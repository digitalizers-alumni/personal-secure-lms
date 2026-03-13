import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.db.database import init_db
from app.rag.embedder import embedder
from app.api.routes.upload_document import router as documents_router
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes.generate import router as generate_router


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up Atlas Backend")
    init_db()
    embedder.load()
    from app.rag.indexer import ensure_collection
    ensure_collection()
    logger.info("Atlas Backend ready")
    yield


app = FastAPI(
    title="Atlas Backend",
    description="RAG API — document ingestion and LLM-augmented query service",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents_router, prefix="/api", tags=["Documents"])
app.include_router(generate_router, prefix="/api", tags=["Generate"])

@app.get("/health", tags=["Health"])
async def root():
    return {"message": "Atlas Backend is running", "status": "ok"}