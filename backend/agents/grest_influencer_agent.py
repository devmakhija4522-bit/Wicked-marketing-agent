import json
import re

import httpx

from agents.base_agent import BaseAgent
from config import settings

_VERIFY_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
}

_YOUTUBE_CHANNELS_URL = "https://www.googleapis.com/youtube/v3/channels"

class GrestInfluencerAgent(BaseAgent):
    """
    Finds potential influencers based on flexible user criteria.
    Uses AI web search to find relevant influencers and returns JSON data.
    """
    agent_name = "Grest Influencer Scout"
    agent_role = "Influencer Marketing Strategist"

    def run(self, criteria: dict) -> str:
        self.logger.info(f"Scouting influencers with criteria: {criteria}")

        platform = criteria.get('platform', 'YouTube and Instagram')
        category = criteria.get('category', 'Tech')
        follower_count = criteria.get('followerCount', '50k - 100k')
        city = criteria.get('city', 'India')

        city_line = (
            "- Target City: No location restriction — creators from anywhere in India are fine."
            if city.strip().lower() in ("all india", "india", "")
            else f"- Target City (where the influencer or their audience is broadly associated with): {city}"
        )

        system_prompt = f"""
You are an expert Influencer Marketing Strategist working for Grest (grest.in).
Your task is to find the best influencer matches based on these specific criteria:

CRITERIA:
- Platform: {platform}
- Category/Niche/Content Style: {category}
- Follower Count: approximately {follower_count} (a reasonable, good-faith estimate is fine — see note below)
{city_line}

Use the web to search for real, active influencers that match this criteria.

STRICT VERIFICATION & QUALITY CONTROL (BACKEND ONLY):
1. **ABSOLUTELY NO HALLUCINATIONS ON IDENTITY — this is the one hard rule:** You must NEVER guess an Instagram or YouTube handle. Do not assume that if someone's name is "John Doe", their handle is "instagram.com/johndoe". YOU MUST only provide a URL if you explicitly saw that exact URL written out in your web search results. If you cannot find their explicit, exact profile URL in the search results, DO NOT include them in the list. This rule is non-negotiable.
2. **Follower count and city are soft targets, not proof requirements:** Search results rarely state an exact subscriber count or explicit audience geography in plain text. Use your best good-faith judgment from whatever context is available (channel description, video content, comments, related coverage) to estimate whether a REAL, VERIFIED creator (per rule 1) is a reasonable fit for the requested follower range and city. Do not discard an otherwise real, correctly-identified creator just because you can't find an exact quoted number or an explicit "based in X" statement — approximate is fine here. Note in "reasoning" when a figure is an estimate.
3. **FAKE FOLLOWER DETECTION:** You must analyze the influencer's engagement patterns. Look for red flags that indicate purchased fake followers or boosted bot engagement.
   - *Pattern 1:* Extremely high follower count (e.g., 500k+) but very low average likes/comments on videos (e.g., < 1,000 likes).
   - *Pattern 2:* Comments are generic (e.g., "nice", "fire emoji", spam) rather than actual community discussion.
   - *Action:* If you detect these patterns of fake engagement, DISCARD the profile and find another one. Only recommend creators with authentic, organic engagement.

Provide up to 5 solid, verified recommendations. Returning fewer than 5 — or even zero —
is CORRECT and PREFERRED over including a single influencer whose profile URL you did not
explicitly see in your search results. You will not be penalized for a short list; you will
be penalized for a fabricated one.

CRITICAL INSTRUCTION: 
You MUST output your response as a valid, raw JSON array of objects. Do NOT include markdown code blocks like ```json or anything else. JUST the raw JSON.
The JSON array MUST follow this exact schema:
[
  {{
    "name": "Influencer Name",
    "handle": "@username",
    "platform": "YouTube or Instagram",
    "url": "https://...",
    "followers": "Number of followers",
    "reasoning": "Why they are a perfect fit. MUST include a brief note on why you believe their engagement is authentic (e.g., '10% engagement rate with active community comments')."
  }}
]
"""

        prompt = f"""
Find up to 5 highly relevant influencers based on the provided criteria.
Only include a profile if you saw its exact URL in your search results — a shorter,
fully-verified list is required over padding the list with guessed profiles.
Output strictly as a valid JSON array.
"""

        result = self.llm.generate_json(
            prompt=prompt,
            system_prompt=system_prompt,
            use_search=True
        )

        if isinstance(result, dict) and "parse_error" in result:
            raise RuntimeError(
                f"Gemini did not return valid JSON for the influencer search: {result['parse_error']}"
            )

        if isinstance(result, list):
            result = self._drop_dead_links(result)

        return json.dumps(result)

    def _drop_dead_links(self, influencers: list) -> list:
        """The model's own "don't hallucinate" instructions are not reliable enough
        on their own — LLMs routinely invent plausible-looking handles anyway. This
        actually checks each claimed profile against a real data source and drops
        any we can prove don't exist, so a fabricated profile can't reach the user
        just because the model claimed to have seen it."""
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
                exists = True  # unrecognized platform/URL shape — can't verify, don't punish

            if exists is False:
                self.logger.warning(f"Dropping hallucinated/dead influencer link: {url or handle}")
                continue
            verified.append(inf)
        return verified

    def _youtube_channel_exists(self, url: str, handle: str) -> bool:
        """Prefers the YouTube Data API (authoritative, and confirms the channel is
        real rather than just that the page loads) when a key is configured. Falls
        back to a plain page request otherwise — YouTube reliably 404s nonexistent
        /channel/, /c/, /user/, and /@handle URLs, unlike Instagram (see below)."""
        param_name, value = self._extract_youtube_lookup(url, handle)
        if settings.has_youtube and param_name and value:
            try:
                resp = httpx.get(
                    _YOUTUBE_CHANNELS_URL,
                    params={"part": "id", param_name: value, "key": settings.youtube_api_key},
                    timeout=8.0,
                )
                if resp.status_code == 200:
                    return bool(resp.json().get("items"))
                # Unexpected status (e.g. this API version doesn't support forHandle) —
                # fall through to the HTTP page check instead of guessing.
            except (httpx.HTTPError, ValueError) as e:
                self.logger.warning(f"YouTube Data API lookup failed for {value}, falling back to page check: {e}")

        return not self._page_is_404(url or f"https://www.youtube.com/@{handle.lstrip('@')}")

    @staticmethod
    def _extract_youtube_lookup(url: str, handle: str) -> tuple[str, str]:
        """Returns the (param_name, value) pair the YouTube Data API's
        channels.list endpoint expects for this URL's format."""
        if m := re.search(r"youtube\.com/channel/([\w-]+)", url):
            return "id", m.group(1)
        if m := re.search(r"youtube\.com/@([\w.-]+)", url):
            return "forHandle", m.group(1)
        if m := re.search(r"youtube\.com/(?:c|user)/([\w.-]+)", url):
            return "forUsername", m.group(1)
        if handle:
            return "forHandle", handle.lstrip("@")
        return "", ""

    def _instagram_profile_exists(self, url: str, handle: str) -> bool:
        """Instagram serves an identical generic 200 page for real and fake
        profiles to unauthenticated/bot requests, so a plain HTTP check can't
        tell them apart — this uses the RapidAPI Instagram Scraper lookup
        instead. If it's not configured, or the response doesn't match a shape
        we recognize, we fail open (keep the entry) rather than risk dropping
        real profiles based on a guess about the API's schema."""
        if not settings.has_instagram:
            return True

        username = handle.lstrip("@") if handle else self._extract_instagram_username(url)
        if not username:
            return True

        try:
            resp = httpx.get(
                f"https://{settings.rapidapi_instagram_host}/v1/info",
                headers={
                    "x-rapidapi-key": settings.rapidapi_key,
                    "x-rapidapi-host": settings.rapidapi_instagram_host,
                },
                params={"username_or_id_or_url": username},
                timeout=10.0,
            )
            if resp.status_code == 404:
                return False
            resp.raise_for_status()
            data = resp.json()
            if isinstance(data, dict) and not data.get("data") and (
                data.get("error") or data.get("exc_type") or data.get("message")
            ):
                return False
            return True
        except (httpx.HTTPError, ValueError) as e:
            self.logger.warning(f"Instagram verification failed for @{username}, keeping (inconclusive): {e}")
            return True

    @staticmethod
    def _extract_instagram_username(url: str) -> str:
        m = re.search(r"instagram\.com/([\w.]+)", url)
        return m.group(1) if m else ""

    @staticmethod
    def _page_is_404(url: str) -> bool:
        try:
            resp = httpx.get(url, headers=_VERIFY_HEADERS, timeout=8.0, follow_redirects=True)
            return resp.status_code == 404
        except httpx.HTTPError:
            return False
