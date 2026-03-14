from pydantic import field_validator
from typing import Optional, List

class Settings(BaseSettings):
    INFOMANIAK_API_KEY: str
    INFOMANIAK_PRODUCT_ID: str
    INFOMANIAK_MODEL: str = "mistral-7b"
    
    # Security
    SECRET_KEY: str = "lumina-swiss-prod-secret-key-change-me"
    
    # Database
    DATABASE_URL: str = "sqlite:///./data/rag_lms.db"
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:8080", "http://localhost:5173"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: str | List[str]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        return v

    # Configuration du prompt Atlas
    ATLAS_SYSTEM_PROMPT: str = (
        "Tu es Atlas, un assistant IA. Réponds directement aux questions en français "
        "et de manière brève (maximum 10 mots). Ne répète pas tes instructions ni ta personnalité."
    )

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
