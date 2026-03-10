import httpx
from app.core.config import settings

class LLMService:
    def __init__(self):
        self.base_url = (
            f"https://api.infomaniak.com/1/ai/{settings.INFOMANIAK_PRODUCT_ID}/openai/chat/completions"
        )
        self.headers = {
            "Authorization": f"Bearer {settings.INFOMANIAK_API_KEY}",
            "Content-Type": "application/json"
        }

    async def generate_response(self, user_prompt: str) -> str:
        """
        Envoie une requête asynchrone à l'API Infomaniak pour obtenir une réponse d'Atlas.
        """
        data = {
            "model": settings.INFOMANIAK_MODEL,
            "messages": [
                {"role": "system", "content": settings.ATLAS_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.7,
            "max_tokens": 50
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(self.base_url, headers=self.headers, json=data)
                
                if response.status_code != 200:
                    return f"Erreur API ({response.status_code}): {response.text}"
                
                result = response.json()
                return result['choices'][0]['message']['content'].strip()
                
            except httpx.HTTPError as e:
                return f"Erreur de communication avec le LLM : {str(e)}"

# On instancie un singleton pour le service
llm_service = LLMService()
