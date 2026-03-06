# Backend LLM Local - Atlas

Ce dossier contient le service backend permettant de faire tourner un LLM localement (Mistral-7B-v0.3) via FastAPI.

## 🚀 Installation Rapide

Suivez ces étapes pour mettre en place l'environnement de développement :

### 1. Créer l'environnement virtuel (venv)
Il est fortement recommandé d'utiliser un environnement virtuel pour isoler les dépendances (PyTorch, Transformers, etc.).

```bash
# Dans le dossier server/local-llm/
python3 -m venv venv
```

### 2. Activer l'environnement virtuel
```bash
# Sur Linux / macOS
source venv/bin/activate

# Sur Windows (PowerShell)
.\venv\Scripts\Activate.ps1
```

### 3. Installer les dépendances
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

> **Note :** Le premier téléchargement de PyTorch et des modèles Mistral peut être long (environ 15 Go). Assurez-vous d'avoir assez d'espace disque.

## 🛠️ Utilisation

### Démarrer le serveur
```bash
uvicorn main:app --reload
```
Le serveur sera disponible sur [http://localhost:8000](http://localhost:8000).

### Tester l'API
Vous pouvez tester si le modèle répond correctement avec cette commande `curl` :

```bash
curl -X POST \
-H "Content-Type: application/json" \
-d '{"prompt": "Salut, qui es-tu ?"}' \
http://localhost:8000/generate
```

## 📂 Structure du projet
- `main.py` : Point d'entrée FastAPI et chargement du modèle.
- `requirements.txt` : Liste des dépendances Python.
- `.gitignore` : Configuration pour ignorer les fichiers lourds (venv, modèles).
