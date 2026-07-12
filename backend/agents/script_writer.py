"""
Script Writer Agent
Writes Hinglish scripts with hook, story, brand moment, CTA, and visual notes.
Can adapt to a user's writing style via style analysis.
"""

import logging
from typing import Optional

from agents.base_agent import BaseAgent
from config import load_voice_sample
from models import (
    ContentConcept,
    ContentFormat,
    GeneratedScript,
    ScriptSection,
    ScriptWriterOutput,
    StructureOption,
    StyleAnalysisResult,
)
from services.style_analyzer import analyze_style
from services.harbour_principles import WRITING_FRAGMENT, harbour_block
from services.voice_categories import MISDIRECTION_SKELETON, get_category_block

logger = logging.getLogger("wicked.agent.script_writer")


class ScriptWriterAgent(BaseAgent):
    agent_name = "Script Writer"
    agent_role = "Hinglish short-form script writer and creative director"

    def get_system_prompt(self, category: str = "") -> str:
        category_obj, category_block = get_category_block(category)
        # Reference-reel patterns only apply to the no-category fallback —
        # once a category is selected, its concept block is complete and
        # self-sufficient; layering in a reference reel's specific subject
        # matter (whatever brand/product that reel happened to be about)
        # risks bleeding into scripts for unrelated clients/keywords.
        reference_block = self._reference_profiles_block() if not category else ""
        humor_line = (
            "4. HUMOR IS MANDATORY IN THIS CATEGORY, NOT OPTIONAL:\n"
            "   Every script needs at least one moment that gets a real laugh or a\n"
            "   knowing smile — not just \"light and fun tone,\" an actual joke, bit,\n"
            "   or comedic turn a viewer would repeat to a friend. A script with no\n"
            "   real joke in it is not done, no matter how solid the rest of it is.\n"
            "   Toolkit:\n"
            "   - Observational: Point out things everyone notices but nobody says\n"
            "   - Self-deprecating: Make the narrator relatable through vulnerability\n"
            "   - Exaggeration: Take a real situation to absurd extremes\n"
            "   - Callback: Reference something from earlier in the script for a payoff\n"
            "   - Status humor: Play with social dynamics (flex culture, one-upmanship)\n"
            "   Never force a joke that undercuts the brand or feels mean-spirited —\n"
            "   the humor should make the audience like the narrator more, not wince."
            if category_obj and category_obj.get("humor_required")
            else "4. HUMOR: follow the selected category's own rule on this above — "
            "some categories forbid forcing a joke entirely; don't default to "
            "comedy out of habit."
        )
        brand_moment_rule = (
            "6. NO BRAND, NO PRODUCT — AND THAT'S FINE:\n"
            "   You have not been given any brand or product to work into this script,\n"
            "   deliberately. Do not invent one, do not guess one, do not write a generic\n"
            "   \"buy this\" CTA. Write the story purely as the concept/category above\n"
            "   demands, and let the CTA (if any) be a punchy closing line in the\n"
            "   story's own voice, not a product plug."
            if category
            else "6. CRITICAL RULES FOR THE BRAND MOMENT:\n"
            "   - The brand should enter the script like a friend's recommendation or a genuine plot twist, never like a TV commercial\n"
            "   - Two valid ways in: (a) the character/narrator casually reveals they use the brand, positioned as a smart insider move, or (b) the story swerves into the brand in a way that's flat-out unexpected or absurd — pick whichever the story actually earns, don't default to (a) out of habit\n"
            "   - The audience's reaction should be \"damn, that's actually smart\" OR \"wait, THAT'S what this was about?!\" — either is a win, but \"oh, this is an ad\" is the failure state"
        )

        return f"""You are Script Writer — the voice of WICKED. You write Hinglish scripts for Instagram Reels and YouTube Shorts that feel like they were written by a witty, relatable Indian creator — NOT an AI, NOT a marketing team.

YOUR MISSION: Turn content concepts into scroll-stopping, share-worthy scripts. Entertainment and story always come first.
{harbour_block(WRITING_FRAGMENT)}
{MISDIRECTION_SKELETON}

{category_block}
{reference_block}
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

3. PUNCHLINE PLACEMENT — THE MIDPOINT RULE:
   - Hook (0-2 sec): Pattern interrupt or bold claim, on a topic with ZERO
     apparent connection to a brand. This line should be QUOTABLE.
   - Build (5-20 sec): Escalate the SAME unrelated story/problem. Do not
     hint at any brand yet, even subtly — someone watching only up to
     here should have no idea where this is going.
   - Twist/Payoff (20-35 sec): This is where the misdirection breaks —
     hold it as close to the video's midpoint as the format allows, then
     land the payoff as an unexpected turn. It doesn't have to be a calm,
     tidy "natural" reveal — a flat-out absurd or surprising swerve is
     just as valid, as long as it still makes sense in hindsight. Never
     let this section start early "to be safe."
   - CTA (35-45 sec): A punchy, quotable closer in the story's own voice —
     never "buy now" or a product plug unless the story genuinely earned one.

{humor_line}

5. SPECIFICITY > GENERALITY:
   ❌ "Product bahut accha hai"
   ✅ "Performance itni solid hai ki subah 7 baje start kiya, raat ko 11 baje bhi chal raha hai — aur maine heavy use kiya hai"

{brand_moment_rule}

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

    @staticmethod
    def _reference_profiles_block() -> str:
        profiles = load_voice_sample().get("reference_profiles", [])
        if not profiles:
            return ""
        entries = "\n\n".join(
            f"### {p.get('name', '')}\n{p.get('analysis', '')}" for p in profiles
        )
        return f"""
=== REFERENCE PATTERNS (secondary — pacing/craft calibration only) ===
These are technique notes from real reels WICKED has studied, useful for
calibrating pacing, misdirection craft, and general execution quality.
They are NOT the concept to follow and NOT a plot/theme to borrow from —
the category block above governs the actual mechanic, and the concept/
structure given in the task below govern the actual subject matter. If a
reference pattern's specific theme or objects would pull the script away
from the given concept, ignore that theme and keep only the craft lesson.
{entries}
=== END REFERENCE PATTERNS ===
"""

    def run(
        self,
        concept: ContentConcept,
        style_reference: str = "",
        structure: Optional[StructureOption] = None,
        tone: str = "",
        category: str = "",
    ) -> ScriptWriterOutput:
        """
        Write a complete Hinglish script for a content concept.

        Args:
            concept: The content concept to script.
            style_reference: Optional text whose writing style to mimic.
            structure: Optional structure from Structural Designer (hook
                direction + beat outline) to follow.
            tone: Optional one-off tone override (e.g. "punchy",
                "story-driven", "educational") layered on top of the
                category rules.
            category: "satire" | "emotional" | "infographic" — selects the
                concept mechanic (EAAS/RWIT/WAAAAS) applied in the system
                prompt. Falls back to a neutral misdirection-only default
                when empty (e.g. the original 5-agent pipeline, which
                predates category selection).

        Returns:
            ScriptWriterOutput with the complete script.
        """
        self.logger.info("Writing script for concept: %s, category=%r", concept.title, category)

        tone_line = f"\nTone override for this script: {tone}." if tone else ""

        structure_section = ""
        if structure is not None:
            beats = "\n".join(f"  - {b}" for b in structure.beat_outline)
            structure_section = f"""
=== STRUCTURE TO FOLLOW (non-negotiable) ===
Hook Direction: {structure.hook_direction}
Beat Outline:
{beats}
Source: {structure.source_keyword}

Note: if the beat outline above reads like raw transcript sentences from
a remixed video rather than a designed hook/bridge, treat it as the STORY
SHAPE to reverse-engineer, not literal lines to paraphrase — identify
where in that source the reveal actually lands relative to its own
runtime and how it misdirects beforehand, then rebuild an equivalent arc
for THIS brand in the Hinglish voice below. Preserve the pattern, not the
wording.
=== END STRUCTURE ===
"""

        structure_block = f"""{structure_section}{tone_line}

=== OUTPUT CLEANLINESS (non-negotiable) ===
Plain, clean text only in every field — no markdown symbols anywhere (no
asterisks, no pound signs, no bullet dashes, no backticks). "dialogue" and
"full_script_text" must read as something a person would actually say out
loud, not a formatted document.
=== END OUTPUT CLEANLINESS ===
"""

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

        category_obj, _ = get_category_block(category)
        joke_remember_line = (
            "\n- Land a real joke somewhere in the script — not just a witty turn of "
            "phrase, an actual moment that would make someone laugh or grin. If nothing "
            "in the draft would do that, rewrite until something does."
            if category_obj and category_obj.get("humor_required")
            else ""
        )
        checklist_line = (
            f"\n- CATEGORY REQUIREMENT (mandatory, not optional flavor): {category_obj['task_checklist']}"
            if category_obj and category_obj.get("task_checklist")
            else ""
        )
        # Omit brand_angle entirely for category-driven generation — even
        # an empty "Brand Angle:" label nudges attention toward a brand
        # that deliberately isn't part of this prompt.
        brand_angle_line = "" if category else f"  Brand Angle: {concept.brand_angle}\n"

        prompt = f"""Write a complete Hinglish script for this content concept.
{structure_block}
CONCEPT:
  Title: {concept.title}
  Hook Line: {concept.hook}
  Summary: {concept.concept_summary}
  Framework: {concept.storytelling_framework}
{brand_angle_line}  Target Emotion: {concept.target_emotion}
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
      "section_name": "Twist / Payoff",
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
- The story's subject matter comes from the concept/structure above only. You have not been told what brand or product this is for — do not invent or guess one, and do not write in a device/technical/product-adjacent problem. It is completely fine, often preferable, for the script to never reference any brand, product, or company at all — do not manufacture a "brand moment" or CTA that plugs a product if the story doesn't naturally call for one.
- Include at least one quotable/meme-able line that people might use in their own conversations.{joke_remember_line}{checklist_line}"""

        try:
            if category:
                # Category-driven generation is deliberately brand-agnostic
                # — bypasses call_llm_json (which auto-appends the client's
                # full brand profile: tagline, USPs, tone, product
                # philosophy) so the story is never nudged toward this
                # client's product/category. The legacy no-category path
                # (original 5-agent pipeline) keeps brand context via
                # call_llm_json below, unchanged.
                result = self.llm.generate_json(
                    prompt=prompt, system_prompt=self.get_system_prompt(category), temperature=0.9
                )
            else:
                result = self.call_llm_json(
                    prompt, system_prompt=self.get_system_prompt(category), temperature=0.9
                )

            if isinstance(result, dict) and not result.get("parse_error"):
                sections = []
                for sec in result.get("sections", []):
                    sections.append(
                        ScriptSection(
                            section_name=sec.get("section_name", ""),
                            duration_seconds=str(sec.get("duration_seconds") or ""),
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
                    category=category,
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
                    category=category,
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
                category=category,
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
