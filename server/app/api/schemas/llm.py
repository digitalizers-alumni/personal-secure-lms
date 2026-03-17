from pydantic import BaseModel, Field
from typing import Optional

class LLMRequest(BaseModel):
    prompt: str = Field(..., description="Message to request Atlas")

class LLMResponse(BaseModel):
    generated_text: str = Field(..., description="Atlas response")
