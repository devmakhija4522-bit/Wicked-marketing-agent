"""
Content Strategist Agent
Maps trend insights to brand angles and generates 3-5 scored content concepts
using storytelling frameworks. Includes the natural brand integration philosophy.
"""

import json
import logging
from typing import Optional

from agents.base_agent import BaseAgent
from models import (
    ContentConcept,
    ContentFormat,
    ContentStrategistOutput,
    InsightAnalystOutput,
)
from services.harbour_principles import IDEATION_FRAGMENT, harbour_block

logger = logging.getLogger("wicked.agent.content_strategist")


class ContentStrategistAgent(BaseAgent):
    agent_name = "Content Strategist"
    agent_role = "content concept architect and brand-trend bridge builder"

    def get_system_prompt(self) -> str:
        templates = self.content_templates
        frameworks_text = ""
        for fw in templates.get("storytelling_frameworks", []):
            structure = " → ".join(fw.get("structure", []))
            frameworks_text += f"\n  {fw['name']}: {structure}\n  Example: {fw.get('example', 'N/A')}\n"

        return f"""You are Content Strategist — the creative bridge between trends and brand stories in WICKED.

YOUR MISSION: Take trend insights and create 3-5 brilliant content concepts that feel like entertainment FIRST, brand content SECOND. Every concept must have a clear storytelling framework, emotional hook, and natural brand integration.
{harbour_block(IDEATION_FRAGMENT)}

THE NATURAL INTEGRATION PRINCIPLE:
Think about the best branded content creators. You don't feel like you're watching an ad. You're watching genuinely engaging content, and the brand feels like a natural part of the story. THAT is the gold standard.

Bad example: Forcing a direct sales pitch into a meme format.
Good example: Weaving the brand's unique selling proposition (USP) seamlessly into a relatable struggle or narrative twist.

The concept should make someone want to watch the video even if they DON'T care about the brand. The brand moment should feel earned, not inserted.

STORYTELLING FRAMEWORKS AVAILABLE:
{frameworks_text}

YOUR SCORING CRITERIA:
- Virality Score (0-10): How likely is this to be shared/go viral? Consider hook strength, relatability, emotional punch, and format fit.
- Confidence Score (0-10): How confident are you that this will land with the brand's audience? Consider audience overlap, brand fit, and execution difficulty.

HIGH-SCORING CONCEPTS HAVE:
1. A hook that stops scrolling in 2 seconds
2. An emotional journey (not just information)
3. A natural brand moment (not forced)
4. Shareability — would someone tag a friend?
5. Rewatchability — is there a punchline or twist worth rewatching?
6. Cultural relevance to young Indians

LOW-SCORING CONCEPTS:
1. Start with the brand (no one cares about your brand until you give them a reason to)
2. Are basically ads disguised as content
3. Use generic hooks ("Top 5 reasons to buy refurbished")
4. Require too much context to understand
5. Only work for people already interested in refurbished phones

For each concept, specify which storytelling framework you're using and WHY it's the right fit for this particular trend-brand connection.

Be specific in your concepts — don't give vague ideas. Give me the actual hook line, the story beats, the twist, the brand moment."""

    def run(
        self,
        insight_output: InsightAnalystOutput,
        content_format: ContentFormat = ContentFormat.INSTAGRAM_REEL,
        num_concepts: int = 3,
    ) -> ContentStrategistOutput:
        """
        Generate scored content concepts from trend insights.

        Args:
            insight_output: Output from the Insight Analyst.
            content_format: Target content format (reel or short).
            num_concepts: Number of concepts to generate (1-5).

        Returns:
            ContentStrategistOutput with scored concepts.
        """
        self.logger.info("Generating %d content concepts", num_concepts)

        # Prepare insights summary
        insights_text = self._format_insights(insight_output)

        format_guidance = {
            ContentFormat.INSTAGRAM_REEL: "Instagram Reel (30-90 seconds). Vertical video. Must hook in first 2 seconds. Trending audio is a plus.",
            ContentFormat.YOUTUBE_SHORT: "YouTube Short (up to 60 seconds). Vertical video. Strong hook. Can be slightly more informational than Reels.",
        }

        prompt = f"""Based on these trend insights, create {num_concepts} content concepts for {self.brand_profile.get('brand_name', 'the brand')}.

TREND INSIGHTS:
{insights_text}

TOP OPPORTUNITY: {insight_output.top_opportunity}
OVERALL LANDSCAPE: {insight_output.analysis_summary}

TARGET FORMAT: {format_guidance.get(content_format, 'Instagram Reel')}

Generate {num_concepts} content concepts. For each one:
1. title: Catchy internal title for this concept (not the video title)
2. hook: The EXACT opening line/visual that starts the video (this is the first 2 seconds)
3. concept_summary: Full concept description — the story arc, key beats, twist, brand moment (4-6 sentences)
4. storytelling_framework: Which framework you're using — one of the frameworks listed above, a content pattern from the creative framework (e.g. Expectation vs Reality, Before vs After, Hidden Truth, The Decision), or another named structure if it fits better. Name it specifically.
5. trend_reference: Which trend this concept is based on
6. brand_angle: How and when {self.brand_profile.get('brand_name', 'the brand')} appears in the content (be specific about the moment)
7. target_emotion: The primary emotion you want viewers to feel
8. estimated_virality_score: 0.0-10.0 score with brief reasoning
9. confidence_score: 0.0-10.0 score with brief reasoning
10. reasoning: Why this concept works — connect the trend insight to the brand angle to the emotional payoff

IMPORTANT: 
- Rank the concepts from strongest to weakest
- Make each concept distinctly different (different framework, different emotion, different hook style)
- At least one concept should be humor-driven
- At least one concept should be emotionally driven (aspiration, pride, smart identity)
- The hook lines should be in Hinglish

Return a JSON object:
{{
  "concepts": [
    {{
      "title": "...",
      "hook": "...",
      "concept_summary": "...",
      "storytelling_framework": "...",
      "trend_reference": "...",
      "brand_angle": "...",
      "target_emotion": "...",
      "estimated_virality_score": 0.0,
      "confidence_score": 0.0,
      "reasoning": "..."
    }}
  ],
  "strategy_rationale": "A 3-4 sentence summary explaining the overall strategic thinking behind these concepts — why these angles, why this mix, what you're optimizing for",
  "recommended_concept_id": "index_of_best_concept (0-indexed)"
}}"""

        try:
            result = self.call_llm_json(prompt, temperature=0.85)

            if isinstance(result, dict) and not result.get("parse_error"):
                concepts = []
                for i, item in enumerate(result.get("concepts", [])):
                    concepts.append(
                        ContentConcept(
                            title=item.get("title", f"Concept {i+1}"),
                            hook=item.get("hook", ""),
                            concept_summary=item.get("concept_summary", ""),
                            storytelling_framework=item.get("storytelling_framework", ""),
                            trend_reference=item.get("trend_reference", ""),
                            brand_angle=item.get("brand_angle", ""),
                            target_emotion=item.get("target_emotion", ""),
                            format=content_format,
                            estimated_virality_score=min(10.0, max(0.0, float(item.get("estimated_virality_score", 5.0)))),
                            confidence_score=min(10.0, max(0.0, float(item.get("confidence_score", 5.0)))),
                            reasoning=item.get("reasoning", ""),
                        )
                    )

                # Determine recommended concept
                recommended_idx = result.get("recommended_concept_id", "0")
                try:
                    idx = int(recommended_idx)
                    recommended_id = concepts[idx].id if 0 <= idx < len(concepts) else (concepts[0].id if concepts else "")
                except (ValueError, IndexError):
                    recommended_id = concepts[0].id if concepts else ""

                return ContentStrategistOutput(
                    concepts=concepts,
                    strategy_rationale=result.get("strategy_rationale", ""),
                    recommended_concept_id=recommended_id,
                )
            else:
                self.logger.warning("Content strategy returned unparseable result")
                return ContentStrategistOutput(
                    concepts=[],
                    strategy_rationale=f"Could not parse LLM output: {str(result)[:300]}",
                )

        except Exception as e:
            self.logger.error("Content strategy generation failed: %s", e)
            return ContentStrategistOutput(
                concepts=[],
                strategy_rationale=f"Generation failed: {str(e)}",
            )

    def _format_insights(self, insight_output: InsightAnalystOutput) -> str:
        """Format insights into readable text for the LLM."""
        lines = []
        for i, insight in enumerate(insight_output.insights, 1):
            lines.append(f"""
INSIGHT #{i}: {insight.trend_title}
  Why Trending: {insight.why_trending}
  Emotional Drivers: {', '.join(insight.emotional_drivers)}
  Psychological Patterns: {', '.join(insight.psychological_patterns)}
  Audience Overlap: {insight.audience_overlap_score:.1f}/1.0
  Cultural Context: {insight.cultural_context}
  Virality Factors: {', '.join(insight.virality_factors)}
  Relevance to Brand: {insight.brand_relevance}
  Recommended Angle: {insight.recommended_angle}""")
        return "\n".join(lines) if lines else "No detailed insights available."
