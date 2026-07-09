"""
WICKED Autonomous Mode
Self-looping runner for the 5-agent pipeline (Trend Scout → Insight Analyst →
Content Strategist → Script Writer → Brand Guardian).

- run_cycle()       : one full cycle with a "should I run" dedupe check
- autonomous_loop() : outer loop — run, sleep LOOP_INTERVAL_MINUTES, repeat
- Every cycle outcome is logged to logs/pipeline_run.log (and MongoDB when
  configured) so overnight activity can be audited.

Controlled entirely by env vars (see get_autonomous_config); flip
AUTONOMOUS_MODE=false to kill the loop without touching code.
"""

import json
import logging
import os
import threading
import time
from datetime import datetime
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

from config import BASE_DIR, DATA_DIR, db, settings
from models import PipelineInput, PipelineRun, PipelineStatus
from pipeline import execute_pipeline
from agents.trend_scout import TrendScoutAgent

logger = logging.getLogger("wicked.autonomous")

LOGS_DIR = BASE_DIR / "logs"
PIPELINE_LOG_FILE = LOGS_DIR / "pipeline_run.log"
COVERED_TOPICS_FILE = DATA_DIR / "covered_topics.json"
STATE_FILE = DATA_DIR / "autonomous_state.json"

MAX_STATE_CYCLES = 100  # cap the local cycle history so the file can't grow forever

_file_handler_lock = threading.Lock()
_file_handler_attached = False


def _ensure_file_logging() -> None:
    """Attach a file handler for logs/pipeline_run.log exactly once."""
    global _file_handler_attached
    with _file_handler_lock:
        if _file_handler_attached:
            return
        try:
            LOGS_DIR.mkdir(parents=True, exist_ok=True)
            handler = logging.FileHandler(PIPELINE_LOG_FILE, encoding="utf-8")
            handler.setFormatter(
                logging.Formatter("%(asctime)s | %(levelname)-7s | %(message)s")
            )
            logger.addHandler(handler)
            if logger.level > logging.INFO or logger.level == logging.NOTSET:
                logger.setLevel(logging.INFO)
            _file_handler_attached = True
        except OSError as e:
            # Read-only filesystem etc. — stdout logging still works
            logging.getLogger("wicked.autonomous").error(
                "Could not open %s for cycle logging: %s", PIPELINE_LOG_FILE, e
            )


# ── Config ────────────────────────────────────────────────────

def _env_bool(name: str, default: str = "false") -> bool:
    return os.getenv(name, default).strip().lower() in ("1", "true", "yes", "on")


def get_autonomous_config() -> dict:
    """Read autonomous-mode settings live from the environment / .env file."""
    load_dotenv(override=True)  # pick up .env edits without a restart (local dev)

    try:
        interval = float(os.getenv("LOOP_INTERVAL_MINUTES", "60"))
    except ValueError:
        interval = 60.0
    if interval <= 0:
        interval = 60.0

    keywords = [
        k.strip() for k in os.getenv("AUTONOMOUS_KEYWORDS", "").split(",") if k.strip()
    ]

    return {
        "enabled": _env_bool("AUTONOMOUS_MODE"),
        "run_in_web": _env_bool("AUTONOMOUS_IN_WEB"),
        "interval_minutes": interval,
        "client_id": os.getenv("AUTONOMOUS_CLIENT_ID", "generic").strip() or "generic",
        "topic": os.getenv("AUTONOMOUS_TOPIC", "").strip(),
        "keywords": keywords,
    }


# ── Covered-topics store (the "should I run" dedupe) ─────────

def _normalize(title: str) -> str:
    return " ".join(title.lower().split())


def _load_covered_file() -> dict:
    if COVERED_TOPICS_FILE.exists():
        try:
            with open(COVERED_TOPICS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, dict) and isinstance(data.get("topics"), dict):
                return data["topics"]
        except (json.JSONDecodeError, IOError) as e:
            logger.error("Could not read %s: %s", COVERED_TOPICS_FILE, e)
    return {}


def load_covered_topics() -> set:
    """Return the set of normalized topic keys already covered by past cycles."""
    if db is not None:
        try:
            return {
                doc["key"]
                for doc in db.covered_topics.find({}, {"key": 1})
                if doc.get("key")
            }
        except Exception as e:
            logger.error("Failed to load covered topics from MongoDB: %s", e)
    return set(_load_covered_file().keys())


def mark_topics_covered(titles: list) -> None:
    """Persist topic titles as covered (MongoDB when available, plus local JSON backup)."""
    now = datetime.utcnow().isoformat()
    entries = {_normalize(t): {"title": t, "covered_at": now} for t in titles if t and t.strip()}
    if not entries:
        return

    if db is not None:
        try:
            for key, entry in entries.items():
                db.covered_topics.update_one(
                    {"key": key},
                    {"$set": {"key": key, **entry}},
                    upsert=True,
                )
        except Exception as e:
            logger.error("Failed to save covered topics to MongoDB: %s", e)

    # Always keep the local file too (same dual-storage pattern as client profiles)
    try:
        topics = _load_covered_file()
        topics.update(entries)
        COVERED_TOPICS_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(COVERED_TOPICS_FILE, "w", encoding="utf-8") as f:
            json.dump({"topics": topics}, f, indent=2, ensure_ascii=False)
    except IOError as e:
        logger.error("Failed to save %s: %s", COVERED_TOPICS_FILE, e)


# ── Cycle history / audit trail ───────────────────────────────

def _load_state() -> dict:
    if STATE_FILE.exists():
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, dict):
                return data
        except (json.JSONDecodeError, IOError):
            pass
    return {}


def _record_cycle(record: dict) -> None:
    """Write one cycle's outcome to the log file, MongoDB, and the local state file."""
    logger.info(
        "CYCLE RESULT | decision=%s | stage=%s | run_id=%s | %s%s",
        record.get("decision"),
        record.get("stage_reached"),
        record.get("run_id") or "-",
        record.get("summary") or "",
        f" | ERROR: {record['error']}" if record.get("error") else "",
    )

    if db is not None:
        try:
            db.autonomous_cycles.insert_one(dict(record))  # copy: insert_one adds _id
        except Exception as e:
            logger.error("Failed to save cycle record to MongoDB: %s", e)

    try:
        state = _load_state()
        cycles = state.get("cycles", [])
        if not isinstance(cycles, list):
            cycles = []
        state["cycles"] = ([record] + cycles)[:MAX_STATE_CYCLES]
        state["last_cycle_at"] = record.get("timestamp")
        STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(STATE_FILE, "w", encoding="utf-8") as f:
            json.dump(state, f, indent=2, ensure_ascii=False, default=str)
    except IOError as e:
        logger.error("Failed to save %s: %s", STATE_FILE, e)


def get_recent_cycles(limit: int = 20) -> list:
    """Recent cycle records for the /autonomous/status endpoint (newest first)."""
    if db is not None:
        try:
            import pymongo
            return list(
                db.autonomous_cycles.find({}, {"_id": 0})
                .sort("timestamp", pymongo.DESCENDING)
                .limit(limit)
            )
        except Exception as e:
            logger.error("Failed to load cycle history from MongoDB: %s", e)
    cycles = _load_state().get("cycles", [])
    return cycles[:limit] if isinstance(cycles, list) else []


# ── One cycle ─────────────────────────────────────────────────

def _stage_reached(run: PipelineRun) -> str:
    if run.guardian_output is not None:
        return "brand_guardian"
    if run.script_output is not None:
        return "script_writer"
    if run.strategy_output is not None:
        return "content_strategist"
    if run.insight_output is not None:
        return "insight_analyst"
    if run.trend_output is not None:
        return "trend_scout"
    return "none"


def run_cycle(config: Optional[dict] = None) -> dict:
    """
    One autonomous cycle:
      1. Trend Scout scans for content.
      2. Dedupe against covered topics — if nothing new, skip (no further Gemini calls).
      3. Otherwise run the remaining 4 agents on the new trends only.
      4. On success, mark those trends covered and record the outcome.
    Returns the cycle record dict. Never raises — errors are captured in the record.
    """
    _ensure_file_logging()
    cfg = config or get_autonomous_config()
    record = {
        "timestamp": datetime.utcnow().isoformat(),
        "client_id": cfg["client_id"],
        "topic": cfg["topic"],
        "decision": "run",
        "stage_reached": "none",
        "run_id": None,
        "summary": "",
        "error": None,
    }

    try:
        # 1. Scout
        scout = TrendScoutAgent(client_id=cfg["client_id"])
        trend_output = scout.run(topic=cfg["topic"], keywords=cfg["keywords"])
        record["stage_reached"] = "trend_scout"

        # 2. Should I run? — dedupe against covered topics
        covered = load_covered_topics()
        new_trends = [t for t in trend_output.trends if _normalize(t.title) not in covered]
        logger.info(
            "Scout found %d trends — %d new (covered set holds %d topics)",
            len(trend_output.trends), len(new_trends), len(covered),
        )

        if not new_trends:
            record["decision"] = "skipped"
            record["summary"] = (
                f"No new trends among {len(trend_output.trends)} found — "
                "skipping cycle to save Gemini API calls."
            )
            _record_cycle(record)
            return record

        # 3. Run the remaining agents on the fresh trends only
        fresh_output = trend_output.model_copy(update={"trends": new_trends})
        run = PipelineRun(
            input=PipelineInput(
                client_id=cfg["client_id"],
                topic=cfg["topic"],
                keywords=cfg["keywords"],
            )
        )
        record["run_id"] = run.id
        execute_pipeline(run, precomputed_trend_output=fresh_output)
        record["stage_reached"] = _stage_reached(run)

        # 4. Outcome
        if run.status == PipelineStatus.COMPLETED and run.script_output is not None:
            mark_topics_covered([t.title for t in new_trends])
            title = run.script_output.script.title
            score = (
                f", brand score {run.guardian_output.overall_score:.0f}/100"
                if run.guardian_output is not None else ""
            )
            record["summary"] = (
                f"Generated script '{title}' from {len(new_trends)} new trends{score}."
            )
        else:
            # Failure or no concepts — leave topics uncovered so the next cycle retries
            record["decision"] = "failed" if run.status == PipelineStatus.FAILED else "incomplete"
            record["error"] = run.error
            record["summary"] = f"Pipeline stopped at stage '{record['stage_reached']}'."

    except Exception as e:
        logger.error("Cycle crashed: %s", e, exc_info=True)
        record["decision"] = "failed"
        record["error"] = str(e)

    _record_cycle(record)
    return record


# ── The loop ──────────────────────────────────────────────────

def _sleep(seconds: float, stop_event: Optional[threading.Event]) -> None:
    if stop_event is not None:
        stop_event.wait(seconds)
    else:
        time.sleep(seconds)


def autonomous_loop(stop_event: Optional[threading.Event] = None) -> None:
    """
    Run cycles forever. One failed cycle never kills the loop — the error is
    logged and the loop sleeps until the next interval. AUTONOMOUS_MODE is
    re-read every iteration, so setting it to false stops cycling without a
    code change (on Railway, updating the variable redeploys the worker).
    """
    _ensure_file_logging()
    logger.info("Autonomous loop starting (pid %s)", os.getpid())
    cycle_num = 0

    while stop_event is None or not stop_event.is_set():
        cfg = get_autonomous_config()

        if not cfg["enabled"]:
            logger.info("AUTONOMOUS_MODE is off — idling, re-checking in 60s.")
            _sleep(60, stop_event)
            continue

        if not (settings.gemini_api_key or os.getenv("GEMINI_API_KEY")):
            logger.warning("GEMINI_API_KEY missing — cannot run cycles. Re-checking in 60s.")
            _sleep(60, stop_event)
            continue

        cycle_num += 1
        logger.info(
            "=== Autonomous cycle %d starting (client=%s, topic='%s', interval=%.0f min) ===",
            cycle_num, cfg["client_id"], cfg["topic"], cfg["interval_minutes"],
        )
        try:
            record = run_cycle(cfg)
            logger.info(
                "=== Cycle %d finished: %s (stage: %s) ===",
                cycle_num, record["decision"], record["stage_reached"],
            )
        except Exception as e:
            # run_cycle already guards internally; this is a belt-and-braces catch
            logger.error("Cycle %d crashed unexpectedly: %s", cycle_num, e, exc_info=True)

        _sleep(cfg["interval_minutes"] * 60, stop_event)

    logger.info("Autonomous loop stopped.")
