from fastapi import APIRouter, HTTPException, Depends
from app.models.analysis_model import AnalysisRequest, AnalysisResponse, AnalysisResult
from app.services.gemini_service import analyze_product_images
from app.services.credits_service import award_credits_for_return, calculate_sustainability
from app.services import db_service as db
from app.middleware.auth_middleware import verify_session_token
import math

router = APIRouter()


@router.post("", response_model=AnalysisResponse)
async def analyze_return(
    body: AnalysisRequest,
    token: dict = Depends(verify_session_token),
):
    """
    Run AI analysis on a return.
    Calls Gemini Vision API with product images, stores result, awards green credits.
    """
    # Verify return exists
    record = db.get_return_by_id(body.return_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Return {body.return_id} not found")

    # Call Gemini Vision (or rule-based fallback)
    try:
        ai_result = await analyze_product_images(
            image_urls=body.image_urls,
            product_name=body.product_name,
            category=body.category,
            return_reason=body.return_reason,
            condition_notes=body.condition_notes or "",
            original_price=body.original_price,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

    grade           = ai_result["grade"]
    action          = ai_result["recommended_action"]
    score           = ai_result["condition_score"]
    sustainability  = calculate_sustainability(action)

    # Calculate estimated values
    estimated_resale = _estimate_resale_value(body.original_price, grade)
    estimated_refurb = _estimate_refurb_cost(body.original_price, grade)

    # Update return record with AI results
    db.update_return(body.return_id, {
        "condition_grade":    grade,
        "condition_score":    score,
        "recommended_action": action,
        "gemini_analysis":    ai_result.get("routing_reason"),
        "detected_defects":   ai_result.get("detected_defects", []),
        "status":             "reviewed",
    })

    # Create report
    report_data = {
        "estimated_resale_value":   estimated_resale,
        "estimated_refurbish_cost": estimated_refurb,
        "waste_saved_kg":           sustainability["waste_saved_kg"],
        "carbon_saved_kg":          sustainability["carbon_saved_kg"],
        "green_credits_awarded":    0,  # updated below
        "listing_description":      ai_result.get("listing_description"),
        "ai_powered":               ai_result.get("ai_powered", True),
        "confidence":               ai_result.get("confidence", 70),
    }

    # Award green credits
    user_id = token.get("uid", record.get("processed_by", "anonymous"))
    credits_data = {"credits_earned": 0, "new_balance": 0}
    if user_id and user_id != "anonymous":
        try:
            credits_data = award_credits_for_return(user_id, body.return_id, action)
            report_data["green_credits_awarded"] = credits_data["credits_earned"]
        except Exception as e:
            print(f"⚠️  Credits award failed: {e}")

    db.create_report(body.return_id, report_data)

    result = AnalysisResult(
        return_id=body.return_id,
        grade=grade,
        condition_score=score,
        detected_defects=ai_result.get("detected_defects", []),
        recommended_action=action,
        routing_reason=ai_result.get("routing_reason", ""),
        confidence=ai_result.get("confidence", 70),
        estimated_resale_value=estimated_resale,
        estimated_refurbish_cost=estimated_refurb,
        waste_saved_kg=sustainability["waste_saved_kg"],
        carbon_saved_kg=sustainability["carbon_saved_kg"],
        green_credits_awarded=credits_data["credits_earned"],
        ai_powered=ai_result.get("ai_powered", True),
        listing_description=ai_result.get("listing_description"),
    )

    return AnalysisResponse(
        success=True,
        result=result,
        message=f"Analysis complete. Recommendation: {action}",
    )


def _estimate_resale_value(original_price: float, grade: str) -> float:
    """Estimate resale value based on grade."""
    multipliers = {"A": 0.75, "B": 0.55, "C": 0.30, "D": 0.05}
    return round(original_price * multipliers.get(grade, 0.40), 2)


def _estimate_refurb_cost(original_price: float, grade: str) -> float:
    """Estimate refurbishment cost."""
    if grade == "A": return 0.0
    if grade == "B": return round(original_price * 0.08, 2)
    if grade == "C": return round(original_price * 0.22, 2)
    return round(original_price * 0.40, 2)
