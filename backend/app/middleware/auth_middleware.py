from fastapi import Request, HTTPException, status, Depends
from app.services import db_service as db

async def verify_session_token(request: Request) -> dict:
    """
    Middleware-style dependency that verifies our custom session token
    from the Authorization: Bearer <token> header.
    """
    authorization = request.headers.get("Authorization")
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
        )

    token = authorization.split(" ")[1]
    session = db.get_session(token)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token",
        )
        
    return {
        "uid": session["user_id"],
        "email": session["email"],
        "role": session["role"],
        "display_name": session["display_name"]
    }

def require_role(allowed_roles: list[str]):
    """
    Returns a dependency that checks the user's role against allowed_roles.
    """
    async def role_checker(token_data: dict = Depends(verify_session_token)):
        role = token_data.get("role", "warehouse_operator")
        if role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {allowed_roles}",
            )
        return token_data
    return role_checker
