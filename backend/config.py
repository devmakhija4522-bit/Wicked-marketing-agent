"""
WICKED Backend Configuration
Loads environment variables and provides typed config access.
Only GEMINI_API_KEY is required — all other keys are optional enhancements.
"""

import os
import json
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
CLIENTS_DIR = DATA_DIR / "clients"
SCRIPTS_FILE = DATA_DIR / "generated_scripts.json"


class Settings(BaseSettings):
    # --- Required ---
    gemini_api_key: str = ""

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

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}

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


def get_all_clients() -> list[dict]:
    """List all available client profiles."""
    if not CLIENTS_DIR.exists():
        CLIENTS_DIR.mkdir(parents=True, exist_ok=True)
        return []
    
    clients = []
    for file_path in CLIENTS_DIR.glob("*.json"):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                clients.append(data)
        except (json.JSONDecodeError, IOError):
            pass
    return clients

def load_client_profile(client_id: str) -> dict:
    """Load a specific client profile JSON."""
    profile_path = CLIENTS_DIR / f"{client_id}.json"
    if not profile_path.exists():
        # Fallback to the first client if it exists, otherwise empty
        all_clients = get_all_clients()
        if all_clients:
            return all_clients[0]
        return {"brand_name": "Unknown Client"}
    with open(profile_path, "r", encoding="utf-8") as f:
        return json.load(f)

def save_client_profile(client_data: dict) -> None:
    """Save a client profile JSON."""
    if not CLIENTS_DIR.exists():
        CLIENTS_DIR.mkdir(parents=True, exist_ok=True)
    
    client_id = client_data.get("id")
    if not client_id:
        return
        
    profile_path = CLIENTS_DIR / f"{client_id}.json"
    with open(profile_path, "w", encoding="utf-8") as f:
        json.dump(client_data, f, indent=2)

def delete_client_profile(client_id: str) -> bool:
    """Delete a client profile JSON."""
    profile_path = CLIENTS_DIR / f"{client_id}.json"
    if profile_path.exists():
        profile_path.unlink()
        return True
    return False

def load_brand_profile() -> dict:
    """Fallback for backwards compatibility, loads the first client or generic."""
    return load_client_profile("generic")


def load_content_templates() -> dict:
    """Load the storytelling framework templates."""
    templates_path = DATA_DIR / "content_templates.json"
    with open(templates_path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_generated_scripts() -> list[dict]:
    """Load previously generated scripts from the JSON file."""
    if not SCRIPTS_FILE.exists():
        return []
    try:
        with open(SCRIPTS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return []


def save_generated_scripts(scripts: list[dict]) -> None:
    """Persist generated scripts to the JSON file."""
    SCRIPTS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(SCRIPTS_FILE, "w", encoding="utf-8") as f:
        json.dump(scripts, f, indent=2, ensure_ascii=False, default=str)
