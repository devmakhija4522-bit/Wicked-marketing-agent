from typing import Optional
from agents.base_agent import BaseAgent

class GMMHookScoutAgent(BaseAgent):
    """
    Extracts viral hook structures either from a provided URL or by searching for trends.
    Uses reference accounts to establish a structural baseline.
    """
    agent_name = "GMM Hook Scout"
    agent_role = "Viral Content Analyst"

    def run(self, product_focus: str, viral_url: Optional[str] = None) -> str:
        self.logger.info(f"Extracting hooks for: {product_focus} (URL: {viral_url})")

        from config import settings
        import httpx

        scraped_captions = ""

        # Attempt to scrape natively if they didn't provide a URL but provided a RapidAPI key
        if not viral_url and settings.has_instagram:
            self.logger.info("Native Instagram scraping enabled via RapidAPI. Attempting to fetch recent reels from moonshot.fun...")
            try:
                # We use a synchronous request here for simplicity, though async is also possible
                with httpx.Client(timeout=15.0) as client:
                    headers = {
                        "X-RapidAPI-Key": settings.rapidapi_key,
                        "X-RapidAPI-Host": settings.rapidapi_instagram_host
                    }
                    # Standard endpoint for this RapidAPI host to get user posts
                    # Depending on exact subscription, it may be /v1.2/posts or /v1/user_info
                    response = client.get(
                        f"https://{settings.rapidapi_instagram_host}/v1.2/posts",
                        headers=headers,
                        params={"username_or_id_or_url": "moonshot.fun"}
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        items = data.get("data", {}).get("items", [])
                        
                        captions_list = []
                        for idx, item in enumerate(items[:3]): # Top 3 recent videos
                            caption = item.get("caption", {}).get("text", "No caption provided.")
                            view_count = item.get("play_count", "Unknown")
                            captions_list.append(f"Reel {idx+1} (Views: {view_count}):\n{caption}")
                            
                        if captions_list:
                            scraped_captions = "\n\n".join(captions_list)
                            self.logger.info("Successfully scraped Instagram reels natively.")
                    else:
                        self.logger.warning(f"RapidAPI returned status {response.status_code}: {response.text}")
            except Exception as e:
                self.logger.error(f"Failed to scrape Instagram natively: {e}")

        if viral_url:
            url_context = f"The user has provided this viral video URL as inspiration: {viral_url}\nUse your search capabilities or web grounding to analyze the content, transcript, or context of this specific URL."
        elif scraped_captions:
            url_context = f"We have natively scraped the latest reels from our reference account (moonshot.fun). Here are the exact captions/metadata of their top 3 recent videos:\n\n{scraped_captions}\n\nUse these exact structures to model your hooks."
        else:
            url_context = f"No specific URL provided, and native scraping failed/disabled. Use your general knowledge to find top-performing and trending short-form video hooks related to '{product_focus}' or this niche."

        prompt = f"""
{self.brand_context_summary}

You are a viral social media strategist. 
{url_context}

CRITICAL STYLISTIC REFERENCE:
The client wants the pacing, energy, and hook structures to be modeled after top-tier engaging pages such as:
1. instagram.com/moonshot.fun
2. instagram.com/adsyouwontskip

Your hooks MUST emulate the fast-paced, high-retention, and pattern-interrupt style of these accounts. 
Even if the product is dry, the delivery must feel like a native, high-performing organic reel.

Your task is to extract or synthesize 3 highly engaging "Hook + Body Structure" combinations that we can use for {product_focus}.
Each of the 3 hooks should follow a distinct psychological pattern (e.g., The Contrarian Hook, The Curiosity Gap, The Desire/Pain-Point Hook).

Format your response exactly like this for each of the 3 hooks:

### Hook Option [1/2/3]: [Hook Name]
**The Hook Line (0-3s):** [Write the exact line to be spoken]
**Visual Hook:** [What should happen visually on screen]
**Why it works:** [Brief psychological reason referencing our stylistic baseline]
**Suggested Body Arc:** [How the 30-second script should flow after this hook]

Do not write the full script, just the hooks and the structural arc.
"""
        response = self.llm.generate(
            prompt=prompt,
            system_prompt="You are an expert social media analyst specializing in viral hooks, retention graphs, and psychological triggers. You understand how accounts like adsyouwontskip engineer retention.",
            use_search=True
        )
        return response

