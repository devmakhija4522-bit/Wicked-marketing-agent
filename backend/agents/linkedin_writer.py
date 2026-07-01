import logging
from typing import Optional
from pydantic import BaseModel
from agents.base_agent import BaseAgent
from services.news_service import NewsItem

logger = logging.getLogger("wicked.agent.linkedin_writer")

class LinkedInDraftOutput(BaseModel):
    draft_text: str
    suggested_hashtags: list[str]
    source_url: str
    news_title: str

class LinkedInWriterAgent(BaseAgent):
    agent_name = "LinkedIn Writer"
    agent_role = "professional B2B and B2C content creator"

    def get_system_prompt(self) -> str:
        return """You are the LinkedIn Writer Agent for the brand.

YOUR MISSION: Take a piece of Apple/Tech news and turn it into an engaging, professional, yet conversational LinkedIn post.

Your tone should be:
- Authoritative but approachable
- Focused on value or smart financial decisions
- Engaging (ask a question at the end to drive comments)

FORMAT:
1. A hook (first line)
2. The core news/insight
3. The "Brand take" (why this matters for our market or smart buyers)
4. A closing question for the audience

Do not use too many emojis. Keep it clean. Provide the final text and a list of 3-5 hashtags."""

    def run(self, news_item: NewsItem) -> LinkedInDraftOutput:
        self.logger.info("Generating LinkedIn draft for news: %s", news_item.title)
        
        prompt = f"""
        Please write a LinkedIn post based on the following news:
        Title: {news_item.title}
        Description: {news_item.description}
        Source: {news_item.source}
        
        Return a JSON object with:
        - "draft_text": The complete text of the LinkedIn post.
        - "suggested_hashtags": A list of strings (without the # symbol).
        """
        
        try:
            result = self.call_llm_json(prompt, temperature=0.7)
            
            draft_text = result.get("draft_text", "")
            hashtags = result.get("suggested_hashtags", [])
            
            if not draft_text:
                raise ValueError("LLM returned empty draft text.")
                
            return LinkedInDraftOutput(
                draft_text=draft_text,
                suggested_hashtags=hashtags,
                source_url=news_item.url,
                news_title=news_item.title
            )
            
        except Exception as e:
            self.logger.error("Failed to generate LinkedIn draft: %s", e)
            # Fallback
            return LinkedInDraftOutput(
                draft_text=f"Breaking News: {news_item.title}\n\n{news_item.description}\n\nWhat are your thoughts on this? Let us know below!",
                suggested_hashtags=["TechNews", "Brand"],
                source_url=news_item.url,
                news_title=news_item.title
            )
