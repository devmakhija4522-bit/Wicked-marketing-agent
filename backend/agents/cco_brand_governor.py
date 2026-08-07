"""
Chief Content Officer Agent (Boss of Your Voice)
Ensures brand alignment, content mix compliance (70% value, 20% viral, 10% promo), and editorial governance.
"""

from typing import Dict, Any
from agents.base_agent import BaseAgent


class CCOBrandGovernorAgent(BaseAgent):
    agent_name: str = "Chief Content Officer"
    agent_role: str = "Chief Editorial Officer & Brand Voice Governor"

    def get_system_prompt(self) -> str:
        return (
            "You are the Chief Content Officer (CCO) of the brand. "
            "You govern editorial guidelines, content ratio balance (70% value, 20% viral, 10% promotional), "
            "and brand voice integrity across all content channels."
        )

    def review_content(self, draft_content: str, channel: str = "General") -> Dict[str, Any]:
        """Review draft content against CCO standards."""
        prompt = f"""
As Chief Content Officer, review the following draft marketing content for channel: {channel}.

DRAFT CONTENT:
\"\"\"
{draft_content}
\"\"\"

Respond STRICTLY in valid JSON with the following structure:
{{
  "approved": <true or false>,
  "brand_voice_alignment": <number 0-100>,
  "content_category": "Value / Educational" | "Viral / Storytelling" | "Promotional",
  "cco_verdict": "...",
  "strengths": ["...", "..."],
  "required_edits": ["...", "..."],
  "cco_approved_revision": "..."
}}
"""
        return self.call_llm_json(prompt, temperature=0.3)
