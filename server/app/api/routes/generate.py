import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.api.schemas.llm import LLMRequest, LLMResponse
from app.services.llm_service import llm_service
from app.services.pipeline import run_rag_pipeline


logger = logging.getLogger(__name__)
router = APIRouter()

class ChunkSource(BaseModel):
    text: str
    doc_id: int
    score: float

class GenerateRequest(BaseModel):
    prompt: str = Field(..., description="Full prompt with context already built")
    user_id: int | None = None


class GenerateResponse(BaseModel):
    answer: str
    keywords: list[str]
    sources: list[ChunkSource]


@router.post("/generate", response_model=GenerateResponse)
async def generate(request: GenerateRequest):
    """
    Low-level generation endpoint.
    Runs the full RAG pipeline and returns an LLM-augmented answer.
    """
    try:
        result = await run_rag_pipeline(
            prompt=request.prompt,
            user_id=request.user_id,
        )
        return GenerateResponse(
            answer=result["answer"],
            keywords=result["keywords"],
            sources=[ChunkSource(**c) for c in result["sources"]],
        )
    except HTTPException as e:
        # Re-raise HTTPException directly, as it's already properly formatted
        raise e
    except Exception as e:
        logger.error("Generation failed: %s", str(e))
        # For any other unexpected exception, raise a generic 500 Internal Server Error
        raise HTTPException(status_code=500, detail="Internal Server Error")
