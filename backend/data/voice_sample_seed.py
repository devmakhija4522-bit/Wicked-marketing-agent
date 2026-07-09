"""
Default seed content for the account-wide Voice Sample record.
Used only to populate voice_sample.json / MongoDB on first run — after
that, the stored record (editable via the Voice Sample page) is the
source of truth, not this file.
"""

SCRIPT_WRITING_VOICE_SEED = """# Voice Sample — Script Writing Approach

## Purpose
This file captures how I actually think through writing a script once a
topic/keyword is chosen — how I build the hook, how far I keep the brand
from the opening line, and how I bridge back to it. Structural Designer
and Script Writer should reference this file when generating hooks and
script structure, instead of defaulting to the generic pattern of
opening near the product and explaining it.

---

## Core Principle: Maximum Distance Hook

The hook should open on a topic that appears to have **zero connection**
to the brand or client. The audience should not be able to predict, from
the opening line alone, where the brand angle is eventually coming from.
The wider the apparent gap between the hook and the brand, the stronger
the "wait... that actually connects" moment once the bridge lands.

This is not randomness. The gap should feel completely disconnected at
first and then feel inevitable once the bridge is revealed. Never force
a connection that doesn't logically hold — but never open with anything
that telegraphs the product either.

---

## Worked Example (real case: Grest, refurbished phones, sustainability)

**Generic/AI-default version:** open by explaining refurbished phones
are more sustainable than new ones, then introduce Grest. This reads
like an ad within the first two lines — no curiosity, no distance.

**What I'd actually do instead:**

1. **Open on a completely unrelated, high-frustration, high-relevance
   topic** — something the audience already feels strongly about. In
   this case, Delhi's air pollution:

   > "दिल्ली में सांस लेने में दिक्कत हो रही है? हमें पता है क्यों।"
   > *(Trouble breathing in Delhi? We know why.)*

   At this point the audience has no idea this is going anywhere near
   phones. That's the point.

2. **Validate the obvious assumption first.** Let people assume the
   usual culprits — cars, factories — before redirecting. This keeps
   them inside a topic they already care about, instead of jumping them
   somewhere unfamiliar too fast.

3. **Pivot with one sharp, specific, sourced statistic** — not a vague
   claim:

   > "But do you know how much your new phone contributes to this?"
   > "80% of a phone's carbon footprint comes from manufacturing it
   > new. A refurbished phone's footprint is close to zero."

   The stat is the hinge the entire hook turns on. It has to be
   specific and credible — a vague or invented-sounding number breaks
   trust at exactly the moment curiosity is highest.

4. **Let the brand be the conclusion, not the announcement.** It enters
   as the answer that was already implied by the stat:

   > This is where Grest fits — refurbished devices as the practical
   > way to act on what you just learned.

---

## The Bridge Formula

Unrelated hook (high relevance, high emotion)
→ validate the obvious assumption
→ pivot with one sharp, specific stat/fact
→ let the brand be the conclusion, not the announcement

This is closer to documentary/journalism structure than ad structure —
start wide, narrow in, land on the specific case last.

---

## Tone Ingredients — how and when to use them

- **Humor / satire** — works best when it punctures a frustration the
  audience already feels (pollution, corporate life, cost of living).
  The joke should come from recognition, not randomness.
- **Dark humor** — fits when the hook's stakes are genuinely serious
  (health, environment, money). The humor comes from stating the
  problem bluntly and without filter, not from making light of the
  problem itself.
- **Raw / blunt phrasing** — I lean toward direct, sometimes coarse,
  colloquial Hindi/Hinglish rather than polished corporate language.
  Keep that rawness in tone even when specific words get smoothed out
  for a client-safe final cut — don't sand it down into something that
  reads like a brand deck.
- **Emotion** — should come through specificity (a real stat, a real
  number, a real consequence), not through adjectives like "shocking"
  or "unbelievable."

---

## Anti-Patterns (what I don't want)

- Opening with the product, brand name, or category in the first line.
- Explaining "why refurbished is good" before the audience has a reason
  to care yet.
- Vague or unsourced statistics used purely for shock value.
- Polished/corporate tone that strips out the rawness of how the point
  would actually be said out loud.
"""

IDEA_CATEGORIZATION_VOICE_SEED = """# Voice Sample — Content Idea & Categorization Approach

## Purpose
This file captures how I actually think through turning a keyword or
topic into a content series — specifically how I build "types of ___"
style categories. Keyword Planner and Structural Designer should
reference this whenever a keyword gets expanded into a list of angles
or characters, instead of defaulting to generic demographic buckets.

---

## Core Principle: Dramatic, Named Characters — Never Generic Buckets

Given a keyword like "types of customers buying an iPhone," the
default/generic output looks like:

> Student, Professional, Creator, Parent

This is technically correct and completely useless — nobody recognizes
themselves or anyone else in it.

What I actually do instead is build **specific, exaggerated, named
archetypes** — the kind of character where someone immediately reacts
with "oh my god that's my cousin" or "that's literally me," off a single
label alone.

---

## Worked Example (real case: "types of customers buying an iPhone in 2026")

Instead of the generic list above, my actual categories would be:

1. **The Tech Geek** — knows the chip name and the camera sensor size,
   and will explain both to you unprompted.
2. **The Content Creator** — buys the Pro Max before learning how to
   use manual focus.
3. **The Ultra-Westernized "Sobo" Girl** — the aesthetic-and-affectation
   archetype: imported brands, constant name-drops, performs a lifestyle
   more than she actually lives it.
4. **The Frustrated Corporate Employee** — buys it the day the
   appraisal hits, then tells everyone "it's just a phone."
5. **The 2026 Kid Trying To Be An Influencer** — has 40 followers,
   refers to their "content" and "brand deals" completely unironically.

Notice the specificity: each one stacks a job/aesthetic/behavior/
generation marker together, not just a role on its own.

---

## Category Construction Rules

- Each category should stack **at least two specificity layers**
  together — e.g. (behavior) + (aesthetic), or (life-stage) +
  (generation marker), or (job) + (attitude). One layer alone reads
  generic; two or more reads like a real, specific person.
- Categories should be **behavior/aesthetic-based**, never based on
  protected characteristics (ethnicity, religion, disability, etc.) —
  the archetype should describe something someone performs or a role
  they occupy, not something they inherently are.
- Aim for **5+ categories per keyword** before settling. The first 2-3
  tend to be the obvious ones; the sharper, funnier ones show up
  further down the list.
- At least one category per set should carry dark humor, satire, or a
  slightly mean-but-true edge — "safe" categories alone don't create
  the "wait, that's literally me" reaction.
- Time/generation markers ("in 2026," "post-appraisal season," "post-
  pandemic") sharpen a category instantly — always consider adding one.

---

## Tone Dial

Every category set should be checked for a mix, not uniformity:

- At least one **purely funny/exaggerated** entry
- At least one **emotionally real/bittersweet** entry (e.g. the
  corporate employee rewarding themselves)
- At least one **satirical/borderline savage** entry
- Optionally, one **dark humor** entry if the topic supports it

---

## Anti-Patterns (what I don't want)

- Categories that are just job titles or demographics with nothing
  behavioral attached ("Student," "Professional").
- Categories so broad no specific person would recognize themselves in
  them.
- Playing it safe — a category set with no edge or humor at all reads
  like a market research report, not content.
"""
