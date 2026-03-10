# Utilisation d'une image Python légère
FROM python:3.12-slim

# On définit le répertoire de travail dans le conteneur
WORKDIR /app

# Copie des dépendances depuis la racine du backend (server/)
COPY requirements.txt .

# Installation des dépendances
RUN pip install --no-cache-dir -r requirements.txt

# Copie du code applicatif depuis le dossier local-llm/app
COPY local-llm/app/ ./app/

# On expose le port sur lequel l'app tourne
EXPOSE 8000

# Commande pour lancer l'application avec uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
