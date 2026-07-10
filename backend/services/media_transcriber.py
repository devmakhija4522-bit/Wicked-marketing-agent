"""
Media Transcriber
Downloads a short-form video (Instagram Reel, TikTok, or YouTube Short/video)
and produces a clean, speaker-friendly transcript using Gemini.

Used by the Remix feature (see agents/remix_agent.py): paste a link, get a
transcript, then rewrite it in the account's own Voice Sample.
"""

import logging
import tempfile
import time
from pathlib import Path
from typing import Optional

from config import settings

logger = logging.getLogger("wicked.services.media_transcriber")


class TranscriptionError(RuntimeError):
    """Raised when a video/audio source can't be downloaded or transcribed."""


def detect_platform(url: str) -> str:
    url_l = url.lower()
    if "instagram.com" in url_l:
        return "instagram"
    if "tiktok.com" in url_l:
        return "tiktok"
    if "youtube.com" in url_l or "youtu.be" in url_l:
        return "youtube"
    return "unknown"


def _download_with_ytdlp(url: str, workdir: Path) -> Path:
    """Download the smallest reasonable audio/video track for a URL using
    yt-dlp. Raises TranscriptionError on failure (private/removed/geo-blocked
    videos, unsupported host, missing binary, etc.)."""
    try:
        import yt_dlp
    except ImportError as e:
        raise TranscriptionError(
            "yt-dlp is not installed. Run `pip install yt-dlp` in the backend environment."
        ) from e

    outtmpl = str(workdir / "%(id)s.%(ext)s")
    ydl_opts = {
        # Prefer audio-only (smaller, faster, all we need for a transcript).
        # Falls back to a small combined format if audio-only isn't available.
        "format": "bestaudio/worst",
        "outtmpl": outtmpl,
        "noplaylist": True,
        "quiet": True,
        "no_warnings": True,
        "max_filesize": 100 * 1024 * 1024,  # 100MB safety cap
        "socket_timeout": 30,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            filepath = ydl.prepare_filename(info)
            path = Path(filepath)
            if not path.exists():
                # yt-dlp sometimes remuxes/renames — glob for whatever landed.
                candidates = list(workdir.glob(f"{info.get('id', '*')}.*"))
                if not candidates:
                    raise TranscriptionError("Download completed but the output file could not be located.")
                path = candidates[0]
            return path
    except yt_dlp.utils.DownloadError as e:
        raise TranscriptionError(
            f"Could not download this video (private, removed, or unsupported link?): {e}"
        ) from e


def _mime_type_for(path: Path) -> str:
    ext = path.suffix.lower()
    if ext in {".mp3"}:
        return "audio/mpeg"
    if ext in {".m4a", ".aac"}:
        return "audio/mp4"
    if ext in {".wav"}:
        return "audio/wav"
    if ext in {".ogg", ".opus"}:
        return "audio/ogg"
    if ext in {".webm"}:
        # yt-dlp's audio-only downloads are frequently opus-in-webm; Gemini
        # handles the video/webm mime type fine either way (it just reads
        # the audio track when there's no meaningful video).
        return "video/webm"
    if ext in {".mp4"}:
        return "video/mp4"
    if ext in {".mov"}:
        return "video/quicktime"
    return "application/octet-stream"


_TRANSCRIBE_PROMPT = """Transcribe the spoken audio in this media file exactly as spoken, word for word.

Then return ONLY a JSON object (no markdown fences) with these keys:
- "transcript": the full, clean, punctuated transcript
- "hook_line": just the first ~3 seconds of spoken content (the opening hook line)
- "estimated_duration_seconds": your best estimate of the clip length in seconds (integer)
- "summary": one sentence describing what the clip is about

If there is no clear speech (e.g. music only), set "transcript" to an empty string and explain in "summary".
"""


def _wait_for_file_active(client, file_obj, timeout_s: int = 60):
    """Gemini's Files API processes uploads asynchronously (video especially).
    Poll until the file leaves PROCESSING state."""
    start = time.time()
    name = file_obj.name
    while getattr(file_obj, "state", None) and file_obj.state.name == "PROCESSING":
        if time.time() - start > timeout_s:
            raise TranscriptionError("Timed out waiting for Gemini to process the uploaded media.")
        time.sleep(2)
        file_obj = client.files.get(name=name)
    if getattr(file_obj, "state", None) and file_obj.state.name == "FAILED":
        raise TranscriptionError("Gemini failed to process the uploaded media file.")
    return file_obj


def transcribe_url(url: str) -> dict:
    """End-to-end: detect platform, fetch media (direct URL for YouTube where
    possible, otherwise download via yt-dlp), transcribe with Gemini, and
    return a dict with transcript/hook_line/estimated_duration_seconds/summary/platform."""
    if not settings.gemini_api_key:
        raise TranscriptionError("GEMINI_API_KEY not configured.")

    from google import genai
    from google.genai import types

    client = genai.Client(api_key=settings.gemini_api_key)
    platform = detect_platform(url)

    parts = []
    tmp_path: Optional[Path] = None

    try:
        if platform == "youtube":
            # Gemini can ingest a YouTube URL directly — no download needed.
            try:
                parts = [types.Part(file_data=types.FileData(file_uri=url))]
            except Exception as e:
                logger.warning(f"Direct YouTube URL ingestion failed, falling back to download: {e}")
                parts = []

        if not parts:
            workdir = Path(tempfile.mkdtemp(prefix="wicked_remix_"))
            tmp_path = _download_with_ytdlp(url, workdir)
            mime_type = _mime_type_for(tmp_path)

            uploaded = client.files.upload(file=str(tmp_path), config={"mime_type": mime_type})
            uploaded = _wait_for_file_active(client, uploaded)
            parts = [uploaded]

        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=[*parts, _TRANSCRIBE_PROMPT],
        )
        text = response.text
        if not text:
            raise TranscriptionError("Gemini returned no transcription output for this media.")

        from services.llm_service import LLMService
        parsed, error = LLMService._try_parse_json(text)
        if parsed is None:
            # Fall back to treating the whole response as the transcript.
            parsed = {"transcript": text.strip(), "hook_line": "", "estimated_duration_seconds": 0, "summary": ""}

        parsed["platform"] = platform
        parsed["source_url"] = url
        return parsed

    finally:
        # Always clean up the downloaded temp file — never leave media on disk.
        if tmp_path is not None:
            try:
                tmp_path.unlink(missing_ok=True)
                tmp_path.parent.rmdir()
            except OSError:
                pass
