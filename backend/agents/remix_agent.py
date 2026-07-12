"""
Remix Agent
Takes a pasted Instagram Reel / TikTok / YouTube link, transcribes it
(services/media_transcriber.py), and hands the transcript to the same
ScriptWriterAgent used by Content Generator's Script Writer stage — so a
remix gets the exact same Voice Sample application, client brand context,
and output shape (GeneratedScript) as any other script in Creative Studio.

Client-scoped (unlike the account-wide tool this replaced): once Remix
lives inside Creative Studio, it should feel client-aware like every other
feature there, and it works identically for any client — existing or new.
"""

import logging

from agents.base_agent import BaseAgent
from agents.script_writer import ScriptWriterAgent
from models import ContentConcept, ContentFormat, GeneratedScript, StructureOption
from services.media_transcriber import transcribe_url

logger = logging.getLogger("wicked.agent.remix")


class RemixResult:
    """Plain container returned by RemixAgent.run() — not a Pydantic model
    since it's assembled straight into CreativeStudioRemixOutput in main.py."""

    def __init__(self, script, structure, transcript, platform, summary):
        self.script = script
        self.structure = structure
        self.transcript = transcript
        self.platform = platform
        self.summary = summary


class RemixAgent(BaseAgent):
    agent_name = "Remix Agent"
    agent_role = "short-form creator voice remix specialist"

    def run(self, video_url: str, tone: str = "", category: str = "") -> RemixResult:
        self.logger.info(f"Remixing: {video_url}")

        transcript_data = transcribe_url(video_url)
        transcript = (transcript_data.get("transcript") or "").strip()
        platform = transcript_data.get("platform", "unknown")
        hook_line = transcript_data.get("hook_line", "")
        summary = transcript_data.get("summary", "")

        if not transcript:
            empty_script = GeneratedScript(
                title=f"Remix ({platform})",
                hook_line=hook_line,
                full_script_text="",
                audio_direction=summary or "No speech detected in this clip.",
            )
            return RemixResult(empty_script, None, transcript, platform, summary)

        beat_outline = [s.strip() for s in transcript.replace("\n", " ").split(". ") if s.strip()]
        structure = StructureOption(
            hook_direction=hook_line or transcript[:120],
            beat_outline=beat_outline or [transcript],
            source_keyword=video_url,
            category=category,
        )
        concept = ContentConcept(
            title=summary[:60] if summary else f"Remix ({platform})",
            hook=structure.hook_direction,
            concept_summary=summary or transcript[:200],
            storytelling_framework="Remix",
            trend_reference=video_url,
            format=ContentFormat.INSTAGRAM_REEL,
        )

        writer = ScriptWriterAgent(client_id=self.client_id)
        result = writer.run(concept, structure=structure, tone=tone, category=category)

        return RemixResult(result.script, structure, transcript, platform, summary)
