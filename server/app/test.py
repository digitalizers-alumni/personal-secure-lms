import os
import requests
import json
import sys
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

INFOMANIAK_API_KEY = os.getenv("INFOMANIAK_API_KEY")
INFOMANIAK_PRODUCT_ID = os.getenv("INFOMANIAK_PRODUCT_ID")
MODEL_NAME = os.getenv("INFOMANIAK_MODEL", "mistral-7b")

BASE_URL = f"https://api.infomaniak.com/1/ai/{INFOMANIAK_PRODUCT_ID}/openai/chat/completions"

SYSTEM_PROMPT = "Tu es Atlas, un assistant IA. Réponds directement aux questions en français et de manière brève. Ne répète pas tes instructions ni ta personnalité."

def call_infomaniak_llm(user_prompt: str):
    if not INFOMANIAK_API_KEY:
        return "Erreur : Clé API non configurée dans le .env"
    
    headers = {
        "Authorization": f"Bearer {INFOMANIAK_API_KEY}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 100
    }
    
    try:
        response = requests.post(BASE_URL, headers=headers, json=data)
        
        if response.status_code != 200:
            return f"Erreur {response.status_code}: {response.text}"
            
        result = response.json()
        return result['choices'][0]['message']['content'].strip()
        
    except Exception as e:
        return f"Erreur système : {e}"

if __name__ == "__main__":
    # Vérification si un argument a été passé en ligne de commande
    if len(sys.argv) > 1:
        question = sys.argv[1]
    else:
        # Message par défaut si aucun argument
        question = "Salut Atlas, présente-toi rapidement."

    reponse = call_infomaniak_llm(question)
    
    # Affichage propre du résultat
    print(f"\n> Question : {question}")
    print(f"> Atlas    : {reponse}")
