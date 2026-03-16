import httpx
from fastapi import HTTPException
from app.api.core.config import settings

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
        Sent async request to Atlas' Infomaniak API
        """
        data = {
            "model": settings.INFOMANIAK_MODEL,
            "messages": [
                {"role": "system", "content": settings.ATLAS_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.7,
            "max_tokens": 500
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(self.base_url, headers=self.headers, json=data)
                response.raise_for_status()
                
                result = response.json()
                return result['choices'][0]['message']['content'].strip()
                
            except httpx.HTTPStatusError as e:
                raise HTTPException(
                    status_code=502,
                    detail=f"LLM API error ({e.response.status_code}): {e.response.text}"
                )
            except httpx.TimeoutException:
                raise HTTPException(
                    status_code=504,
                    detail="LLM API timeout"
                )
            except httpx.RequestError as e:
                raise HTTPException(
                    status_code=503,
                    detail=f"LLM unreachable: {str(e)}"
                )
            except (KeyError, IndexError):
                raise HTTPException(
                    status_code=502,
                    detail="Unexpected LLM response format"
                )

# SIngleton instanciation for service
llm_service = LLMService()
