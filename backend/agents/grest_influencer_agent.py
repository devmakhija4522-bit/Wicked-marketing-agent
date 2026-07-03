import json
from agents.base_agent import BaseAgent

class GrestInfluencerAgent(BaseAgent):
    """
    Finds potential influencers based on flexible user criteria.
    Uses AI web search to find relevant influencers and returns JSON data.
    """
    agent_name = "Grest Influencer Scout"
    agent_role = "Influencer Marketing Strategist"

    def run(self, criteria: dict) -> str:
        self.logger.info(f"Scouting influencers with criteria: {criteria}")

        platform = criteria.get('platform', 'YouTube and Instagram')
        category = criteria.get('category', 'Tech')
        follower_count = criteria.get('followerCount', '50k - 100k')
        city = criteria.get('city', 'India')

        system_prompt = f"""
You are an expert Influencer Marketing Strategist working for Grest (grest.in).
Your task is to find the best influencer matches based on these specific criteria:

CRITERIA:
- Platform: {platform}
- Category/Niche/Content Style: {category}
- Follower Count: {follower_count}
- Target City (Where influencer & their primary audience resides): {city}

Use the web to search for real, active influencers that match this exact criteria.

STRICT VERIFICATION & QUALITY CONTROL (BACKEND ONLY):
1. **ABSOLUTELY NO HALLUCINATIONS:** You must NEVER guess an Instagram or YouTube handle. Do not assume that if someone's name is "John Doe", their handle is "instagram.com/johndoe". YOU MUST only provide a URL if you explicitly saw that exact URL written out in your web search results. If you cannot find their explicit, exact profile URL in the search results, DO NOT include them in the list.
2. **FAKE FOLLOWER DETECTION:** You must analyze the influencer's engagement patterns. Look for red flags that indicate purchased fake followers or boosted bot engagement. 
   - *Pattern 1:* Extremely high follower count (e.g., 500k+) but very low average likes/comments on videos (e.g., < 1,000 likes).
   - *Pattern 2:* Comments are generic (e.g., "nice", "fire emoji", spam) rather than actual community discussion.
   - *Action:* If you detect these patterns of fake engagement, DISCARD the profile and find another one. Only recommend creators with authentic, organic engagement.

Provide 5 solid, verified recommendations.

CRITICAL INSTRUCTION: 
You MUST output your response as a valid, raw JSON array of objects. Do NOT include markdown code blocks like ```json or anything else. JUST the raw JSON.
The JSON array MUST follow this exact schema:
[
  {{
    "name": "Influencer Name",
    "handle": "@username",
    "platform": "YouTube or Instagram",
    "url": "https://...",
    "followers": "Number of followers",
    "reasoning": "Why they are a perfect fit. MUST include a brief note on why you believe their engagement is authentic (e.g., '10% engagement rate with active community comments')."
  }}
]
"""

        prompt = f"""
Find 5 highly relevant influencers based on the provided criteria.
Ensure the profiles actually exist and provide valid links.
Output strictly as a valid JSON array.
"""

        response = self.llm.generate(
            prompt=prompt,
            system_prompt=system_prompt,
            use_search=True
        )
        
        # Robust JSON extraction: find the first '[' and last ']'
        cleaned_response = response.strip()
        start_idx = cleaned_response.find('[')
        end_idx = cleaned_response.rfind(']')
        
        if start_idx != -1 and end_idx != -1:
            cleaned_response = cleaned_response[start_idx:end_idx+1]
            
        return cleaned_response
