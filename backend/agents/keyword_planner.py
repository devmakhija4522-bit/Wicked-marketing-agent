"""
Keyword Planner Agent
Auto-fetches what's genuinely trending right now — any creator, any topic,
no manual input — from Google Trends, YouTube, Reddit, and best-effort
Instagram, then uses one LLM call to reshape those raw signals into 7-10
keyword phrases that mirror how real, currently-performing videos get
discovered/searched.

Deliberately NOT scoped to the client's own product/category: the
account's Maximum Distance Hook principle (see script_writing_voice in the
Voice Sample) depends on hooks opening on topics with zero apparent
connection to the brand, so Structural Designer needs genuinely broad
trending material to bridge from — not pre-filtered "on brand" keywords.
"""

import logging

from agents.base_agent import BaseAgent
from models import KeywordPhrase, KeywordPlannerOutput
from services.trend_sources import google_trends, youtube_trends, reddit_trends, instagram_trends

logger = logging.getLogger("wicked.agent.keyword_planner")

# Broad, topic-agnostic hashtags — deliberately not brand/category-specific,
# since Instagram's trend source otherwise defaults to Apple/refurbished
# hashtags (built for a different, brand-scoped use case).
_GENERAL_HASHTAGS = ["viral", "trending", "reels", "fyp"]


class KeywordPlannerAgent(BaseAgent):
    agent_name = "Keyword Planner"
    agent_role = "video-search-behavior keyword strategist"

    def get_system_prompt(self) -> str:
        return """You are the Keyword Planner Agent.

YOUR MISSION: Given a set of raw, currently-trending signals from across
social platforms, produce keyword phrases that mirror how people actually
search for and discover videos on these topics — NOT generic SEO keywords.

Bad (generic SEO): "car buying tips"
Good (video-style): "types of customers buying a car"

Video-style phrases describe a scenario, a character, a comparison, or a
specific angle someone would search for expecting to find a video — not a
dry topic label. These trends can be about ANYTHING — any creator, any
niche — they don't need to relate to any specific brand. Stay grounded in
the raw signals you're given; don't invent unrelated content."""

    def run(self) -> KeywordPlannerOutput:
        self.logger.info("Fetching currently-trending signals (no manual topic)")

        raw_signals: list[str] = []
        sources_used: list[str] = []
        sources_skipped: list[str] = []

        try:
            gt_trends = google_trends.fetch_trends(max_results=10)
            raw_signals.extend(f"{t.title} (Google Trends)" for t in gt_trends)
            sources_used.append("google_trends")
        except Exception as e:
            self.logger.error("Google Trends failed: %s", e)
            sources_skipped.append("google_trends")

        if youtube_trends.is_available():
            try:
                yt_trends = youtube_trends.fetch_trends(query="viral reels trending", max_results=8)
                raw_signals.extend(f"{t.title} (YouTube)" for t in yt_trends)
                sources_used.append("youtube")
            except Exception as e:
                self.logger.error("YouTube failed: %s", e)
                sources_skipped.append("youtube")
        else:
            sources_skipped.append("youtube")

        if reddit_trends.is_available():
            try:
                # No query -> hot posts across the general relevant-subreddit
                # list, i.e. genuinely trending, not filtered to any topic.
                rd_trends = reddit_trends.fetch_trends(max_results=8)
                raw_signals.extend(f"{t.title} (Reddit)" for t in rd_trends)
                sources_used.append("reddit")
            except Exception as e:
                self.logger.error("Reddit failed: %s", e)
                sources_skipped.append("reddit")
        else:
            sources_skipped.append("reddit")

        # Instagram is best-effort only — skip silently if unavailable/unconfigured.
        if instagram_trends.is_available():
            try:
                ig_trends = instagram_trends.fetch_trends(hashtags=_GENERAL_HASHTAGS, max_results=6)
                raw_signals.extend(f"{t.title} (Instagram)" for t in ig_trends)
                sources_used.append("instagram")
            except Exception as e:
                self.logger.error("Instagram failed: %s", e)
                sources_skipped.append("instagram")
        else:
            sources_skipped.append("instagram")

        signals_block = "\n".join(f"- {s}" for s in raw_signals) if raw_signals else "(no raw signals found — rely on general knowledge of what's trending right now)"

        prompt = f"""RAW TRENDING SIGNALS (any creator, any topic, currently trending across Google Trends / YouTube / Reddit / Instagram):
{signals_block}

Reshape these into 7-10 keyword phrases that mirror how real, currently-performing
videos actually get discovered/searched right now. Each phrase should describe a
scenario, character, comparison, or specific angle — not a generic topic label.
These do NOT need to relate to any single brand or niche — stay broad and grounded
in the raw signals above.

Return a JSON object:
{{
  "keywords": [
    {{"phrase": "...", "source_note": "which raw signal(s) this draws from"}}
  ]
}}"""

        note = ""
        keywords: list[KeywordPhrase] = []
        try:
            result = self.call_llm_json(prompt, temperature=0.8)
            if isinstance(result, dict) and not result.get("parse_error"):
                for item in result.get("keywords", []):
                    if isinstance(item, dict) and item.get("phrase"):
                        keywords.append(
                            KeywordPhrase(
                                phrase=item["phrase"],
                                source_note=item.get("source_note", ""),
                            )
                        )
            else:
                note = "LLM output could not be parsed."
        except Exception as e:
            self.logger.error("Keyword reshaping failed: %s", e)
            note = f"Keyword generation failed: {e}"

        if len(keywords) < 7:
            note = (note + " " if note else "") + f"Only {len(keywords)} keyword(s) returned — limited by available trend signals."

        return KeywordPlannerOutput(
            keywords=keywords,
            sources_used=sources_used,
            sources_skipped=sources_skipped,
            note=note.strip(),
        )
