import logging
import random
from typing import List
from pydantic import BaseModel
from datetime import datetime, timedelta

logger = logging.getLogger("wicked.services.analytics")

class VideoAnalytics(BaseModel):
    id: str
    title: str
    platform: str
    views: int
    likes: int
    comments: int
    shares: int
    posted_at: datetime
    thumbnail_url: str

class AnalyticsSummary(BaseModel):
    total_views: int
    total_likes: int
    total_comments: int
    videos: List[VideoAnalytics]

class AnalyticsService:
    @staticmethod
    def get_analytics(platform: str = "All") -> AnalyticsSummary:
        """
        Fetches analytics for the account.
        Requires OAuth for real YouTube/Instagram data. Using mocked data for now.
        """
        logger.info(f"Fetching analytics for platform: {platform}")
        
        # Generate some realistic looking mock data
        base_date = datetime.utcnow()
        mock_videos = [
            VideoAnalytics(
                id="yt1",
                title="Is a Refurbished iPhone 13 Still Worth It in 2026?",
                platform="YouTube",
                views=45200,
                likes=1200,
                comments=145,
                shares=320,
                posted_at=base_date - timedelta(days=2),
                thumbnail_url="https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500&q=80"
            ),
            VideoAnalytics(
                id="ig1",
                title="5 Checks before buying a second hand phone! 📱",
                platform="Instagram",
                views=125000,
                likes=8400,
                comments=320,
                shares=1500,
                posted_at=base_date - timedelta(days=5),
                thumbnail_url="https://images.unsplash.com/photo-1512054502232-10a0a035d672?w=500&q=80"
            ),
            VideoAnalytics(
                id="yt2",
                title="Unboxing Certified MacBook Air M2",
                platform="YouTube",
                views=18400,
                likes=650,
                comments=89,
                shares=45,
                posted_at=base_date - timedelta(days=10),
                thumbnail_url="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80"
            ),
            VideoAnalytics(
                id="ig2",
                title="Save ₹20k on your next iPhone? Here's how 🤯",
                platform="Instagram",
                views=210000,
                likes=15000,
                comments=890,
                shares=4200,
                posted_at=base_date - timedelta(days=12),
                thumbnail_url="https://images.unsplash.com/photo-1556656793-08538906a9f8?w=500&q=80"
            )
        ]
        
        if platform != "All":
            mock_videos = [v for v in mock_videos if v.platform == platform]
            
        return AnalyticsSummary(
            total_views=sum(v.views for v in mock_videos),
            total_likes=sum(v.likes for v in mock_videos),
            total_comments=sum(v.comments for v in mock_videos),
            videos=mock_videos
        )
