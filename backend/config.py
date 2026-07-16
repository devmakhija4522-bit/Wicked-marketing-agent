"""
WICKED Backend Configuration
Loads environment variables and provides typed config access.
Only GEMINI_API_KEY is required — all other keys are optional enhancements.
"""

import os
import json
from datetime import datetime
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings
from dotenv import load_dotenv
from pymongo import MongoClient
import logging

logger = logging.getLogger(__name__)

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
CLIENTS_DIR = DATA_DIR / "clients"
COVERED_INFLUENCERS_FILE = DATA_DIR / "covered_influencers.json"
VOICE_SAMPLE_FILE = DATA_DIR / "voice_sample.json"
SKILL_RUNS_FILE = DATA_DIR / "skill_runs.json"


class Settings(BaseSettings):
    # --- Required ---
    gemini_api_key: str = ""

    # --- Database ---
    mongodb_uri: str = ""

    # --- Optional: Trend Sources ---
    youtube_api_key: str = ""
    reddit_client_id: str = ""
    reddit_client_secret: str = ""
    reddit_user_agent: str = "WICKED/1.0"
    rapidapi_key: str = ""
    rapidapi_instagram_host: str = "instagram-scraper-api2.p.rapidapi.com"

    # --- Server ---
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True

    # --- LLM ---
    gemini_model: str = "gemini-2.5-flash"
    gemini_temperature: float = 0.8
    gemini_max_tokens: int = 8192

    # --- LLM fallback: NVIDIA NIM (OpenAI-compatible) ---
    # Used only when Gemini is exhausted/unavailable after its own retries —
    # see services/llm_service.py. Free tier at build.nvidia.com; one key
    # works across all NVIDIA-hosted models.
    nvidia_api_key: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}

    @property
    def has_nvidia(self) -> bool:
        return bool(self.nvidia_api_key)

    @property
    def has_youtube(self) -> bool:
        return bool(self.youtube_api_key)

    @property
    def has_reddit(self) -> bool:
        return bool(self.reddit_client_id and self.reddit_client_secret)

    @property
    def has_instagram(self) -> bool:
        return bool(self.rapidapi_key)


settings = Settings()

mongo_client = None
db = None
if settings.mongodb_uri:
    try:
        mongo_client = MongoClient(settings.mongodb_uri)
        db = mongo_client["wicked_marketing"]
        logger.info("Connected to MongoDB from config")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")

def get_all_clients() -> list[dict]:
    """List all available client profiles from both local storage and MongoDB."""
    clients_dict = {}
    
    # 1. Load from local JSON files
    if not CLIENTS_DIR.exists():
        CLIENTS_DIR.mkdir(parents=True, exist_ok=True)
    else:
        for file_path in CLIENTS_DIR.glob("*.json"):
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if "id" in data:
                        clients_dict[data["id"]] = data
            except (json.JSONDecodeError, IOError):
                pass
                
    # 2. Load from MongoDB and merge/overwrite
    if db is not None:
        try:
            mongo_clients = list(db.clients.find({}, {"_id": 0}))
            for data in mongo_clients:
                if "id" in data:
                    clients_dict[data["id"]] = data
        except Exception as e:
            logger.error(f"Failed to fetch clients from MongoDB: {e}")
            
    return list(clients_dict.values())

def load_client_profile(client_id: str) -> dict:
    """Load a specific client profile directly (no full-collection scan)."""
    if db is not None:
        try:
            doc = db.clients.find_one({"id": client_id}, {"_id": 0})
            if doc:
                return doc
        except Exception as e:
            logger.error(f"Failed to fetch client '{client_id}' from MongoDB: {e}")

    profile_path = CLIENTS_DIR / f"{client_id}.json"
    if profile_path.exists():
        try:
            with open(profile_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            logger.error(f"Failed to read {profile_path}: {e}")

    # Unknown client_id — fall back to whatever's available, same as before.
    all_clients = get_all_clients()
    if all_clients:
        return all_clients[0]
    return {"brand_name": "Unknown Client"}

def save_client_profile(client_data: dict) -> None:
    """Save a client profile JSON to both MongoDB and local storage."""
    client_id = client_data.get("id")
    if not client_id:
        return

    # Always save to local JSON file for backup/persistence
    if not CLIENTS_DIR.exists():
        CLIENTS_DIR.mkdir(parents=True, exist_ok=True)
        
    profile_path = CLIENTS_DIR / f"{client_id}.json"
    try:
        with open(profile_path, "w", encoding="utf-8") as f:
            json.dump(client_data, f, indent=2)
    except IOError as e:
        logger.error(f"Failed to save local client file: {e}")

    # Also save to MongoDB if configured
    if db is not None:
        try:
            db.clients.update_one(
                {"id": client_id},
                {"$set": client_data},
                upsert=True
            )
        except Exception as e:
            logger.error(f"Failed to save client to MongoDB: {e}")

def delete_client_profile(client_id: str) -> bool:
    """Delete a client profile from both MongoDB and local storage — a client
    saved via save_client_profile() always lands in both, so deletion must
    check both too rather than returning as soon as one store says 404."""
    deleted = False

    if db is not None:
        try:
            result = db.clients.delete_one({"id": client_id})
            if result.deleted_count > 0:
                deleted = True
        except Exception as e:
            logger.error(f"Failed to delete client '{client_id}' from MongoDB: {e}")

    profile_path = CLIENTS_DIR / f"{client_id}.json"
    if profile_path.exists():
        profile_path.unlink()
        deleted = True

    return deleted

def load_brand_profile() -> dict:
    """Fallback for backwards compatibility, loads the first client or generic."""
    return load_client_profile("generic")


# ── Voice Sample (account-wide, single record — not per-client) ──────

def load_voice_sample() -> dict:
    """Load the account-wide Voice Sample record, seeding it with the
    default reference content on first run if none exists yet."""
    if db is not None:
        try:
            doc = db.voice_sample.find_one({"id": "voice_sample"}, {"_id": 0})
            if doc:
                return doc
        except Exception as e:
            logger.error(f"Failed to fetch voice sample from MongoDB: {e}")

    if VOICE_SAMPLE_FILE.exists():
        try:
            with open(VOICE_SAMPLE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            logger.error(f"Failed to read {VOICE_SAMPLE_FILE}: {e}")

    # Fresh account: the creative mechanic for each category lives in
    # services/voice_categories.py, not in seed data — notes start empty.
    seed = {
        "id": "voice_sample",
        "satire_notes": "",
        "emotional_notes": "",
        "infographic_notes": "",
        "updated_at": datetime.utcnow().isoformat(),
    }
    save_voice_sample(seed)
    return seed


def save_voice_sample(data: dict) -> None:
    """Persist the account-wide Voice Sample record to both MongoDB and
    local storage, following the same dual-write pattern as client
    profiles."""
    record = {**data, "id": "voice_sample"}

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    try:
        with open(VOICE_SAMPLE_FILE, "w", encoding="utf-8") as f:
            json.dump(record, f, indent=2, ensure_ascii=False)
    except IOError as e:
        logger.error(f"Failed to save {VOICE_SAMPLE_FILE}: {e}")

    if db is not None:
        try:
            db.voice_sample.update_one(
                {"id": "voice_sample"}, {"$set": record}, upsert=True
            )
        except Exception as e:
            logger.error(f"Failed to save voice sample to MongoDB: {e}")


def load_content_templates() -> dict:
    """Load the storytelling framework templates."""
    templates_path = DATA_DIR / "content_templates.json"
    with open(templates_path, "r", encoding="utf-8") as f:
        return json.load(f)


# ── Covered-influencers store (per-client dedupe across repeat searches) ──
# Mirrors autonomous.py's covered-topics pattern: without this, each
# influencer search is a stateless call with the same criteria, so Gemini's
# search grounding keeps surfacing the same top-ranked names (or fabricates
# once it runs out of "different" ideas). Tracking what's already been
# suggested lets us tell the model explicitly not to repeat it.

def _normalize_influencer_key(identifier: str) -> str:
    return " ".join(identifier.lower().split())


def _load_covered_influencers_file() -> dict:
    if COVERED_INFLUENCERS_FILE.exists():
        try:
            with open(COVERED_INFLUENCERS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, dict):
                return data
        except (json.JSONDecodeError, IOError) as e:
            logger.error(f"Could not read {COVERED_INFLUENCERS_FILE}: {e}")
    return {}


def load_covered_influencers(client_id: str) -> list[dict]:
    """Influencers already suggested to this client, most recently suggested
    first. Each entry has key/name/handle/url/covered_at."""
    if db is not None:
        try:
            docs = list(
                db.covered_influencers.find({"client_id": client_id}, {"_id": 0})
                .sort("covered_at", -1)
            )
            if docs:
                return docs
        except Exception as e:
            logger.error(f"Failed to load covered influencers for '{client_id}' from MongoDB: {e}")

    entries = _load_covered_influencers_file().get(client_id, {})
    return sorted(entries.values(), key=lambda e: e.get("covered_at", ""), reverse=True)


def mark_influencers_covered(client_id: str, influencers: list[dict]) -> None:
    """Persist newly-suggested influencers (by handle/URL/name) as covered
    for this client, so the next search knows to avoid repeating them."""
    now = datetime.utcnow().isoformat()
    entries = {}
    for inf in influencers:
        if not isinstance(inf, dict):
            continue
        identifier = (inf.get("handle") or inf.get("url") or inf.get("name") or "").strip()
        if not identifier:
            continue
        key = _normalize_influencer_key(identifier)
        entries[key] = {
            "key": key,
            "name": inf.get("name", ""),
            "handle": inf.get("handle", ""),
            "url": inf.get("url", ""),
            "covered_at": now,
        }
    if not entries:
        return

    if db is not None:
        try:
            for key, entry in entries.items():
                db.covered_influencers.update_one(
                    {"client_id": client_id, "key": key},
                    {"$set": {"client_id": client_id, **entry}},
                    upsert=True,
                )
        except Exception as e:
            logger.error(f"Failed to save covered influencers for '{client_id}' to MongoDB: {e}")

    try:
        data = _load_covered_influencers_file()
        client_entries = data.get(client_id, {})
        client_entries.update(entries)
        data[client_id] = client_entries
        COVERED_INFLUENCERS_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(COVERED_INFLUENCERS_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except IOError as e:
        logger.error(f"Failed to save {COVERED_INFLUENCERS_FILE}: {e}")


# ── Marketing skill run history (persisted results, client-scoped) ──────
# Mirrors the covered-influencers store above: a flat local JSON file keyed
# by client_id, dual-written to MongoDB when configured. Runs not tied to any
# client use the "_global" sentinel bucket (same convention as VoiceSample's
# "id": "voice_sample" singleton sentinel).

def _load_skill_runs_file() -> dict:
    if SKILL_RUNS_FILE.exists():
        try:
            with open(SKILL_RUNS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, dict):
                return data
        except (json.JSONDecodeError, IOError) as e:
            logger.error(f"Could not read {SKILL_RUNS_FILE}: {e}")
    return {}


def load_skill_runs(client_id: str = "_global") -> list[dict]:
    """This client's persisted marketing-skill run history, newest first."""
    if db is not None:
        try:
            docs = list(
                db.skill_runs.find({"client_id": client_id}, {"_id": 0})
                .sort("created_at", -1)
            )
            if docs:
                return docs
        except Exception as e:
            logger.error(f"Failed to load skill runs for '{client_id}' from MongoDB: {e}")

    entries = _load_skill_runs_file().get(client_id, {})
    return sorted(entries.values(), key=lambda e: e.get("created_at", ""), reverse=True)


def save_skill_run(client_id: str, run: dict) -> None:
    """Persist one completed marketing-skill run to both MongoDB and local
    storage. `run` must include a unique 'id'."""
    run_id = run.get("id")
    if not run_id:
        return
    record = {**run, "client_id": client_id}

    if db is not None:
        try:
            db.skill_runs.update_one(
                {"client_id": client_id, "id": run_id},
                {"$set": record},
                upsert=True,
            )
        except Exception as e:
            logger.error(f"Failed to save skill run for '{client_id}' to MongoDB: {e}")

    try:
        data = _load_skill_runs_file()
        client_entries = data.get(client_id, {})
        client_entries[run_id] = record
        data[client_id] = client_entries
        SKILL_RUNS_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(SKILL_RUNS_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except IOError as e:
        logger.error(f"Failed to save {SKILL_RUNS_FILE}: {e}")
