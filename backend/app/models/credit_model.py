from pydantic import BaseModel, Field
from typing import Optional, List


class CreditTransaction(BaseModel):
    credit_id:         str
    user_id:           str
    return_id:         Optional[str]
    credits_earned:    int
    reason:            str   # responsible_return / chose_refurbished / donation_route
    routing_action:    Optional[str]
    created_at:        Optional[str]
    cumulative_balance: Optional[int]


class LeaderboardEntry(BaseModel):
    rank:              int
    user_id:           str
    display_name:      str
    total_credits:     int
    returns_processed: int
    carbon_saved_kg:   float


class CreditsResponse(BaseModel):
    user_id:           str
    total_credits:     int
    transactions:      List[CreditTransaction]


class LeaderboardResponse(BaseModel):
    leaderboard: List[LeaderboardEntry]
