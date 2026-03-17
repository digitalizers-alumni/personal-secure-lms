import logging
import httpx
from fastapi import HTTPException
from app.api.core.config import settings
import json # Added import
import re   # Added import

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        self.base_url = (
            f"https://api.infomaniak.com/2/ai/{settings.INFOMANIAK_PRODUCT_ID}/openai/v1/chat/completions"
        )
        self.headers = {
            "Authorization": f"Bearer {settings.INFOMANIAK_API_KEY}",
            "Content-Type": "application/json"
        }

    async def generate_response(self, user_prompt: str, system_prompt: str = None) -> str:
        """
        Sent async request to Atlas' Infomaniak API
        """
        messages = [
            {"role": "system", "content": system_prompt or settings.ATLAS_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ]
        
        data = {
            "model": settings.INFOMANIAK_MODEL,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 1000 # Increased for general responses
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                logger.info(f"Sending request to Infomaniak LLM: {self.base_url}")
                response = await client.post(self.base_url, headers=self.headers, json=data)
                logger.info(f"Infomaniak status code: {response.status_code}")
                response.raise_for_status()
                
                result = response.json()
                return result['choices'][0]['message']['content'].strip()
                
            except httpx.HTTPStatusError as e:
                logger.error(f"LLM API Error: {e.response.status_code} - {e.response.text}")
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

    async def generate_json_response(self, user_prompt: str, system_prompt: str) -> dict: # Changed return type to dict
        """
        Specialized method to get strict JSON from the LLM.
        """
        system_prompt_with_json_instruction = system_prompt + "\n\nYour response MUST be a valid JSON object."
        data = {
            "model": settings.INFOMANIAK_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt_with_json_instruction},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.1, # Low temperature for strict adherence to structure
            "max_tokens": 2000, # Large buffer for course + quiz
        }

        async with httpx.AsyncClient(timeout=90.0) as client:
            try:
                response = await client.post(self.base_url, headers=self.headers, json=data)
                response.raise_for_status()
                result = response.json() # Let httpx handle initial JSON parsing and encoding
                
                logger.info(f"LLM response received (generate_json_response): {result}") # Added logging
                llm_content = result['choices'][0]['message']['content'].strip()
                
                # Remove markdown code blocks
                llm_content = re.sub(r'```json\s*', '', llm_content)
                llm_content = re.sub(r'```\s*', '', llm_content)
                llm_content = llm_content.strip()

                # Fix invalid JSON escaping
                llm_content = llm_content.replace("\\'", "'")  # ← apostrophes invalides

                json_match = re.search(r'(\{.*\})', llm_content, re.DOTALL)
                if json_match:
                    json_string = json_match.group(1)
                else:
                    json_string = llm_content

                try:
                    # Attempt to parse as-is
                    return json.loads(json_string)
                except json.JSONDecodeError as e:
                    logger.warning(f"Initial JSON parse failed: {e}. Attempting sanitization...")
                    logger.error("JSON parse error: %s", e)
                    logger.error("JSON string snippet: %s", json_string[:500])
                    try:
                        # Common LLM mistake 1: Escaping single quotes as \' (invalid in JSON)
                        # Common LLM mistake 2: Literal newlines in strings
                        # Common LLM mistake 3: Mis-escaped backslashes
                        sanitized_string = json_string.replace("\\'", "'")
                        # If strict is False, some control characters are allowed, but not newlines in strings.
                        return json.loads(sanitized_string, strict=False)
                    except Exception as final_e:
                        logger.error(f"Failed to decode JSON from LLM content after sanitization: {final_e}")
                        logger.error(f"Problematic JSON string (first 200 chars): {json_string[:200]!r}")
                        raise HTTPException(
                            status_code=502,
                            detail=f"LLM Structure Error: Failed to parse JSON response - {str(final_e)}"
                        )
            except Exception as e:
                logger.error(f"Structured LLM request failed: {e}")
                raise HTTPException(status_code=502, detail=f"LLM Structure Error: {str(e)}") # Re-raise here for consistency

# SIngleton instanciation for service
llm_service = LLMService()
