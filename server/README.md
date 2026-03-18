# Lumina Backend - LLM Module (Infomaniak AI)

This service is the backend component of the Lumina project.
It is composed of a RAG to embbed documents and enrich prompt for Large Language Models (LLMs) via **Infomaniak AI** to create personalized courses.

## Project Structure (Clean Architecture)

- `app/main.py`: FastAPI initialization and route mounting.
- `app/api/llm.py`: API Entry points (Endpoints).
- `app/services/llm_service.py`: Infomaniak API calling logic (Asynchronous).
- `app/schemas/llm.py`: Pydantic Validation (Request/Response).
- `app/core/config.py`: Centralized management of the `.env` file.

---

## Technical Notes
- **Data Sovereignty**: 100% Swiss infrastructure, compliant with data protection requirements.
- **Async**: Uses `httpx` to avoid blocking incoming requests during LLM inference.
- **Live-Reload**: In Docker mode, the `./app` folder is mounted as a volume, allowing code modifications without rebuilding the image.


## Requirements

- **Python** (v3.11+)
- **Docker** (v29.0+)
- **Debian Bookworm or WSL for Windows users**
- **Infomaniak LLM API token Key**

## Quick Start

The recommended method to run the service is using **Docker Compose**. This ensures all dependencies are correctly isolated and configured.
To install and set environment variables you can execute :
```bash
bash install.sh
```

## Manual installation

## Environment Variables

If you didn't use the install-requirements.sh script, you have to create this file manually in server/

### 1. Configure Secrets Backend (`server/.env`)
- `DATABASE_URL`: SQLite or PostgreSQL connection string.
- `SECRET_KEY`: Used for JWT signing.
- `INFOMANIAK_API_KEY`: Your LLM provider key.
- `CORS_ORIGINS`: Allowed frontend origins.
- `CADDY_HOST=localhost` : Machine IP where luminas server is executed

### 2. Start the Service
Launch the container, it might take several minutes:

```bash
docker-compose up --build -d
```

The service will be available at **[http://localhost:8000]**.

---