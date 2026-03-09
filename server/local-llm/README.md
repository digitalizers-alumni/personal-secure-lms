# 🤖 Atlas Backend - Brique LLM (Infomaniak AI)

Ce service est la brique d'intelligence artificielle du projet Atlas. Il permet d'interroger des modèles de langage (LLM) hébergés en Suisse via l'infrastructure **Infomaniak AI** (OpenAI-compatible).

## 🚀 Installation & Lancement Rapide (Docker)

La méthode recommandée pour lancer le service est d'utiliser **Docker Compose**. Cela garantit que toutes les dépendances sont correctement isolées et configurées.

### 1. Configuration des secrets
Créez un fichier `.env` à la racine du projet et remplissez-le avec vos identifiants Infomaniak :

```bash
# .env
INFOMANIAK_API_KEY=votre_cle_api_ici
INFOMANIAK_PRODUCT_ID=votre_product_id_ici
INFOMANIAK_MODEL=llama3  # Modèles : mixtral, llama3, mistral3, etc.
```

### 2. Démarrer le service
Lancez le conteneur (le flag `--build` assure la mise à jour des dépendances) :

```bash
docker-compose up --build
```

Le service sera disponible sur **[http://localhost:8000](http://localhost:8000)**.

---

## 🧪 Tester l'API

Une fois le serveur lancé (via Docker ou Local), vous pouvez tester la brique LLM de deux manières :

### A. Via le Terminal (cURL)
Ouvrez un **nouveau terminal** et exécutez la commande suivante :

```bash
curl -X POST "http://localhost:8000/api/generate" \
     -H "Content-Type: application/json" \
     -d '{"prompt": "Salut Atlas, présente-toi en 5 mots."}'
```

### B. Via l'Interface Interactive (Swagger)
FastAPI génère automatiquement une interface de test visuelle :
👉 Accédez à : [http://localhost:8000/docs](http://localhost:8000/docs)
1. Cliquez sur `POST /api/generate`
2. Cliquez sur **"Try it out"**
3. Modifiez le JSON de test et cliquez sur **"Execute"**

---

## 🛠️ Développement Local (Sans Docker)

Si vous préférez travailler sans Docker :

1. **Préparer l'environnement** :
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # Windows: .\venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```

2. **Lancer le serveur** :
   ```bash
   uvicorn app.main:app --reload
   ```

---

## 📂 Structure du Projet (Clean Architecture)

- `app/main.py` : Initialisation de FastAPI et montage des routes.
- `app/api/llm.py` : Points d'entrée (Endpoints) de l'API.
- `app/services/llm_service.py` : Logique d'appel API Infomaniak (Asynchrone).
- `app/schemas/llm.py` : Validation Pydantic (Request/Response).
- `app/core/config.py` : Gestion centralisée du fichier `.env`.

---

## 📝 Notes Techniques
- **Souveraineté** : Infrastructure 100% suisse, conforme aux exigences de protection des données.
- **Async** : Utilisation de `httpx` pour ne pas bloquer les requêtes entrantes pendant l'inférence LLM.
- **Live-Reload** : En mode Docker, le dossier `./app` est monté en volume, permettant de modifier le code sans reconstruire l'image.
