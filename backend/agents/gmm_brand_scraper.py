import json
from typing import Optional
from agents.base_agent import BaseAgent

class GMMBrandScraperAgent(BaseAgent):
    """
    Crawls a given website URL and extracts Brand DNA.
    """
    agent_name = "GMM Brand Scraper"
    agent_role = "Brand Identity Analyst"

    def run(self, website_url: str) -> dict:
        self.logger.info(f"Scraping brand DNA from: {website_url}")

        prompt = f"""
You are an elite Brand Identity Analyst. Your task is to analyze the following website: {website_url}
Use your search or web crawling capabilities to read the homepage, about us page, and product offerings.

Based on the website's content, extract the core Brand DNA.
You must return your analysis strictly as a JSON object with EXACTLY these keys:
- "brand_name" (String: The name of the company)
- "tagline" (String: A 1-2 sentence business description or unique value proposition)
- "category" (String: The industry or niche, e.g., "Technology", "Fashion")
- "target_audience" (String: A description of who this product is for)
- "brand_voice" (String: A description of the tone and voice, e.g., "Professional, authoritative, but approachable")

Do not include markdown blocks in your json values, just raw text.
"""
        response = self.llm.generate_json(
            prompt=prompt,
            system_prompt="You are an expert brand analyst. Output strictly valid JSON.",
            use_search=True
        )
        return response
