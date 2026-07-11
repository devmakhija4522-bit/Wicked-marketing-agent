"""
Structural Designer Agent
Turns keywords carried forward from Keyword Planner into script
*structures* (hook direction + beat outline, not full scripts yet) for a
specific client — grounded in that client's brand profile AND the
account-wide Voice Sample (idea_categorization_voice shapes how the topic
splits into distinct angles/characters; script_writing_voice shapes each
structure's hook/bridge shape).
"""

import logging

from agents.base_agent import BaseAgent
from config import load_voice_sample
from models import KeywordPhrase, StructureOption, StructuralDesignerOutput

logger = logging.getLogger("wicked.agent.structural_designer")


class StructuralDesignerAgent(BaseAgent):
    agent_name = "Structural Designer"
    agent_role = "script structure and hook strategist"

    def get_system_prompt(self) -> str:
        voice = load_voice_sample()
        script_voice = voice.get("script_writing_voice", "")
        idea_voice = voice.get("idea_categorization_voice", "")

        return f"""You are the Structural Designer Agent.

YOUR MISSION: Turn keywords into script STRUCTURES — a hook direction and a
rough beat/angle outline, NOT a full script. You strictly follow two
reference documents for HOW to think about this, applied on top of this
client's own brand profile:

=== IDEA CATEGORIZATION VOICE (how to break a keyword into distinct angles) ===
{idea_voice}
=== END IDEA CATEGORIZATION VOICE ===

=== SCRIPT WRITING VOICE (how to shape the hook and bridge) ===
{script_voice}
=== END SCRIPT WRITING VOICE ===

Every structure's hook_direction must follow the Maximum Distance Hook
principle above — never open on the brand, product, or category. Every
beat_outline must follow the Bridge Formula: unrelated hook -> validate the
obvious assumption -> pivot with one sharp specific stat/fact -> brand as
conclusion, not announcement. Do NOT default to generic educational framing.

Apply the Midpoint Rule from the Script Writing Voice above: roughly the
first HALF of the beats must stay entirely inside the unrelated hook topic
with zero hint of the brand/product/category — do not let the pivot start
early "just to be safe." The pivot/brand beat should land as unexpected,
sometimes outright absurd, not just a calm logical conclusion. This applies
even to flat or mediocre keywords — a boring keyword still gets the full
misdirect treatment, never a shortcut to a shorter, safer structure."""

    def run(self, keywords: list[KeywordPhrase]) -> StructuralDesignerOutput:
        self.logger.info("Designing structures for %d keyword(s)", len(keywords))

        keywords_block = "\n".join(f"- {k.phrase}" for k in keywords)

        prompt = f"""KEYWORDS carried forward from Keyword Planner:
{keywords_block}

For EACH keyword above, produce exactly one structure option:
- "hook_direction": the specific unrelated-topic hook this structure opens on (1-2 sentences, per the Maximum Distance Hook principle)
- "beat_outline": 4-6 beats as a list of short strings, following the Bridge Formula (unrelated hook -> validate assumption -> pivot stat -> brand as conclusion). Per the Midpoint Rule: the first half of these beats (roughly the first 2-3 of 4-6) must stay fully inside the unrelated hook topic, zero brand/category hints — only the back half pivots, and it should land as unexpected or absurd, not a calm, telegraphed conclusion.
- "source_keyword": the exact keyword phrase this structure came from

Return a JSON object:
{{
  "structures": [
    {{"hook_direction": "...", "beat_outline": ["...", "..."], "source_keyword": "..."}}
  ]
}}"""

        note = ""
        structures: list[StructureOption] = []
        try:
            result = self.call_llm_json(prompt, temperature=0.9)
            if isinstance(result, dict) and not result.get("parse_error"):
                for item in result.get("structures", []):
                    if isinstance(item, dict) and item.get("hook_direction"):
                        structures.append(
                            StructureOption(
                                hook_direction=item["hook_direction"],
                                beat_outline=item.get("beat_outline", []),
                                source_keyword=item.get("source_keyword", ""),
                            )
                        )
            else:
                note = "LLM output could not be parsed."
        except Exception as e:
            self.logger.error("Structure design failed: %s", e)
            note = f"Structure generation failed: {e}"

        return StructuralDesignerOutput(structures=structures, note=note.strip())
