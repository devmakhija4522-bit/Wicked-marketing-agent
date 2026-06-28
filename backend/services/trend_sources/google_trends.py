from pytrends.request import TrendReq

def get_google_trends() -> list:
    try:
        pytrends = TrendReq(hl='en-IN', tz=330)
        trending = pytrends.trending_searches(pn='india')
        results = []
        for topic in trending[0][:10]:
            results.append({
                "title": topic,
                "source": "google_trends",
                "category": "trending",
                "engagement_signal": "Top trending in India today",
                "raw_data": {"keyword": topic}
            })
        return results
    except Exception as e:
        return [{"error": str(e)}]
