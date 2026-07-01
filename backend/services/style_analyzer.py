"""
Style Analyzer Service
Analyzes a reference text to extract writing style characteristics.
Used by the Script Writer to adapt to the user's preferred voice.
"""

import logging
from typing import Optional

from models import StyleAnalysisResult
from services.llm_service import get_llm_service

logger = logging.getLogger("wicked.style_analyzer")

STYLE_ANALYSIS_PROMPT = """You are a linguistic style analyst. Analyze the following text and extract the writer's unique style characteristics.

TEXT TO ANALYZE:
\"\"\"
{reference_text}
\"\"\"

Analyze and return a JSON object with these fields:
{{
  "tone": "Overall tone (e.g., casual, sarcastic, enthusiastic, deadpan, motivational)",
  "vocabulary_style": "Type of words used (e.g., colloquial Hindi-English mix, formal English, slang-heavy, technical)",
  "sentence_structure": "How sentences are built (e.g., short punchy, long flowing, fragment-heavy, question-heavy)",
  "humor_style": "Type of humor if any (e.g., self-deprecating, observational, absurdist, wordplay, none)",
  "pacing": "How the writing flows (e.g., fast with quick cuts, slow build, rhythmic, unpredictable)",
  "signature_phrases": ["list", "of", "recurring", "phrases", "or", "patterns"],
  "overall_summary": "A 2-3 sentence summary of this writing style that another writer could use as a guide to mimic it"
}}

Return ONLY the JSON object."""


def analyze_style(reference_text: str) -> StyleAnalysisResult:
    """
    Analyze a reference text and return structured style characteristics.

    Args:
        reference_text: The text to analyze (could be a previous script,
                       a blog post, a creator's transcript, etc.)

    Returns:
        StyleAnalysisResult with tone, vocabulary, humor style, etc.
    """
    if not reference_text or len(reference_text.strip()) < 20:
        logger.info("Reference text too short for style analysis, using defaults.")
        return StyleAnalysisResult(
            tone="casual, confident Hinglish",
            vocabulary_style="Hindi-English mix, colloquial",
            sentence_structure="short punchy sentences with occasional longer builds",
            humor_style="observational, relatable",
            pacing="fast, hook-driven",
            signature_phrases=[],
            overall_summary="Default brand style."
        )

    llm = get_llm_service()
    prompt = STYLE_ANALYSIS_PROMPT.format(reference_text=reference_text)

    try:
        result = llm.generate_json(
            prompt=prompt,
            system_prompt="You are a linguistic style analyst. Return only valid JSON.",
            temperature=0.3,
        )

        if isinstance(result, dict) and not result.get("parse_error"):
            return StyleAnalysisResult(
                tone=result.get("tone", ""),
                vocabulary_style=result.get("vocabulary_style", ""),
                sentence_structure=result.get("sentence_structure", ""),
                humor_style=result.get("humor_style", ""),
                pacing=result.get("pacing", ""),
                signature_phrases=result.get("signature_phrases", []),
                overall_summary=result.get("overall_summary", ""),
            )
        else:
            logger.warning("Style analysis returned unparseable result, using defaults.")
            return StyleAnalysisResult(
                tone="casual Hinglish",
                vocabulary_style="Hindi-English mix",
                sentence_structure="short and punchy",
                humor_style="observational",
                pacing="fast-paced",
                signature_phrases=[],
                overall_summary="Could not fully analyze the provided style reference."
            )
    except Exception as e:
        logger.error(f"Style analysis failed: {e}")
        return StyleAnalysisResult(
            overall_summary=f"Style analysis failed: {str(e)}."
        )
