from fastapi import APIRouter, HTTPException, Depends, Query, File, UploadFile
from app.models.return_model import CreateReturnRequest, UpdateReturnActionRequest, ReturnListResponse
from app.services import db_service as db
from app.services import s3_service
from app.middleware.auth_middleware import verify_session_token
from typing import Optional
import uuid

router = APIRouter()


@router.post("", status_code=201)
async def create_return(
    body: CreateReturnRequest,
    token: dict = Depends(verify_session_token),
):
    """Register a new product return."""
    data = body.model_dump()
    data["processed_by"] = token.get("uid", "unknown")
    record = db.create_return(data)
    return {"success": True, "return": record}


@router.get("")
async def list_returns(
    grade:    Optional[str] = Query(None, description="Filter by condition grade A/B/C/D"),
    action:   Optional[str] = Query(None, description="Filter by recommended action"),
    category: Optional[str] = Query(None),
    status:   Optional[str] = Query(None),
    page:     int = Query(1, ge=1),
    limit:    int = Query(20, ge=1, le=100),
    token:    dict = Depends(verify_session_token),
):
    """List all returns with optional filters."""
    returns, total = db.list_returns(grade, action, category, status, page, limit)
    return {
        "returns": returns,
        "total":   total,
        "page":    page,
        "limit":   limit,
    }


@router.get("/{return_id}")
async def get_return(
    return_id: str,
    token: dict = Depends(verify_session_token),
):
    """Get a single return record by ID."""
    record = db.get_return_by_id(return_id)
    if not record:
        raise HTTPException(status_code=404, detail="Return not found")
    report = db.get_report_by_return_id(return_id)
    return {"return": record, "report": report}


@router.patch("/{return_id}/action")
async def override_return_action(
    return_id: str,
    body: UpdateReturnActionRequest,
    token: dict = Depends(verify_session_token),
):
    """Admin override of recommended routing action."""
    record = db.get_return_by_id(return_id)
    if not record:
        raise HTTPException(status_code=404, detail="Return not found")

    db.update_return(return_id, {
        "final_action": body.final_action,
        "admin_note":   body.admin_note,
        "status":       "reviewed",
        "reviewed_by":  token.get("uid"),
    })
    return {"success": True, "message": f"Action updated to {body.final_action}"}


@router.delete("/{return_id}", status_code=204)
async def delete_return(
    return_id: str,
    token: dict = Depends(verify_session_token),
):
    """Delete a return record (admin only)."""
    record = db.get_return_by_id(return_id)
    if not record:
        raise HTTPException(status_code=404, detail="Return not found")
    db.delete_return(return_id)


@router.post("/{return_id}/upload", status_code=200)
async def upload_return_image(
    return_id: str,
    files: list[UploadFile] = File(...),
    token: dict = Depends(verify_session_token),
):
    """Upload images for a registered return."""
    urls = []
    for file in files:
        file_bytes = await file.read()
        # Create a unique filename
        ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        filename = f"{return_id}_{uuid.uuid4().hex[:8]}.{ext}"
        
        url = s3_service.upload_return_image(file_bytes, filename, file.content_type)
        urls.append(url)
        
    return {"urls": urls}
