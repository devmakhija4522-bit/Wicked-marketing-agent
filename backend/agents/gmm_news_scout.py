from typing import Optional
from agents.base_agent import BaseAgent

class GMMNewsScoutAgent(BaseAgent):
    """
    Uses Gemini's built-in Google Search grounding to fetch the latest
    news and updates about a specific product/brand.
    """
    agent_name = "GMM News Scout"
    agent_role = "Product News Researcher"

    def run(self, product_focus: str) -> str:
        self.logger.info(f"Gathering latest news for: {product_focus}")

        prompt = f"""
{self.brand_context_summary}

You are an expert marketing researcher. The client is focusing on this specific product/campaign:
"{product_focus}"

Your task is to find the absolute latest, real-time news, updates, sentiment, and public discourse 
about this exact product/topic using Google Search.

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
