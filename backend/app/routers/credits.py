from fastapi import APIRouter, Depends
from app.services import db_service as db
from app.middleware.auth_middleware import verify_session_token

router = APIRouter()


@router.get("/leaderboard")
async def get_leaderboard(token: dict = Depends(verify_session_token)):
    """Top eco-contributors by green credits."""
    leaders = db.get_leaderboard(limit=10)
    result = []
    for i, u in enumerate(leaders):
        result.append({
            "rank":              i + 1,
            "user_id":           u.get("user_id", ""),
            "display_name":      u.get("display_name", "Anonymous"),
            "total_credits":     u.get("total_green_credits", 0),
            "returns_processed": u.get("returns_processed", 0),
            "carbon_saved_kg":   u.get("carbon_saved_kg", 0),
        })
    return {"leaderboard": result}


@router.get("/{user_id}")
async def get_user_credits(
    user_id: str,
    token: dict = Depends(verify_session_token),
):
    """Get green credit history for a user."""
    transactions = db.get_user_credits(user_id)
    user = db.get_user(user_id) or {}
    return {
        "user_id":      user_id,
        "total_credits": user.get("total_green_credits", 0),
        "transactions": transactions,
    }
