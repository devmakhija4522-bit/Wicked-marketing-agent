from backend.services.llm_service import call_llm
import json

def run_insight_analyst(trends: list) -> list:
    insights = []
    for trend in trends[:5]:  # Analyze top 5 to save API quota
        prompt = f"""
You are a viral content psychologist analyzing social media trends for India.

Trend: {trend['title']}
Source: {trend['source']}
Engagement: {trend['engagement_signal']}

Analyze this trend and return a JSON object with these exact keys:
- why_trending: one sentence explanation
- emotion: primary emotion it triggers (humor/nostalgia/FOMO/anger/inspiration/shock)
- audience: who is engaging with this (age group, interests)
- content_type: best content format (humor/emotional/suspense/educational/relatable)

Return ONLY valid JSON, no markdown, no explanation.
"""
        try:
            raw = call_llm(prompt)
            # Clean up in case Gemini adds markdown
            raw = raw.replace("```json", "").replace("```", "").strip()
            analysis = json.loads(raw)
            insights.append({
                "trend": trend,
                **analysis
            })
        except Exception as e:
            insights.append({
                "trend": trend,
                "why_trending": "Could not analyze",
                "emotion": "unknown",
                "audience": "general",
                "content_type": "relatable",
                "error": str(e)
            })
    return insights
