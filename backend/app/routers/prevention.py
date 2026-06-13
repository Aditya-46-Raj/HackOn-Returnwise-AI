from fastapi import APIRouter, HTTPException, Depends
from app.services import db_service as db
from app.middleware.auth_middleware import verify_session_token

router = APIRouter()

# Fallback risk data when database isn't seeded
FALLBACK_RISK_DATA = {
    "Electronics": {
        "category": "Electronics",
        "return_rate_pct": 28,
        "top_return_reasons": [
            {"reason": "Doesn't meet expectations", "pct": 35},
            {"reason": "Defective / Not Working",   "pct": 30},
            {"reason": "Wrong item received",        "pct": 20},
        ],
        "satisfaction_score": 3.8,
        "ai_tip": "Check product specifications carefully. Compare technical specs with your device requirements before purchase.",
    },
    "Clothing & Apparel": {
        "category": "Clothing & Apparel",
        "return_rate_pct": 34,
        "top_return_reasons": [
            {"reason": "Wrong size / poor fit", "pct": 52},
            {"reason": "Color differs from photo", "pct": 28},
            {"reason": "Poor quality",            "pct": 20},
        ],
        "satisfaction_score": 3.5,
        "ai_tip": "Always check the size chart and customer reviews mentioning fit. Consider ordering 2 sizes if unsure.",
    },
    "Home & Kitchen": {
        "category": "Home & Kitchen",
        "return_rate_pct": 18,
        "top_return_reasons": [
            {"reason": "Doesn't fit space / dimensions", "pct": 40},
            {"reason": "Quality not as expected",         "pct": 35},
            {"reason": "Changed mind",                    "pct": 25},
        ],
        "satisfaction_score": 4.1,
        "ai_tip": "Measure your space carefully and compare with product dimensions. Read reviews about build quality.",
    },
    "Sports & Outdoors": {
        "category": "Sports & Outdoors",
        "return_rate_pct": 22,
        "top_return_reasons": [
            {"reason": "Wrong size",         "pct": 38},
            {"reason": "Not durable enough", "pct": 32},
            {"reason": "Missing accessories","pct": 30},
        ],
        "satisfaction_score": 3.9,
        "ai_tip": "Check sizing guides for sports equipment. Read reviews specifically about durability and long-term use.",
    },
    "Beauty & Personal Care": {
        "category": "Beauty & Personal Care",
        "return_rate_pct": 15,
        "top_return_reasons": [
            {"reason": "Allergic reaction / skin sensitivity", "pct": 42},
            {"reason": "Product ineffective",                  "pct": 35},
            {"reason": "Packaging damaged",                    "pct": 23},
        ],
        "satisfaction_score": 4.0,
        "ai_tip": "Check ingredient lists if you have sensitive skin. Look for hypoallergenic certifications.",
    },
}


@router.get("/{category}")
async def get_return_risk(
    category: str,
    token: dict = Depends(verify_session_token),
):
    """Get return risk profile for a product category."""
    # Try database first
    profile = db.get_risk_profile(category)

    if not profile:
        # Use fallback data
        profile = FALLBACK_RISK_DATA.get(category)
        if not profile:
            # Generic fallback
            profile = {
                "category": category,
                "return_rate_pct": 20,
                "top_return_reasons": [
                    {"reason": "Doesn't meet expectations", "pct": 40},
                    {"reason": "Quality issues",            "pct": 35},
                    {"reason": "Changed mind",              "pct": 25},
                ],
                "satisfaction_score": 3.7,
                "ai_tip": "Read recent customer reviews carefully before purchasing. Check the return policy.",
            }

    return {"success": True, "risk_profile": profile}


@router.get("")
async def list_categories(token: dict = Depends(verify_session_token)):
    """List all available product categories for prevention analysis."""
    return {
        "categories": list(FALLBACK_RISK_DATA.keys())
    }
