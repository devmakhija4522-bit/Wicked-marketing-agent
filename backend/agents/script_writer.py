from backend.services.llm_service import call_llm
import json

def run_script_writer(concept: dict, language: str = "hinglish", style_samples: list = []) -> dict:
    style_context = ""
    if style_samples:
        style_context = f"""
Here are sample scripts written by the user — match their tone, humor, and sentence structure exactly:

{chr(10).join([f'Sample {i+1}: {s}' for i, s in enumerate(style_samples)])}
"""

    lang_instruction = {
        "hinglish": "Write in Hinglish (natural Hindi + English mix, like how Indian Gen Z actually talks). Use Roman script for Hindi words.",
        "hindi": "Write in pure Hindi using Roman script.",
        "english": "Write in casual Indian English."
    }.get(language, "Write in Hinglish.")

    prompt = f"""
You are a viral Instagram Reels scriptwriter for Grest — India's top certified refurbished Apple brand.

Content Concept: {concept['angle']}
Grest Integration: {concept['grest_hook']}
Trend: {concept['insight']['trend']['title']}
Emotion to trigger: {concept['insight']['emotion']}

{style_context}

{lang_instruction}

Write a 30-60 second Instagram Reel script. Structure it EXACTLY like this and return as JSON:

{{
  "hook": "First 3 seconds — must stop the scroll. One punchy line or scene.",
  "body": "The main story — entertainment first. Drama, humor, suspense. NO selling yet.",
  "grest_moment": "The subtle brand reveal — natural, NOT a sales pitch. Max 2 lines.",
  "cta": "Call to action — casual, not pushy. One line.",
  "visual_notes": "Camera angles, transitions, on-screen text suggestions.",
  "full_script": "The complete script as it would be read/performed, combining all parts."
}}

Rules:
- Entertainment FIRST, brand SECOND
- Never say 'buy now' or 'visit our store'
- The Grest mention should feel like a natural part of the story
- Hook must be shocking, funny, or deeply relatable
- Keep it conversational — like talking to a friend

Return ONLY valid JSON, no markdown.
"""
    try:
        raw = call_llm(prompt)
        raw = raw.replace("```json", "").replace("```", "").strip()
        script = json.loads(raw)
        return {
            "concept": concept,
            "language": language,
            **script
        }
    except Exception as e:
        return {
            "concept": concept,
            "language": language,
            "hook": "Error generating script",
            "body": "",
            "grest_moment": "",
            "cta": "",
            "visual_notes": "",
            "full_script": "",
            "error": str(e)
        }
