from fastapi import FastAPI
from app.api.routes.llm import router as llm_router

# Fast API initialization
app = FastAPI(
    title="Atlas Backend - LLM",
    description="API service for atlas agent hosted at Infomaniak",
    version="1.0.0"
)

# Add LLM route under /api
app.include_router(llm_router, prefix="/api", tags=["LLM"])

@app.get("/")
async def root():
    return {"message": "Atlas Backend is running", "status": "ok"}
