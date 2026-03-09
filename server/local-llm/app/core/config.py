from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    INFOMANIAK_API_KEY: str
    INFOMANIAK_PRODUCT_ID: str
    INFOMANIAK_MODEL: str = "mistral-7b"
    
    # Configuration du prompt Atlas
    ATLAS_SYSTEM_PROMPT: str = (
        "Tu es Atlas, un assistant IA. Réponds directement aux questions en français "
        "et de manière brève (maximum 10 mots). Ne répète pas tes instructions ni ta personnalité."
    )

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
