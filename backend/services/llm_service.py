import logging
import json
from google import genai
from typing import Optional

from config import settings

logger = logging.getLogger("wicked.llm_service")

class LLMService:
    def __init__(self):
        self.client = None
        if settings.gemini_api_key:
            self.client = genai.Client(api_key=settings.gemini_api_key)
        else:
            logger.warning("GEMINI_API_KEY is not set. LLM features will not work.")

    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        use_search: bool = False
    ) -> str:
        if not self.client:
            raise RuntimeError("Gemini API key not configured in .env")

        from google.genai import types

        try:
            full_prompt = prompt
            if system_prompt:
                full_prompt = f"System: {system_prompt}\n\nUser: {prompt}"

            config_args = {}
            if temperature is not None:
                config_args["temperature"] = temperature
            if use_search:
                config_args["tools"] = [{"google_search": {}}]

            config = types.GenerateContentConfig(**config_args) if config_args else None

            response = self.client.models.generate_content(
                model=settings.gemini_model,
                contents=full_prompt,
                config=config,
            )
            return response.text.strip()
        except Exception as e:
            logger.error(f"Gemini generation error: {e}")
            raise RuntimeError(f"Gemini API error: {e}")

    def generate_json(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        use_search: bool = False
    ) -> dict | list:
        # Prompt the model to return JSON
        json_prompt = f"{prompt}\n\nPlease respond ONLY with valid JSON."
        text_response = self.generate(json_prompt, system_prompt, temperature, use_search)
        
        # Try to clean up markdown formatting if the LLM returned it
        if text_response.startswith("```json"):
            text_response = text_response[7:]
        if text_response.startswith("```"):
            text_response = text_response[3:]
        if text_response.endswith("```"):
            text_response = text_response[:-3]
            
        try:
            return json.loads(text_response.strip())
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM JSON response: {text_response}")
            return {"parse_error": str(e), "raw": text_response}

_instance = None

def get_llm_service() -> LLMService:
    global _instance
    if _instance is None:
        _instance = LLMService()
    return _instance

def call_llm(prompt: str) -> str:
    """Legacy helper function."""
    return get_llm_service().generate(prompt)