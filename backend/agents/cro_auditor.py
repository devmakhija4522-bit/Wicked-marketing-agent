"""
CRO Auditor Agent (Landing Page Window Fixer)
Audits landing page copy, value propositions, CTAs, and friction points.
Returns a conversion scorecard and 3 rewritten copy variations.
"""

from typing import Dict, Any
from agents.base_agent import BaseAgent


class CROAuditorAgent(BaseAgent):
    agent_name: str = "Landing Page CRO Expert"
    agent_role: str = "Conversion Rate Optimization Expert & High-Converting Copywriter"

    def get_system_prompt(self) -> str:
        return (
            "You are a top-tier Conversion Rate Optimization (CRO) Expert and Direct-Response Copywriter. "
            "Your job is to audit landing page copy, identify friction, weak headlines, unclear value propositions, "
            "and missing trust triggers, then output a precise CRO Scorecard and 3 rewritten variations."
        )

    def audit(self, page_content: str, target_audience: str = "") -> Dict[str, Any]:
        """Audit page content and return structured JSON CRO analysis + rewrites."""
        prompt = f"""
Audit the following landing page copy/content and provide actionable conversion optimization analysis.

Target Audience Context: {target_audience or 'General potential customers'}

LANDING PAGE CONTENT TO AUDIT:
\"\"\"
{page_content}
\"\"\"

Respond STRICTLY in valid JSON with the following structure:
{{
  "overall_score": 75,
  "scores": {{
    "headline_clarity": 70,
    "value_prop_strength": 80,
    "cta_friction": 65,
    "trust_signals": 60
  }},
  "strengths": ["...", "..."],
  "friction_points": ["...", "...", "..."],
  "recommendations": ["...", "...", "..."],
  "rewrites": {{
    "headline_variations": [
      {{"style": "Direct & Value-First", "text": "..."}},
      {{"style": "Urgency & Pain-Point Focused", "text": "..."}},
      {{"style": "Social Proof & Outcome Driven", "text": "..."}}
    ],
    "cta_variations": [
      {{"label": "High-Intent Action", "text": "..."}},
      {{"label": "Low-Friction Trial", "text": "..."}},
      {{"label": "Benefit-Driven", "text": "..."}}
    ],
    "improved_hero_subheadline": "..."
  }}
}}
"""
        return self.call_llm_json(prompt, temperature=0.3)
