import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
<<<<<<< HEAD
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes.llm import router as llm_router
from app.api.routes.documents import router as documents_router
from app.api.routes.users import router as users_router
from app.api.routes.courses import router as courses_router
from app.db.database import init_db
from app.rag.embedder import embedder
=======
from app.db.database import init_db
from app.rag.embedder import embedder
from app.api.routes.upload_document import router as documents_router
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes.generate import router as generate_router

>>>>>>> main

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

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

<<<<<<< HEAD
# Routes
app.include_router(documents_router, prefix="/api/documents", tags=["Documents"])
app.include_router(llm_router, prefix="/api/llm", tags=["LLM"])
app.include_router(users_router, prefix="/api/users", tags=["Users"])
app.include_router(courses_router, prefix="/api/courses", tags=["Courses"])

@app.get("/", tags=["General"])
async def root():
    return {"message": "Atlas Backend is running", "status": "ok"}
=======
app.include_router(documents_router, prefix="/api", tags=["Documents"])
app.include_router(generate_router, prefix="/api", tags=["Generate"])
>>>>>>> main

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}
