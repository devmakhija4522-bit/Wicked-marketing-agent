"""
Reddit Trends Source
Uses PRAW to discover trending posts on relevant subreddits.
Optional — skipped if REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET not set.
"""

import logging

from config import settings
from models import TrendItem, TrendSource

logger = logging.getLogger("wicked.trends.reddit")

# Subreddits relevant to Grest's target audience and content
RELEVANT_SUBREDDITS = [
    "india",
    "IndianGaming",
    "apple",
    "iphone",
    "macbook",
    "technology",
    "gadgets",
    "memes",
    "IndianStreetFashion",
    "indiasocial",
]


def is_available() -> bool:
    """Check if Reddit API is configured."""
    return settings.has_reddit


def fetch_trends(
    subreddits: list[str] | None = None,
    query: str = "",
    max_results: int = 10,
    time_filter: str = "week",
) -> list[TrendItem]:
    """
    Fetch trending posts from relevant subreddits.

    Args:
        subreddits: List of subreddit names to scan. Defaults to RELEVANT_SUBREDDITS.
        query: Optional search query within subreddits.
        max_results: Max posts to return.
        time_filter: Time filter for 'hot'/'top' (hour, day, week, month, year, all).

    Returns:
        List of TrendItem objects from Reddit.
    """
    if not is_available():
        logger.info("Reddit API not configured, skipping Reddit trends.")
        return []

    try:
        import praw

        reddit = praw.Reddit(
            client_id=settings.reddit_client_id,
            client_secret=settings.reddit_client_secret,
            user_agent=settings.reddit_user_agent,
        )

        target_subs = subreddits or RELEVANT_SUBREDDITS
        trends = []

        if query:
            # Search across multiple subreddits
            combined = "+".join(target_subs[:5])  # Reddit limits multi-sub search
            subreddit = reddit.subreddit(combined)
            posts = subreddit.search(query, sort="relevance", time_filter=time_filter, limit=max_results)
        else:
            # Get hot posts from combined subreddits
            combined = "+".join(target_subs)
            subreddit = reddit.subreddit(combined)
            posts = subreddit.hot(limit=max_results * 2)  # Fetch extra, filter below

        count = 0
        for post in posts:
            if count >= max_results:
                break
            # Skip stickied/pinned posts
            if post.stickied:
                continue

            trends.append(
                TrendItem(
                    title=post.title,
                    description=(post.selftext[:500] if post.selftext else ""),
                    source=TrendSource.REDDIT,
                    url=f"https://reddit.com{post.permalink}",
                    engagement_metrics={
                        "upvotes": post.score,
                        "upvote_ratio": post.upvote_ratio,
                        "comments": post.num_comments,
                        "awards": getattr(post, "total_awards_received", 0),
                    },
                    keywords=[],
                    category=post.subreddit.display_name,
                    raw_data={
                        "subreddit": post.subreddit.display_name,
                        "author": str(post.author) if post.author else "[deleted]",
                        "is_video": post.is_video,
                        "domain": post.domain,
                        "created_utc": post.created_utc,
                    },
                )
            )
            count += 1

        logger.info("Fetched %d Reddit trends", len(trends))
        return trends

    except ImportError:
        logger.error("PRAW not installed. Run: pip install praw")
        return []
    except Exception as e:
        logger.error("Reddit trends fetch failed: %s", e)
        return []
