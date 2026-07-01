"""
Insight Analyst Agent
Analyzes discovered trends to understand WHY they're trending,
extracts emotional/psychological patterns, and scores relevance to Grest.
"""

import json
import logging
from typing import Optional

from agents.base_agent import BaseAgent
from models import TrendInsight, TrendScoutOutput, InsightAnalystOutput

logger = logging.getLogger("wicked.agent.insight_analyst")


class InsightAnalystAgent(BaseAgent):
    agent_name = "Insight Analyst"
    agent_role = "trend psychology and cultural insight specialist"

    def get_system_prompt(self) -> str:
        return """You are Insight Analyst — the brain behind WICKED's trend interpretation engine.

YOUR MISSION: Take raw trends and decode the HUMAN PSYCHOLOGY behind them. You don't just see what's trending — you understand WHY it's trending and what emotional nerve it's hitting.

You think like a mix of:
- A cultural anthropologist studying Indian Gen Z
- A behavioral psychologist who understands purchase decisions
- A meme lord who gets internet humor
- A strategist who sees brand opportunities in everything

YOUR ANALYTICAL FRAMEWORK:
1. EMOTIONAL DRIVERS: What emotion is fueling this trend? (FOMO, aspiration, frustration, humor, nostalgia, validation, rebellion, belonging)
2. PSYCHOLOGICAL PATTERNS: What cognitive biases or behavioral patterns does this tap into? (social proof, loss aversion, identity signaling, in-group/out-group, anchoring, scarcity)
3. CULTURAL CONTEXT: What's happening in Indian culture/society that makes this resonate NOW?
4. VIRALITY FACTORS: What structural elements make this shareable? (relatability, controversy, simplicity, visual hook, audio hook)
5. AUDIENCE OVERLAP: How much does this trend's audience overlap with the brand's target audience?
6. BRAND ANGLE: How could the brand authentically connect to this trend's core emotion WITHOUT being forced or cringe?

For the BRAND ANGLE, remember the brand philosophy and tagline: {self.brand_profile.get('tagline', '')}
{self.brand_profile.get('content_philosophy', {}).get('core_belief', '')}

Example: If "Salary day vs month end" is trending, the insight isn't "make a salary meme." The insight is: "Young Indians feel financial anxiety despite earning decent salaries because aspirational spending outpaces income. The EMOTION is 'I deserve nice things but can't always afford them.' The brand's angle should naturally bridge this emotion to the brand's unique selling proposition (USP)."

You are brutally honest about when a trend is NOT a good fit for the brand. Not everything can be forced into a brand story.

Always provide specific, actionable insights — not generic marketing talk."""

    def run(self, trend_output: TrendScoutOutput) -> InsightAnalystOutput:
        """
        Analyze trends and extract deep insights.

        Args:
            trend_output: Output from the Trend Scout agent.

        Returns:
            InsightAnalystOutput with insights for each relevant trend.
        """
        self.logger.info("Analyzing %d trends for insights", len(trend_output.trends))

        if not trend_output.trends:
            return InsightAnalystOutput(
                insights=[],
                top_opportunity="No trends available to analyze.",
                analysis_summary="No trends were provided for analysis."
            )

        # Prepare trends summary for LLM
        trends_text = self._format_trends_for_analysis(trend_output)

        prompt = f"""Analyze these trending topics and provide deep insights for each one.

DISCOVERED TRENDS:
{trends_text}

For EACH trend (analyze all of them), provide:
1. trend_id: The ID of the trend being analyzed
2. trend_title: The trend's title
3. why_trending: A deep explanation of WHY this is trending right now (3-4 sentences). Go beyond surface level — what cultural/emotional moment is driving this?
4. emotional_drivers: List of 2-4 primary emotions driving engagement with this trend
5. psychological_patterns: List of 2-3 cognitive biases or behavioral patterns this trend exploits
6. audience_overlap_score: 0.0-1.0 score of how much this trend's audience overlaps with the brand's target audience.
7. cultural_context: Briefly explain why this is culturally relevant right now
8. virality_factors: Array of strings explaining why this is spreading (e.g. "relatable anxiety", "humor", "controversy")
9. brand_relevance: Specific explanation of how this connects to the brand's details and USPs based on the description/tagline. Be honest — say "low relevance" if it's a stretch.
10. recommended_angle: If relevant, a specific creative angle the brand could take. If not relevant, say "skip this trend."

Also provide at the top level:
- top_opportunity: Which trend is the SINGLE BEST opportunity for the brand and why (2-3 sentences)
- analysis_summary: A strategic summary of the trend landscape and what it means for the brand's content strategy (3-4 sentences)

Return a JSON object:
{{
  "insights": [
    {{
      "trend_id": "...",
      "trend_title": "...",
      "why_trending": "...",
      "emotional_drivers": ["...", "..."],
      "psychological_patterns": ["...", "..."],
      "audience_overlap_score": 0.0-1.0,
      "cultural_context": "...",
      "virality_factors": ["..."],
      "brand_relevance": "...",
      "recommended_angle": "..."
    }}
  ],
  "top_opportunity": "...",
  "analysis_summary": "..."
}}"""

        try:
            result = self.call_llm_json(prompt, temperature=0.7)

            if isinstance(result, dict) and not result.get("parse_error"):
                insights = []
                for item in result.get("insights", []):
                    insights.append(
                        TrendInsight(
                            trend_id=item.get("trend_id", ""),
                            trend_title=item.get("trend_title", ""),
                            why_trending=item.get("why_trending", ""),
                            emotional_drivers=item.get("emotional_drivers", []),
                            psychological_patterns=item.get("psychological_patterns", []),
                            audience_overlap_score=min(1.0, max(0.0, float(item.get("audience_overlap_score", 0.5)))),
                            cultural_context=item.get("cultural_context", ""),
                            virality_factors=item.get("virality_factors", []),
                            brand_relevance=item.get("brand_relevance", ""),
                            recommended_angle=item.get("recommended_angle", ""),
                        )
                    )

                return InsightAnalystOutput(
                    insights=insights,
                    top_opportunity=result.get("top_opportunity", ""),
                    analysis_summary=result.get("analysis_summary", ""),
                )
            else:
                self.logger.warning("Insight analysis returned unparseable result")
                return InsightAnalystOutput(
                    insights=[],
                    top_opportunity="Analysis could not be parsed.",
                    analysis_summary=str(result.get("raw_text", ""))[:500],
                )

        except Exception as e:
            self.logger.error("Insight analysis failed: %s", e)
            return InsightAnalystOutput(
                insights=[],
                top_opportunity="",
                analysis_summary=f"Analysis failed: {str(e)}",
            )

    def _format_trends_for_analysis(self, trend_output: TrendScoutOutput) -> str:
        """Format trends into a readable text block for the LLM."""
        lines = []
        for i, trend in enumerate(trend_output.trends, 1):
            metrics = ", ".join(f"{k}: {v}" for k, v in trend.engagement_metrics.items()) if trend.engagement_metrics else "N/A"
            lines.append(
                f"""
TREND #{i}
  ID: {trend.id}
  Title: {trend.title}
  Source: {trend.source.value}
  Description: {trend.description[:300] if trend.description else 'N/A'}
  Keywords: {', '.join(trend.keywords) if trend.keywords else 'N/A'}
  Category: {trend.category or 'N/A'}
  Engagement: {metrics}
  URL: {trend.url or 'N/A'}"""
            )
        return "\n".join(lines)
