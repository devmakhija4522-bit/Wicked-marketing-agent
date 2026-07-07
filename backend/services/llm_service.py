import logging
import json
import re
import time
from google import genai
from google.genai import errors as genai_errors
import httpx
from typing import Optional

from config import settings

logger = logging.getLogger("wicked.llm_service")

# Retry only on transient failures — rate limits and server-side hiccups —
# never on client errors like a bad prompt (400) or missing model (404).
_RETRYABLE_STATUS_CODES = {429, 500, 502, 503, 504}
_MAX_ATTEMPTS = 4
_BACKOFF_BASE_SECONDS = 2


def _is_retryable(exc: Exception) -> bool:
    if isinstance(exc, genai_errors.APIError):
        return exc.code in _RETRYABLE_STATUS_CODES
    return isinstance(exc, (httpx.TimeoutException, httpx.ConnectError))


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

        full_prompt = prompt
        if system_prompt:
            full_prompt = f"System: {system_prompt}\n\nUser: {prompt}"

        config_args = {}
        if temperature is not None:
            config_args["temperature"] = temperature
        if use_search:
            config_args["tools"] = [{"google_search": {}}]

        config = types.GenerateContentConfig(**config_args) if config_args else None

        last_error: Optional[Exception] = None
        for attempt in range(1, _MAX_ATTEMPTS + 1):
            try:
                response = self.client.models.generate_content(
                    model=settings.gemini_model,
                    contents=full_prompt,
                    config=config,
                )
                text = response.text
                if text is None:
                    text = self._extract_text_fallback(response)
                if text is None:
                    reason = self._describe_empty_response(response)
                    raise RuntimeError(f"Gemini returned no text content ({reason})")
                return text.strip()
            except Exception as e:
                last_error = e
                if attempt < _MAX_ATTEMPTS and _is_retryable(e):
                    wait = _BACKOFF_BASE_SECONDS * (2 ** (attempt - 1))
                    logger.warning(
                        f"Gemini generation error (attempt {attempt}/{_MAX_ATTEMPTS}, "
                        f"retrying in {wait}s): {e}"
                    )
                    time.sleep(wait)
                    continue
                logger.error(f"Gemini generation error: {e}")
                if _is_retryable(e):
                    raise RuntimeError(
                        "Gemini is currently experiencing high demand and didn't respond "
                        "after several retries. Please try again in a few minutes."
                    ) from last_error
                raise RuntimeError(f"Gemini API error: {e}") from last_error

    @staticmethod
    def _extract_text_fallback(response) -> Optional[str]:
        """response.text is None when the SDK's quick accessor can't find a single
        text part (e.g. grounded search responses that split text across multiple
        parts). Manually concatenate any text parts from the first candidate."""
        candidates = getattr(response, "candidates", None) or []
        if not candidates:
            return None
        content = getattr(candidates[0], "content", None)
        parts = getattr(content, "parts", None) or []
        texts = [p.text for p in parts if getattr(p, "text", None)]
        return "".join(texts) if texts else None

    @staticmethod
    def _describe_empty_response(response) -> str:
        candidates = getattr(response, "candidates", None) or []
        if not candidates:
            feedback = getattr(response, "prompt_feedback", None)
            return f"no candidates, prompt_feedback={feedback}"
        finish_reason = getattr(candidates[0], "finish_reason", None)
        return f"finish_reason={finish_reason}"

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

        parsed, error = self._try_parse_json(text_response)
        if parsed is not None:
            return parsed

        # Grounded (use_search) responses are the main source of malformed JSON:
        # Gemini tends to wrap the array in prose or append citation markers
        # despite instructions. Give the model one chance to fix its own output
        # before giving up — cheap, and resolves the vast majority of cases.
        logger.warning(f"LLM JSON parse failed ({error}), attempting self-repair")
        repair_prompt = (
            "The text below was supposed to be valid JSON but failed to parse "
            f"with error: {error}\n\n"
            "Return ONLY the corrected, valid JSON. No markdown, no explanation, "
            "no commentary — just the fixed JSON.\n\n"
            f"{text_response}"
        )
        try:
            repaired_response = self.generate(repair_prompt, temperature=0)
        except Exception as repair_exc:
            logger.error(f"JSON repair call failed: {repair_exc}")
            repaired_response = None

        if repaired_response:
            parsed, repaired_error = self._try_parse_json(repaired_response)
            if parsed is not None:
                return parsed
            error = repaired_error
            text_response = repaired_response

        logger.error(f"Failed to parse LLM JSON response after repair attempt: {text_response}")
        return {"parse_error": error, "raw": text_response}

    @staticmethod
    def _try_parse_json(text: str) -> tuple[Optional[dict | list], Optional[str]]:
        """Best-effort JSON parse. Strips markdown fences, extracts the first
        balanced JSON value (quote-aware, so brackets inside string values or
        trailing search-grounding citations like '[1]' can't derail it), and
        tolerates trailing commas. Returns (parsed, None) or (None, error)."""
        cleaned = text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned.rsplit("```", 1)[0]
        cleaned = cleaned.strip()

        candidate = LLMService._extract_balanced_json(cleaned) or cleaned

        last_error = "empty response"
        for attempt in (candidate, re.sub(r",\s*([\]}])", r"\1", candidate)):
            try:
                return json.loads(attempt), None
            except json.JSONDecodeError as e:
                last_error = str(e)
        return None, last_error

    @staticmethod
    def _extract_balanced_json(text: str) -> Optional[str]:
        """Find the first '[' or '{' and return the substring up to its
        matching close, tracking string literals so quoted brackets/quotes
        don't throw off the depth count. Ignores any trailing prose or
        citation markers Gemini appends after the actual JSON payload."""
        start = None
        for i, ch in enumerate(text):
            if ch in "[{":
                start = i
                break
        if start is None:
            return None

        stack = [text[start]]
        in_string = False
        escape = False
        for i in range(start + 1, len(text)):
            ch = text[i]
            if in_string:
                if escape:
                    escape = False
                elif ch == "\\":
                    escape = True
                elif ch == '"':
                    in_string = False
                continue
            if ch == '"':
                in_string = True
            elif ch in "[{":
                stack.append(ch)
            elif ch in "]}":
                if not stack:
                    break
                stack.pop()
                if not stack:
                    return text[start:i + 1]
        return None

_instance = None

def get_llm_service() -> LLMService:
    global _instance
    if _instance is None:
        _instance = LLMService()
    return _instance

def call_llm(prompt: str) -> str:
    """Legacy helper function."""
    return get_llm_service().generate(prompt)