import json
import re
import time
from datetime import datetime, timezone
from typing import Optional

import feedparser
import httpx

from agents.base_agent import BaseAgent
from config import settings, load_covered_influencers, mark_influencers_covered, _normalize_influencer_key

_VERIFY_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
}

_YOUTUBE_CHANNELS_URL = "https://www.googleapis.com/youtube/v3/channels"
_YOUTUBE_MAX_INACTIVE_DAYS = 30
_MAX_COVERED_IN_PROMPT = 40  # cap the "already suggested" list injected into the prompt to bound token growth

# Mirrors the concrete options in the frontend's category dropdown
# (frontend/src/pages/InfluencerScout.jsx) — excludes the meta-options
# "All"/"General"/"Other" since those aren't niches themselves.
_CONCRETE_CATEGORIES = [
    "Tech",
    "Lifestyle",
    "Gaming",
    "Review and experience",
    "GenZ creators",
    "Corporate employee influencer",
    "Unboxing & Reviews",
    "Vlogs",
    "Reels & Shorts",
    "Dedicated Integration",
]

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

        # Broad categories have a much larger real candidate pool than a
        # narrow niche — scale the target count accordingly instead of a
        # single fixed cap that starved broad searches down to ~5 results.
        is_broad_category = category.strip().lower() in ("all", "general", "")
        target_count = 30 if is_broad_category else 15

        # "All" was previously passed through to the model as the literal
        # word "All", which gave it no real guidance and led to unfocused,
        # low-quality results. Expand it into an explicit spread across the
        # dropdown's actual concrete categories instead.
        if is_broad_category:
            category_line = (
                f"- Category/Niche/Content Style: All — aim for a genuine SPREAD across these "
                f"concrete categories rather than an unfocused mix: {', '.join(_CONCRETE_CATEGORIES)}. "
                f"Roughly {max(1, target_count // len(_CONCRETE_CATEGORIES))}-{target_count // 3} per "
                f"category is a reasonable spread, not a strict quota per category."
            )
        else:
            category_line = f"- Category/Niche/Content Style: {category}"

        city_line = (
            "- Target City: No location restriction — creators from anywhere in India are fine."
            if city.strip().lower() in ("all india", "india", "")
            else f"- Target City (where the influencer or their audience is broadly associated with): {city}"
        )

        covered = load_covered_influencers(self.client_id)
        covered_keys = {c["key"] for c in covered if c.get("key")}
        if covered:
            shown = covered[:_MAX_COVERED_IN_PROMPT]
            covered_list = "\n".join(f"- {c.get('name') or c.get('handle') or c.get('url')}" for c in shown)
            already_suggested_block = f"""
ALREADY SUGGESTED TO THIS CLIENT — DO NOT REPEAT ANY OF THESE:
{covered_list}
You MUST find DIFFERENT creators than everyone listed above, even if they'd otherwise
fit the criteria well. If genuinely no new real, verified creators exist beyond this
list, it is correct to return fewer results or zero — do not repeat a name from this
list and do not fabricate a new one just to appear different.
"""
        else:
            already_suggested_block = ""

        system_prompt = f"""
You are an expert Influencer Marketing Strategist working for Grest (grest.in).
Your task is to find the best influencer matches based on these specific criteria:

CRITERIA:
- Platform: {platform}
{category_line}
- Follower Count: {follower_count} — this is a real filter, not a suggestion (see note below)
{city_line}
{already_suggested_block}
Use the web to search for real, active influencers that match this criteria.

STRICT VERIFICATION & QUALITY CONTROL (BACKEND ONLY):
1. **ABSOLUTELY NO HALLUCINATIONS ON IDENTITY — this is the one hard rule:** You must NEVER guess an Instagram or YouTube handle. Do not assume that if someone's name is "John Doe", their handle is "instagram.com/johndoe". YOU MUST only provide a URL if you explicitly saw that exact URL written out in your web search results. If you cannot find their explicit, exact profile URL in the search results, DO NOT include them in the list. This rule is non-negotiable.
2. **Follower count is a real numeric filter — being close is fine, being wrong by an order of magnitude is not.** City is a soft target (exact audience geography is rarely stated in plain text, so a broad "based in India" fit is fine); follower count is NOT — the number is almost always visible right on the profile itself. Only include a creator whose actual, observed follower count on their profile genuinely falls within (or is close to, e.g. within ~30% of either edge of) the requested range — a creator with 200 followers is NEVER a fit for a "10k-50k" request, full stop, no matter how well their content matches the category. If you cannot see or reasonably confirm the follower count from your search results, DO NOT include them — do not guess a number to make them fit. Note the actual observed count in "followers", not a rounded restatement of the request.
3. **FAKE FOLLOWER DETECTION:** You must analyze the influencer's engagement patterns. Look for red flags that indicate purchased fake followers or boosted bot engagement.
   - *Pattern 1:* Extremely high follower count (e.g., 500k+) but very low average likes/comments on videos (e.g., < 1,000 likes).
   - *Pattern 2:* Comments are generic (e.g., "nice", "fire emoji", spam) rather than actual community discussion.
   - *Action:* If you detect these patterns of fake engagement, DISCARD the profile and find another one. Only recommend creators with authentic, organic engagement.

Provide up to {target_count} solid, verified recommendations — this is a target, not a quota,
so keep searching until you've genuinely exhausted real, verifiable candidates rather than
stopping early. Returning fewer than {target_count} — or even zero — is CORRECT and PREFERRED
over including a single influencer whose profile URL you did not explicitly see in your search
results. You will not be penalized for a short list; you will be penalized for a fabricated one.

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
Find up to {target_count} highly relevant influencers based on the provided criteria — search
broadly and thoroughly to reach that target if the category genuinely supports it.
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
            result = self._drop_outside_follower_range(result, follower_count)
            result = self._drop_already_covered(result, covered_keys)
            if result:
                mark_influencers_covered(self.client_id, result)

        return json.dumps(result)

    def _drop_outside_follower_range(self, influencers: list, follower_count_str: str) -> list:
        """Belt-and-suspenders, same reasoning as _drop_dead_links: the
        prompt tells the model follower count is a real filter, but it has
        still returned wildly-out-of-range profiles (e.g. a 200-follower
        account for a "10k-50k" request) despite that instruction. Drops
        anything clearly outside a generous tolerance band around the
        requested range rather than trusting the model's own claim."""
        target = self._parse_follower_range(follower_count_str)
        if target is None:
            return influencers  # unrecognized range string — can't verify, don't punish

        lo, hi = target
        # Generous slack around the requested band — enough to keep a
        # reasonable "soft estimate" from the model, tight enough to
        # reject an order-of-magnitude miss.
        band_lo, band_hi = lo * 0.5, (hi if hi is not None else lo * 3) * 2.5

        kept = []
        for inf in influencers:
            if not isinstance(inf, dict):
                continue
            count = self._parse_follower_count(inf.get("followers", ""))
            if count is None:
                kept.append(inf)  # can't verify from the claim — don't punish, _drop_dead_links already checked identity
                continue
            if band_lo <= count <= band_hi:
                kept.append(inf)
            else:
                self.logger.warning(
                    "Dropping %s: followers=%s outside requested range %s",
                    inf.get("name") or inf.get("handle"), inf.get("followers"), follower_count_str,
                )
        return kept

    @staticmethod
    def _parse_follower_range(range_str: str) -> Optional[tuple[float, Optional[float]]]:
        """Parses the frontend's fixed dropdown strings, e.g. "10k - 50k
        (Micro)" -> (10_000, 50_000), "1M+ (Mega)" -> (1_000_000, None)."""
        numbers = re.findall(r"[\d.]+\s*[kKmM]?\+?", range_str or "")
        parsed = [GrestInfluencerAgent._parse_follower_count(n) for n in numbers]
        parsed = [p for p in parsed if p is not None]
        if not parsed:
            return None
        if len(parsed) == 1:
            return parsed[0], None
        return min(parsed), max(parsed)

    @staticmethod
    def _parse_follower_count(value) -> Optional[float]:
        """Parses a human-written follower count like "51K+", "25k",
        "1.2M", "200", "10,000" into a plain number. Returns None if it
        can't confidently parse (treated as unverifiable, not a failure)."""
        if value is None:
            return None
        s = str(value).strip().replace(",", "")
        m = re.match(r"^([\d.]+)\s*([kKmM]?)\+?$", s)
        if not m:
            return None
        try:
            num = float(m.group(1))
        except ValueError:
            return None
        suffix = m.group(2).lower()
        if suffix == "k":
            num *= 1_000
        elif suffix == "m":
            num *= 1_000_000
        return num

    def _drop_already_covered(self, influencers: list, covered_keys: set) -> list:
        """Belt-and-suspenders: the prompt tells the model not to repeat
        already-suggested creators, but LLMs don't always follow instructions
        perfectly. This drops any result that slips through anyway, so a
        repeat can't reach the user even if the model ignores the instruction."""
        if not covered_keys:
            return influencers
        fresh = []
        for inf in influencers:
            if not isinstance(inf, dict):
                continue
            identifier = (inf.get("handle") or inf.get("url") or inf.get("name") or "").strip()
            if identifier and _normalize_influencer_key(identifier) in covered_keys:
                self.logger.warning(f"Dropping repeat influencer (already suggested previously): {identifier}")
                continue
            fresh.append(inf)
        return fresh

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
                keep = self._instagram_profile_exists(url, handle)
                reason = "hallucinated/dead Instagram link"
            elif "youtube" in platform_name or "youtube.com" in url:
                keep = self._youtube_channel_exists(url, handle)
                reason = "hallucinated/dead YouTube channel"
                if keep and self._youtube_channel_is_stale(url, handle):
                    keep = False
                    reason = f"inactive YouTube channel (no upload in {_YOUTUBE_MAX_INACTIVE_DAYS}+ days)"
            else:
                keep, reason = True, ""  # unrecognized platform/URL shape — can't verify, don't punish

            if not keep:
                self.logger.warning(f"Dropping {reason}: {url or handle}")
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

    def _youtube_channel_is_stale(self, url: str, handle: str) -> bool:
        """Checks the channel's public upload RSS feed (no API key needed) for
        its most recent video. Returns True only when we can positively confirm
        the channel hasn't posted in _YOUTUBE_MAX_INACTIVE_DAYS+ days, or has no
        public uploads at all. Any failure to resolve the channel ID or fetch/
        parse the feed is treated as inconclusive and left in (fail open)."""
        channel_id = self._resolve_youtube_channel_id(url, handle)
        if not channel_id:
            return False

        try:
            resp = httpx.get(
                f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}",
                headers=_VERIFY_HEADERS,
                timeout=8.0,
            )
            resp.raise_for_status()
        except httpx.HTTPError as e:
            self.logger.warning(f"Could not fetch upload feed for {channel_id}, skipping recency check: {e}")
            return False

        feed = feedparser.parse(resp.content)
        if not feed.entries:
            return True  # no public uploads at all

        latest = feed.entries[0]
        published = getattr(latest, "published_parsed", None)
        if not published:
            return False

        latest_dt = datetime.fromtimestamp(time.mktime(published), tz=timezone.utc)
        age_days = (datetime.now(timezone.utc) - latest_dt).days
        return age_days > _YOUTUBE_MAX_INACTIVE_DAYS

    def _resolve_youtube_channel_id(self, url: str, handle: str) -> Optional[str]:
        """The RSS feed only accepts a real channel ID, not a handle/username, so
        this resolves one: straight from the URL if it's already a /channel/ link,
        via the Data API if configured, or by scraping the page's canonical link
        (reliable — unlike a generic "channelId" string match elsewhere in the
        page, which can pick up an unrelated channel referenced on it)."""
        if m := re.search(r"youtube\.com/channel/([\w-]+)", url):
            return m.group(1)

        param_name, value = self._extract_youtube_lookup(url, handle)
        if settings.has_youtube and param_name and value:
            try:
                resp = httpx.get(
                    _YOUTUBE_CHANNELS_URL,
                    params={"part": "id", param_name: value, "key": settings.youtube_api_key},
                    timeout=8.0,
                )
                if resp.status_code == 200:
                    items = resp.json().get("items") or []
                    if items:
                        return items[0]["id"]
            except (httpx.HTTPError, ValueError):
                pass

        lookup_url = url or f"https://www.youtube.com/@{handle.lstrip('@')}"
        try:
            resp = httpx.get(lookup_url, headers=_VERIFY_HEADERS, timeout=8.0, follow_redirects=True)
            if m := re.search(r'<link rel="canonical" href="https://www\.youtube\.com/channel/([\w-]+)"', resp.text):
                return m.group(1)
        except httpx.HTTPError:
            pass
        return None

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
