from typing import Optional
from agents.base_agent import BaseAgent

class GMMHookScoutAgent(BaseAgent):
    """
    Extracts viral hook structures either from a provided URL or by searching for trends.
    """
    agent_name = "GMM Hook Scout"
    agent_role = "Viral Content Analyst"

    def run(self, product_focus: str, viral_url: Optional[str] = None) -> str:
        self.logger.info(f"Extracting hooks for: {product_focus} (URL: {viral_url})")

        if viral_url:
            url_context = f"The user has provided this viral video URL as inspiration: {viral_url}\nUse your search capabilities or web grounding to analyze the content, transcript, or context of this specific URL."
        else:
            url_context = f"No specific URL provided. Use Google Search to find top-performing and trending short-form video hooks related to '{product_focus}' or this niche."

        prompt = f"""
{self.brand_context_summary}

You are a viral social media strategist. 
{url_context}

Your task is to extract or synthesize 3 highly engaging "Hook + Body Structure" combinations that we can use for {product_focus}.
Each of the 3 hooks should follow a distinct psychological pattern (e.g., The Contrarian Hook, The Curiosity Gap, The Desire/Pain-Point Hook).

Format your response exactly like this for each of the 3 hooks:

### Hook Option [1/2/3]: [Hook Name]
**The Hook Line (0-3s):** [Write the exact line to be spoken]
**Visual Hook:** [What should happen visually on screen]
**Why it works:** [Brief psychological reason]
**Suggested Body Arc:** [How the 30-second script should flow after this hook]

Do not write the full script, just the hooks and the structural arc.
"""
        response = self.llm.generate(
            prompt=prompt,
            system_prompt="You are an expert social media analyst specializing in viral hooks, retention graphs, and psychological triggers.",
            use_search=True
        )
        return response
