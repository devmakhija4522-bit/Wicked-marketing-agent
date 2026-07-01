"""
Base Agent
Provides shared LLM integration, logging, and brand context loading
that all 5 WICKED agents inherit from.
"""

import json
import logging
from typing import Optional

from config import load_client_profile
from services.llm_service import LLMService, get_llm_service


class BaseAgent:
    """Base class for all WICKED pipeline agents."""

    agent_name: str = "BaseAgent"
    agent_role: str = "marketing assistant"
    client_id: str = "generic"

    def __init__(self, client_id: str = "generic", llm_service: Optional[LLMService] = None):
        self.llm = llm_service or get_llm_service()
        self.client_id = client_id
        self.logger = logging.getLogger(f"wicked.agent.{self.__class__.__name__}")
        self._brand_profile: Optional[dict] = None
        self._content_templates: Optional[dict] = None
        self.logger.info(f"Agent '{self.agent_name}' initialized for client '{self.client_id}'.")

    @property
    def brand_profile(self) -> dict:
        """Lazy-load the brand profile."""
        if self._brand_profile is None:
            self._brand_profile = load_client_profile(self.client_id)
        return self._brand_profile

    @property
    def brand_context_summary(self) -> str:
        """Formatted brand context string for injection into prompts."""
        bp = self.brand_profile
        
        tagline = bp.get("tagline", "")
        usps_list = bp.get("usps", [])
        if usps_list:
            usps_text = "\n".join(f"  - {u['title']}: {u['detail']}" for u in usps_list)
        else:
            usps_text = f"  - Core Business & USP: {tagline}"

        voice = bp.get("brand_voice", {})
        avoid = ", ".join(voice.get("avoid", [])) if voice.get("avoid") else "Generic marketing speak"
        embrace = ", ".join(voice.get("embrace", [])) if voice.get("embrace") else "Authenticity, value, engaging storytelling"

        return f"""
=== BRAND CONTEXT ===
Brand: {bp.get('brand_name', 'The Brand')}
Business Description & Tagline: {tagline}
Category: {bp.get('category', 'Generic Category')}
Website: {bp.get('website', '')}
Target Audience: {bp.get('target_audience', {}).get('primary', 'General audience interested in the brand')}

KEY USPs & DETAILS:
{usps_text}

BRAND VOICE:
  Tone: {voice.get('tone', 'Professional')}
  Language: {voice.get('language', 'English')}
  AVOID: {avoid}
  EMBRACE: {embrace}

CONTENT PHILOSOPHY:
  {bp.get('content_philosophy', {}).get('core_belief', 'Provide value.')}
  Ratio: {bp.get('content_philosophy', {}).get('ratio', '80/20')}
  Hook Rule: {bp.get('content_philosophy', {}).get('hooks', 'Strong hooks.')}
=== END BRAND CONTEXT ===
"""

    def get_system_prompt(self) -> str:
        """Override in subclasses to define agent-specific system prompts."""
        return f"You are {self.agent_name}, a {self.agent_role} for the WICKED marketing system."

    def call_llm(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        json_mode: bool = False,
    ) -> str:
        """Call LLM with agent's system prompt + brand context."""
        sys_prompt = system_prompt or self.get_system_prompt()
        full_system = f"{sys_prompt}\n\n{self.brand_context_summary}"

        if json_mode:
            return json.dumps(
                self.llm.generate_json(
                    prompt=prompt,
                    system_prompt=full_system,
                    temperature=temperature,
                )
            )
        else:
            return self.llm.generate(
                prompt=prompt,
                system_prompt=full_system,
                temperature=temperature,
            )

    def call_llm_json(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
    ) -> dict | list:
        """Call LLM and parse result as JSON."""
        sys_prompt = system_prompt or self.get_system_prompt()
        full_system = f"{sys_prompt}\n\n{self.brand_context_summary}"

        return self.llm.generate_json(
            prompt=prompt,
            system_prompt=full_system,
            temperature=temperature,
        )
