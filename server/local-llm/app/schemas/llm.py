from pydantic import BaseModel, Field
from typing import Optional

class LLMRequest(BaseModel):
    prompt: str = Field(..., description="Le message à envoyer à Atlas")

class LLMResponse(BaseModel):
    generated_text: str = Field(..., description="La réponse d'Atlas")
