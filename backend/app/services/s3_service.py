"""
S3 Storage Service — Handles image uploads.
Uploads to Amazon S3 if configured; otherwise saves to local static uploads folder.
"""
import os
import boto3
from app.config import get_settings

settings = get_settings()

# Directories for local static uploads
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
STATIC_DIR = os.path.join(BACKEND_DIR, "static")
UPLOADS_DIR = os.path.join(STATIC_DIR, "uploads")

# Ensure directories exist
os.makedirs(UPLOADS_DIR, exist_ok=True)

AWS_S3_MODE = False
s3_client = None

if settings.aws_access_key_id and settings.aws_secret_access_key:
    try:
        s3_client = boto3.client(
            "s3",
            region_name=settings.aws_region,
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key
        )
        # Verify permissions
        s3_client.head_bucket(Bucket=settings.aws_s3_bucket)
        AWS_S3_MODE = True
        print(f"⚡ AWS S3 Storage configured (Bucket: {settings.aws_s3_bucket})")
    except Exception as e:
        print(f"⚠️ S3 Connection failed ({e}). Falling back to Local file storage.")
        AWS_S3_MODE = False
else:
    print("ℹ️ AWS S3 credentials not set. Image uploads will save to backend/static/uploads/")
    AWS_S3_MODE = False


def upload_return_image(file_bytes: bytes, filename: str, content_type: str) -> str:
    """
    Uploads file bytes to S3 or saves locally.
    Returns the public URL of the uploaded image.
    """
    # Clean up filename to prevent directory traversal
    clean_filename = os.path.basename(filename)
    
    if AWS_S3_MODE and s3_client:
        try:
            s3_client.put_object(
                Bucket=settings.aws_s3_bucket,
                Key=f"returns/{clean_filename}",
                Body=file_bytes,
                ContentType=content_type,
                ACL="public-read"
            )
            # Standard S3 URL
            return f"https://{settings.aws_s3_bucket}.s3.amazonaws.com/returns/{clean_filename}"
        except Exception as e:
            print(f"⚠️ AWS S3 upload failed ({e}). Saving to local disk.")
            # Fall through to local save

    # Local storage fallback
    local_path = os.path.join(UPLOADS_DIR, clean_filename)
    with open(local_path, "wb") as f:
        f.write(file_bytes)
        
    # Return local HTTP path served by backend
    # VITE_API_BASE_URL defaults to localhost:8000
    return f"http://localhost:8000/static/uploads/{clean_filename}"
