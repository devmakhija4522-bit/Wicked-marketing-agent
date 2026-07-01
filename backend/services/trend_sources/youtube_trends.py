"""
YouTube Trends Source
Uses YouTube Data API v3 to discover trending/popular videos.
Optional — skipped if YOUTUBE_API_KEY is not set.
"""

import logging
from typing import Optional

import httpx

from config import settings
from models import TrendItem, TrendSource

logger = logging.getLogger("wicked.trends.youtube")

YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"
YOUTUBE_VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos"


def is_available() -> bool:
    """Check if YouTube API is configured."""
    return settings.has_youtube


def fetch_trends(
    query: str = "tech india",
    max_results: int = 10,
    region_code: str = "IN",
) -> list[TrendItem]:
    """
    Fetch trending/popular YouTube videos matching a query.

    Args:
        query: Search query string.
        max_results: Number of results to fetch.
        region_code: ISO country code for regional trends.

    Returns:
        List of TrendItem objects from YouTube.
    """
    if not is_available():
        logger.info("YouTube API key not configured, skipping YouTube trends.")
        return []

    try:
        # Step 1: Search for relevant videos
        search_params = {
            "part": "snippet",
            "q": query,
            "type": "video",
            "order": "viewCount",
            "regionCode": region_code,
            "maxResults": max_results,
            "publishedAfter": _get_recent_date(),
            "relevanceLanguage": "hi",
            "key": settings.youtube_api_key,
        }

        with httpx.Client(timeout=15.0) as client:
            search_resp = client.get(YOUTUBE_SEARCH_URL, params=search_params)
            search_resp.raise_for_status()
            search_data = search_resp.json()

            video_ids = [
                item["id"]["videoId"]
                for item in search_data.get("items", [])
                if "videoId" in item.get("id", {})
            ]

            if not video_ids:
                logger.info("No YouTube videos found for query: %s", query)
                return []

            # Step 2: Get video statistics
            stats_params = {
                "part": "snippet,statistics,contentDetails",
                "id": ",".join(video_ids),
                "key": settings.youtube_api_key,
            }
            stats_resp = client.get(YOUTUBE_VIDEOS_URL, params=stats_params)
            stats_resp.raise_for_status()
            stats_data = stats_resp.json()

        trends = []
        for item in stats_data.get("items", []):
            snippet = item.get("snippet", {})
            stats = item.get("statistics", {})
            trends.append(
                TrendItem(
                    title=snippet.get("title", ""),
                    description=snippet.get("description", "")[:500],
                    source=TrendSource.YOUTUBE,
                    url=f"https://youtube.com/watch?v={item['id']}",
                    engagement_metrics={
                        "views": int(stats.get("viewCount", 0)),
                        "likes": int(stats.get("likeCount", 0)),
                        "comments": int(stats.get("commentCount", 0)),
                    },
                    keywords=snippet.get("tags", [])[:10] if snippet.get("tags") else [],
                    category=snippet.get("categoryId", ""),
                    raw_data={
                        "channel": snippet.get("channelTitle", ""),
                        "published_at": snippet.get("publishedAt", ""),
                    },
                )
            )

        logger.info("Fetched %d YouTube trends for query: %s", len(trends), query)
        return trends

    except httpx.HTTPStatusError as e:
        logger.error("YouTube API HTTP error: %s", e.response.text[:300])
        return []
    except Exception as e:
        logger.error("YouTube trends fetch failed: %s", e)
        return []


def _get_recent_date() -> str:
    """Get ISO date string for 7 days ago (to find recent trending content)."""
    from datetime import datetime, timedelta
    d = datetime.utcnow() - timedelta(days=7)
    return d.strftime("%Y-%m-%dT00:00:00Z")
