"""
Market Researcher Agent (The Secret Detective)
Mines customer pain points, viral hooks, target audience desires, and competitor gaps.
"""

from typing import Dict, Any
from agents.base_agent import BaseAgent


class MarketResearcherAgent(BaseAgent):
    agent_name: str = "AI Research Analyst"
    agent_role: str = "Market Intelligence & Customer Psychology Analyst"

    def get_system_prompt(self) -> str:
        return (
            "You are an expert AI Research Analyst. Your job is to extract customer pain points, "
            "objections, viral messaging hooks, and market gaps from user input, target audience descriptions, "
            "or industry niches."
        )

    def research(self, niche_or_topic: str) -> Dict[str, Any]:
        """Perform deep market and audience research."""
        prompt = f"""
Perform market research and audience sentiment analysis for the following niche / product / topic:

TOPIC / NICHE:
\"\"\"
{niche_or_topic}
\"\"\"

Respond STRICTLY in valid JSON with the following structure:
{{
  "niche": "{niche_or_topic}",
  "target_persona": {{
    "primary_demographic": "...",
    "core_desire": "...",
    "biggest_fear": "..."
  }},
  "top_pain_points": [
    {{"point": "...", "severity": "High", "customer_quote": "..."}},
    {{"point": "...", "severity": "High", "customer_quote": "..."}},
    {{"point": "...", "severity": "Medium", "customer_quote": "..."}}
  ],
  "common_objections": [
    {{"objection": "...", "counter_argument": "..."}},
    {{"objection": "...", "counter_argument": "..."}}
  ],
  "viral_hooks_working_now": [
    "...", "...", "..."
  ],
  "competitor_gaps": [
    "...", "..."
  ]
}}
"""
        return self.call_llm_json(prompt, temperature=0.3)
