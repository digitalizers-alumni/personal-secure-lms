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
            f"https://api.infomaniak.com/1/ai/{settings.INFOMANIAK_PRODUCT_ID}/openai/chat/completions"
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

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(self.base_url, headers=self.headers, json=data)
                response.raise_for_status()
                
                result = response.json()
                logger.info(f"LLM response received (generate_response): {result}") # Added logging
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

                # More robust extraction of JSON from markdown code block
                json_string = llm_content
                if llm_content.startswith("```json"):
                    json_string = llm_content[len("```json"):].strip()
                elif llm_content.startswith("```"):
                    json_string = llm_content[len("```"):].strip()
                
                if json_string.endswith("```"):
                    json_string = json_string[:-len("```")].strip()

                try:
                    parsed_json = json.loads(json_string) # Directly parse json_string
                    return parsed_json # Return parsed JSON object
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to decode JSON from LLM content: {e}")
                    logger.error(f"Problematic JSON string (first 200 chars): {json_string[:200]!r}") # Log original json_string
                    raise HTTPException(
                        status_code=502,
                        detail=f"LLM Structure Error: Failed to parse JSON response - {str(e)}"
                    )
            except Exception as e:
                logger.error(f"Structured LLM request failed: {e}")
                raise HTTPException(status_code=502, detail=f"LLM Structure Error: {str(e)}") # Re-raise here for consistency

# SIngleton instanciation for service
llm_service = LLMService()
