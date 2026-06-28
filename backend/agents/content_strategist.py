from backend.services.llm_service import call_llm
import json

GREST_USPs = """
- 50+ Quality Checks on every device
- 6-12 Month Warranty
- 6 Physical Stores across India
- Government IMEI Verification via C-DOT/Sanchar Saathi (only private company)
- Premium Apple devices at fraction of cost
"""

def run_content_strategist(insights: list) -> list:
    concepts = []
    for insight in insights:
        prompt = f"""
You are a viral content strategist for Grest — India's leading certified refurbished Apple brand.

Trend: {insight['trend']['title']}
Why it's trending: {insight['why_trending']}
Emotion it triggers: {insight['emotion']}
Target audience: {insight['audience']}
Content type: {insight['content_type']}

Grest's USPs:
{GREST_USPs}

Your job: Find a creative, subtle way to tie this trend to Grest.
Like how Lava phones used a kidnapping plot twist to sell phones — entertainment first, brand second.

Return a JSON object with:
- angle: the creative concept in one sentence
- grest_hook: how Grest is subtly woven in (NOT a sales pitch)
- virality_score: 1-100
- brand_fit_score: 1-100
- originality_score: 1-100

Return ONLY valid JSON, no markdown.
"""
        try:
            raw = call_llm(prompt)
            raw = raw.replace("```json", "").replace("```", "").strip()
            concept = json.loads(raw)
            concepts.append({
                "insight": insight,
                **concept
            })
        except Exception as e:
            concepts.append({
                "insight": insight,
                "angle": "Could not generate concept",
                "grest_hook": "",
                "virality_score": 0,
                "brand_fit_score": 0,
                "originality_score": 0,
                "error": str(e)
            })

    # Sort by combined score
    concepts.sort(key=lambda x: x["virality_score"] + x["brand_fit_score"] + x["originality_score"], reverse=True)
    return concepts
