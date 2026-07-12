"""
Voice Sample Categories
Almost all short-form brand content falls into one of three formats —
Satire, Emotional, Infographic — each built around a named, reusable
creative concept rather than a vague "tone." Structural Designer and
Script Writer require one of these to be selected; each concept block
below is deliberately mechanical (a repeatable technique, not a mood)
so the agent can apply it to an arbitrary new brand/pain-point and
invent a fresh scenario, never reproduce the reference example it was
distilled from.
"""

MISDIRECTION_SKELETON = """=== SHARED SKELETON: MAXIMUM DISTANCE HOOK + THE MIDPOINT RULE ===
This applies underneath every category below — categories layer their
specific flavor on top of it, they never replace it.

MAXIMUM DISTANCE HOOK: the hook should open on a topic that appears to
have ZERO connection to any brand. This is not randomness — the gap
should feel completely disconnected at first and then feel inevitable
only if and when anything resembling a "reveal" happens at all.

NO BRAND, NO PRODUCT, AND THAT'S OFTEN CORRECT (critical — read
carefully, this is the rule most often broken): you have deliberately
not been told what client or product this is for. The story's subject
matter comes ENTIRELY from the KEYWORD/TOPIC given for this specific
brief. Never invent, guess, or reference a brand, a product category, an
industry, or "essence" of a company anywhere in the piece — not in the
hook, not in the build, not even at the very end. It is completely fine,
and often the stronger creative choice, for a structure or script to
never mention any brand, product, or company at all. Do not manufacture
a "brand moment," a product plug, or a buy-this CTA just because ads
conventionally have one — if the keyword/story doesn't organically call
for one, end the piece on its own terms instead.

THE BRIDGE FORMULA (optional shape, only if a landing genuinely fits):
unrelated hook (high relevance, high emotion) -> validate the obvious
assumption -> pivot with one sharp, specific stat/fact -> a payoff, not
an announcement. This reads closer to documentary/journalism structure
than ad structure. Using this shape does NOT require or imply a brand
belongs at the end — the "pivot" can just as easily land on the story's
own twist, irony, or punchline with nothing commercial attached.

THE MIDPOINT RULE: this has to hold for roughly the first HALF of the
video's total runtime. If someone watches only the first 50% and stops,
they should have no real idea what the video is even about, let alone
that it's for a brand or which category it's in. Resist the temptation to
hint at the category around the 25-40% mark "just to be safe" — hold the
misdirection all the way to the midpoint. This applies even when —
especially when — the input keyword is flat, generic, or seemingly
mediocre. A boring keyword is never an excuse for a boring, front-loaded
structure.
=== END SHARED SKELETON ==="""

_INVENT_FRESH = (
    "Invent a brand-new scenario for THIS brief from scratch — do not "
    "reuse, lightly reskin, or paraphrase the reference example above. "
    "The example illustrates the MECHANIC, not a template to fill in. "
    "If your first idea resembles the reference example's plot in any "
    "specific, recognizable way, discard it and think of a different one. "
    "Note also that the reference example includes a brand only because "
    "that's how that specific real ad happened to be briefed — your brief "
    "does not include a brand at all, and should not invent one. Build "
    "the story purely from the keyword given below."
)

VOICE_CATEGORIES: dict[str, dict] = {
    "satire": {
        "label": "Satire",
        "concept_name": "EAAS — Exaggeration As A Service",
        "short_description": (
            "Escalate a real, mundane pain point into an absurd, "
            "disproportionate story from a totally different genre — "
            "comedy comes from the gap between how small the real "
            "problem is and how outrageous the exaggerated version gets."
        ),
        "humor_required": True,
        "task_checklist": (
            "This structure MUST escalate the pain point implied by the "
            "GIVEN KEYWORD into a disproportionate, absurd STORY from an "
            "unrelated genre (not just an unrelated topic — an escalating "
            "narrative with mounting absurd stakes, causally consistent "
            "step to step). No brand or product should appear anywhere — "
            "that's expected and fine, not a gap to fill."
        ),
        "prompt_block": f"""=== CATEGORY: SATIRE — EAAS (EXAGGERATION AS A SERVICE) ===

THE MECHANIC:
1. Start from the real, mundane pain point implied by the KEYWORD/TOPIC
   given for this brief. No brand or product has been given to you — do
   not invent one or reshape the pain point toward one.
2. Take the STAKES of that pain point — not the topic, the STAKES — and
   escalate them to a disproportionate, absurd extreme. Multiply the
   scale, the timeline, or the consequence far beyond anything realistic,
   while keeping the internal logic of the escalated story completely
   consistent — the audience must be able to follow every step even as
   it gets ridiculous. Nothing is "randomly weird"; every beat follows
   causally from the one before it.
3. The escalation should hijack a genre or scenario that has nothing to
   do with the keyword's surface topic (a heist, a courtroom drama, a
   survival story, a rivalry, a slow-burn family saga — pick whatever the
   keyword's pain point suggests). The audience should feel like they're
   watching THAT story on its own terms.
4. The exaggerated version should map back onto the KEYWORD's real pain
   point by the end — the "aha" is realizing the outrageous story was a
   literal, if extreme, dramatization of that real problem. This payoff
   is about the STORY resolving itself, not about introducing a brand —
   no product or company needs to appear for the piece to be complete.
5. Comedy is generated by the gap between the small real annoyance and
   the catastrophic fictional consequence — not by one-liners bolted on
   afterward. The escalation itself has to be the joke.

REFERENCE EXAMPLE (mechanic only, do not reuse the plot):
A phone brand's real pain point is slow after-sales repair service; the
real solution is fast at-home repair. The ad escalates "repair takes too
long" into: a kidnapped child is raised by his kidnapper — fed, educated,
married off, made a grandfather — all while still tied up, because the
real dad's phone was never fixed by the time he died waiting at the
service centre. The absurd multi-generational timeline IS the joke about
how long repairs take; the brand's actual instant-repair promise lands as
the punchline resolution.

{_INVENT_FRESH}

HUMOR IS MANDATORY IN THIS CATEGORY: the script is not done until it
contains at least one moment that would get a real laugh or a delighted
"no way" — not just a light tone, an actual comedic beat built from the
escalation itself.
=== END CATEGORY: SATIRE ===""",
    },
    "emotional": {
        "label": "Emotional",
        "concept_name": "RWIT — Realism With Indirect Truth",
        "short_description": (
            "A character hides a harder truth behind a composed surface "
            "to protect someone else; the truth surfaces indirectly, "
            "through an artifact or observation, not a confession."
        ),
        "humor_required": False,
        "task_checklist": (
            "This structure MUST include: (1) a beat establishing the "
            "composed 'surface' a character shows the world, rooted "
            "entirely in the GIVEN KEYWORD's own subject matter, and (2) a "
            "later beat where a hidden, harder truth surfaces via an "
            "INDIRECT artifact or observation (a letter, a discovered "
            "detail — never a direct confession). No brand or product "
            "should appear anywhere — that's expected and fine. A "
            "structure without a real surface-vs-hidden-truth beat pair "
            "is not RWIT, no matter how sentimental the copy is."
        ),
        "prompt_block": f"""=== CATEGORY: EMOTIONAL — RWIT (REALISM WITH INDIRECT TRUTH) ===

THE MECHANIC:
1. Start from a real emotional pain point tied to protection, safety, or
   dignity within a relationship (family, partner, friend, mentor) —
   rooted entirely in the KEYWORD/TOPIC given for this brief. No brand or
   product has been given to you — do not invent one or reshape the
   struggle toward one.
2. Build a character who maintains TWO layers of truth simultaneously:
   the composed, together, "fine" surface they show the world or a
   specific person, and a harder hidden reality underneath that they are
   deliberately protecting that person from (a struggle, a sacrifice, a
   fear, a cost).
3. Do NOT reveal the hidden layer through direct confession, narration,
   or exposition. Reveal it through an indirect artifact or observation —
   a letter, a note, an overheard detail, something discovered rather
   than declared — that recontextualizes everything already shown to the
   audience. The reveal should land as a single sentence or beat that
   makes the viewer want to mentally replay what they just watched.
4. The person protecting the truth should have a clear, specific reason
   the direct truth would hurt or embarrass the person they're hiding it
   from — the hiding is an act of love or dignity, not a plot device.
5. The payoff is the emotional recognition itself — the audience
   understanding what was really going on. Nothing needs to "arrive" at
   the end to complete it; no product, company, or service needs to
   appear for this to be a finished, satisfying piece.

REFERENCE EXAMPLE (mechanic only, do not reuse the plot):
An insurance brand's real pain point is families not being financially
protected against uncertainty; the real solution is a policy. The ad
shows a daughter's letter praising her father, until it states "but my
father lies" — he secretly works menial jobs and hides hunger, pain, and
unemployment from her so she won't feel embarrassed or burdened, always
re-dressing as a "successful" parent before picking her up. The daughter
reveals she has known all along, choosing a letter over a confrontation
so he keeps his dignity. The brand is mentioned only as part of what
allowed the family to be okay despite everything — never as the hero.

{_INVENT_FRESH}

DO NOT FORCE HUMOR IN THIS CATEGORY: a joke here undercuts the payoff.
The target reaction is quiet recognition, a lump in the throat, or "wait,
go back and re-watch the beginning" — not a laugh. If a line reads funny,
cut or rewrite it.
=== END CATEGORY: EMOTIONAL ===""",
    },
    "infographic": {
        "label": "Infographic",
        "concept_name": "WAAAAS — Weirdness And Absurdity As A Service",
        "short_description": (
            "Stage a confrontation that reads as genuinely weird to "
            "onlookers, let the confusion sit unexplained, then land one "
            "reframing line that makes the message hit harder for it."
        ),
        "humor_required": False,
        "task_checklist": (
            "This structure MUST stage a SPECIFIC behavior/confrontation, "
            "rooted entirely in the GIVEN KEYWORD's own subject matter, "
            "that reads as objectively weird or contradictory to onlookers "
            "in the scene — not just an unusual topic, an actual moment "
            "someone would find confusing or off if they walked past it. "
            "Hold that weirdness unexplained for multiple beats before a "
            "single reframing beat resolves it. No brand or product should "
            "appear anywhere — that's expected and fine."
        ),
        "prompt_block": f"""=== CATEGORY: INFOGRAPHIC — WAAAAS (WEIRDNESS AND ABSURDITY AS A SERVICE) ===

THE MECHANIC:
1. Start from a behavior-change message, stat, or fact relevant to the
   KEYWORD/TOPIC given for this brief — a civic, social, or
   general-interest message. No brand or product has been given to you —
   do not invent one or force the message toward one.
2. Stage a real-world scene where a character or group does something
   that reads as objectively weird, confrontational, or contradictory to
   onlookers — accusing people of something visibly untrue, insisting on
   a claim that contradicts what's plainly observable, behaving oddly
   toward strangers. The weirdness has to be genuinely uncomfortable or
   confusing to watch, not cute.
3. Let the audience — and the people inside the scene — sit in real
   confusion or mild irritation at the weirdness for a beat BEFORE any
   explanation is given. Do not rush to clarify or wink at the camera.
   The confusion is doing the work of holding attention; don't shortcut it.
4. Land a single reframing line that redefines the terms of the
   confrontation — the same words or behavior that seemed nonsensical a
   second ago instantly become logical once this line recontextualizes
   them. The message should hit harder specifically BECAUSE it was
   earned through confusion first, not delivered upfront.
5. Close plainly on the message once the twist has landed — this
   format's job is informational impact, not subtlety, so the ending can
   be direct. No product or company needs to appear for this to be a
   finished, satisfying piece; the message itself is the payoff.

REFERENCE EXAMPLE (mechanic only, do not reuse the plot):
A tea brand's real pain point is low voter turnout; the real message is
"go vote." The ad shows people handing out tea to a fully awake, talking,
wide-eyed queue outside a cinema, insisting each person is "asleep" and
needs tea to "wake up" — which reads as bizarre and confrontational,
since everyone is visibly awake. When challenged, the line lands: "if
you're here instead of at the voting booth, then yes, you are asleep" —
redefining "asleep" as failing a civic duty, instantly making the
confrontation make sense and landing the message with more force than a
direct PSA would have.

{_INVENT_FRESH}

HUMOR IS OPTIONAL, NOT REQUIRED, IN THIS CATEGORY: deadpan or absurdist
beats are welcome if they arise naturally from the weirdness, but the
target reaction is "wait, WHAT — ...oh." (curiosity resolving into
understanding), not necessarily a laugh. Don't force a joke that isn't
there.
=== END CATEGORY: INFOGRAPHIC ===""",
    },
}

DEFAULT_BLOCK = """=== NO CATEGORY SELECTED — DEFAULT MISDIRECTION SKELETON ===
No Satire/Emotional/Infographic category was selected for this
generation (this happens for callers outside Creative Studio, e.g. the
original pipeline). Apply the shared skeleton only, with no category
flavor: open on a hook with zero apparent connection to the brand,
build the same unrelated story for roughly the first half of the
runtime with no hints, then land the brand as an unexpected turn near
the midpoint rather than a calm, telegraphed conclusion. Humor is
welcome if it fits naturally but is not mandatory.
=== END DEFAULT ==="""


def get_category_block(category: str) -> tuple[dict | None, str]:
    """Look up a category by key. Returns (category_dict_or_None,
    prompt_block) — prompt_block falls back to DEFAULT_BLOCK for an
    empty/unknown key so every caller always has something to inject."""
    cat = VOICE_CATEGORIES.get(category)
    if cat is None:
        return None, DEFAULT_BLOCK
    return cat, cat["prompt_block"]


def humor_required(category: str) -> bool:
    cat = VOICE_CATEGORIES.get(category)
    return bool(cat and cat.get("humor_required"))


def categories_for_api() -> list[dict]:
    """Public-facing shape for GET /api/voice-categories — label/concept
    name/description only, never the full prompt_block."""
    return [
        {
            "key": key,
            "label": cat["label"],
            "concept_name": cat["concept_name"],
            "short_description": cat["short_description"],
        }
        for key, cat in VOICE_CATEGORIES.items()
    ]
