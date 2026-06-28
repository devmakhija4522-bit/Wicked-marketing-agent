from backend.services.llm_service import call_llm
import json

def run_brand_guardian(script: dict) -> dict:
    prompt = f"""
You are the Brand Guardian for Grest — India's top certified refurbished Apple brand.

Review this Instagram Reel script:

HOOK: {script.get('hook', '')}
BODY: {script.get('body', '')}
GREST MOMENT: {script.get('grest_moment', '')}
CTA: {script.get('cta', '')}

Grest Brand Rules:
- Content must be entertainment-first, NOT a sales pitch
- Grest should feel like a natural part of the story
- Never sound desperate or pushy
- Must appeal to smart, value-conscious Indian millennials/Gen Z
- USPs (warranty, IMEI verification, quality checks) should be mentioned naturally if at all

Return a JSON object:
{{
  "brand_alignment_score": 0-100,
  "approved": true or false,
  "feedback": "One paragraph of constructive feedback",
  "flags": ["list of issues if any, empty array if none"]
}}

Score guide: 80+ = approved, below 80 = needs revision.
Return ONLY valid JSON, no markdown.
"""
    try:
        raw = call_llm(prompt)
        raw = raw.replace("```json", "").replace("```", "").strip()
        review = json.loads(raw)
        return {
            "script": script,
            **review
        }
    except Exception as e:
        return {
            "script": script,
            "brand_alignment_score": 0,
            "approved": False,
            "feedback": f"Review failed: {str(e)}",
            "flags": ["Error during review"]
        }
