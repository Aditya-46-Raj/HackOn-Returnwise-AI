"""
Database Service — Supports AWS DynamoDB and local JSON file-based storage.
Provides transparent fallback and identical API interface for data operations.
"""
import os
import json
import uuid
import time
import hashlib
import threading
from datetime import datetime, timezone
from app.config import get_settings

settings = get_settings()

# Lock for thread-safe local file operations
_file_lock = threading.Lock()
DB_JSON_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "db.json")

# AWS DynamoDB client
_dynamodb_resource = None
AWS_MODE = False

# Try initializing AWS if credentials are set
if settings.aws_access_key_id and settings.aws_secret_access_key:
    try:
        import boto3
        _dynamodb_resource = boto3.resource(
            "dynamodb",
            region_name=settings.aws_region,
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key
        )
        # Verify connection by listing tables
        list(_dynamodb_resource.tables.all())
        AWS_MODE = True
        print("⚡ Connected to AWS DynamoDB successfully!")
    except Exception as e:
        print(f"⚠️ Failed to connect to AWS DynamoDB ({e}). Falling back to Local JSON Database.")
        AWS_MODE = False
else:
    print("ℹ️ AWS credentials not set. Running in Local JSON Database mode.")
    AWS_MODE = False


# Helper for SHA256 password hashing
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


# ══════════════════════════════════════════════════════════════
#  SEEDED DEFAULT DATA
# ══════════════════════════════════════════════════════════════
DEFAULT_USERS = {
    "demo_operator_id": {
        "user_id": "demo_operator_id",
        "display_name": "Warehouse Operator",
        "email": "operator@demo.com",
        "password_hash": hash_password("Demo@123"),
        "role": "warehouse_operator",
        "total_green_credits": 150,
        "returns_processed": 12,
        "created_at": "2026-01-01T12:00:00Z"
    },
    "demo_admin_id": {
        "user_id": "demo_admin_id",
        "display_name": "Admin Reviewer",
        "email": "admin@demo.com",
        "password_hash": hash_password("Demo@123"),
        "role": "admin",
        "total_green_credits": 500,
        "returns_processed": 45,
        "created_at": "2026-01-01T12:00:00Z"
    },
    "demo_manager_id": {
        "user_id": "demo_manager_id",
        "display_name": "Ops Manager",
        "email": "manager@demo.com",
        "password_hash": hash_password("Demo@123"),
        "role": "manager",
        "total_green_credits": 1200,
        "returns_processed": 124,
        "created_at": "2026-01-01T12:00:00Z"
    }
}

DEFAULT_RISK_PROFILES = {
    "electronics": {
        "category": "Electronics",
        "return_rate": 18.5,
        "primary_reasons": [
            {"reason": "Technical defect", "percentage": 42},
            {"reason": "Difficulty in setup", "percentage": 28},
            {"reason": "Not as expected", "percentage": 20},
            {"reason": "Other", "percentage": 10}
        ],
        "impact_score": 85,
        "preventative_tips": [
            "Add a 'Quick Start & Troubleshooting Guide' video scan QR code on the box.",
            "Verify remote controls and batteries are included before shipping.",
            "Provide compatibility checks on product listings."
        ]
    },
    "clothing": {
        "category": "Clothing",
        "return_rate": 26.2,
        "primary_reasons": [
            {"reason": "Sizing mismatch", "percentage": 65},
            {"reason": "Color/Style mismatch", "percentage": 20},
            {"reason": "Quality issue", "percentage": 10},
            {"reason": "Other", "percentage": 5}
        ],
        "impact_score": 92,
        "preventative_tips": [
            "Implement interactive 3D virtual sizing charts on Amazon product pages.",
            "Include customer reviews commenting on whether item runs 'small' or 'large'.",
            "Ensure dye lots and styling graphics are updated across all photos."
        ]
    },
    "home_goods": {
        "category": "Home Goods",
        "return_rate": 10.4,
        "primary_reasons": [
            {"reason": "Damaged in transit", "percentage": 50},
            {"reason": "Size dimensions mismatch", "percentage": 30},
            {"reason": "Not as expected", "percentage": 15},
            {"reason": "Other", "percentage": 5}
        ],
        "impact_score": 60,
        "preventative_tips": [
            "Upgrade packaging and corner protection for fragile items.",
            "Display full furniture dimensions relative to common room layouts.",
            "Clarify assembly level requirements in description."
        ]
    }
}

DEFAULT_LISTINGS = {
    "list_1": {
        "listing_id": "list_1",
        "product_name": "Echo Dot (5th Gen)",
        "category": "Electronics",
        "grade": "A",
        "original_price": 49.99,
        "resale_price": 29.99,
        "carbon_saved_kg": 4.5,
        "waste_saved_kg": 0.8,
        "image_url": "https://images.unsplash.com/photo-1543512214-318c7553f230?w=500&auto=format&fit=crop&q=60",
        "description": "Like-new condition Echo Dot. Cleaned and fully tested. Original packaging included.",
        "seller_trust_score": 98,
        "created_at": "2026-06-10T14:32:00Z"
    },
    "list_2": {
        "listing_id": "list_2",
        "product_name": "Kindle Paperwhite",
        "category": "Electronics",
        "grade": "B",
        "original_price": 139.99,
        "resale_price": 89.99,
        "carbon_saved_kg": 8.2,
        "waste_saved_kg": 1.2,
        "image_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60",
        "description": "Good condition Kindle Paperwhite. Minor surface scuffs on the back. Screen is flawless.",
        "seller_trust_score": 95,
        "created_at": "2026-06-11T09:15:00Z"
    },
    "list_3": {
        "listing_id": "list_3",
        "product_name": "Ergonomic Office Chair",
        "category": "Home Goods",
        "grade": "B",
        "original_price": 249.99,
        "resale_price": 149.99,
        "carbon_saved_kg": 15.0,
        "waste_saved_kg": 12.5,
        "image_url": "https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=500&auto=format&fit=crop&q=60",
        "description": "Fully functional ergonomic chair. Minor cosmetic scratches on the armrest. Assembly manual included.",
        "seller_trust_score": 92,
        "created_at": "2026-06-12T11:45:00Z"
    },
    "list_4": {
        "listing_id": "list_4",
        "product_name": "Running Shoes (Size 10)",
        "category": "Clothing",
        "grade": "A",
        "original_price": 110.00,
        "resale_price": 65.00,
        "carbon_saved_kg": 2.5,
        "waste_saved_kg": 0.9,
        "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=60",
        "description": "Returned due to incorrect sizing. Never worn outdoors. Original tags and box intact.",
        "seller_trust_score": 99,
        "created_at": "2026-06-13T08:00:00Z"
    }
}


# ══════════════════════════════════════════════════════════════
#  DYNAMODB HELPER FUNCTIONS
# ══════════════════════════════════════════════════════════════
def _get_table_name(table_base_name: str) -> str:
    return f"{settings.dynamodb_table_prefix}{table_base_name}"

def _ensure_tables():
    """Dynamically creates tables in AWS DynamoDB if they are missing."""
    if not AWS_MODE or not _dynamodb_resource:
        return

    table_specs = {
        "returns": "return_id",
        "reports": "return_id",
        "users": "user_id",
        "credits": "credit_id",
        "risk_profiles": "category",
        "listings": "listing_id",
        "sessions": "session_token"
    }

    for base_name, key in table_specs.items():
        table_name = _get_table_name(base_name)
        try:
            _dynamodb_resource.Table(table_name).load()
        except _dynamodb_resource.meta.client.exceptions.ResourceNotFoundException:
            print(f"🛠️ Creating DynamoDB table: {table_name}...")
            table = _dynamodb_resource.create_table(
                TableName=table_name,
                KeySchema=[{"AttributeName": key, "KeyType": "HASH"}],
                AttributeDefinitions=[{"AttributeName": key, "AttributeType": "S"}],
                ProvisionedThroughput={"ReadCapacityUnits": 5, "WriteCapacityUnits": 5}
            )
            # Wait for table to be created
            table.meta.client.get_waiter('table_exists').wait(TableName=table_name)
            print(f"✅ Created {table_name} successfully.")
            
            # Seed default data to DynamoDB
            if base_name == "users":
                tbl = _dynamodb_resource.Table(table_name)
                for u in DEFAULT_USERS.values():
                    tbl.put_item(Item=u)
            elif base_name == "risk_profiles":
                tbl = _dynamodb_resource.Table(table_name)
                for r in DEFAULT_RISK_PROFILES.values():
                    tbl.put_item(Item=r)
            elif base_name == "listings":
                tbl = _dynamodb_resource.Table(table_name)
                for l in DEFAULT_LISTINGS.values():
                    tbl.put_item(Item=l)

# Run AWS Table creation if in AWS mode
if AWS_MODE:
    _ensure_tables()


# ══════════════════════════════════════════════════════════════
#  LOCAL FILE HELPER FUNCTIONS
# ══════════════════════════════════════════════════════════════
def _read_local_db() -> dict:
    with _file_lock:
        if not os.path.exists(DB_JSON_PATH):
            initial_db = {
                "returns": {},
                "reports": {},
                "users": DEFAULT_USERS,
                "credits": {},
                "risk_profiles": DEFAULT_RISK_PROFILES,
                "listings": DEFAULT_LISTINGS,
                "sessions": {}
            }
            with open(DB_JSON_PATH, "w", encoding="utf-8") as f:
                json.dump(initial_db, f, indent=2)
            return initial_db
        try:
            with open(DB_JSON_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}

def _write_local_db(data: dict):
    with _file_lock:
        with open(DB_JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)


# Decimal/float compatibility helper for DynamoDB JSON conversion
def _clean_dynamodb_item(item: dict) -> dict:
    """Helper to convert DynamoDB Decimal instances back to float/int."""
    from decimal import Decimal
    if not item:
        return item
    cleaned = {}
    for k, v in item.items():
        if isinstance(v, Decimal):
            cleaned[k] = float(v) if v % 1 != 0 else int(v)
        elif isinstance(v, list):
            cleaned[k] = [_clean_dynamodb_item(i) if isinstance(i, dict) else i for i in v]
        elif isinstance(v, dict):
            cleaned[k] = _clean_dynamodb_item(v)
        else:
            cleaned[k] = v
    return cleaned


# ══════════════════════════════════════════════════════════════
#  PUBLIC CORE API METHODS
# ══════════════════════════════════════════════════════════════

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ── RETURNS ───────────────────────────────────────────────────

def create_return(data: dict) -> dict:
    return_id = str(uuid.uuid4())
    doc_data = {
        "return_id": return_id,
        "status": "pending",
        "created_at": _now_iso(),
        **data,
    }

    if AWS_MODE:
        table = _dynamodb_resource.Table(_get_table_name("returns"))
        table.put_item(Item=doc_data)
    else:
        db = _read_local_db()
        db["returns"][return_id] = doc_data
        _write_local_db(db)
    return doc_data


def get_return_by_id(return_id: str) -> dict | None:
    if AWS_MODE:
        table = _dynamodb_resource.Table(_get_table_name("returns"))
        res = table.get_item(Key={"return_id": return_id})
        return _clean_dynamodb_item(res.get("Item"))
    else:
        db = _read_local_db()
        return db.get("returns", {}).get(return_id)


def list_returns(
    grade: str | None = None,
    action: str | None = None,
    category: str | None = None,
    status: str | None = None,
    page: int = 1,
    limit: int = 20,
) -> tuple[list[dict], int]:
    all_returns = []

    if AWS_MODE:
        table = _dynamodb_resource.Table(_get_table_name("returns"))
        response = table.scan()
        all_returns = [_clean_dynamodb_item(item) for item in response.get("Items", [])]
        # Keep scanning if there is a LastEvaluatedKey
        while 'LastEvaluatedKey' in response:
            response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
            all_returns.extend([_clean_dynamodb_item(item) for item in response.get("Items", [])])
    else:
        db = _read_local_db()
        all_returns = list(db.get("returns", {}).values())

    # In-memory filter & sort
    if grade:
        all_returns = [r for r in all_returns if r.get("condition_grade") == grade]
    if action:
        all_returns = [r for r in all_returns if r.get("recommended_action") == action]
    if category:
        all_returns = [r for r in all_returns if r.get("category") == category]
    if status:
        all_returns = [r for r in all_returns if r.get("status") == status]

    # Sort descending by created_at
    all_returns.sort(key=lambda x: x.get("created_at", ""), reverse=True)

    total = len(all_returns)
    start = (page - 1) * limit
    paged = all_returns[start: start + limit]
    return paged, total


def update_return(return_id: str, updates: dict) -> None:
    if AWS_MODE:
        table = _dynamodb_resource.Table(_get_table_name("returns"))
        # Get existing first to merge updates
        item = get_return_by_id(return_id)
        if item:
            item.update({**updates, "updated_at": _now_iso()})
            # Convert float to Decimal for DynamoDB compatibility
            from decimal import Decimal
            def _float_to_decimal(val):
                if isinstance(val, float):
                    return Decimal(str(val))
                if isinstance(val, dict):
                    return {k: _float_to_decimal(v) for k, v in val.items()}
                if isinstance(val, list):
                    return [_float_to_decimal(v) for v in val]
                return val
            decimal_item = _float_to_decimal(item)
            table.put_item(Item=decimal_item)
    else:
        db = _read_local_db()
        if return_id in db.get("returns", {}):
            db["returns"][return_id].update({
                **updates,
                "updated_at": _now_iso(),
            })
            _write_local_db(db)


def delete_return(return_id: str) -> None:
    if AWS_MODE:
        table = _dynamodb_resource.Table(_get_table_name("returns"))
        table.delete_item(Key={"return_id": return_id})
    else:
        db = _read_local_db()
        if return_id in db.get("returns", {}):
            del db["returns"][return_id]
            _write_local_db(db)


# ── REPORTS ───────────────────────────────────────────────────

def create_report(return_id: str, report_data: dict) -> dict:
    report_id = str(uuid.uuid4())
    doc_data = {
        "report_id": report_id,
        "return_id": return_id,
        "created_at": _now_iso(),
        **report_data,
    }

    if AWS_MODE:
        table = _dynamodb_resource.Table(_get_table_name("reports"))
        # Convert floats to decimal
        from decimal import Decimal
        def _float_to_decimal(val):
            if isinstance(val, float): return Decimal(str(val))
            if isinstance(val, dict): return {k: _float_to_decimal(v) for k, v in val.items()}
            if isinstance(val, list): return [_float_to_decimal(v) for v in val]
            return val
        table.put_item(Item=_float_to_decimal(doc_data))
    else:
        db = _read_local_db()
        db["reports"][return_id] = doc_data
        _write_local_db(db)
    return doc_data


def get_report_by_return_id(return_id: str) -> dict | None:
    if AWS_MODE:
        table = _dynamodb_resource.Table(_get_table_name("reports"))
        # We key reports by return_id in DynamoDB as 1-to-1 mapping
        res = table.get_item(Key={"return_id": return_id})
        return _clean_dynamodb_item(res.get("Item"))
    else:
        db = _read_local_db()
        return db.get("reports", {}).get(return_id)


# ── USERS & AUTH ──────────────────────────────────────────────

def get_user(user_id: str) -> dict | None:
    if AWS_MODE:
        table = _dynamodb_resource.Table(_get_table_name("users"))
        res = table.get_item(Key={"user_id": user_id})
        return _clean_dynamodb_item(res.get("Item"))
    else:
        db = _read_local_db()
        return db.get("users", {}).get(user_id)


def get_user_by_email(email: str) -> dict | None:
    if AWS_MODE:
        table = _dynamodb_resource.Table(_get_table_name("users"))
        # Scan by email attribute
        from boto3.dynamodb.conditions import Key, Attr
        res = table.scan(FilterExpression=Attr("email").eq(email))
        items = res.get("Items", [])
        return _clean_dynamodb_item(items[0]) if items else None
    else:
        db = _read_local_db()
        for u in db.get("users", {}).values():
            if u.get("email") == email:
                return u
        return None


def upsert_user(user_id: str, data: dict) -> None:
    if AWS_MODE:
        table = _dynamodb_resource.Table(_get_table_name("users"))
        existing = get_user(user_id) or {}
        merged = {**existing, **data, "user_id": user_id}
        table.put_item(Item=merged)
    else:
        db = _read_local_db()
        if "users" not in db:
            db["users"] = {}
        if user_id not in db["users"]:
            db["users"][user_id] = {}
        db["users"][user_id].update(data)
        db["users"][user_id]["user_id"] = user_id
        _write_local_db(db)


def add_user_credits(user_id: str, credits: int) -> int:
    if AWS_MODE:
        table = _dynamodb_resource.Table(_get_table_name("users"))
        # Atomically increment or update
        try:
            res = table.update_item(
                Key={"user_id": user_id},
                UpdateExpression="ADD total_green_credits :val",
                ExpressionAttributeValues={":val": credits},
                ReturnValues="UPDATED_NEW"
            )
            val = res.get("Attributes", {}).get("total_green_credits", credits)
            return int(val)
        except Exception:
            # Fallback to get and put
            u = get_user(user_id) or {}
            new_bal = int(u.get("total_green_credits", 0) + credits)
            upsert_user(user_id, {"total_green_credits": new_bal})
            return new_bal
    else:
        db = _read_local_db()
        u = db.get("users", {}).get(user_id, {})
        new_bal = int(u.get("total_green_credits", 0) + credits)
        u["total_green_credits"] = new_bal
        _write_local_db(db)
        return new_bal


# ── SESSIONS ──────────────────────────────────────────────────

def create_session(session_token: str, user_data: dict) -> None:
    session_item = {
        "session_token": session_token,
        "user_id": user_data.get("user_id"),
        "email": user_data.get("email"),
        "display_name": user_data.get("display_name"),
        "role": user_data.get("role"),
        "created_at": _now_iso(),
        "expires_at": time.time() + 86400  # 24 hours
    }
    if AWS_MODE:
        from decimal import Decimal
        session_item["expires_at"] = Decimal(str(session_item["expires_at"]))
        table = _dynamodb_resource.Table(_get_table_name("sessions"))
        table.put_item(Item=session_item)
    else:
        db = _read_local_db()
        db["sessions"][session_token] = session_item
        _write_local_db(db)


def get_session(session_token: str) -> dict | None:
    if AWS_MODE:
        table = _dynamodb_resource.Table(_get_table_name("sessions"))
        res = table.get_item(Key={"session_token": session_token})
        item = _clean_dynamodb_item(res.get("Item"))
        if item and item.get("expires_at", 0) > time.time():
            return item
        return None
    else:
        db = _read_local_db()
        sess = db.get("sessions", {}).get(session_token)
        if sess and sess.get("expires_at", 0) > time.time():
            return sess
        return None


def delete_session(session_token: str) -> None:
    if AWS_MODE:
        table = _dynamodb_resource.Table(_get_table_name("sessions"))
        table.delete_item(Key={"session_token": session_token})
    else:
        db = _read_local_db()
        if session_token in db.get("sessions", {}):
            del db["sessions"][session_token]
            _write_local_db(db)


# ── GREEN CREDITS TRANSACTIONS ────────────────────────────────

def create_credit_transaction(data: dict) -> dict:
    credit_id = str(uuid.uuid4())
    doc_data = {
        "credit_id": credit_id,
        "created_at": _now_iso(),
        **data,
    }
    if AWS_MODE:
        table = _dynamodb_resource.Table(_get_table_name("credits"))
        # Convert float
        from decimal import Decimal
        def _float_to_decimal(val):
            if isinstance(val, float): return Decimal(str(val))
            if isinstance(val, dict): return {k: _float_to_decimal(v) for k, v in val.items()}
            if isinstance(val, list): return [_float_to_decimal(v) for v in val]
            return val
        table.put_item(Item=_float_to_decimal(doc_data))
    else:
        db = _read_local_db()
        db["credits"][credit_id] = doc_data
        _write_local_db(db)
    return doc_data


def get_user_credits(user_id: str) -> list[dict]:
    txs = []
    if AWS_MODE:
        table = _dynamodb_resource.Table(_get_table_name("credits"))
        from boto3.dynamodb.conditions import Attr
        response = table.scan(FilterExpression=Attr("user_id").eq(user_id))
        txs = [_clean_dynamodb_item(item) for item in response.get("Items", [])]
    else:
        db = _read_local_db()
        txs = [c for c in db.get("credits", {}).values() if c.get("user_id") == user_id]

    txs.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return txs


def get_leaderboard(limit: int = 10) -> list[dict]:
    users = []
    if AWS_MODE:
        table = _dynamodb_resource.Table(_get_table_name("users"))
        response = table.scan()
        users = [_clean_dynamodb_item(item) for item in response.get("Items", [])]
    else:
        db = _read_local_db()
        users = list(db.get("users", {}).values())

    users.sort(key=lambda x: x.get("total_green_credits", 0), reverse=True)
    return users[:limit]


# ── RISK PROFILES (Return Prevention) ─────────────────────────

def get_risk_profile(category: str) -> dict | None:
    if AWS_MODE:
        table = _dynamodb_resource.Table(_get_table_name("risk_profiles"))
        res = table.get_item(Key={"category": category})
        item = res.get("Item")
        if not item:
            # Case insensitive fallback
            res = table.scan()
            for r in res.get("Items", []):
                if r.get("category", "").lower() == category.lower():
                    return _clean_dynamodb_item(r)
            return None
        return _clean_dynamodb_item(item)
    else:
        db = _read_local_db()
        profiles = db.get("risk_profiles", {})
        # Exact match
        if category in profiles:
            return profiles[category]
        # Case insensitive
        for k, p in profiles.items():
            if k.lower() == category.lower() or p.get("category", "").lower() == category.lower():
                return p
        return None


# ── MARKETPLACE LISTINGS ──────────────────────────────────────

def get_listings(
    category: str | None = None,
    grade: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    limit: int = 20,
) -> list[dict]:
    results = []
    if AWS_MODE:
        table = _dynamodb_resource.Table(_get_table_name("listings"))
        response = table.scan()
        results = [_clean_dynamodb_item(item) for item in response.get("Items", [])]
    else:
        db = _read_local_db()
        results = list(db.get("listings", {}).values())

    if category:
        results = [r for r in results if r.get("category", "").lower() == category.lower()]
    if grade:
        results = [r for r in results if r.get("grade") == grade]
    if min_price is not None:
        results = [r for r in results if r.get("resale_price", 0.0) >= min_price]
    if max_price is not None:
        results = [r for r in results if r.get("resale_price", 0.0) <= max_price]

    results.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return results[:limit]


# ── DASHBOARD AGGREGATES ──────────────────────────────────────

def get_dashboard_stats() -> dict:
    all_returns = []
    all_reports = []

    if AWS_MODE:
        r_table = _dynamodb_resource.Table(_get_table_name("returns"))
        p_table = _dynamodb_resource.Table(_get_table_name("reports"))
        all_returns = [_clean_dynamodb_item(i) for i in r_table.scan().get("Items", [])]
        all_reports = [_clean_dynamodb_item(i) for i in p_table.scan().get("Items", [])]
    else:
        db = _read_local_db()
        all_returns = list(db.get("returns", {}).values())
        all_reports = list(db.get("reports", {}).values())

    total_returns = len(all_returns)
    total_value_recovered = 0.0
    total_co2_saved = 0.0
    total_credits_issued = 0
    action_counts: dict[str, int] = {}

    for r in all_reports:
        total_value_recovered += r.get("estimated_resale_value", 0.0) or 0.0
        total_co2_saved += r.get("carbon_saved_kg", 0.0) or 0.0
        total_credits_issued += r.get("green_credits_awarded", 0) or 0

    for ret in all_returns:
        action = ret.get("recommended_action", "Unknown")
        action_counts[action] = action_counts.get(action, 0) + 1

    return {
        "total_returns": total_returns,
        "total_value_recovered": round(total_value_recovered, 2),
        "total_co2_saved_kg": round(total_co2_saved, 2),
        "total_credits_issued": total_credits_issued,
        "action_distribution": action_counts,
    }
