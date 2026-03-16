# LuminaSwiss — Knowledge-to-Learning Engine

LuminaSwiss is a secure, private, RAG-driven knowledge management system designed to transform internal documentation into intelligent training modules. Built with a "Privacy-First" architecture, it detects and anonymizes PII (Personally Identifiable Information) on the client side before any data reaches the cloud.

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** (v18+)
- **Python** (v3.10+)
- **Qdrant** (Vector Database) — Running on port 6333
- **Infomaniak LLM API Key**

### 2. Backend Setup
```bash
cd server
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python seed_db.py         # Initialize the database with demo data
python main.py
```

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev
```

### 4. Qdrant Setup
If using Docker:
```bash
docker run -p 6333:6333 qdrant/qdrant
```

## 🔐 Security & Privacy
- **Client-Side PII Detection**: Uses a local Transformers.js model to detect sensitive data (names, locations, etc.).
- **Tokenization**: Sensitive data is replaced by tokens (e.g., `[[PII_001]]`) before upload.
- **RAG-First**: All LLM queries are grounded in your private, anonymized document base.

## 🛠 Environment Variables

### Backend (`server/.env`)
- `DATABASE_URL`: SQLite or PostgreSQL connection string.
- `SECRET_KEY`: Used for JWT signing.
- `INFOMANIAK_API_KEY`: Your LLM provider key.
- `CORS_ORIGINS`: Allowed frontend origins.

### Frontend (`client/.env`)
- `VITE_API_URL`: Backend API endpoint (default: `http://localhost:8000`).

## 🎯 Demo Login
For the demo, you can use:
- **Email**: `admin@lumina-swiss.ch`
- **Password**: `admin123`

## 📦 Submission & Deployment
LuminaSwiss is designed for deployment on Swiss infrastructure (e.g., Infomaniak Jelastic/Public Cloud).
- **Frontend**: Static build deployed to a web server or CDN.
- **Backend**: FastAPI app served via Uvicorn/Gunicorn.
- **Database**: Persistent SQLite volume or managed DB.