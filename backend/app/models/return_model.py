from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class ReturnCategory(str, Enum):
    electronics    = "Electronics"
    clothing       = "Clothing & Apparel"
    home_kitchen   = "Home & Kitchen"
    sports         = "Sports & Outdoors"
    books          = "Books & Media"
    beauty         = "Beauty & Personal Care"
    toys           = "Toys & Games"
    automotive     = "Automotive"
    health         = "Health & Wellness"
    other          = "Other"


class ReturnReason(str, Enum):
    defective          = "Defective / Not Working"
    wrong_item         = "Wrong Item Received"
    not_as_described   = "Not as Described"
    changed_mind       = "Changed Mind"
    damaged_shipping   = "Damaged in Shipping"
    wrong_size         = "Wrong Size / Fit"
    missing_parts      = "Missing Parts / Accessories"
    better_price       = "Found Better Price"
    other              = "Other"


class ConditionGrade(str, Enum):
    a = "A"
    b = "B"
    c = "C"
    d = "D"


class RoutingAction(str, Enum):
    restock   = "Restock"
    resell    = "Resell"
    refurbish = "Refurbish"
    donate    = "Donate"
    recycle   = "Recycle"
    exchange  = "Exchange"


class ReturnStatus(str, Enum):
    pending  = "pending"
    reviewed = "reviewed"
    closed   = "closed"


# ── Request Models ────────────────────────────────────────────────────────────

class CreateReturnRequest(BaseModel):
    product_name:    str = Field(..., min_length=2, max_length=200)
    category:        ReturnCategory
    brand:           Optional[str] = Field(None, max_length=100)
    original_price:  float = Field(..., gt=0)
    return_reason:   ReturnReason
    condition_notes: Optional[str] = Field(None, max_length=1000)
    image_urls:      List[str] = Field(default_factory=list, max_items=5)
    processed_by:    Optional[str] = None   # Operator user UID


class UpdateReturnActionRequest(BaseModel):
    final_action: RoutingAction
    admin_note:   Optional[str] = Field(None, max_length=500)


# ── Response Models ───────────────────────────────────────────────────────────

class ReturnRecord(BaseModel):
    return_id:          str
    product_name:       str
    category:           str
    brand:              Optional[str]
    original_price:     float
    return_reason:      str
    condition_notes:    Optional[str]
    condition_score:    Optional[int]       # 0-100
    condition_grade:    Optional[str]       # A/B/C/D
    gemini_analysis:    Optional[str]       # raw AI response
    recommended_action: Optional[str]
    final_action:       Optional[str]
    status:             str
    image_urls:         List[str]
    processed_by:       Optional[str]
    created_at:         Optional[str]

    class Config:
        use_enum_values = True


class ReturnListResponse(BaseModel):
    returns: List[ReturnRecord]
    total:   int
    page:    int
    limit:   int
