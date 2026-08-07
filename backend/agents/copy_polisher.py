"""
Copy Polisher Agent (The Helpful Teacher)
Provides real-time scoring, tone adjustments, and one-click copy rewrites ("Make More Punchy", "Add Urgency", "Simplify").
"""

from typing import Dict, Any
from agents.base_agent import BaseAgent


class CopyPolisherAgent(BaseAgent):
    agent_name: str = "UX & Copy Auditor"
    agent_role: str = "Senior Editor & Copy Optimizer"

    def get_system_prompt(self) -> str:
        return (
            "You are a master Copy Editor and UX Copy Auditor. "
            "Your job is to take raw marketing copy and provide real-time scores plus high-converting rewrite variations."
        )

    def polish(self, text: str, mode: str = "punchy") -> Dict[str, Any]:
        """Polish copy with a specific mode (punchy, urgency, simple, premium)."""
        prompt = f"""
Audit and optimize the following marketing copy.

MODE / GOAL: {mode.upper()}
COPY TO POLISH:
\"\"\"
{text}
\"\"\"

Respond STRICTLY in valid JSON with the following structure:
{{
  "original": "{text}",
  "readability_score": <number 0-100>,
  "punchiness_score": <number 0-100>,
  "persuasion_score": <number 0-100>,
  "improvements": ["...", "..."],
  "rewrites": {{
    "punchy": "...",
    "urgency": "...",
    "simplified": "...",
    "premium": "..."
  }}
}}
"""
        return self.call_llm_json(prompt, temperature=0.3)
