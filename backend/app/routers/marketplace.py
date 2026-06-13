from fastapi import APIRouter, Depends, Query
from app.services import db_service as db
from app.middleware.auth_middleware import verify_session_token
from typing import Optional

router = APIRouter()

# Fallback seeded listings for demo (used when database is empty)
DEMO_LISTINGS = [
    {"listing_id": "l001", "product_name": "Sony WH-1000XM4 Headphones", "category": "Electronics", "brand": "Sony", "grade": "A", "original_price": 349.99, "resale_price": 219.99, "co2_saved_kg": 4.5, "trust_score": 4.8, "image_url": "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400", "description": "Grade A certified refurbished. Like-new condition, all accessories included.", "warranty_months": 6},
    {"listing_id": "l002", "product_name": "Apple iPad Air 5th Gen", "category": "Electronics", "brand": "Apple", "grade": "B", "original_price": 749.00, "resale_price": 429.99, "co2_saved_kg": 6.2, "trust_score": 4.7, "image_url": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400", "description": "Grade B refurbished. Minor cosmetic scratches, fully functional.", "warranty_months": 3},
    {"listing_id": "l003", "product_name": "Nike Air Max 270", "category": "Clothing & Apparel", "brand": "Nike", "grade": "A", "original_price": 150.00, "resale_price": 89.99, "co2_saved_kg": 2.1, "trust_score": 4.6, "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400", "description": "Grade A open-box. Tried on once, no wear visible.", "warranty_months": 0},
    {"listing_id": "l004", "product_name": "Instant Pot Duo 7-in-1", "category": "Home & Kitchen", "brand": "Instant Pot", "grade": "B", "original_price": 99.95, "resale_price": 54.99, "co2_saved_kg": 1.8, "trust_score": 4.5, "image_url": "https://images.unsplash.com/photo-1585515320310-259814833e62?w=400", "description": "Grade B certified. Light use, fully tested and sanitized.", "warranty_months": 3},
    {"listing_id": "l005", "product_name": "Samsung 65\" QLED TV", "category": "Electronics", "brand": "Samsung", "grade": "A", "original_price": 1299.99, "resale_price": 849.99, "co2_saved_kg": 9.8, "trust_score": 4.9, "image_url": "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=400", "description": "Grade A certified. Display-returned unit, zero screen defects.", "warranty_months": 12},
    {"listing_id": "l006", "product_name": "Dyson V11 Cordless Vacuum", "category": "Home & Kitchen", "brand": "Dyson", "grade": "B", "original_price": 599.99, "resale_price": 319.99, "co2_saved_kg": 5.1, "trust_score": 4.7, "image_url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400", "description": "Grade B refurbished. Suction power verified at 95% of new.", "warranty_months": 6},
    {"listing_id": "l007", "product_name": "Levi's 501 Original Jeans", "category": "Clothing & Apparel", "brand": "Levi's", "grade": "A", "original_price": 79.50, "resale_price": 44.99, "co2_saved_kg": 1.4, "trust_score": 4.4, "image_url": "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400", "description": "Grade A open-box. Unworn, tags attached, wrong size return.", "warranty_months": 0},
    {"listing_id": "l008", "product_name": "Fitbit Charge 5", "category": "Electronics", "brand": "Fitbit", "grade": "A", "original_price": 179.95, "resale_price": 109.99, "co2_saved_kg": 2.8, "trust_score": 4.6, "image_url": "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=400", "description": "Grade A certified. Factory-reset and tested, all bands included.", "warranty_months": 6},
    {"listing_id": "l009", "product_name": "KitchenAid Stand Mixer", "category": "Home & Kitchen", "brand": "KitchenAid", "grade": "B", "original_price": 449.99, "resale_price": 249.99, "co2_saved_kg": 4.2, "trust_score": 4.8, "image_url": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400", "description": "Grade B refurbished. Minor paint chip on base, motor 100% functional.", "warranty_months": 6},
    {"listing_id": "l010", "product_name": "GoPro HERO11 Black", "category": "Electronics", "brand": "GoPro", "grade": "A", "original_price": 399.99, "resale_price": 259.99, "co2_saved_kg": 3.5, "trust_score": 4.7, "image_url": "https://images.unsplash.com/photo-1603481546238-487240415921?w=400", "description": "Grade A certified. Like-new, all mounts and accessories included.", "warranty_months": 3},
    {"listing_id": "l011", "product_name": "Under Armour Running Shoes", "category": "Sports & Outdoors", "brand": "Under Armour", "grade": "A", "original_price": 120.00, "resale_price": 69.99, "co2_saved_kg": 1.9, "trust_score": 4.5, "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400", "description": "Grade A open-box. Worn briefly indoors only, no exterior wear.", "warranty_months": 0},
    {"listing_id": "l012", "product_name": "Bose SoundLink Revolve+", "category": "Electronics", "brand": "Bose", "grade": "B", "original_price": 299.00, "resale_price": 159.99, "co2_saved_kg": 3.1, "trust_score": 4.6, "image_url": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400", "description": "Grade B refurbished. Slight scuff on base, sound quality perfect.", "warranty_months": 3},
]


@router.get("")
async def get_listings(
    category:  Optional[str] = Query(None),
    grade:     Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price:  Optional[float] = Query(None),
    sort_by:   str = Query("grade", description="Sort by: grade, price_asc, price_desc, co2"),
    token:     dict = Depends(verify_session_token),
):
    """Get refurbished marketplace listings with filters."""
    # Try database first, fall back to demo data
    try:
        listings = db.get_listings(category, grade, min_price, max_price)
        if not listings:
            listings = DEMO_LISTINGS
    except Exception:
        listings = DEMO_LISTINGS

    # Apply filters to demo data
    if category:
        listings = [l for l in listings if l.get("category") == category]
    if grade:
        listings = [l for l in listings if l.get("grade") == grade]
    if min_price:
        listings = [l for l in listings if l.get("resale_price", 0) >= min_price]
    if max_price:
        listings = [l for l in listings if l.get("resale_price", 0) <= max_price]

    # Sorting
    sort_key = {
        "grade":      lambda x: x.get("grade", "Z"),
        "price_asc":  lambda x: x.get("resale_price", 0),
        "price_desc": lambda x: -x.get("resale_price", 0),
        "co2":        lambda x: -x.get("co2_saved_kg", 0),
    }.get(sort_by, lambda x: x.get("grade", "Z"))

    listings.sort(key=sort_key)

    return {
        "listings": listings,
        "total": len(listings),
    }
