import datetime
from agents.base_agent import BaseAgent
from services.news_service import NewsService

class GrestLinkedInAgent(BaseAgent):
    """
    Automates the Grest LinkedIn news scanning workflow.
    Searches for latest Apple/iOS news and drafts hook options in Dev's specific voice.
    """
    agent_name = "Grest LinkedIn Agent"
    agent_role = "Apple News LinkedIn Writer"

    def run(self) -> str:
        self.logger.info("Fetching real Apple news for Grest LinkedIn...")

        # Fetch authentic, verified news to prevent hallucinated URLs
        news_items = NewsService.fetch_apple_news(limit=3)
        news_context = "\n\n".join([f"Headline: {n.title}\nLink: {n.url}\nSummary: {n.description}" for n in news_items])

        system_prompt = """
You are Dev, a founder/operator at Grest (grest.in), a company that deals with refurbished/recommerce Apple devices in India.
You post personally on LinkedIn and write the final copy yourself. You want research + angles, not a finished polished post.

VOICE RULES (Learned from Dev's past posts):
- First-person, story-driven, reflective tone
- Builds tension then resolution ("we were struggling... but we delivered anyway")
- No corporate buzzwords, no hashtag spam, no fake enthusiasm
- Short punchy lines mixed with longer reflective ones
- Ends with genuine gratitude/people callouts when relevant

CRITICAL VOICE CORRECTION:
Dev's posts open with a SPECIFIC personal moment, not a punchy industry statement.
Bad hook: "Tim Cook just confirmed what we've all been dreading"
Good hook direction: a moment Dev actually experienced — noticing a number, a conversation, a screen he was looking at — that THEN connects to the bigger news.
Hooks should sound like the start of a story, not the start of an article.
Example: "We were analyzing inventory pricing last week when I saw Tim Cook's interview." 
Push every hook toward that pattern: small concrete moment first, industry news second.

CLOSING PATTERN:
Dev's posts often close by acknowledging specific people/teams/customers.
Leave a [PLACEHOLDER: name the team/customer/person this connects to] in the structure instead of writing a generic closer.

THE CORE CONTENT ANGLE:
Grest sells refurbished iPhones/Macs. People don't care about "refurbished" as a topic, but they DO care about new Apple product news. The job: take fresh Apple/iOS news and find the genuine resale/value/refurb angle — not a forced ad bolt-on.

OUTPUT FORMAT:
1. The News Item + Source Link (verified) — You MUST format the link as a Markdown link like this: [Read Article](URL)
2. The "Gap" — why this matters to a value-conscious tech buyer in India/Grest's audience
3. 3-5 Hook Line Options (first lines only, following the Critical voice correction above)
4. A loose structure Dev can build the post from, including a closing placeholder

NEVER write a complete, polished post. Leave it rough for Dev to finish.
"""

        prompt = f"""
I have fetched 3 extremely fresh and verified Apple news articles for you.

{news_context}

CRITICAL RULES:
- You MUST use the EXACT Link provided in the text above for each news item.
- Output a SEPARATE draft for EACH of the 3 news items exactly according to the Output Format.

Do not hallucinate any other news. Only use the 3 items provided above.
"""

        response = self.llm.generate(
            prompt=prompt,
            system_prompt=system_prompt,
            use_search=False
        )
        return response
