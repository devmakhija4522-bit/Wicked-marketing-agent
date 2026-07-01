"""
Instagram Trends Source
Uses RapidAPI Instagram Scraper to discover trending content.
Optional — skipped if RAPIDAPI_KEY is not set.
"""

import logging

import httpx

from config import settings
from models import TrendItem, TrendSource

logger = logging.getLogger("wicked.trends.instagram")


def is_available() -> bool:
    """Check if Instagram/RapidAPI is configured."""
    return settings.has_instagram


def fetch_trends(
    hashtags: list[str] | None = None,
    max_results: int = 10,
) -> list[TrendItem]:
    """
    Fetch trending Instagram posts by hashtag via RapidAPI.

    Args:
        hashtags: Hashtags to search (without #). Defaults to tech/apple related tags.
        max_results: Max items to return.

    Returns:
        List of TrendItem objects from Instagram.
    """
    if not is_available():
        logger.info("RapidAPI key not configured, skipping Instagram trends.")
        return []

    default_hashtags = ["refurbishediphone", "iphoneindia", "techindia", "appleindia", "budgetphone"]
    target_hashtags = hashtags if hashtags else default_hashtags

    trends = []

    for tag in target_hashtags:
        tag_trends = _fetch_hashtag_posts(tag, max_per_tag=max(2, max_results // len(target_hashtags)))
        trends.extend(tag_trends)
        if len(trends) >= max_results:
            break

    logger.info("Fetched %d Instagram trends", len(trends))
    return trends[:max_results]


def _fetch_hashtag_posts(hashtag: str, max_per_tag: int = 3) -> list[TrendItem]:
    """Fetch top posts for a specific hashtag."""
    try:
        url = f"https://{settings.rapidapi_instagram_host}/v1/hashtag"

        headers = {
            "x-rapidapi-key": settings.rapidapi_key,
            "x-rapidapi-host": settings.rapidapi_instagram_host,
        }

        params = {
            "hashtag": hashtag,
        }

        with httpx.Client(timeout=15.0) as client:
            response = client.get(url, headers=headers, params=params)
            response.raise_for_status()
            data = response.json()

        items = []
        edges = data.get("data", {}).get("items", [])
        if not edges:
            # Try alternate response structure
            edges = data.get("items", data.get("data", []))
            if isinstance(edges, dict):
                edges = edges.get("edge_hashtag_to_media", {}).get("edges", [])

        for edge in edges[:max_per_tag]:
            node = edge.get("node", edge) if isinstance(edge, dict) else {}

            caption_edges = node.get("edge_media_to_caption", {}).get("edges", [])
            caption = ""
            if caption_edges:
                caption = caption_edges[0].get("node", {}).get("text", "")
            elif isinstance(node.get("caption"), dict):
                caption = node["caption"].get("text", "")
            elif isinstance(node.get("caption"), str):
                caption = node["caption"]

            shortcode = node.get("shortcode", node.get("code", ""))
            likes = node.get("edge_liked_by", {}).get("count",
                    node.get("like_count",
                    node.get("edge_media_preview_like", {}).get("count", 0)))
            comments = node.get("edge_media_to_comment", {}).get("count",
                       node.get("comment_count", 0))

            items.append(
                TrendItem(
                    title=f"#{hashtag}: {caption[:100]}" if caption else f"#{hashtag} trending post",
                    description=caption[:500] if caption else "",
                    source=TrendSource.INSTAGRAM,
                    url=f"https://instagram.com/p/{shortcode}" if shortcode else "",
                    engagement_metrics={
                        "likes": likes,
                        "comments": comments,
                        "hashtag": hashtag,
                    },
                    keywords=[hashtag],
                    category="instagram_hashtag",
                    raw_data={
                        "is_video": node.get("is_video", False),
                        "media_type": node.get("media_type", ""),
                    },
                )
            )

        return items

    except httpx.HTTPStatusError as e:
        logger.warning("Instagram API error for #%s: %s", hashtag, e.response.status_code)
        return []
    except Exception as e:
        logger.error("Instagram fetch failed for #%s: %s", hashtag, e)
        return []
