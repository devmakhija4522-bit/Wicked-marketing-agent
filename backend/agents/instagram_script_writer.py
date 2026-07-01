import logging
from typing import Optional
from pydantic import BaseModel
from agents.base_agent import BaseAgent
from services.news_service import NewsItem
from services.format_service import StoryFormat

logger = logging.getLogger("wicked.agent.instagram_script_writer")

class InstagramScriptOutput(BaseModel):
    title: str
    script: str
    visual_cues: list[str]
    suggested_audio: str
    source_news_title: str
    format_used: str

class InstagramScriptWriterAgent(BaseAgent):
    agent_name = "Instagram Script Writer"
    agent_role = "viral storytelling and short-form video expert"

    def get_system_prompt(self) -> str:
        return """You are the Instagram Script Writer Agent for the brand.

YOUR MISSION: Take a piece of Apple/Tech news and a specific viral storytelling format, and merge them into a highly engaging Instagram Reel script.

Your script must:
- Exactly follow the provided Storytelling Format and timing structure.
- Adapt the news to fit the brand's value proposition.
- Be formatted clearly with Visual/Audio cues and the spoken Script.
- Appeal to an 18-35 year old Indian demographic using a confident, slightly cheeky Hinglish tone.
"""

    def run(self, news_item: NewsItem, format_item: StoryFormat) -> InstagramScriptOutput:
        self.logger.info("Generating Instagram Script for news: %s using format: %s", news_item.title, format_item.name)
        
        format_structure_str = "\n".join([f"- {step}" for step in format_item.structure])
        
        prompt = f"""
        Please write an Instagram Reel script based on the following inputs:
        
        === NEWS ===
        Title: {news_item.title}
        Description: {news_item.description}
        
        === STORYTELLING FORMAT: {format_item.name} ===
        Description: {format_item.description}
        Structure:
        {format_structure_str}
        
        Return a JSON object with:
        - "title": A catchy title for this Reel.
        - "script": The spoken word script, formatted nicely with timestamps.
        - "visual_cues": A list of 3-4 visual directions (e.g. "Zoom in on face", "B-roll of iPhone").
        - "suggested_audio": A suggestion for background music or trending audio vibe.
        """
        
        try:
            result = self.call_llm_json(prompt, temperature=0.8)
            
            script_text = result.get("script", "")
            if not script_text:
                raise ValueError("LLM returned empty script text.")
                
            return InstagramScriptOutput(
                title=result.get("title", f"Reel: {news_item.title}"),
                script=script_text,
                visual_cues=result.get("visual_cues", []),
                suggested_audio=result.get("suggested_audio", "Trending Lo-Fi Beat"),
                source_news_title=news_item.title,
                format_used=format_item.name
            )
            
        except Exception as e:
            self.logger.error("Failed to generate Instagram Script: %s", e)
            return InstagramScriptOutput(
                title=f"Breaking: {news_item.title}",
                script=f"[0:00] Hook: {news_item.title}\n[0:05] Body: {news_item.description}\n[0:20] CTA: Follow us for more!",
                visual_cues=["Show the news article", "Show brand logo"],
                suggested_audio="Trending sound",
                source_news_title=news_item.title,
                format_used=format_item.name
            )
