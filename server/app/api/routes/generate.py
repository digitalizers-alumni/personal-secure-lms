import logging
from typing import List, Optional
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
    prompt: str = Field(..., description="The query/instruction from the user")
    user_id: Optional[str] = None
    doc_ids: Optional[List[int]] = None


class GenerateResponse(BaseModel):
    answer: str
    keywords: List[str]
    sources: List[ChunkSource]


from app.models.users import User
from app.api.core.security import get_current_user
from fastapi import APIRouter, HTTPException, Depends

@router.post("/generate", response_model=GenerateResponse)
async def generate(
    request: GenerateRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Low-level generation endpoint.
    Runs the full RAG pipeline and returns an LLM-augmented answer.
    """
    try:
        user_id = current_user.email
        result = await run_rag_pipeline(
            prompt=request.prompt,
            user_id=user_id,
            doc_ids=request.doc_ids
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
