"""
Marketing Skills Registry
16 marketing playbooks adapted from the open-source superamped/ai-marketing-skills
project. Each skill is a standalone markdown file (backend/data/marketing_skills/
<category>/<skill-id>/SKILL.md) describing a step-by-step process an LLM follows
to do one marketing task. This module is the single source of truth for their
metadata; MarketingSkillAgent reads the actual playbook text at run time.

Two skills from the source project (Keyword Research, Competitor Keyword
Analysis) require a paid Keywords Everywhere API key WICKED doesn't have and
are deliberately excluded.
"""

from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "marketing_skills"

SKILLS = {
    "ad-angles": {
        "category": "ads",
        "label": "Ad Angles",
        "description": "Brainstorm ad concepts across 5 messaging angles (Problem, Solution, Comparison, Proof, Curiosity), formats, and visual styles.",
        "input_hint": "Product description, target audience, platform (Reddit/LinkedIn/Meta/Google/X), optional competitor names and proof points.",
    },
    "ad-campaign-analyzer": {
        "category": "ads",
        "label": "Ad Campaign Analyzer",
        "description": "Grade running ads Red/Yellow/Green, flag creative fatigue, and recommend scaling.",
        "input_hint": "Campaign data (CSV/table/pasted text: ad name, impressions, clicks, conversions, spend, CPA), target CPA, AOV.",
    },
    "ad-creative": {
        "category": "ads",
        "label": "Ad Creative",
        "description": "Render ad concepts as HTML in 5 template styles (cookie-cutter, ugly, meme, branded, native).",
        "input_hint": "Headline text, style (cookie-cutter/ugly/meme/branded/native), platform, optional brand colors and dimensions.",
    },
    "content-repurposer": {
        "category": "content",
        "label": "Content Repurposer",
        "description": "Turn one long-form piece into a week of short-form social posts (Hub & Spoke method).",
        "input_hint": "The long-form content (paste it), target platform, brand voice/tone, target audience.",
    },
    "content-strategy": {
        "category": "content",
        "label": "Content Strategy",
        "description": "Plan content pillars, topic clusters, editorial calendar, and keyword targeting by buyer stage.",
        "input_hint": "What the company does, ideal customer, primary content goal, main competitors.",
    },
    "social-post-writer": {
        "category": "content",
        "label": "Social Post Writer",
        "description": "Generate social posts from a topic using 9 proven templates (Story, Observation, Contrarian, Listicle, etc.).",
        "input_hint": "Topic or idea, platform (LinkedIn/Twitter/both), voice/tone, optional personal anecdotes or proof points.",
    },
    "conversion-audit": {
        "category": "conversion",
        "label": "Conversion Audit",
        "description": "53-point landing page audit — customer focus, narrative arc, copy, design, CTAs, proof — with prioritized fixes.",
        "input_hint": "The page URL to audit, plus optional context: product, audience, price point.",
    },
    "reply-writer": {
        "category": "reddit",
        "label": "Reddit Reply Writer",
        "description": "Draft a native, non-promotional Reddit reply in one of 3 rotating formats, calibrated to the subreddit's tone.",
        "input_hint": "Subreddit name, thread title, the OP's full text, top existing replies, and your product/brand context.",
    },
    "channel-discovery": {
        "category": "research",
        "label": "Channel Discovery",
        "description": "Map marketing channels for a target audience, score on 5 criteria, recommend the top 3.",
        "input_hint": "Target market definition (identity + industry + business stage), product context, budget/team constraints.",
    },
    "community-discovery": {
        "category": "research",
        "label": "Community Discovery",
        "description": "Discover 100+ online communities (Reddit, Slack, Discord, Facebook, LinkedIn, forums) scored by signal-to-noise.",
        "input_hint": "Audience description (job title, industry, stage), optional product category.",
    },
    "competitor-content-analysis": {
        "category": "research",
        "label": "Competitor Content Analysis",
        "description": "Analyze a competitor's content engine — inventory, SEO plays, comparison pages, gaps.",
        "input_hint": "Competitor name and URL, your product description.",
    },
    "competitor-discovery": {
        "category": "research",
        "label": "Competitor Discovery",
        "description": "Search the web for competitors and produce a ranked direct/adjacent/tangential list.",
        "input_hint": "Product description, target audience, optional known competitors and how many to find.",
    },
    "competitor-landscape": {
        "category": "research",
        "label": "Competitor Landscape",
        "description": "Cross-competitor comparison — feature matrix, pricing, 2x2 positioning map, aggregate SWOT.",
        "input_hint": "Your product info plus data on 2+ competitors (features, pricing, positioning, strengths/weaknesses) — paste prior research if you have it.",
    },
    "competitor-site-analysis": {
        "category": "research",
        "label": "Competitor Site Analysis",
        "description": "Extract structured data from a competitor's website — overview, positioning, pricing, social proof, hiring signals.",
        "input_hint": "Competitor name and homepage URL.",
    },
    "influencer-discovery": {
        "category": "research",
        "label": "Influencer Discovery",
        "description": "Discover 100+ influencers across YouTube, X/Twitter, blogs, newsletters, podcasts, and Instagram, scored by audience overlap.",
        "input_hint": "Industry/niche, target audience, optional platform focus and minimum follower count.",
    },
    "search-page-audit": {
        "category": "search",
        "label": "Search Page Audit",
        "description": "38-point SEO + AI/GEO optimization audit on any URL, with E-E-A-T signals and prioritized fixes.",
        "input_hint": "The page URL to audit, optional focus area (seo-only/geo-only/eeat-only/content-only).",
    },
}

CATEGORY_LABELS = {
    "ads": "Ads",
    "content": "Content",
    "conversion": "Conversion",
    "reddit": "Reddit",
    "research": "Research",
    "search": "Search",
}


def skills_for_api() -> list[dict]:
    """Public-facing shape for GET /api/marketing-skills — id/category/label/
    description/input_hint only, never the full playbook text."""
    return [
        {
            "id": skill_id,
            "category": skill["category"],
            "category_label": CATEGORY_LABELS[skill["category"]],
            "label": skill["label"],
            "description": skill["description"],
            "input_hint": skill["input_hint"],
        }
        for skill_id, skill in SKILLS.items()
    ]


def get_skill_markdown(skill_id: str) -> str:
    """Read a skill's full playbook (SKILL.md) from disk. Raises KeyError if
    skill_id isn't in the registry, FileNotFoundError if its file is missing."""
    skill = SKILLS[skill_id]
    path = DATA_DIR / skill["category"] / skill_id / "SKILL.md"
    with open(path, "r", encoding="utf-8") as f:
        return f.read()
