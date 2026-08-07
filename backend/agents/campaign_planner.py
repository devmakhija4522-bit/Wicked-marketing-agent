"""
Campaign Planner Agent (The Party Master Planner)
Generates 14-to-30 day multi-channel content launch campaigns across LinkedIn, X/Twitter, Instagram, and Email.
"""

from typing import Dict, Any
from agents.base_agent import BaseAgent


class CampaignPlannerAgent(BaseAgent):
    agent_name: str = "Marketing Campaign Planner"
    agent_role: str = "Chief Marketing Strategist & Campaign Architect"

    def get_system_prompt(self) -> str:
        return (
            "You are a master Marketing Campaign Planner. "
            "You build cohesive, high-converting multi-week marketing campaign blueprints. "
            "Your campaigns combine Tease, Announcement/Launch, Social Proof, Objection-Busting, and Urgency phases."
        )

    def plan_campaign(self, goal: str, duration_days: int = 14, channels: list = None) -> Dict[str, Any]:
        """Generate a complete multi-channel campaign blueprint."""
        channels = channels or ["LinkedIn", "Instagram", "X/Twitter", "Email"]
        prompt = f"""
Build a complete {duration_days}-day multi-channel marketing campaign blueprint for the following goal:

CAMPAIGN GOAL / PRODUCT LAUNCH:
\"\"\"
{goal}
\"\"\"

TARGET CHANNELS: {', '.join(channels)}

Respond STRICTLY in valid JSON with the following structure:
{{
  "campaign_name": "...",
  "tagline": "...",
  "phases": [
    {{
      "phase_name": "Phase 1: Awareness & Tease",
      "days": "Days 1-3",
      "focus": "...",
      "key_action": "..."
    }},
    {{
      "phase_name": "Phase 2: Big Reveal & Launch",
      "days": "Days 4-7",
      "focus": "...",
      "key_action": "..."
    }},
    {{
      "phase_name": "Phase 3: Social Proof & Case Studies",
      "days": "Days 8-11",
      "focus": "...",
      "key_action": "..."
    }},
    {{
      "phase_name": "Phase 4: Urgency & Final Call",
      "days": "Days 12-14",
      "focus": "...",
      "key_action": "..."
    }}
  ],
  "schedule": [
    {{
      "day": 1,
      "channel": "LinkedIn",
      "content_type": "Teaser Post",
      "hook": "...",
      "copy_outline": "...",
      "call_to_action": "..."
    }},
    {{
      "day": 2,
      "channel": "Instagram",
      "content_type": "Behind-the-scenes Reel",
      "hook": "...",
      "copy_outline": "...",
      "call_to_action": "..."
    }},
    {{
      "day": 4,
      "channel": "Email",
      "content_type": "Official Launch Email",
      "hook": "...",
      "copy_outline": "...",
      "call_to_action": "..."
    }}
  ],
  "kpis_to_track": ["...", "...", "..."]
}}
"""
        return self.call_llm_json(prompt, temperature=0.4)
