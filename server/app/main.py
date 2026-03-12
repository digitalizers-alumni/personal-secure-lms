import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.api.routes.llm import router as llm_router
from app.db.database import init_db
from app.rag.embedder import embedder
from app.api.routes.upload_document import router as documents_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up Atlas Backend")
    init_db()
    embedder.load()
    logger.info("Atlas Backend ready")
    yield
    logger.info("Shutting down Atlas Backend")


app = FastAPI(
    title="Atlas Backend",
    description="RAG API — document ingestion and LLM-augmented query service",
    version="1.0.0",
    lifespan=lifespan
)
app.include_router(documents_router, prefix="/api", tags=["Documents"])
app.include_router(llm_router, prefix="/api", tags=["LLM"])


@app.get("/health", tags=["Health"])
async def root():
    return {"message": "Atlas Backend is running", "status": "ok"}