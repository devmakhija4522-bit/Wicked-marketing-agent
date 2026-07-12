"""
Reference Reel Analyzer
Transcribes a single user-provided reel/video and distills its narrative
pattern (hook style, misdirection technique, reveal timing, tone) into a
short technique analysis. The user reviews it and, on approval, it's
saved as a named profile ("Wicked VC1", "Wicked VC2", ...) that
accumulates into the account-wide Voice Sample rather than overwriting
previous ones.

Brand-agnostic by design: this feeds the account-wide Voice Sample, not a
specific client's content, so it bypasses BaseAgent's automatic brand
context injection and calls self.llm directly instead of call_llm_json.
"""

import logging

from agents.base_agent import BaseAgent
from config import load_voice_sample
from services.media_transcriber import transcribe_url, TranscriptionError

logger = logging.getLogger("wicked.agent.reference_analyzer")

SYSTEM_PROMPT = """You are a narrative-structure analyst for short-form video ads.

You will be given the transcript of one reference reel the user picked
specifically because they like how the story is told. Identify the
pattern: where and how it hooks the viewer, roughly what percentage of
the runtime it holds genuine ambiguity about what it's even about, what
technique it uses to misdirect (an unrelated story, a question, a bold
claim), and how/where the actual subject or brand lands — a calm logical
reveal or an unexpected/absurd swerve?

CRITICAL: Describe the PATTERN AND TECHNIQUE in your own analytical
words, as a creative director briefing a writer. Do not quote or
reproduce more than a few words of dialogue at a time from the
transcript, and never reproduce a full line, sentence, or verse
verbatim — this is structural analysis, not transcription."""


class ReferenceAnalyzerAgent(BaseAgent):
    agent_name = "Reference Analyzer"
    agent_role = "narrative pattern analyst"

    def get_system_prompt(self) -> str:
        return SYSTEM_PROMPT

    def analyze(self, video_url: str) -> dict:
        url = video_url.strip()
        suggested_name = self._next_name()

        try:
            data = transcribe_url(url)
        except TranscriptionError as e:
            self.logger.warning("Transcription failed for %s: %s", url, e)
            return self._result(url, note=f"Could not transcribe: {e}", suggested_name=suggested_name)
        except Exception as e:
            self.logger.error("Unexpected error transcribing %s: %s", url, e)
            return self._result(url, note=f"Unexpected error: {e}", suggested_name=suggested_name)

        transcript = (data.get("transcript") or "").strip()
        platform = data.get("platform", "unknown")
        duration = data.get("estimated_duration_seconds")

        if not transcript:
            return self._result(
                url,
                platform=platform,
                duration_seconds=duration,
                note=data.get("summary") or "No speech detected in this clip.",
                suggested_name=suggested_name,
            )

        prompt = f"""Here is the transcript of one reference reel (~{duration}s, {platform}):

{transcript}

Return a JSON object:
{{
  "pattern_analysis": "2-4 paragraphs of prose analysis, structural and technique-focused, written the way a creative director would brief a writer — not a transcript summary and not a scene-by-scene recap."
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

        return self._result(
            url,
            platform=platform,
            transcribed=True,
            duration_seconds=duration,
            note=note,
            pattern_analysis=analysis,
            suggested_name=suggested_name,
        )

    @staticmethod
    def _result(
        url: str,
        platform: str = "unknown",
        transcribed: bool = False,
        duration_seconds=None,
        note: str = "",
        pattern_analysis: str = "",
        suggested_name: str = "",
    ) -> dict:
        return {
            "url": url,
            "platform": platform,
            "transcribed": transcribed,
            "duration_seconds": duration_seconds,
            "note": note,
            "pattern_analysis": pattern_analysis,
            "suggested_name": suggested_name,
        }

    @staticmethod
    def _next_name() -> str:
        profiles = load_voice_sample().get("reference_profiles", [])
        return f"Wicked VC{len(profiles) + 1}"
