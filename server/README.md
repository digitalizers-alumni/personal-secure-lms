# Lumina Backend - LLM Module (Infomaniak AI)

This service is the backend component of the Lumina project.
It is composed of a RAG to embbed documents and enrich prompt for Large Language Models (LLMs) via **Infomaniak AI** to create personalized courses. 

## Requirements

- **Python** (v3.11+)
- **Docker** (v29.0+)
- **Ubuntu-server 24.04 or Debian Bookworm**
- **Infomaniak LLM API token Key**

## Quick Start

The recommended method to run the service is using **Docker Compose**. This ensures all dependencies are correctly isolated and configured.
To install and set environment variables you can execute :
```bash
bash install-requirements.sh
```

## Environment Variables

### Backend (`server/.env`)
- `DATABASE_URL`: SQLite or PostgreSQL connection string.
- `SECRET_KEY`: Used for JWT signing.
- `INFOMANIAK_API_KEY`: Your LLM provider key.
- `CORS_ORIGINS`: Allowed frontend origins.

## Manual installation

### 1. Configure Secrets
Create a `.env` file at the project root and fill it with your Infomaniak credentials:

```bash
# .env
INFOMANIAK_API_KEY=your_api_key_here
INFOMANIAK_PRODUCT_ID=your_product_id_here
INFOMANIAK_MODEL=llama3  # Available models: mixtral, llama3, mistral3, etc.
CORS_ORIGINS=allowed-frontend-url-origins # default: http://localhost:8000
```

### 2. Start the Service
Launch the container:

```bash
docker-compose up --build -d
```

The service will be available at **[http://localhost:8000]**.

---

## 📂 Project Structure (Clean Architecture)

- `app/main.py`: FastAPI initialization and route mounting.
- `app/api/llm.py`: API Entry points (Endpoints).
- `app/services/llm_service.py`: Infomaniak API calling logic (Asynchronous).
- `app/schemas/llm.py`: Pydantic Validation (Request/Response).
- `app/core/config.py`: Centralized management of the `.env` file.

---

## 📝 Technical Notes
- **Data Sovereignty**: 100% Swiss infrastructure, compliant with data protection requirements.
- **Async**: Uses `httpx` to avoid blocking incoming requests during LLM inference.
- **Live-Reload**: In Docker mode, the `./app` folder is mounted as a volume, allowing code modifications without rebuilding the image.
