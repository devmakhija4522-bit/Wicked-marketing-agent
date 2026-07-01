import urllib.parse
from typing import Optional
from agents.base_agent import BaseAgent

class GMMNewsScoutAgent(BaseAgent):
    """
    Uses feedparser (Google News RSS) and Gemini's built-in Google Search grounding 
    to fetch the latest news and updates about a specific product/brand.
    """
    agent_name = "GMM News Scout"
    agent_role = "Product News Researcher"

    def run(self, product_focus: str) -> str:
        self.logger.info(f"Gathering latest news for: {product_focus}")

        headlines_text = ""
        try:
            import feedparser
            query = urllib.parse.quote(product_focus)
            rss_url = f"https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en"
            feed = feedparser.parse(rss_url)
            
            if feed.entries:
                headlines_list = []
                for entry in feed.entries[:5]: # Get top 5 headlines
                    headlines_list.append(f"- {entry.title}")
                headlines_text = "\n".join(headlines_list)
            else:
                headlines_text = "No recent RSS headlines found."
        except Exception as e:
            self.logger.error(f"Error fetching RSS feeds: {e}")
            headlines_text = "Could not fetch RSS headlines, relying on Google Grounding."

        prompt = f"""
{self.brand_context_summary}

You are an expert marketing researcher. The client is focusing on this specific product/campaign:
"{product_focus}"

We have fetched the following real-time headlines via RSS:
{headlines_text}

Your task is to find the absolute latest, real-time news, updates, sentiment, and public discourse 
about this exact product/topic using Google Search to supplement the RSS headlines.

Summarize your findings in a clear, journalistic format:
1. **Latest Headlines & Updates:** (What is happening right now?)
2. **Public Sentiment:** (How are people reacting? Is it hype, controversy, or neutral?)
3. **Key Marketing Angles:** (Based on the news, what 2-3 angles should we use for marketing content?)

Do NOT generate a script. Only provide the research summary.
"""
        response = self.llm.generate(
            prompt=prompt,
            system_prompt="You are a meticulous marketing researcher. Always use search to verify real-time facts.",
            use_search=True
        )
        return response
