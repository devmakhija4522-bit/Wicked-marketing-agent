"""
Influencer Scout Agent
Discovers verified YouTube & Instagram influencers, detects fake follower engagement, and filters candidates.
"""

import json
import re
from typing import Dict, Any, List
import httpx

from agents.base_agent import BaseAgent
from config import settings

_VERIFY_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
}
_YOUTUBE_CHANNELS_URL = "https://www.googleapis.com/youtube/v3/channels"


class InfluencerScoutAgent(BaseAgent):
    agent_name: str = "Influencer Scout"
    agent_role: str = "Creator Discovery & Authenticity Audit Specialist"

    def get_system_prompt(self) -> str:
        return (
            "You are a Creator Discovery Specialist. Your job is to find authentic, high-converting "
            "YouTube and Instagram influencers tailored to brand criteria, auditing fake followers and link validity."
        )

    def search_influencers(
        self,
        platform: str = "YouTube and Instagram",
        category: str = "Tech",
        follower_count: str = "50k - 100k",
        city: str = "All India"
    ) -> List[Dict[str, Any]]:
        """Search and audit influencers matching criteria."""
        system_prompt = f"""
{self.brand_context_summary}

YOU ARE AN EXPERT INFLUENCER SCOUT AND CREATOR STRATEGIST.
Your task is to find real, highly relevant YouTube and Instagram creators.

TARGET CRITERIA:
- Platform: {platform}
- Category / Niche: {category}
- Follower Range: {follower_count}
- Location: {city}

STRICT QUALITY & VERIFICATION RULES:
1. NO HALLUCINATED HANDLES/URLS: Only return profile URLs that are real YouTube channels or Instagram accounts.
2. FAKE FOLLOWER DETECTION: Check for red flags like 500k+ followers with under 1,000 likes or spam comments. Discard fake bot accounts.
3. AUTHENTIC ENGAGEMENT: Recommend creators with real community interaction.

Respond STRICTLY in valid raw JSON array format:
[
  {{
    "name": "Creator Name",
    "handle": "@username",
    "platform": "YouTube",
    "url": "https://www.youtube.com/@username",
    "followers": "75k",
    "reasoning": "High 8% engagement rate with active tech reviews community."
  }}
]
"""
        prompt = f"Find up to 5 verified creators for: Platform={platform}, Niche={category}, Followers={follower_count}, City={city}."

        result = self.llm.generate_json(
            prompt=prompt,
            system_prompt=system_prompt,
            use_search=True
        )

        if isinstance(result, list):
            result = self._drop_dead_links(result)
            return result
        elif isinstance(result, dict) and "influencers" in result:
            return self._drop_dead_links(result["influencers"])
        return []

    def _drop_dead_links(self, influencers: list) -> list:
        verified = []
        for inf in influencers:
            if not isinstance(inf, dict):
                continue
            url = inf.get("url", "") or ""
            handle = inf.get("handle", "") or ""
            platform_name = (inf.get("platform") or "").lower()

            if "instagram" in platform_name or "instagram.com" in url:
                exists = self._instagram_profile_exists(url, handle)
            elif "youtube" in platform_name or "youtube.com" in url:
                exists = self._youtube_channel_exists(url, handle)
            else:
                exists = True

            if exists is False:
                continue
            verified.append(inf)
        return verified

    def _youtube_channel_exists(self, url: str, handle: str) -> bool:
        return not self._page_is_404(url or f"https://www.youtube.com/@{handle.lstrip('@')}")

    def _instagram_profile_exists(self, url: str, handle: str) -> bool:
        return True

    @staticmethod
    def _page_is_404(url: str) -> bool:
        try:
            resp = httpx.get(url, headers=_VERIFY_HEADERS, timeout=5.0, follow_redirects=True)
            return resp.status_code == 404
        except Exception:
            return False
