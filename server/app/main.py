import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes.llm import router as llm_router
from app.api.routes.documents import router as documents_router
from app.api.routes.users import router as users_router
from app.api.routes.courses import router as courses_router
from app.api.routes.auth import router as auth_router
from app.db.database import init_db
from app.api.core.config import settings
from app.rag.embedder import embedder
from app.api.routes.generate import router as generate_router
from app.api.core.security import get_current_user
from fastapi import Depends

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up Lumina Backend")
    init_db()
    embedder.load()
    from app.rag.indexer import ensure_collection
    ensure_collection()
    logger.info("Lumina Backend ready")
    yield


app = FastAPI(
    title="Lumina Backend",
    description="RAG API — document ingestion and LLM-augmented query service",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth route: /api/token
app.include_router(auth_router, prefix="/auth", tags=["Auth"])

# Protected routes (require JWT)
app.include_router(
    documents_router, 
    prefix="/api/documents", 
    tags=["Documents"],
    dependencies=[Depends(get_current_user)]
)

app.include_router(
    generate_router, 
    prefix="/api", 
    tags=["Generate"],
    dependencies=[Depends(get_current_user)]
)

app.include_router(
    users_router,
    prefix="/api/users",
    tags=["Users"],
    dependencies=[Depends(get_current_user)]
)

app.include_router(
    courses_router,
    prefix="/api/courses",
    tags=["Courses"],
    dependencies=[Depends(get_current_user)]
)

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}
