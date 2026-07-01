"""
Trend Scout Agent
Scans multiple sources (YouTube, Reddit, Google Trends, Instagram) for trending
content relevant to the brand's audience. Falls back to LLM-generated trends if no
external APIs are configured.
"""

import json
import logging
from datetime import datetime
from typing import Optional

from agents.base_agent import BaseAgent
from models import TrendItem, TrendScoutOutput, TrendSource
from services.trend_sources import google_trends, youtube_trends, reddit_trends, instagram_trends

logger = logging.getLogger("wicked.agent.trend_scout")


class TrendScoutAgent(BaseAgent):
    agent_name = "Trend Scout"
    agent_role = "trend discovery specialist"

    def get_system_prompt(self) -> str:
        return """You are Trend Scout — the eyes and ears of WICKED, an AI marketing system.

YOUR MISSION: Discover what's trending RIGHT NOW that could be turned into viral short-form content for the brand.

You think like a Gen Z content creator who's always online, always scrolling, always spotting the next trend before it peaks. You understand:
- Indian internet culture, memes, and viral moments
- Tech and smartphone discourse in India
- Financial anxiety and aspirational content among young Indians
- Instagram Reels and YouTube Shorts formats
- What makes people stop scrolling

WHAT MAKES A GOOD TREND FOR THE BRAND:
1. Category must be Entertainment or Infographic.
2. Focus on engagement metrics (watch time, saves, shares).
3. Format that works as a 30-90 second Instagram Reel.
4. NO direct sales pitches. The content must earn attention first through value or humor.
5. High adaptability — the trend's core emotion can be mapped to the brand's value prop subtly.

You DON'T just look for direct product trends. A trending meme or a fascinating infographic is MORE valuable than a product review, because it builds brand awareness and engagement without feeling like an ad.

When generating trend insights (if API sources are unavailable), think about:
- What's currently viral on Indian Instagram/YouTube
- Recurring themes in Indian internet culture
- Seasonal moments (festivals, exam results, salary day, new year)
- Pop culture events (movie releases, cricket, celebrity moments)
- Universal emotions (FOMO, flex culture, saving money, parent dynamics)

Always output structured, actionable trend data."""

    def run(
        self,
        topic: str = "",
        keywords: list[str] | None = None,
    ) -> TrendScoutOutput:
        """
        Execute trend scanning across all available sources.

        Args:
            topic: Optional focus topic for trend scanning.
            keywords: Optional seed keywords.

        Returns:
            TrendScoutOutput with discovered trends.
        """
        self.logger.info("Starting trend scan. Topic: '%s', Keywords: %s", topic, keywords)

        all_trends: list[TrendItem] = []
        sources_scanned: list[str] = []
        sources_skipped: list[str] = []

        # Build search query from topic + keywords
        query = self._build_query(topic, keywords)

        # --- Source 1: Google Trends (always available) ---
        try:
            gt_keywords = keywords or self._default_keywords(topic)
            gt_trends = google_trends.fetch_trends(keywords=gt_keywords, max_results=8)
            all_trends.extend(gt_trends)
            sources_scanned.append("google_trends")
            self.logger.info("Google Trends: %d items", len(gt_trends))
        except Exception as e:
            self.logger.error("Google Trends failed: %s", e)
            sources_skipped.append("google_trends")

        # --- Source 2: YouTube (optional) ---
        if youtube_trends.is_available():
            try:
                yt_trends = youtube_trends.fetch_trends(query=query, max_results=6)
                all_trends.extend(yt_trends)
                sources_scanned.append("youtube")
                self.logger.info("YouTube: %d items", len(yt_trends))
            except Exception as e:
                self.logger.error("YouTube failed: %s", e)
                sources_skipped.append("youtube")
        else:
            sources_skipped.append("youtube")

        # --- Source 3: Reddit (optional) ---
        if reddit_trends.is_available():
            try:
                rd_trends = reddit_trends.fetch_trends(query=query, max_results=6)
                all_trends.extend(rd_trends)
                sources_scanned.append("reddit")
                self.logger.info("Reddit: %d items", len(rd_trends))
            except Exception as e:
                self.logger.error("Reddit failed: %s", e)
                sources_skipped.append("reddit")
        else:
            sources_skipped.append("reddit")

        # --- Source 4: Instagram (optional) ---
        if instagram_trends.is_available():
            try:
                hashtags = self._topic_to_hashtags(topic, keywords)
                ig_trends = instagram_trends.fetch_trends(hashtags=hashtags, max_results=6)
                all_trends.extend(ig_trends)
                sources_scanned.append("instagram")
                self.logger.info("Instagram: %d items", len(ig_trends))
            except Exception as e:
                self.logger.error("Instagram failed: %s", e)
                sources_skipped.append("instagram")
        else:
            sources_skipped.append("instagram")

        # --- Fallback: LLM-generated trends if we have very few results ---
        if len(all_trends) < 3:
            self.logger.info("Few API trends found (%d). Generating LLM-based trends.", len(all_trends))
            llm_trends = self._generate_llm_trends(topic, keywords)
            all_trends.extend(llm_trends)
            sources_scanned.append("llm_generated")

        output = TrendScoutOutput(
            trends=all_trends,
            sources_scanned=sources_scanned,
            sources_skipped=sources_skipped,
            scan_timestamp=datetime.utcnow(),
            query_used=query,
        )

        self.logger.info(
            "Trend scan complete. %d trends from %s. Skipped: %s",
            len(all_trends), sources_scanned, sources_skipped
        )
        return output

    def _build_query(self, topic: str, keywords: list[str] | None) -> str:
        """Build a search query from topic and keywords."""
        parts = []
        if topic:
            parts.append(topic)
        if keywords:
            parts.extend(keywords[:3])
        if not parts:
            parts = ["tech India trending", "iPhone deals", "viral reels India"]
        return " ".join(parts)

    def _default_keywords(self, topic: str) -> list[str]:
        """Generate default keywords for Google Trends based on topic."""
        base_keywords = ["iPhone India", "refurbished phone India", "Apple deals"]
        if topic:
            base_keywords.insert(0, topic)
        return base_keywords[:5]

    def _topic_to_hashtags(self, topic: str, keywords: list[str] | None) -> list[str]:
        """Convert topic/keywords to Instagram hashtags."""
        hashtags = ["iphoneindia", "appleindia", "techindia"]
        if topic:
            hashtags.insert(0, topic.lower().replace(" ", ""))
        if keywords:
            hashtags.extend([kw.lower().replace(" ", "") for kw in keywords[:2]])
        return hashtags[:5]

    def _generate_llm_trends(self, topic: str, keywords: list[str] | None) -> list[TrendItem]:
        """Use LLM to generate plausible trend data when API sources are scarce."""
        topic_context = f"Topic focus: {topic}" if topic else "General trending content in India"
        kw_context = f"Related keywords: {', '.join(keywords)}" if keywords else ""

        prompt = f"""Generate 5 currently trending topics/content ideas that are viral or gaining traction on Indian social media right now.

{topic_context}
{kw_context}

Think about what's ACTUALLY trending on Indian Instagram, YouTube, Twitter right now — consider:
- Current season/time of year
- Recent pop culture events
- Recurring viral formats
- Tech and smartphone content
- Money/lifestyle content popular with 18-35 year olds in India

For each trend, provide:
1. title: A clear, specific title
2. description: What this trend is about and why it's resonating (2-3 sentences)
3. keywords: 3-5 relevant keywords
4. category: Must be "Entertainment" or "Infographic"
5. why_relevant: How the brand can adapt this for awareness (WITHOUT a sales pitch)

Return a JSON array of 5 trend objects:
[
  {{
    "title": "...",
    "description": "...",
    "keywords": ["...", "..."],
    "category": "...",
    "why_relevant": "..."
  }}
]"""

        try:
            result = self.call_llm_json(prompt, temperature=0.9)
            trends = []

            items = result if isinstance(result, list) else result.get("trends", result.get("items", []))

            for item in items:
                if isinstance(item, dict) and not item.get("parse_error"):
                    trends.append(
                        TrendItem(
                            title=item.get("title", "LLM Trend"),
                            description=item.get("description", ""),
                            source=TrendSource.LLM_GENERATED,
                            keywords=item.get("keywords", []),
                            category=item.get("category", ""),
                            raw_data={"why_relevant": item.get("why_relevant", "")},
                        )
                    )

            self.logger.info("LLM generated %d fallback trends", len(trends))
            return trends

        except Exception as e:
            self.logger.error("LLM trend generation failed: %s", e)
            return []
