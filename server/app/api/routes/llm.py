from fastapi import APIRouter, HTTPException
from app.api.schemas.llm import LLMRequest, LLMResponse
from app.services.llm_service import llm_service

router = APIRouter()

@router.post("/generate", response_model=LLMResponse)
async def generate_text(request: LLMRequest):
    """
    Entry point to generate an LLM prompt
    """
    response_text = await llm_service.generate_response(request.prompt)
    return LLMResponse(generated_text=response_text)
