"""
Gemini Vision Service — Analyzes product images for condition grading.
Uses Google Gemini 1.5 Flash multimodal capabilities.
"""
import google.generativeai as genai
import json
import re
import base64
import httpx
from app.config import get_settings

settings = get_settings()

# Configure Gemini API
if settings.gemini_api_key:
    genai.configure(api_key=settings.gemini_api_key)

GEMINI_MODEL = "gemini-1.5-flash"

ANALYSIS_PROMPT = """You are an expert product condition assessor for an e-commerce return system.

Analyze the provided product images and the context below.

PRODUCT CONTEXT:
- Product: {product_name}
- Category: {category}
- Return Reason: {return_reason}
- Customer Notes: {condition_notes}
- Original Price: ${original_price}

GRADING SCALE:
- Grade A (90-100): Like new, no visible defects, original packaging, fully functional
- Grade B (70-89): Good condition, minor wear, all parts present, fully functional
- Grade C (40-69): Fair condition, visible defects but repairable, may be missing accessories
- Grade D (0-39): Poor condition, significant damage, not easily repairable

ROUTING RULES:
- Restock: Grade A, no usage signs, packaging intact
- Resell: Grade A or B, usable condition, marketable
- Refurbish: Grade B or C, fixable issues, repair cost < 40% of original price
- Donate: Grade C or D, usable but low resale value
- Recycle: Grade D, beyond economical repair
- Exchange: Any grade when customer preference mismatch (wrong size, color, etc.)

Respond ONLY with a valid JSON object in this exact format (no markdown, no explanation):
{{
  "grade": "A",
  "condition_score": 85,
  "detected_defects": ["list of specific visible defects, empty array if none"],
  "recommended_action": "Resell",
  "routing_reason": "2-3 sentence explanation of why this action was chosen based on condition and market value",
  "confidence": 88,
  "listing_description": "1-2 sentence description suitable for a refurbished product listing"
}}"""


async def download_image_as_bytes(url: str) -> tuple[bytes, str] | None:
    """Download image from cloud/local storage URL. Returns (bytes, mime_type) or None."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            content_type = response.headers.get("content-type", "image/jpeg")
            mime = content_type.split(";")[0].strip()
            return response.content, mime
    except Exception as e:
        print(f"⚠️  Failed to download image from {url}: {e}")
        return None


async def analyze_product_images(
    image_urls: list[str],
    product_name: str,
    category: str,
    return_reason: str,
    condition_notes: str,
    original_price: float,
) -> dict:
    """
    Main analysis function. Calls Gemini Vision with product images.
    Returns structured analysis dict.
    Falls back to rule-based analysis if Gemini is unavailable.
    """
    if not settings.gemini_api_key:
        print("⚠️  No Gemini API key — using rule-based fallback")
        return await _rule_based_fallback(
            category, return_reason, condition_notes, original_price
        )

    # Download images as bytes
    image_parts = []
    for url in image_urls[:5]:  # Max 5 images
        result = await download_image_as_bytes(url)
        if result:
            img_bytes, mime_type = result
            image_parts.append({
                "inline_data": {
                    "mime_type": mime_type,
                    "data": base64.b64encode(img_bytes).decode("utf-8"),
                }
            })

    prompt = ANALYSIS_PROMPT.format(
        product_name=product_name,
        category=category,
        return_reason=return_reason,
        condition_notes=condition_notes or "No additional notes provided",
        original_price=original_price,
    )

    try:
        model = genai.GenerativeModel(GEMINI_MODEL)

        # Build content parts: images first (as inline_data), then prompt
        content_parts = image_parts + [prompt]

        response = model.generate_content(
            content_parts,
            generation_config=genai.types.GenerationConfig(
                temperature=0.2,  # Low temperature for consistent analysis
                max_output_tokens=1024,
            ),
        )

        raw_text = response.text.strip()
        # Strip markdown code blocks if present
        raw_text = re.sub(r"```json\s*", "", raw_text)
        raw_text = re.sub(r"```\s*", "", raw_text)
        raw_text = raw_text.strip()

        result = json.loads(raw_text)

        # Validate required fields
        required = ["grade", "condition_score", "detected_defects",
                    "recommended_action", "routing_reason", "confidence"]
        for field in required:
            if field not in result:
                raise ValueError(f"Missing field in Gemini response: {field}")

        result["ai_powered"] = True
        return result

    except json.JSONDecodeError as e:
        print(f"⚠️  Gemini returned invalid JSON: {e}. Using fallback.")
        return await _rule_based_fallback(category, return_reason, condition_notes, original_price)
    except Exception as e:
        print(f"⚠️  Gemini API error: {e}. Using fallback.")
        return await _rule_based_fallback(category, return_reason, condition_notes, original_price)


async def generate_listing_description(
    product_name: str,
    grade: str,
    category: str,
    defects: list[str],
) -> str:
    """Generate a compelling refurbished listing description using Gemini text."""
    if not settings.gemini_api_key:
        defect_text = ", ".join(defects) if defects else "no visible defects"
        return f"Grade {grade} certified {category} — {product_name}. Condition: {defect_text}. Tested and verified."

    prompt = f"""Write a compelling 2-sentence product description for a certified refurbished listing.
Product: {product_name}
Category: {category}
Condition Grade: {grade} ({'Like New' if grade=='A' else 'Good' if grade=='B' else 'Fair' if grade=='C' else 'As-Is'})
Known issues: {', '.join(defects) if defects else 'None'}

Be honest about condition but focus on value. Do not use markdown."""

    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception:
        return f"Grade {grade} certified {category}. Professionally assessed and verified."


async def _rule_based_fallback(
    category: str,
    return_reason: str,
    condition_notes: str,
    original_price: float,
) -> dict:
    """
    Rule-based fallback when Gemini is unavailable.
    Uses return reason and condition notes keywords to assign grade.
    """
    notes_lower = (condition_notes or "").lower()
    reason_lower = return_reason.lower()

    # Grade determination
    if any(w in reason_lower for w in ["defective", "not working", "damaged"]):
        if any(w in notes_lower for w in ["broken", "shattered", "completely", "severe"]):
            grade, score = "D", 25
        else:
            grade, score = "C", 55
    elif any(w in reason_lower for w in ["wrong item", "changed mind", "better price"]):
        grade, score = "A", 92
    elif any(w in reason_lower for w in ["not as described", "missing parts"]):
        grade, score = "B", 72
    elif any(w in reason_lower for w in ["wrong size", "wrong fit"]):
        grade, score = "A", 88
    elif any(w in notes_lower for w in ["scratch", "scuff", "minor"]):
        grade, score = "B", 75
    else:
        grade, score = "B", 78

    # Action determination
    if grade == "A":
        action = "Resell"
        reason = "Item is in excellent condition with no significant defects. Ideal for direct resale as certified open-box."
    elif grade == "B":
        action = "Resell"
        reason = "Item shows minor wear but remains fully functional. Can be listed as certified refurbished at a competitive price."
    elif grade == "C":
        if original_price > 100:
            action = "Refurbish"
            reason = "Item has repairable issues and the original price justifies refurbishment costs. Professional repair recommended before resale."
        else:
            action = "Donate"
            reason = "Item is functional but repair costs exceed resale value at this price point. Donation maximizes social impact."
    else:
        action = "Recycle"
        reason = "Item is significantly damaged beyond economical repair. Responsible recycling is the best environmental option."

    # Handle wrong size/fit → exchange
    if "wrong size" in reason_lower or "wrong fit" in reason_lower:
        action = "Exchange"
        reason = "Customer received incorrect size/fit. Exchange for correct variant is the best customer experience solution."

    defects = []
    if "scratch" in notes_lower: defects.append("Minor surface scratches")
    if "dent" in notes_lower:    defects.append("Small dents")
    if "broken" in notes_lower:  defects.append("Broken component")

    return {
        "grade": grade,
        "condition_score": score,
        "detected_defects": defects,
        "recommended_action": action,
        "routing_reason": reason,
        "confidence": 70,
        "listing_description": f"Grade {grade} {category}. Assessed by automated system. Fully verified before dispatch.",
        "ai_powered": False,
    }
