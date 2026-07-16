from agents.base_agent import BaseAgent
from services.marketing_skills import get_skill_markdown


class MarketingSkillAgent(BaseAgent):
    """
    Runs one of the 16 marketing-skill playbooks (services/marketing_skills.py)
    against a free-text brief, using Gemini's Google Search grounding for any
    real-time research the playbook calls for (same self.llm.generate(...,
    use_search=True) pattern as GMMNewsScoutAgent/GMMHookScoutAgent).
    """
    agent_name = "Marketing Skill Runner"
    agent_role = "Marketing Specialist"

    def run(self, skill_id: str, brief: str) -> str:
        self.logger.info(f"Running marketing skill '{skill_id}' for client '{self.client_id}'")

        playbook = get_skill_markdown(skill_id)
        brand_block = self.brand_context_summary if self.client_id != "generic" else ""

        prompt = f"""{brand_block}

{playbook}

--- USER BRIEF ---
{brief}
"""
        response = self.llm.generate(
            prompt=prompt,
            system_prompt=(
                "You are a senior marketing specialist executing the skill playbook above exactly. "
                "This is a one-shot run, not a conversation — do not stop to ask the user questions; "
                "proceed with the brief as given and state any assumptions you had to make in an "
                "'Assumptions Made' section at the top of your output instead. Use real web search/page "
                "fetching for every research step the playbook calls for — never fabricate competitor "
                "names, URLs, metrics, or quotes. Follow the playbook's own Output Format section exactly."
            ),
            use_search=True,
        )
        return response
