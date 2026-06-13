"""
Credits Service — Green credits award logic.
Called after every return is processed.
"""
from app.services.db_service import create_credit_transaction, add_user_credits

# Credit award rules by routing action
CREDIT_RULES: dict[str, int] = {
    "Donate":    50,
    "Recycle":   40,
    "Exchange":  25,
    "Resell":    30,
    "Refurbish": 20,
    "Restock":   10,
}

# Sustainability metrics by action (per item)
SUSTAINABILITY_METRICS: dict[str, dict] = {
    "Donate":    {"waste_saved_kg": 2.5, "carbon_saved_kg": 3.2},
    "Recycle":   {"waste_saved_kg": 3.8, "carbon_saved_kg": 2.1},
    "Resell":    {"waste_saved_kg": 2.0, "carbon_saved_kg": 4.5},
    "Refurbish": {"waste_saved_kg": 1.8, "carbon_saved_kg": 3.8},
    "Exchange":  {"waste_saved_kg": 1.2, "carbon_saved_kg": 2.0},
    "Restock":   {"waste_saved_kg": 0.5, "carbon_saved_kg": 0.8},
}


def award_credits_for_return(
    user_id: str,
    return_id: str,
    routing_action: str,
) -> dict:
    """
    Awards green credits for a processed return.
    Returns credit transaction data including amounts earned.
    """
    credits = CREDIT_RULES.get(routing_action, 10)
    sustainability = SUSTAINABILITY_METRICS.get(routing_action, {"waste_saved_kg": 1.0, "carbon_saved_kg": 1.0})

    # Update user's cumulative balance
    new_balance = add_user_credits(user_id, credits)

    # Create transaction record
    transaction = create_credit_transaction({
        "user_id":           user_id,
        "return_id":         return_id,
        "credits_earned":    credits,
        "reason":            "responsible_return",
        "routing_action":    routing_action,
        "cumulative_balance": new_balance,
        **sustainability,
    })

    return {
        "credits_earned": credits,
        "new_balance":    new_balance,
        "waste_saved_kg": sustainability["waste_saved_kg"],
        "carbon_saved_kg": sustainability["carbon_saved_kg"],
        "transaction_id":  transaction["credit_id"],
    }


def get_credit_award_for_action(action: str) -> int:
    """Returns how many credits an action earns (for display before submission)."""
    return CREDIT_RULES.get(action, 10)


def calculate_sustainability(action: str) -> dict:
    """Returns sustainability metrics for a routing action."""
    return SUSTAINABILITY_METRICS.get(action, {"waste_saved_kg": 1.0, "carbon_saved_kg": 1.0})
