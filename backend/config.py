import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
REDDIT_CLIENT_ID = os.getenv("REDDIT_CLIENT_ID")
REDDIT_CLIENT_SECRET = os.getenv("REDDIT_CLIENT_SECRET")
REDDIT_USER_AGENT = os.getenv("REDDIT_USER_AGENT", "WICKED/1.0")
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini")
DEFAULT_LANGUAGE = os.getenv("DEFAULT_LANGUAGE", "hinglish")
CONTENT_FORMAT = os.getenv("CONTENT_FORMAT", "reels")
