import json
import httpx
import re
from typing import Optional
from agents.base_agent import BaseAgent

def extract_text_from_html(html_content: str) -> str:
    # Remove scripts and styles
    html_content = re.sub(r'<script.*?</script>', ' ', html_content, flags=re.IGNORECASE | re.DOTALL)
    html_content = re.sub(r'<style.*?</style>', ' ', html_content, flags=re.IGNORECASE | re.DOTALL)
    # Remove all HTML tags
    text = re.sub(r'<[^>]+>', ' ', html_content)
    # Collapse whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text[:15000] # Provide up to 15k chars of context

class GMMBrandScraperAgent(BaseAgent):
    """
    Crawls a given website URL and extracts Brand DNA.
    """
    agent_name = "GMM Brand Scraper"
    agent_role = "Brand Identity Analyst"

    def run(self, website_url: str) -> dict:
        self.logger.info(f"Scraping brand DNA from: {website_url}")

        website_text = ""
        try:
            # Ensure URL has scheme
            if not website_url.startswith("http"):
                website_url = "https://" + website_url
            
            # Fetch HTML with httpx
            with httpx.Client(timeout=15.0, follow_redirects=True, headers={'User-Agent': 'Mozilla/5.0'}) as client:
                resp = client.get(website_url)
                resp.raise_for_status()
                website_text = extract_text_from_html(resp.text)
                self.logger.info(f"Successfully scraped {len(website_text)} chars from {website_url}")
        except Exception as e:
            self.logger.error(f"Failed to scrape URL {website_url}: {e}")
            website_text = f"[Scraping failed: {e}] - Relying solely on your search knowledge for {website_url}."

        prompt = f"""
You are an elite Brand Identity Analyst. Your task is to analyze the following website: {website_url}

Here is the raw text extracted from the website's homepage:
---
{website_text}
---

Based on this content (or your own search knowledge if the content is missing), extract the core Brand DNA.
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
