"""
Structural Designer Agent
Turns keywords carried forward from Keyword Planner into script
*structures* (hook direction + beat outline, not full scripts yet),
driven entirely by a required Voice Sample category (Satire/EAAS,
Emotional/RWIT, or Infographic/WAAAAS — see services/voice_categories.py).

Deliberately brand-agnostic: bypasses BaseAgent's automatic brand-context
injection (self.llm.generate_json directly, not call_llm_json) so the
client's product/category never shapes the story — the client only
matters for where the resulting structure gets saved, not what it's
about.
"""

import logging

from agents.base_agent import BaseAgent
from config import load_voice_sample
from models import KeywordPhrase, StructureOption, StructuralDesignerOutput
from services.voice_categories import MISDIRECTION_SKELETON, get_category_block

logger = logging.getLogger("wicked.agent.structural_designer")

# How a keyword splits into distinct, specific angles/characters — true
# regardless of which of the 3 categories is selected, so it lives here
# as a fixed mechanic rather than editable per-category text.
ARCHETYPE_SKELETON = """=== HOW TO SPLIT A KEYWORD INTO DISTINCT ANGLES ===
When a keyword implies multiple possible angles or characters (e.g. "types
of X"), build specific, exaggerated, NAMED archetypes — the kind where
someone reacts with "oh my god that's my cousin" off a single label alone
— never generic buckets like "Student, Professional, Creator, Parent."

Each angle should stack at least two specificity layers together (e.g.
behavior + aesthetic, or life-stage + generation marker, or job +
attitude) — one layer alone reads generic, two or more reads like a real
person. Angles must be behavior/aesthetic-based, never based on protected
characteristics. A time/generation marker ("in 2026," "post-appraisal
season") sharpens an angle instantly.
=== END ARCHETYPE SKELETON ==="""


class StructuralDesignerAgent(BaseAgent):
    agent_name = "Structural Designer"
    agent_role = "script structure and hook strategist"

    def get_system_prompt(self, category: str = "") -> str:
        _, category_block = get_category_block(category)
        # Reference-reel patterns are only useful when there's no category
        # mechanic to drive the structure (the DEFAULT_BLOCK fallback path).
        # Once a category is selected, its concept block is the complete,
        # self-sufficient creative direction — injecting reference reels on
        # top risks their specific subject matter (whatever brand/product
        # that reel happened to be about) bleeding into an unrelated
        # client's script, which defeats the point of a fresh keyword.
        reference_block = self._reference_profiles_block() if not category else ""

        return f"""You are the Structural Designer Agent.

YOUR MISSION: Turn keywords into script STRUCTURES — a hook direction and a
rough beat/angle outline, NOT a full script. You have NOT been told what
brand or product this is for, and that is deliberate — build the story
purely from the keyword and the category mechanic below.

{MISDIRECTION_SKELETON}

{ARCHETYPE_SKELETON}

{category_block}
{reference_block}
Every structure's hook_direction must follow the Maximum Distance Hook
principle above — never open on the brand, product, or category. Do NOT
default to generic educational framing. The pivot/brand beat should land
per the category's own reveal mechanic above — this applies even to flat
or mediocre keywords, never a shortcut to a shorter, safer structure."""

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
the category block above governs the actual mechanic, and the keyword(s)
given in the task below govern the actual subject matter. If a reference
pattern's specific theme or objects (e.g. a particular kind of collectible,
a particular kind of character) would pull the structure away from the
given keyword, ignore that theme and keep only the craft lesson.
{entries}
=== END REFERENCE PATTERNS ===
"""

    def run(self, keywords: list[KeywordPhrase], category: str = "") -> StructuralDesignerOutput:
        self.logger.info(
            "Designing structures for %d keyword(s), category=%r", len(keywords), category
        )

        keywords_block = "\n".join(f"- {k.phrase}" for k in keywords)
        category_obj, _ = get_category_block(category)
        joke_beat_note = (
            ' At least one beat must set up a real joke or comedic turn (not just a "fun '
            "tone\") — Script Writer will land it, but the structure has to leave room for it."
            if category_obj and category_obj.get("humor_required")
            else ""
        )
        checklist_note = (
            f"\n\nCATEGORY REQUIREMENT (mandatory, not optional flavor): {category_obj['task_checklist']}"
            if category_obj and category_obj.get("task_checklist")
            else ""
        )

        prompt = f"""KEYWORDS carried forward from Keyword Planner:
{keywords_block}

For EACH keyword above, produce exactly one structure option:
- "hook_direction": the specific unrelated-topic hook this structure opens on (1-2 sentences, per the Maximum Distance Hook principle)
- "beat_outline": 4-6 beats as a list of short strings, following the selected category's reveal mechanic above. Per the Midpoint Rule: the first half of these beats (roughly the first 2-3 of 4-6) must stay fully inside the unrelated hook topic, zero brand/category hints — only the back half pivots. The story's subject matter must come from the keyword above, never from this client's product/industry — do not insert a problem related to what this client sells just because it exists in their brand profile.{joke_beat_note}
- "source_keyword": the exact keyword phrase this structure came from{checklist_note}

Return a JSON object:
{{
  "structures": [
    {{"hook_direction": "...", "beat_outline": ["...", "..."], "source_keyword": "..."}}
  ]
}}"""

        note = ""
        structures: list[StructureOption] = []
        try:
            # Deliberately bypasses call_llm_json (which auto-appends the
            # client's full brand profile — tagline, USPs, tone, product
            # philosophy) so the story stays entirely keyword-driven, never
            # nudged toward this client's product/category. This is a
            # keyword -> structure agent, not a brand-voice agent.
            result = self.llm.generate_json(
                prompt=prompt, system_prompt=self.get_system_prompt(category), temperature=0.9
            )
            if isinstance(result, dict) and not result.get("parse_error"):
                for item in result.get("structures", []):
                    if isinstance(item, dict) and item.get("hook_direction"):
                        structures.append(
                            StructureOption(
                                hook_direction=item["hook_direction"],
                                beat_outline=item.get("beat_outline", []),
                                source_keyword=item.get("source_keyword", ""),
                                category=category,
                            )
                        )
            else:
                note = "LLM output could not be parsed."
        except Exception as e:
            self.logger.error("Structure design failed: %s", e)
            note = f"Structure generation failed: {e}"

        return StructuralDesignerOutput(structures=structures, note=note.strip())
