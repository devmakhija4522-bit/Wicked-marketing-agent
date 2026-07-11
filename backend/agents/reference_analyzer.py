"""
Reference Reel Analyzer
Transcribes a batch of user-provided reels/videos and distills the shared
narrative pattern across them (hook style, misdirection technique, reveal
timing, tone) into a Voice Sample section — so future Structural Designer
and Script Writer output can be steered by real examples the user finds
compelling, not just hand-written guidance.

Brand-agnostic by design: this feeds the account-wide Voice Sample, not a
specific client's content, so it bypasses BaseAgent's automatic brand
context injection and calls self.llm directly instead of call_llm_json.
"""

import logging

from agents.base_agent import BaseAgent
from config import load_voice_sample
from models import ReferenceReelSummary
from services.media_transcriber import transcribe_url, TranscriptionError

logger = logging.getLogger("wicked.agent.reference_analyzer")

SECTION_HEADING = "## Reference Reel Analysis (learned from pasted examples)"

SYSTEM_PROMPT = """You are a narrative-structure analyst for short-form video ads.

You will be given transcripts of several reference reels the user picked
specifically because they like how the story is told. Your job is to find
the SHARED pattern across them — not to summarize each video individually.

Study: where and how each video hooks the viewer, roughly what percentage
of the runtime it holds genuine ambiguity about what it's even about,
what technique it uses to misdirect (an unrelated story, a question, a
bold claim), and how/where the actual subject or brand lands — is it a
calm logical reveal or an unexpected/absurd swerve?

CRITICAL: Describe the PATTERN AND TECHNIQUE in your own analytical
words, as a creative director briefing a writer. Do not quote or
reproduce more than a few words of dialogue at a time from any
transcript, and never reproduce a full line, sentence, or verse
verbatim — this is structural analysis, not transcription."""


class ReferenceAnalyzerAgent(BaseAgent):
    agent_name = "Reference Analyzer"
    agent_role = "narrative pattern analyst"

    def get_system_prompt(self) -> str:
        return SYSTEM_PROMPT

    def run(self, video_urls: list[str]) -> dict:
        videos: list[ReferenceReelSummary] = []
        transcripts_for_analysis: list[str] = []

        for raw_url in video_urls:
            url = raw_url.strip()
            if not url:
                continue
            try:
                data = transcribe_url(url)
            except TranscriptionError as e:
                self.logger.warning("Transcription failed for %s: %s", url, e)
                videos.append(ReferenceReelSummary(url=url, note=f"Could not transcribe: {e}"))
                continue
            except Exception as e:
                self.logger.error("Unexpected error transcribing %s: %s", url, e)
                videos.append(ReferenceReelSummary(url=url, note=f"Unexpected error: {e}"))
                continue

            transcript = (data.get("transcript") or "").strip()
            platform = data.get("platform", "unknown")
            duration = data.get("estimated_duration_seconds")

            if transcript:
                videos.append(
                    ReferenceReelSummary(
                        url=url,
                        platform=platform,
                        transcribed=True,
                        duration_seconds=duration,
                        note=data.get("summary", ""),
                    )
                )
                transcripts_for_analysis.append(f"--- Video ({platform}, ~{duration}s) ---\n{transcript}")
            else:
                videos.append(
                    ReferenceReelSummary(
                        url=url,
                        platform=platform,
                        transcribed=False,
                        duration_seconds=duration,
                        note=data.get("summary") or "No speech detected in this clip.",
                    )
                )

        existing_voice = load_voice_sample().get("script_writing_voice", "")

        if not transcripts_for_analysis:
            return {
                "videos": [v.model_dump() for v in videos],
                "pattern_analysis": "",
                "updated_script_writing_voice": existing_voice,
                "note": "No transcribable videos — nothing to analyze.",
            }

        joined = "\n\n".join(transcripts_for_analysis)
        prompt = f"""Here are transcripts from {len(transcripts_for_analysis)} reference reel(s):

{joined}

Write the shared-pattern analysis as described in your instructions. If
only one video was provided, analyze its pattern alone rather than
looking for a "shared" pattern across videos.

Return a JSON object:
{{
  "pattern_analysis": "3-6 paragraphs of prose analysis, structural and technique-focused, written the way a creative director would brief a writer — not a transcript summary and not a scene-by-scene recap."
}}"""

        analysis = ""
        note = ""
        try:
            result = self.llm.generate_json(prompt=prompt, system_prompt=SYSTEM_PROMPT, temperature=0.7)
            if isinstance(result, dict) and not result.get("parse_error"):
                analysis = str(result.get("pattern_analysis", "")).strip()
            else:
                note = "Analysis output could not be parsed."
        except Exception as e:
            self.logger.error("Reference analysis failed: %s", e)
            note = f"Analysis failed: {e}"

        merged_voice = self._merge_section(existing_voice, analysis) if analysis else existing_voice

        return {
            "videos": [v.model_dump() for v in videos],
            "pattern_analysis": analysis,
            "updated_script_writing_voice": merged_voice,
            "note": note,
        }

    @staticmethod
    def _merge_section(existing_voice: str, analysis: str) -> str:
        """Replace a previous '## Reference Reel Analysis' section if
        present, otherwise append a new one — so re-running this doesn't
        pile up duplicate sections over time."""
        new_section = f"{SECTION_HEADING}\n\n{analysis}\n"

        if SECTION_HEADING in existing_voice:
            before, _, rest = existing_voice.partition(SECTION_HEADING)
            _, sep, after = rest.partition("\n---\n")
            if sep:
                return f"{before}{new_section}\n---\n{after}"
            return f"{before}{new_section}"

        return f"{existing_voice.rstrip()}\n\n---\n\n{new_section}"
