import logging
import httpx
from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional

logger = logging.getLogger("wicked.services.news")

class NewsItem(BaseModel):
    title: str
    description: str
    url: str
    source: str
    published_at: datetime
    
class NewsService:
    @staticmethod
    def fetch_apple_news(limit: int = 5) -> List[NewsItem]:
        """
        Fetches the latest Apple-related news. 
        Currently implemented using a public RSS feed (e.g. RSS to JSON or mock data).
        """
        logger.info("Fetching latest Apple news...")
        
        # In a real scenario, you'd use NewsAPI, MediaStack, or an RSS parser here.
        # For demonstration without requiring an API key, we will return some mock
        # data that simulates what an Apple news feed would look like today.
        
        mock_news = [
            NewsItem(
                title="Apple releases iOS 18 beta with new AI features",
                description="The latest developer beta of iOS 18 includes the highly anticipated Apple Intelligence features.",
                url="https://example.com/apple-ios-18",
                source="TechNews",
                published_at=datetime.utcnow()
            ),
            NewsItem(
                title="Refurbished iPhone market surges in India",
                description="Demand for refurbished premium smartphones, especially iPhones, has seen a 25% year-over-year increase in India.",
                url="https://example.com/refurb-market-india",
                source="MarketWatch",
                published_at=datetime.utcnow()
            ),
            NewsItem(
                title="Next-gen MacBook Pro expected to feature M4 chip",
                description="Rumors suggest Apple is gearing up to launch the M4 chip across its MacBook Pro lineup later this year.",
                url="https://example.com/macbook-m4",
                source="MacRumors Mock",
                published_at=datetime.utcnow()
            ),
            NewsItem(
                title="Apple's sustainability efforts highlighted in new report",
                description="A new environmental report details Apple's progress towards becoming 100% carbon neutral by 2030.",
                url="https://example.com/apple-environment",
                source="EcoTech",
                published_at=datetime.utcnow()
            )
        ]
        
        return mock_news[:limit]
