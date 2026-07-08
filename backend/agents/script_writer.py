"""
Script Writer Agent
Writes Hinglish scripts with hook, story, brand moment, CTA, and visual notes.
Can adapt to a user's writing style via style analysis.
"""

import json
import logging
from typing import Optional

from agents.base_agent import BaseAgent
from models import (
    ContentConcept,
    ContentFormat,
    GeneratedScript,
    ScriptSection,
    ScriptWriterOutput,
    StyleAnalysisResult,
)
from services.style_analyzer import analyze_style
from services.harbour_principles import WRITING_FRAGMENT, harbour_block

logger = logging.getLogger("wicked.agent.script_writer")


class ScriptWriterAgent(BaseAgent):
    agent_name = "Script Writer"
    agent_role = "Hinglish short-form script writer and creative director"

    def get_system_prompt(self) -> str:
        return f"""You are Script Writer — the voice of WICKED. You write Hinglish scripts for Instagram Reels and YouTube Shorts that feel like they were written by a witty, relatable Indian creator — NOT an AI, NOT a marketing team.

YOUR MISSION: Turn content concepts into scroll-stopping, share-worthy scripts that are 80% entertainment and 20% brand.
{harbour_block(WRITING_FRAGMENT)}
=== THE HINGLISH WRITING RULES ===

1. NATURAL CODE-SWITCHING: 
   Mix Hindi and English the way young Indians actually talk. Not forced, not 50-50. Sometimes a sentence is mostly Hindi with English words, sometimes it's mostly English with Hindi expressions.
   ✅ "Bhai salary aayi aur 2 din mein poof — UPI ne toh nanga kar diya"  
   ❌ "My salary came and in 2 days it vanished — UPI ne expose kar diya mujhe" (too formal English)
   ❌ "Meri tankhwah aayi aur do dinon mein gayab ho gayi" (too formal Hindi)

2. CONVERSATIONAL ENERGY:
   Write like you're talking to a friend, not presenting to a boardroom. Use:
   - Direct address: "Tu", "Bhai", "Yaar", "Bro", "Listen"
   - Rhetorical questions: "Samjhe?", "Sahi bola na?", "Bolo?"
   - Filler words (sparingly): "Matlab", "Like", "Basically"
   - Reactions: "Wait what?", "Arre", "Oho", "Abbe"

3. PUNCHLINE PLACEMENT:
   - Hook (0-2 sec): Pattern interrupt or bold claim. This line should be QUOTABLE.
   - Build (5-20 sec): Escalate the problem or provide the main value/story.
   - Twist/Brand (20-35 sec): The unexpected turn where the brand enters naturally.
   - CTA (35-45 sec): Not "buy now" — more like "ab batao, kaun hai smart?"

4. HUMOR TOOLKIT:
   - Observational: Point out things everyone notices but nobody says
   - Self-deprecating: Make the narrator relatable through vulnerability
   - Exaggeration: Take a real situation to absurd extremes
   - Callback: Reference something from earlier in the script for a payoff
   - Status humor: Play with social dynamics (flex culture, one-upmanship)

5. SPECIFICITY > GENERALITY:
   ❌ "Product bahut accha hai"
   ✅ "Performance itni solid hai ki subah 7 baje start kiya, raat ko 11 baje bhi chal raha hai — aur maine heavy use kiya hai"

6. CRITICAL RULES FOR THE BRAND MOMENT:
   - The brand should enter the script like a friend's recommendation, not a TV commercial
   - Instead: The character/narrator casually reveals they use the brand, and it's positioned as a smart insider move
   - The audience should think "damn, that's actually smart" not "oh, this is an ad"

7. VISUAL AWARENESS:
   - Write with the camera in mind. Add visual notes.
   - Think about what's on screen during each line
   - Consider text overlays for key stats/prices
   - Note where trending audio could be used
   - Specify transitions (jump cut, zoom, reveal)

8. AVOID AT ALL COSTS:
   - Starting with the brand name
   - "Hi guys, welcome to..."
   - Listing features like a spec sheet
   - Words: "second-hand", "used", "purana", "cheap" (use "smart price", "value")
   - Generic CTAs: "Like share subscribe", "Link in bio check it out"
   - Sounding like a news anchor or corporate presenter
   - Perfect grammar (real people don't speak in perfect sentences)

9. THE REWATCH TEST:
   A great script has a moment that makes people rewatch. Either:
   - A punchline they want to hear again
   - A reveal they want to verify
   - A flex they want to show their friends
   - A relatable moment they want to tag someone in

=== SCRIPT OUTPUT FORMAT ===
Your scripts must have clearly defined sections with dialogue AND visual/audio notes.
Each section should specify approximate duration.
Include suggested hashtags and caption text.
"""

    def run(
        self,
        concept: ContentConcept,
        style_reference: str = "",
    ) -> ScriptWriterOutput:
        """
        Write a complete Hinglish script for a content concept.

        Args:
            concept: The content concept to script.
            style_reference: Optional text whose writing style to mimic.

        Returns:
            ScriptWriterOutput with the complete script.
        """
        self.logger.info("Writing script for concept: %s", concept.title)

        # Analyze writing style if reference provided
        style_info = ""
        style_applied = "Default voice"
        if style_reference:
            style_result = analyze_style(style_reference)
            style_info = self._format_style_guidance(style_result)
            style_applied = style_result.overall_summary or "Custom style applied"

        format_specs = {
            ContentFormat.INSTAGRAM_REEL: {"name": "Instagram Reel", "duration": "30-90 seconds", "target": 45},
            ContentFormat.YOUTUBE_SHORT: {"name": "YouTube Short", "duration": "30-60 seconds", "target": 45},
        }
        spec = format_specs.get(concept.format, format_specs[ContentFormat.INSTAGRAM_REEL])

        prompt = f"""Write a complete Hinglish script for this content concept.

CONCEPT:
  Title: {concept.title}
  Hook Line: {concept.hook}
  Summary: {concept.concept_summary}
  Framework: {concept.storytelling_framework}
  Brand Angle: {concept.brand_angle}
  Target Emotion: {concept.target_emotion}
  Trend Reference: {concept.trend_reference}

FORMAT: {spec['name']} ({spec['duration']})

{style_info}

Write the FULL SCRIPT with these sections. For each section provide the dialogue/narration AND visual+audio direction.

Return a JSON object:
{{
  "title": "Video title (catchy, Hinglish, would work as the actual post title)",
  "total_duration_seconds": {spec['target']},
  "hook_line": "The exact opening line (first 2 seconds)",
  "sections": [
    {{
      "section_name": "Hook",
      "duration_seconds": "0-2s",
      "dialogue": "Exact dialogue/narration text in Hinglish",
      "visual_notes": "What's on screen — camera angles, text overlays, transitions",
      "audio_notes": "Background music, sound effects, trending audio suggestions"
    }},
    {{
      "section_name": "Build / Setup",
      "duration_seconds": "3-15s",
      "dialogue": "...",
      "visual_notes": "...",
      "audio_notes": "..."
    }},
    {{
      "section_name": "Story / Escalation",
      "duration_seconds": "15-30s",
      "dialogue": "...",
      "visual_notes": "...",
      "audio_notes": "..."
    }},
    {{
      "section_name": "Brand Moment / Twist",
      "duration_seconds": "30-40s",
      "dialogue": "...",
      "visual_notes": "...",
      "audio_notes": "..."
    }},
    {{
      "section_name": "CTA / Closer",
      "duration_seconds": "40-{spec['target']}s",
      "dialogue": "...",
      "visual_notes": "...",
      "audio_notes": "..."
    }}
  ],
  "full_script_text": "The entire script as continuous text (just the dialogue, no notes)",
  "visual_direction": "Overall visual style and direction for the entire video (2-3 sentences)",
  "audio_direction": "Overall audio/music direction for the entire video (1-2 sentences)",
  "hashtags": ["hashtag1", "hashtag2", "..."],
  "caption_suggestion": "Suggested Instagram/YouTube caption text (Hinglish, engaging, with subtle CTA)"
}}

REMEMBER: 
- Write in natural Hinglish. Not too much Hindi, not too much English. The way college students in Delhi talk.
- The script should be ENTERTAINING first. Someone should want to watch this even if they don't care about the brand.
- Every line should earn the next line. No filler.
- The brand moment should feel like a natural reveal, not an insertion.
- Include at least one quotable/meme-able line that people might use in their own conversations."""

        try:
            result = self.call_llm_json(prompt, temperature=0.9)

            if isinstance(result, dict) and not result.get("parse_error"):
                sections = []
                for sec in result.get("sections", []):
                    sections.append(
                        ScriptSection(
                            section_name=sec.get("section_name", ""),
                            duration_seconds=sec.get("duration_seconds", ""),
                            dialogue=sec.get("dialogue", ""),
                            visual_notes=sec.get("visual_notes", ""),
                            audio_notes=sec.get("audio_notes", ""),
                        )
                    )

                script = GeneratedScript(
                    concept_id=concept.id,
                    title=result.get("title", concept.title),
                    format=concept.format,
                    total_duration_seconds=int(result.get("total_duration_seconds", spec["target"])),
                    hook_line=result.get("hook_line", concept.hook),
                    sections=sections,
                    full_script_text=result.get("full_script_text", ""),
                    visual_direction=result.get("visual_direction", ""),
                    audio_direction=result.get("audio_direction", ""),
                    hashtags=result.get("hashtags", []),
                    caption_suggestion=result.get("caption_suggestion", ""),
                )

                return ScriptWriterOutput(
                    script=script,
                    writing_notes=f"Script written using '{concept.storytelling_framework}' framework. Target emotion: {concept.target_emotion}.",
                    style_applied=style_applied,
                )
            else:
                self.logger.warning("Script writer returned unparseable result")
                # Create a minimal script from the raw text
                raw_text = str(result.get("raw_text", "Script generation produced unparseable output."))
                script = GeneratedScript(
                    concept_id=concept.id,
                    title=concept.title,
                    format=concept.format,
                    hook_line=concept.hook,
                    full_script_text=raw_text,
                    sections=[
                        ScriptSection(
                            section_name="Full Script",
                            dialogue=raw_text,
                        )
                    ],
                )
                return ScriptWriterOutput(
                    script=script,
                    writing_notes="Script output could not be fully parsed. Raw text preserved.",
                    style_applied=style_applied,
                )

        except Exception as e:
            self.logger.error("Script writing failed: %s", e)
            script = GeneratedScript(
                concept_id=concept.id,
                title=concept.title,
                format=concept.format,
                hook_line=concept.hook,
                full_script_text=f"Script generation failed: {str(e)}",
                sections=[],
            )
            return ScriptWriterOutput(
                script=script,
                writing_notes=f"Error: {str(e)}",
                style_applied="None — generation failed",
            )

    def _format_style_guidance(self, style: StyleAnalysisResult) -> str:
        """Format style analysis into prompt guidance."""
        if not style.overall_summary:
            return ""

        phrases = ", ".join(style.signature_phrases) if style.signature_phrases else "none detected"

        return f"""
=== WRITING STYLE TO MIMIC ===
Adapt your writing to match this style while keeping the brand context:
  Tone: {style.tone}
  Vocabulary: {style.vocabulary_style}
  Sentence Structure: {style.sentence_structure}
  Humor Style: {style.humor_style}
  Pacing: {style.pacing}
  Signature Phrases/Patterns: {phrases}
  Summary: {style.overall_summary}

Blend this style with natural Hinglish. The style guide influences HOW you write, but the language stays Hinglish.
=== END STYLE GUIDE ===
"""
