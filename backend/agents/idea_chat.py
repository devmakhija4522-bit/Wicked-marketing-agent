"""
Idea Chat Agent
A conversational creative-brainstorming partner — the alternative entry
point to Keyword Planner's "Fetch Trending Keywords" button. Instead of
a single keyword phrase, the user riffs on an idea in natural language,
back and forth, the way they'd brainstorm with a real creative director.

Once there's enough to work with (or the user asks outright), this agent
hands the distilled topic back to the frontend as a "keyword" the user
can move to Structural Designer — the same carry-forward step Keyword
Planner uses. It does NOT generate a structure/script itself: Structural
Designer and Script Writer now require an explicit category (Satire/
Emotional/Infographic) to be picked first, and that choice has to happen
in the UI, not be silently skipped by the chat.
"""

import logging

from agents.base_agent import BaseAgent
from models import ChatMessage

logger = logging.getLogger("wicked.agent.idea_chat")

SYSTEM_PROMPT = """You are WICKED's creative brainstorming partner — the person
a founder bounces a rough idea off before it becomes a script. Talk like a
sharp, opinionated creative director having a real conversation, not a
customer-support bot. Keep replies short — a couple of sentences, not a
paragraph — unless something genuinely needs more room.

Your job across the conversation:
- If the idea is vague, ask ONE sharp clarifying question, or throw out a
  specific angle to react to. Don't interrogate with a checklist.
- If the user's given you enough to work with, or explicitly asks you to
  move on / generate / write the script, say so plainly and mark
  ready=true — you are NOT writing anything yourself, just distilling the
  idea into a short topic phrase the user can carry into Structural
  Designer, so say something like "got it, ready to move this to
  Structural Designer" rather than implying you're about to write it.
- Don't mark ready until there's an actual usable creative angle, not
  just a bare topic word with nothing else to go on.

Return a JSON object every turn:
{
  "reply": "your conversational response, in character",
  "ready": true or false,
  "topic": "if ready=true, a short phrase distilling the idea into a keyword-style topic; empty string otherwise"
}"""


class IdeaChatAgent(BaseAgent):
    agent_name = "Idea Chat"
    agent_role = "creative brainstorming partner"

    def get_system_prompt(self) -> str:
        return SYSTEM_PROMPT

    def chat(self, messages: list[ChatMessage]) -> dict:
        history = "\n".join(f"{m.role.upper()}: {m.content}" for m in messages)
        prompt = f"""Conversation so far:
{history}

Respond as the next ASSISTANT turn."""

        try:
            result = self.call_llm_json(prompt, temperature=0.85)
        except Exception as e:
            self.logger.error("Idea chat failed: %s", e)
            return self._reply(f"Something broke on my end: {e}")

        if not isinstance(result, dict) or result.get("parse_error"):
            return self._reply("Lost my train of thought there — say that again?")

        reply = str(result.get("reply", "")).strip() or "..."
        ready = bool(result.get("ready"))
        topic = str(result.get("topic", "")).strip()

        if not (ready and topic):
            return self._reply(reply, ready=False)

        return {"reply": reply, "ready": True, "topic": topic}

    @staticmethod
    def _reply(reply: str, ready: bool = False) -> dict:
        return {"reply": reply, "ready": ready, "topic": ""}
