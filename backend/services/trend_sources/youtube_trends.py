from googleapiclient.discovery import build
from backend.config import YOUTUBE_API_KEY

def get_youtube_trends() -> list:
    try:
        youtube = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)
        request = youtube.videos().list(
            part="snippet,statistics",
            chart="mostPopular",
            regionCode="IN",
            maxResults=10,
            videoCategoryId="0"
        )
        response = request.execute()
        results = []
        for item in response.get("items", []):
            snippet = item["snippet"]
            stats = item.get("statistics", {})
            results.append({
                "title": snippet["title"],
                "source": "youtube",
                "category": snippet.get("categoryId", "general"),
                "engagement_signal": f"{stats.get('viewCount', '?')} views, {stats.get('likeCount', '?')} likes",
                "raw_data": {
                    "channel": snippet["channelTitle"],
                    "description": snippet["description"][:200],
                    "tags": snippet.get("tags", [])[:5]
                }
            })
        return results
    except Exception as e:
        return [{"error": str(e)}]
