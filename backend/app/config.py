from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    gemini_api_key: str = ""
    frontend_origin: str = "http://localhost:5173"
    app_env: str = "development"
    
    # AWS configuration for DynamoDB and S3
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "us-east-1"
    aws_s3_bucket: str = "returnwise-ai-assets"
    dynamodb_table_prefix: str = "returnwise_ai_"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
