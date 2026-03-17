# Light python image
FROM python:3.12-slim

# Container workspace
WORKDIR /app

# Update and install curl
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*


# Copy requirements and install depedencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copie du code applicatif depuis le dossier app
COPY app/ ./app/

EXPOSE 8000

# uvicorn command with hot reload enabled
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]