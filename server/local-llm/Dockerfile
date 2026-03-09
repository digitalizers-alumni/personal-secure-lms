# Utilisation d'une image Python légère
FROM python:3.12-slim

# On définit le répertoire de travail dans le conteneur
WORKDIR /app

# Copie des dépendances en premier pour profiter du cache Docker
COPY requirements.txt .

# Installation des dépendances
RUN pip install --no-cache-dir -r requirements.txt

# Copie du code applicatif
COPY app/ ./app/

# On expose le port sur lequel l'app tourne
EXPOSE 8000

# Commande pour lancer l'application avec uvicorn
# --host 0.0.0.0 est CRUCIAL pour que le conteneur soit accessible de l'extérieur
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
