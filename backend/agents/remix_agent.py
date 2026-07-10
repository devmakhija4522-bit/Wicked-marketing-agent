"""
Remix Agent
Takes a pasted Instagram Reel / TikTok / YouTube link, transcribes it
(services/media_transcriber.py), and rewrites it in the account-wide Voice
Sample — the "paste a link, get a script in your voice" workflow.

Deliberately NOT client-scoped: unlike the GMM/Grest agents, this uses the
single account-wide Voice Sample (config.load_voice_sample) rather than a
per-client brand profile, since remixing is a creator-voice tool rather than
a brand-campaign tool.
"""

import logging
from typing import Optional

from agents.base_agent import BaseAgent
from config import load_voice_sample
from models import RemixOutput
from services.media_transcriber import transcribe_url

logger = logging.getLogger("wicked.agent.remix")


class RemixAgent(BaseAgent):
    agent_name = "Remix Agent"
    agent_role = "short-form creator voice remix specialist"

    def run(self, video_url: str, tone: str = "") -> RemixOutput:
        self.logger.info(f"Remixing: {video_url}")

        transcript_data = transcribe_url(video_url)
        transcript = (transcript_data.get("transcript") or "").strip()

        base_fields = {
            "source_url": transcript_data.get("source_url", video_url),
            "platform": transcript_data.get("platform", "unknown"),
            "transcript": transcript,
            "hook_line": transcript_data.get("hook_line", ""),
            "estimated_duration_seconds": transcript_data.get("estimated_duration_seconds", 0) or 0,
            "summary": transcript_data.get("summary", ""),
        }

        if not transcript:
            return RemixOutput(**base_fields)

        voice_sample = load_voice_sample()
        voice_text = (voice_sample.get("script_writing_voice") or "").strip()
        voice_block = voice_text or (
            "No Voice Sample configured yet — default to a punchy, confident, "
            "native short-form creator voice (natural Hinglish is fine)."
        )
        tone_line = f"\nTone override requested for this remix: {tone}." if tone else ""

        prompt = f"""You are remixing a short-form video transcript into a specific creator's own voice — the same job as tools like Zerovi's "Remix" feature.

=== ORIGINAL TRANSCRIPT ===
{transcript}

=== CREATOR'S VOICE SAMPLE (write the remix EXACTLY in this voice/style) ===
{voice_block}
{tone_line}

Your tasks:
1. Identify the single psychological hook pattern the original uses (e.g. pattern-interrupt, curiosity gap, contrarian take, desire/pain-point, story-driven).
2. Rewrite the ENTIRE script in the creator's voice above — keep the same beats, structure, and roughly the same length/pacing, but it must sound like this creator wrote it, not a copy-paste of the original.
3. Write exactly 3 distinct caption options for the remixed post (varying tone/length).

Return ONLY valid JSON (no markdown fences) with these keys:
- "hook_pattern": short name of the psychological pattern identified
- "remixed_hook": the rewritten opening line (first ~3 seconds)
- "remixed_script": the full rewritten script, beat by beat
- "caption_options": an array of exactly 3 caption strings
"""

        try:
            result = self.llm.generate_json(
                prompt=prompt,
                system_prompt=(
                    "You are an elite short-form video script doctor who specializes in "
                    "voice-matching: taking someone else's viral structure and rewriting it "
                    "so it sounds like it was written by a specific creator, not translated "
                    "or paraphrased."
                ),
                temperature=0.85,
            )
        except Exception as e:
            self.logger.error(f"Remix generation failed: {e}")
            result = {}

        if not isinstance(result, dict) or result.get("parse_error"):
            self.logger.warning(f"Remix LLM output unusable, returning transcript-only result: {result}")
            return RemixOutput(**base_fields)

        caption_options = result.get("caption_options") or []
        if not isinstance(caption_options, list):
            caption_options = []

        return RemixOutput(
            **base_fields,
            remixed_hook=result.get("remixed_hook", ""),
            remixed_script=result.get("remixed_script", ""),
            hook_pattern=result.get("hook_pattern", ""),
            caption_options=[str(c) for c in caption_options][:3],
        )
