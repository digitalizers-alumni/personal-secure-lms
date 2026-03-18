# Lumina Swiss – Quick Local Test Setup

This guide provides the necessary steps to correctly configure and test the Lumina Swiss system in a local environment.

## 1. Prerequisites & Pre-flight Checks
Before starting, ensure your environment is ready:
- **Software**: Docker Desktop, Node.js 22+, and Git.
- **Port Availability**: Ensure ports **8000** (Backend) and **8080** (Frontend) are not being used by other applications.
- **Clean State**: If you have previously run the system, it is recommended to start fresh:
  ```bash
  cd server && docker compose down -v && cd ..
  ```

## 2. Environment Configuration (`.env`)

### Frontend (`client/.env`)
The choice of `VITE_API_URL` is critical for successful communication:
- **Same-machine testing**: Set `VITE_API_URL=http://localhost:8000` (or leave empty).
- **Remote/Network testing**: Set `VITE_API_URL` to your machine's local IP (e.g., `http://192.168.1.XX:8000`).

### Backend (`server/.env`)
Ensure valid API keys for Infomaniak or OpenAI are provided to enable AI features.

---

## 3. Recommended Testing Workflow

### Document Processing
- **Large Files (Up to 20MB)**: The system is optimized for massive documents. When uploading, look for the **real-time progress percentage** in the document list.
- **Hardware Acceleration**: For the fastest PII detection, use a modern browser (Chrome/Edge/Safari) with **Hardware Acceleration** enabled in settings.

### AI Course Generation
- **Generation Time**: Complex course generation involves deep RAG analysis and can take **1 to 3 minutes**. 
- **Language**: The AI automatically inherits your UI language (French, Italian, German, Romansh). 

### Evaluation & Quizzes
- **Progress Tracking**: The quiz progress bar updates specifically when a question is **answered**. It reaches 100% only upon completion of the final question.

---

## 4. System Shutdown
To safely stop all services and preserve resources:
1. Stop the frontend terminal (`Ctrl + C`).
2. Stop the backend: `cd server && docker compose down`.
