import datetime
from agents.base_agent import BaseAgent
from services.news_service import NewsService

class LinkedInAgent(BaseAgent):
    """
    Automates the LinkedIn news scanning workflow for any client.
    Searches for latest industry news based on brand profile and drafts hook options.
    Optionally applies custom writing style references.
    """
    agent_name = "LinkedIn News Agent"
    agent_role = "LinkedIn Content Strategist and Writer"

    def __init__(self, client_id: str = "generic", references: str = "", llm_service=None):
        super().__init__(client_id=client_id, llm_service=llm_service)
        self.references = references

    def _generate_news_query(self) -> str:
        prompt = f"""Based on the following brand context, generate a 2-3 word search query for Google News to find the most relevant industry news. 
Output ONLY the query, no quotes, no extra text.

Brand: {self.brand_profile.get('brand_name', '')}
Category: {self.brand_profile.get('category', '')}
Tagline: {self.brand_profile.get('tagline', '')}"""
        
        query = self.call_llm(prompt=prompt, temperature=0.3).strip('"\'\n ')
        if not query:
            return self.brand_profile.get('category', 'Technology')
        return query

    def run(self) -> str:
        query = self._generate_news_query()
        self.logger.info(f"Fetching real industry news for query '{query}'...")

        # Fetch authentic, verified news to prevent hallucinated URLs
        news_items = NewsService.fetch_industry_news(query=query, limit=3)
        news_context = "\n\n".join([f"Headline: {n.title}\nLink: {n.url}\nSummary: {n.description}" for n in news_items])

        reference_section = ""
        if self.references and self.references.strip():
            reference_section = f"""
CRITICAL VOICE & STRUCTURE REFERENCE:
The user has provided the following sample posts to define their exact writing style, tone, and structural pattern. 
You MUST analyze these samples and match their pattern, structure, line breaks, and tone in your output.

--- START SAMPLES ---
{self.references}
--- END SAMPLES ---

Ensure your generated drafts deeply reflect the style of these samples.
"""

        system_prompt = f"""
You are the LinkedIn Content Strategist for {self.brand_profile.get('brand_name', 'this brand')}.
You post personally on LinkedIn and write the final copy. You want research + angles, not a finished polished post.

THE CORE CONTENT ANGLE:
People care about relevant industry news. The job: take fresh news and find the genuine value/angle that connects to the brand's audience.

{reference_section}

OUTPUT FORMAT:
1. The News Item + Source Link (verified) — You MUST format the link as a Markdown link like this: [Read Article](URL)
2. The "Gap" — why this matters to the target audience.
3. 3-5 Hook Line Options (first lines only).
4. A loose structure the user can build the post from, including a closing placeholder.

NEVER write a complete, polished post. Leave it rough for the user to finish.
"""

        prompt = f"""
I have fetched 3 extremely fresh and verified industry news articles for you.

{news_context}

CRITICAL RULES FOR PREVENTING HALLUCINATIONS:
1. You MUST use the EXACT Link provided in the text above for each news item. Do NOT invent, guess, or modify the URL in any way.
2. DO NOT hallucinate any other news or sources. You are restricted entirely to the 3 items provided above.
3. Even if the news seems slightly unrelated, you MUST use it and find a creative angle rather than inventing fake news.
4. Output a SEPARATE draft for EACH of the 3 news items exactly according to the Output Format.
"""

        response = self.llm.generate(
            prompt=prompt,
            system_prompt=system_prompt,
            use_search=False
        )
        return response
