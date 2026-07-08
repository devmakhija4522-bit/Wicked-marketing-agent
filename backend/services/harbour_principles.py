"""
Harbour creative-principles prompt fragments.

Condensed from the user's personal creative-thinking framework (ideation,
storytelling, self-critique) into compact, agent-specific directives. These
are prompt content only — no new agents, stages, or endpoints. Each fragment
is injected into an existing agent's system prompt via harbour_block().

Toggle off entirely with HARBOUR_MODE_ENABLED=false (see config.py) to
compare against prior prompt behavior.
"""

from config import settings

IDEATION_FRAGMENT = """
=== CREATIVE FRAMEWORK: IDEATION ===
Before generating concepts, run this thinking loop for the trend/insight at hand:
Who experiences this? -> Why do they care? -> What emotion exists? -> What
behavior/contradiction/stereotype appears? -> What story exists here?

Ground rules:
- Start from a human, never the product. The stated reason someone buys something
  ("better camera") is rarely the real one (status, finally affording it, not
  wanting to feel left out) — dig for the real emotional reason.
- Contradictions are content: people want luxury but hunt discounts, buy
  expensive phones with cheap cases. Look for one to build the concept around.
- The customer is the hero. The brand only helps them become who they want to be.
- Every concept needs a genuine surprise — predictable ideas get ignored.
- Prefer a recurring, recognizable character/scenario over a generic demographic.
- Consider content patterns beyond straight explanation: Expectation vs Reality,
  POV, Honest Version, Nobody Talks About This, Myth vs Reality, Before vs
  After, The Decision, Hidden Truth, Internal Monologue, The Butterfly Effect
  (one small decision -> unexpected chain of consequences).
- Before finalizing: would 100 other marketers given this same trend land on
  something similar? If yes, push past the obvious first idea.

Never open a concept with the brand name or a feature list. Avoid these
constructions entirely — they read as generated text: "Imagine...", "In
today's world...", "Have you ever...", "As we all know...", "Nowadays...".
"""

WRITING_FRAGMENT = """
=== CREATIVE FRAMEWORK: WRITING ===
First, silently decide: what should the audience feel by the end (curious,
amused, validated, relieved)? Something must change between the first line
and the last — that's what makes it a story instead of a list of facts.

The hook is a promise, not a sentence — its only job is to make the brain ask
"what happens next?", never to explain or summarize the topic.

Delayed reveal: the brand should feel like the story's natural conclusion,
discovered rather than announced. Self-check before finalizing: "if the brand
disappeared, would this scene still make sense on its own?" If the story falls
apart without the brand mention, it was never really a story — rework it.

Write scenes, not summaries. "His old phone still worked. The new one was
still in the box" beats "he wasted money." Ask what the audience would
actually see on screen for each line.

Show evidence, don't claim adjectives: a specific detail ("50-point quality
check") beats a vague claim ("high quality").

Cut any line that doesn't move curiosity, emotion, or understanding forward —
every line should earn the next one existing.
"""

CRITIQUE_FRAGMENT = """
=== CREATIVE FRAMEWORK: SELF-CRITIQUE ===
Before finalizing your review, silently check the script against these
questions — this is in addition to, not instead of, your normal scoring
rubric below:
- Is this memorable? Would an ordinary viewer actually stop scrolling for it?
- Does it sound human, or does it read as AI-generated / corporate copy?
- Would this survive as a story if the brand mention were removed? If the
  narrative collapses without the brand, that's a structural issue worth
  flagging even if the brand-safety checklist technically passes.
- Is the hook an actual curiosity-driving promise, or does it explain/summarize
  the topic outright (a common AI-tell)?
When flagging issues, prioritize in this order — a broken hook or core idea
matters more than a weak CTA, so don't let a polished CTA hide a weak hook:
Hook -> Core Idea -> Story Structure -> Emotional Impact -> Brand Integration -> CTA.
"""


def harbour_block(fragment: str) -> str:
    """Returns the fragment as-is when Harbour mode is on, empty string
    otherwise — lets call sites just inline this in an f-string prompt
    with no branching at the call site."""
    return fragment if settings.harbour_mode_enabled else ""
