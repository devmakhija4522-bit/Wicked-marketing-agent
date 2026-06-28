from backend.services.trend_sources.google_trends import get_google_trends
from backend.services.trend_sources.youtube_trends import get_youtube_trends

def run_trend_scout() -> list:
    trends = []

    google = get_google_trends()
    trends.extend([t for t in google if "error" not in t])

    youtube = get_youtube_trends()
    trends.extend([t for t in youtube if "error" not in t])

    return trends[:15]  # Return top 15 trends
