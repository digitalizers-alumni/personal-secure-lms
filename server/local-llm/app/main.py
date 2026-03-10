from fastapi import FastAPI
from app.api.llm import router as llm_router

# Initialisation de FastAPI
app = FastAPI(
    title="Atlas Backend - Brique LLM",
    description="Service API pour l'assistant Atlas via Infomaniak",
    version="1.0.0"
)

# Inclusion du router LLM sous le préfixe /api
app.include_router(llm_router, prefix="/api", tags=["LLM"])

@app.get("/")
async def root():
    """
    Vérifie que le serveur fonctionne.
    """
    return {"message": "Atlas Backend is running", "status": "ok"}
