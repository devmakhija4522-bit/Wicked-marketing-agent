import logging
import random
from typing import List
from pydantic import BaseModel

logger = logging.getLogger("wicked.services.format")

class StoryFormat(BaseModel):
    id: str
    name: str
    description: str
    structure: List[str]

class FormatService:
    @staticmethod
    def get_viral_formats() -> List[StoryFormat]:
        """
        Returns a list of high-engagement video storytelling formats.
        These act as blueprints for the LLM to structure news into a script.
        """
        return [
            StoryFormat(
                id="hook_educate_twist",
                name="The Hook, Educate, Twist",
                description="Starts with a bold claim, educates on a trending topic, and twists into a brand value prop.",
                structure=[
                    "0-3s: Visual Hook + Controversial/Bold Claim",
                    "3-15s: Context & Education (The News)",
                    "15-25s: The Twist (Why this matters to the viewer's wallet)",
                    "25-30s: CTA"
                ]
            ),
            StoryFormat(
                id="relatable_struggle",
                name="The Relatable Struggle",
                description="Focuses on the pain points of buying tech, using news as proof.",
                structure=[
                    "0-5s: Act out a relatable frustration (e.g., looking at empty wallet)",
                    "5-20s: Introduce the news as validation of the struggle",
                    "20-30s: The Solution",
                    "30-40s: Proof/Trust factor & CTA"
                ]
            ),
            StoryFormat(
                id="product_teardown",
                name="The 3 Reasons Why (Teardown)",
                description="Fast-paced, listicle format that is highly favored by the algorithm.",
                structure=[
                    "0-2s: '3 Reasons Why [News Topic] Changes Everything'",
                    "2-10s: Reason 1 (The Tech)",
                    "10-18s: Reason 2 (The Impact)",
                    "18-25s: Reason 3",
                    "25-30s: Quick CTA"
                ]
            )
        ]

    @staticmethod
    def get_random_format() -> StoryFormat:
        formats = FormatService.get_viral_formats()
        return random.choice(formats)
