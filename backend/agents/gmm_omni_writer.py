from typing import Optional
from agents.base_agent import BaseAgent
import json

class GMMOmniWriterAgent(BaseAgent):
    """
    Takes approved News and Hooks and generates 3 distinct final content pieces.
    """
    agent_name = "GMM Omni-Channel Writer"
    agent_role = "Master Copywriter & Scriptwriter"

    def run(self, product_focus: str, news_context: str, hook_context: str) -> dict:
        self.logger.info(f"Generating Omni-channel content for: {product_focus}")

        prompt = f"""
{self.brand_context_summary}

You are an elite, omni-channel master copywriter. Your client is launching/focusing on: {product_focus}.

The user has approved the following background context (News/Facts):
---
{news_context}
---

The user has approved the following viral hook structures (use one or blend them):
---
{hook_context}
---

Your task is to write the FINAL, polished marketing copy for 3 distinct channels.
Return a JSON object containing EXACTLY these 4 keys:
- "instagram_reel" (String: 30-60s script with audio/visual cues, high pacing, optimized for shorts/reels)
- "youtube_video" (String: 5-8 minute detailed script outline with intro, retention loop, value delivery, and CTA)
- "facebook_post" (String: Text-based post optimized for engagement and emojis)
- "image_prompt" (String: A highly detailed, 50-word Midjourney/DALL-E 3 image generation prompt for the Facebook post visual)

Ensure the tone perfectly matches the Brand Context. Do not include markdown blocks in your json values, just raw text.
"""
        response = self.llm.generate_json(
            prompt=prompt,
            system_prompt="You are a master copywriter. Output strictly valid JSON."
        )
        return response
