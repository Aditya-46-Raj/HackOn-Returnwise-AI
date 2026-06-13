"""
Authentication Router — Handles login, logout, and token session validations.
"""
import uuid
from fastapi import APIRouter, HTTPException, Depends, status, Header
from pydantic import BaseModel
from app.services import db_service as db
from app.middleware.auth_middleware import verify_session_token

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
async def login(body: LoginRequest):
    """Logs in a user, returning a session token."""
    email = body.email.strip().lower()
    password = body.password
    
    user = db.get_user_by_email(email)
    
    # If the user doesn't exist, we auto-create them to facilitate smooth testing and demoing
    if not user:
        # Determine role from email, default to warehouse_operator
        role = "admin" if "admin" in email else "manager" if "manager" in email else "warehouse_operator"
        display_name = email.split("@")[0].title().replace(".", " ")
        user_id = f"usr_{uuid.uuid4().hex[:12]}"
        
        user = {
            "user_id": user_id,
            "display_name": display_name,
            "email": email,
            "password_hash": db.hash_password(password),
            "role": role,
            "total_green_credits": 0,
            "returns_processed": 0,
            "created_at": db._now_iso()
        }
        db.upsert_user(user_id, user)
    else:
        # Verify password
        incoming_hash = db.hash_password(password)
        if incoming_hash != user.get("password_hash"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect password."
            )
            
    # Create session token
    session_token = f"sess_{uuid.uuid4().hex}"
    db.create_session(session_token, user)
    
    return {
        "token": session_token,
        "user": {
            "uid": user["user_id"],
            "email": user["email"],
            "displayName": user["display_name"],
            "photoURL": None
        },
        "role": user["role"]
    }


@router.post("/logout")
async def logout(authorization: str = Header(None)):
    """Logs out a user and invalidates the session token."""
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        db.delete_session(token)
    return {"success": True, "message": "Logged out successfully"}


@router.get("/me")
async def get_current_user(token_data: dict = Depends(verify_session_token)):
    """Returns the current user profile based on the session token."""
    user = db.get_user(token_data["uid"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return {
        "uid": user["user_id"],
        "email": user["email"],
        "displayName": user["display_name"],
        "role": user["role"],
        "total_green_credits": user.get("total_green_credits", 0),
        "returns_processed": user.get("returns_processed", 0)
    }
