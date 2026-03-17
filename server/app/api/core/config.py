from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional, List

class Settings(BaseSettings):
    INFOMANIAK_API_KEY: str
    INFOMANIAK_PRODUCT_ID: str
    INFOMANIAK_MODEL: str = "mistral-7b"
    
    # Security
    SECRET_KEY: str = "lumina-swiss-prod-secret-key-change-me"
    
    # Database
    DATABASE_URL: str = "sqlite:///./data/rag_lms.db"
    
    # CORS — accept comma-separated string from .env
    CORS_ORIGINS: str = "http://localhost:8080,http://localhost:5173"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    # Configuration du prompt Atlas
    ATLAS_SYSTEM_PROMPT: str = (
        "Tu es Atlas, un assistant IA. Réponds directement aux questions en français "
        "et de manière brève (maximum 10 mots). Ne répète pas tes instructions ni ta personnalité."
    )

    # Infrastructure
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333

    @property
    def redis_url(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/0"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
