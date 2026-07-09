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

# Broad, topic-agnostic seeds — deliberately not brand/category-specific,
# since these trend sources otherwise default to Apple/refurbished seeds
# (built for a different, brand-scoped use case: Trend Scout).
_GENERAL_HASHTAGS = ["viral", "trending", "reels", "fyp"]
_GENERAL_GOOGLE_SEEDS = ["trending now", "viral video", "breaking news today"]
_GENERAL_SUBREDDITS = ["india", "AskReddit", "IndianGaming", "memes", "IndianStreetFashion", "indiasocial", "bollywood", "cricket"]


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
dry topic label.

CRITICAL — DO NOT SKEW TOWARD ANY BRAND OR PRODUCT CATEGORY: you have no
brand context in this task and must not invent any. These keywords feed a
later stage that bridges a genuinely unrelated trending topic back to a
brand — so at least 60% of the phrases you return must be about completely
different domains (entertainment, sports, relationships, food, finance,
pop culture, current events, etc.), grounded in whatever the raw signals
actually show. Do not force every phrase toward tech, gadgets, or any
single niche just because a few of the raw signals happen to be about
that — stay broad."""

    def run(self) -> KeywordPlannerOutput:
        self.logger.info("Fetching currently-trending signals (no manual topic)")

        raw_signals: list[str] = []
        sources_used: list[str] = []
        sources_skipped: list[str] = []

        try:
            gt_trends = google_trends.fetch_trends(keywords=_GENERAL_GOOGLE_SEEDS, max_results=10)
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
                # No query -> hot posts (genuinely trending, not filtered to
                # any topic) from a general-interest subreddit list, not the
                # tech/Apple-heavy default (built for a different, brand-
                # scoped use case: Trend Scout).
                rd_trends = reddit_trends.fetch_trends(subreddits=_GENERAL_SUBREDDITS, max_results=8)
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
At least 60% of these phrases must be genuinely broad, general-interest trending
topics with NO connection to tech, gadgets, phones, or any single brand/niche —
pull from whatever variety the raw signals above actually show.

Return a JSON object:
{{
  "keywords": [
    {{"phrase": "...", "source_note": "which raw signal(s) this draws from"}}
  ]
}}"""

        note = ""
        keywords: list[KeywordPhrase] = []
        try:
            # Bypass BaseAgent.call_llm_json here deliberately — it auto-injects
            # this client's full brand context into the system prompt, which
            # biases the reshaping step toward "on brand" keywords even when the
            # raw signals are genuinely broad. This step must stay brand-blind.
            result = self.llm.generate_json(prompt, system_prompt=self.get_system_prompt(), temperature=0.8)
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
