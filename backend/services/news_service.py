import logging
import httpx
import xml.etree.ElementTree as ET
from datetime import datetime
from pydantic import BaseModel
from typing import List

logger = logging.getLogger("wicked.services.news")

class NewsItem(BaseModel):
    title: str
    description: str
    url: str
    source: str
    
class NewsService:
    @staticmethod
    def fetch_industry_news(query: str, limit: int = 3) -> List[NewsItem]:
        """
        Fetches the absolute latest news from Google News RSS feed for a given query
        to guarantee 100% real, clickable, non-hallucinated links and bypass bot blocks.
        """
        logger.info(f"Fetching real news from Google News RSS for query: {query}...")
        
        # Replace spaces with + for the URL
        url_query = query.replace(' ', '+')
        url = f"https://news.google.com/rss/search?q={url_query}+when:7d&hl=en-US&gl=US&ceid=US:en"
        try:
            # We use a standard User-Agent so we don't get blocked
            response = httpx.get(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}, timeout=10.0)
            response.raise_for_status()
            
            root = ET.fromstring(response.text)
            news_items = []
            
            # The RSS structure is typically: rss -> channel -> item
            for item in root.findall('./channel/item'):
                if len(news_items) >= limit:
                    break
                    
                title = item.find('title').text if item.find('title') is not None else "No Title"
                link = item.find('link').text if item.find('link') is not None else ""
                
                # We strip HTML from the description if possible, or just take a snippet
                desc = item.find('description').text if item.find('description') is not None else ""
                
                news_items.append(NewsItem(
                    title=title.strip(),
                    description=desc.strip()[:300] + "...", # just a snippet for context
                    url=link.strip(),
                    source="Google News"
                ))
                
            # Fallback if no items were found
            if not news_items:
                logger.error("No items found in RSS feed.")
                raise Exception("Empty RSS")
                
            return news_items
            
        except Exception as e:
            logger.error(f"Failed to fetch RSS: {e}")
            raise Exception(f"Failed to fetch real news for query '{query}'. Try again later.")
