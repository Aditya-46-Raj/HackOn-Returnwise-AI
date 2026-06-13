from pydantic import BaseModel, Field
from typing import Optional, List


class AnalysisRequest(BaseModel):
    return_id:       str
    image_urls:      List[str] = Field(default_factory=list)
    condition_notes: Optional[str] = None
    category:        str
    return_reason:   str
    original_price:  float
    product_name:    str


class DetectedDefect(BaseModel):
    description: str
    severity:    str  # minor / moderate / severe


class AnalysisResult(BaseModel):
    return_id:          str
    grade:              str           # A / B / C / D
    condition_score:    int           # 0-100
    detected_defects:   List[str]
    recommended_action: str
    routing_reason:     str
    confidence:         int           # 0-100
    estimated_resale_value:   Optional[float]
    estimated_refurbish_cost: Optional[float]
    waste_saved_kg:    float
    carbon_saved_kg:   float
    green_credits_awarded: int
    ai_powered:        bool           # True if Gemini was used, False if rule-based fallback
    listing_description: Optional[str]  # AI-generated description for resale


class AnalysisResponse(BaseModel):
    success:  bool
    result:   Optional[AnalysisResult]
    message:  str
