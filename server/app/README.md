# 🤖 Atlas Backend - LLM Module (Infomaniak AI)

This service is the artificial intelligence component of the Atlas project. It enables interaction with Large Language Models (LLMs) hosted in Switzerland via the **Infomaniak AI** infrastructure (OpenAI-compatible).

## 🚀 Quick Start (Docker)

The recommended method to run the service is using **Docker Compose**. This ensures all dependencies are correctly isolated and configured.

### 1. Configure Secrets
Create a `.env` file at the project root and fill it with your Infomaniak credentials:

```bash
# .env
INFOMANIAK_API_KEY=your_api_key_here
INFOMANIAK_PRODUCT_ID=your_product_id_here
INFOMANIAK_MODEL=llama3  # Available models: mixtral, llama3, mistral3, etc.
```

### 2. Start the Service
Launch the container (the `--build` flag ensures dependencies are up to date):

```bash
docker-compose up --build
```

The service will be available at **[http://localhost:8000](http://localhost:8000)**.

---

## 🧪 Testing the API

Once the server is running (via Docker or Local), you can test the LLM module in two ways:

### A. Via Terminal (cURL)
Open a **new terminal** and run the following command:

```bash
curl -X POST "http://localhost:8000/api/generate" \
     -H "Content-Type: application/json" \
     -d '{"prompt": "Hello Atlas, introduce yourself in 5 words."}'
```

### B. Via Interactive Interface (Swagger)
FastAPI automatically generates a visual testing interface:
👉 Access at: [http://localhost:8000/docs](http://localhost:8000/docs)
1. Click on `POST /api/generate`
2. Click on **"Try it out"**
3. Modify the test JSON and click **"Execute"**

---

## 🛠️ Local Development (Without Docker)

If you prefer working without Docker:

1. **Prepare the environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # Windows: .\venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```

2. **Start the server**:
   ```bash
   uvicorn app.main:app --reload
   ```

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
