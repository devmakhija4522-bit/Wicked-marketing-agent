"""
Brand Guardian Agent
Reviews scripts for brand alignment, flags issues, gives a 0-100 score,
and optionally provides a revised script.
"""

import json
import logging
from typing import Optional

from agents.base_agent import BaseAgent
from models import (
    BrandGuardianOutput,
    BrandIssue,
    GeneratedScript,
    ScriptSection,
    ScriptWriterOutput,
)
from services.harbour_principles import CRITIQUE_FRAGMENT, harbour_block

logger = logging.getLogger("wicked.agent.brand_guardian")


class BrandGuardianAgent(BaseAgent):
    agent_name = "Brand Guardian"
    agent_role = "brand safety reviewer and quality gatekeeper"

    def get_system_prompt(self) -> str:
        return f"""You are the Brand Guardian. Your job is to review a short-form video script and ensure it aligns perfectly with the brand's voice and guidelines.

YOUR MISSION: Review scripts for brand alignment, quality, and safety. You protect the brand's reputation while ensuring content stays creative and engaging.
{harbour_block(CRITIQUE_FRAGMENT)}
HOW YOU EVALUATE:
You grade scripts on 4 dimensions, scoring out of 100 total points.

1. BRAND VOICE (25 points):
   - Does it sound like the brand?
   - Is it too corporate or boring?

2. STORYTELLING QUALITY (25 points):
   - Is there a clear narrative arc?
   - Is the brand moment natural and not overly promotional?
   - Would someone watch this?
   - Is there a rewatchable/shareable moment?

3. BRAND SAFETY (25 points):
   - Are all claims accurate? (prices, quality checks, warranty, IMEI verification)
   - Does it avoid negative comparisons with competitors?
   - No religious, political, or socially sensitive content?
   - No promises the brand can't keep?
   - No language that could be misinterpreted or offensive?
   - Doesn't use someone else's copyrighted content/dialogue?

4. EFFECTIVENESS (25 points):
   - Will this actually reach and engage the target audience?
   - Is the CTA motivating without being pushy?
   - Does the content format match the platform requirements?
   - Are the visual/audio notes production-ready?
   - Is the total duration appropriate for the format?

=== SEVERITY LEVELS FOR ISSUES ===
- CRITICAL: Must fix before publishing. Brand safety risk, factual error, or deeply off-brand tone.
- HIGH: Strongly recommended fix. Significant quality or brand alignment issue.
- MEDIUM: Suggested improvement. Would make the content noticeably better.
- LOW: Minor polish. Nice-to-have improvement.

=== YOUR PERSONALITY ===
You are firm but fair. You appreciate good creative work and call it out. You're specific about problems AND solutions. You don't just say "this is off-brand" — you say WHY and suggest a FIX.

You understand that great content takes risks. You don't penalize for being edgy or unconventional — you penalize for being off-brand, unsafe, or lazy.

A score of 80+ means "good to publish." 60-79 means "needs revisions." Below 60 means "rethink the approach."

If the script has critical issues, provide a revised version that fixes them while preserving the creative intent."""

    def run(self, script_output: ScriptWriterOutput) -> BrandGuardianOutput:
        """
        Review a script for brand alignment and quality.

        Args:
            script_output: Output from the Script Writer agent.

        Returns:
            BrandGuardianOutput with score, issues, and optional revision.
        """
        script = script_output.script
        self.logger.info("Reviewing script: %s", script.title)

        # Format script for review
        script_text = self._format_script_for_review(script)

        prompt = f"""Review this script for {self.brand_profile.get('brand_name', 'the brand')}'s short-form video.

SCRIPT TO REVIEW:
{script_text}

WRITING NOTES: {script_output.writing_notes}
STYLE APPLIED: {script_output.style_applied}

Review this script across all 4 dimensions (Brand Voice, Storytelling, Brand Safety, Effectiveness — 25 points each, 100 total).

Return a JSON object:
{{
  "approved": true/false (true if score >= 80 and no critical issues),
  "overall_score": 0-100,
  "issues": [
    {{
      "severity": "critical|high|medium|low",
      "category": "brand_voice|storytelling|brand_safety|effectiveness",
      "description": "What the issue is (be specific, quote the problematic part)",
      "location_in_script": "Which section/line has the issue",
      "suggestion": "Specific suggestion to fix this issue"
    }}
  ],
  "praise": [
    "What the script does WELL — be specific. Call out great hooks, clever brand integration, good humor, etc."
  ],
  "needs_revision": true/false (true if there are critical or high-severity issues),
  "review_summary": "2-3 sentence overall assessment — be honest and constructive"
}}

If needs_revision is true, ALSO include a "revised_script" field with the corrected script:
{{
  "revised_script": {{
    "title": "...",
    "total_duration_seconds": ...,
    "hook_line": "...",
    "sections": [
      {{
        "section_name": "...",
        "duration_seconds": "...",
        "dialogue": "...",
        "visual_notes": "...",
        "audio_notes": "..."
      }}
    ],
    "full_script_text": "...",
    "visual_direction": "...",
    "audio_direction": "...",
    "hashtags": ["..."],
    "caption_suggestion": "..."
  }}
}}

Be thorough but fair. Great content takes creative risks — don't punish that. Punish lazy writing, factual errors, and off-brand moments."""

        try:
            result = self.call_llm_json(prompt, temperature=0.4)

            if isinstance(result, dict) and not result.get("parse_error"):
                issues = []
                for issue in result.get("issues", []):
                    issues.append(
                        BrandIssue(
                            severity=issue.get("severity", "low"),
                            category=issue.get("category", ""),
                            description=issue.get("description", ""),
                            location_in_script=issue.get("location_in_script", ""),
                            suggestion=issue.get("suggestion", ""),
                        )
                    )

                # Build revised script if provided
                revised_script = None
                rev = result.get("revised_script")
                if result.get("needs_revision") and rev:
                    revised_sections = []
                    for sec in rev.get("sections", []):
                        revised_sections.append(
                            ScriptSection(
                                section_name=sec.get("section_name", ""),
                                duration_seconds=str(sec.get("duration_seconds") or ""),
                                dialogue=sec.get("dialogue", ""),
                                visual_notes=sec.get("visual_notes", ""),
                                audio_notes=sec.get("audio_notes", ""),
                            )
                        )
                    revised_script = GeneratedScript(
                        concept_id=script.concept_id,
                        title=rev.get("title", script.title),
                        format=script.format,
                        total_duration_seconds=int(rev.get("total_duration_seconds", script.total_duration_seconds)),
                        hook_line=rev.get("hook_line", script.hook_line),
                        sections=revised_sections,
                        full_script_text=rev.get("full_script_text", ""),
                        visual_direction=rev.get("visual_direction", ""),
                        audio_direction=rev.get("audio_direction", ""),
                        hashtags=rev.get("hashtags", script.hashtags),
                        caption_suggestion=rev.get("caption_suggestion", ""),
                    )

                return BrandGuardianOutput(
                    approved=result.get("approved", False),
                    overall_score=min(100.0, max(0.0, float(result.get("overall_score", 0)))),
                    issues=issues,
                    praise=result.get("praise", []),
                    revised_script=revised_script,
                    review_summary=result.get("review_summary", ""),
                )
            else:
                self.logger.warning("Brand review returned unparseable result")
                return BrandGuardianOutput(
                    approved=False,
                    overall_score=0,
                    issues=[
                        BrandIssue(
                            severity="critical",
                            category="system",
                            description="Could not parse brand review output.",
                            suggestion="Retry the review.",
                        )
                    ],
                    review_summary="Review failed to parse. Please retry.",
                )

        except Exception as e:
            self.logger.error("Brand review failed: %s", e)
            return BrandGuardianOutput(
                approved=False,
                overall_score=0,
                issues=[
                    BrandIssue(
                        severity="critical",
                        category="system",
                        description=f"Review failed: {str(e)}",
                        suggestion="Check LLM service and retry.",
                    )
                ],
                review_summary=f"Review failed with error: {str(e)}",
            )

    def _format_script_for_review(self, script: GeneratedScript) -> str:
        """Format a script into readable text for the review prompt."""
        lines = [
            f"TITLE: {script.title}",
            f"FORMAT: {script.format.value}",
            f"DURATION: {script.total_duration_seconds}s",
            f"HOOK LINE: {script.hook_line}",
            "",
        ]

        for i, section in enumerate(script.sections, 1):
            lines.append(f"--- Section {i}: {section.section_name} ({section.duration_seconds}) ---")
            lines.append(f"DIALOGUE: {section.dialogue}")
            if section.visual_notes:
                lines.append(f"VISUAL: {section.visual_notes}")
            if section.audio_notes:
                lines.append(f"AUDIO: {section.audio_notes}")
            lines.append("")

        if script.full_script_text:
            lines.append(f"FULL SCRIPT TEXT:\n{script.full_script_text}")
        if script.visual_direction:
            lines.append(f"\nVISUAL DIRECTION: {script.visual_direction}")
        if script.audio_direction:
            lines.append(f"AUDIO DIRECTION: {script.audio_direction}")
        if script.hashtags:
            lines.append(f"HASHTAGS: {' '.join('#' + h for h in script.hashtags)}")
        if script.caption_suggestion:
            lines.append(f"CAPTION: {script.caption_suggestion}")

        return "\n".join(lines)
