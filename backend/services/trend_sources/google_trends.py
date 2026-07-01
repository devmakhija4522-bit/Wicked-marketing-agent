"""
Google Trends Source
Uses pytrends to discover trending searches — NO API key required.
This is the baseline trend source that always works.
"""

import logging
from datetime import datetime

from models import TrendItem, TrendSource

logger = logging.getLogger("wicked.trends.google")


def is_available() -> bool:
    """Google Trends is always available (no API key needed)."""
    return True


def fetch_trends(
    keywords: list[str] | None = None,
    geo: str = "IN",
    max_results: int = 10,
) -> list[TrendItem]:
    """
    Fetch trending searches and related queries from Google Trends.

    Args:
        keywords: Seed keywords to explore related trends.
        geo: Geographic region code (default: IN for India).
        max_results: Maximum number of trend items to return.

    Returns:
        List of TrendItem objects from Google Trends.
    """
    default_keywords = ["iPhone India", "refurbished phone", "Apple deals", "tech reels", "smartphone 2025"]
    search_keywords = keywords if keywords else default_keywords

    trends = []

    # Strategy 1: Get trending searches (daily/realtime)
    trends.extend(_fetch_trending_searches(geo, max_results))

    # Strategy 2: Get related queries for our seed keywords
    trends.extend(_fetch_related_queries(search_keywords, geo, max_results))

    # Deduplicate by title
    seen_titles = set()
    unique_trends = []
    for t in trends:
        normalized = t.title.lower().strip()
        if normalized not in seen_titles:
            seen_titles.add(normalized)
            unique_trends.append(t)

    logger.info("Fetched %d unique Google Trends items", len(unique_trends))
    return unique_trends[:max_results]


def _fetch_trending_searches(geo: str, max_results: int) -> list[TrendItem]:
    """Fetch daily trending searches for a region."""
    try:
        from pytrends.request import TrendReq

        pytrends = TrendReq(hl="hi-IN", tz=330)  # IST offset

        # Trending searches (daily)
        try:
            trending_df = pytrends.trending_searches(pn="india")
            items = []
            for idx, row in trending_df.head(max_results).iterrows():
                query_text = str(row.iloc[0]) if len(row) > 0 else str(row)
                items.append(
                    TrendItem(
                        title=query_text,
                        description=f"Trending search in India: {query_text}",
                        source=TrendSource.GOOGLE_TRENDS,
                        url=f"https://trends.google.com/trends/explore?q={query_text.replace(' ', '+')}&geo=IN",
                        engagement_metrics={"trending_rank": idx + 1},
                        keywords=[query_text],
                        category="trending_search",
                    )
                )
            return items
        except Exception as e:
            logger.warning("Daily trending searches failed: %s", e)
            return []

    except ImportError:
        logger.error("pytrends not installed. Run: pip install pytrends")
        return []
    except Exception as e:
        logger.error("Google trending searches failed: %s", e)
        return []


def _fetch_related_queries(keywords: list[str], geo: str, max_results: int) -> list[TrendItem]:
    """Fetch related queries for seed keywords."""
    try:
        from pytrends.request import TrendReq

        pytrends = TrendReq(hl="hi-IN", tz=330)

        items = []
        # Process keywords in batches of 5 (pytrends limit)
        for i in range(0, len(keywords), 5):
            batch = keywords[i:i + 5]
            try:
                pytrends.build_payload(batch, cat=0, timeframe="now 7-d", geo=geo)
                related = pytrends.related_queries()

                for kw, data in related.items():
                    # Top related queries
                    if data.get("top") is not None and not data["top"].empty:
                        for _, row in data["top"].head(3).iterrows():
                            query_text = row.get("query", "")
                            value = row.get("value", 0)
                            if query_text:
                                items.append(
                                    TrendItem(
                                        title=query_text,
                                        description=f"Related to '{kw}' — interest score: {value}",
                                        source=TrendSource.GOOGLE_TRENDS,
                                        url=f"https://trends.google.com/trends/explore?q={query_text.replace(' ', '+')}&geo=IN",
                                        engagement_metrics={
                                            "interest_score": int(value),
                                            "related_to": kw,
                                        },
                                        keywords=[query_text, kw],
                                        category="related_query",
                                    )
                                )

                    # Rising related queries (breakout trends)
                    if data.get("rising") is not None and not data["rising"].empty:
                        for _, row in data["rising"].head(3).iterrows():
                            query_text = row.get("query", "")
                            value = row.get("value", "")
                            if query_text:
                                items.append(
                                    TrendItem(
                                        title=f"🔥 {query_text}",
                                        description=f"RISING trend related to '{kw}' — growth: {value}",
                                        source=TrendSource.GOOGLE_TRENDS,
                                        url=f"https://trends.google.com/trends/explore?q={query_text.replace(' ', '+')}&geo=IN",
                                        engagement_metrics={
                                            "growth": str(value),
                                            "related_to": kw,
                                            "is_rising": True,
                                        },
                                        keywords=[query_text, kw],
                                        category="rising_query",
                                    )
                                )
            except Exception as e:
                logger.warning("Related queries for batch %s failed: %s", batch, e)
                continue

        return items[:max_results]

    except ImportError:
        logger.error("pytrends not installed. Run: pip install pytrends")
        return []
    except Exception as e:
        logger.error("Google related queries failed: %s", e)
        return []
