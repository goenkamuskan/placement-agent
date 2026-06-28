import json
from langchain_google_genai import ChatGoogleGenerativeAI
from app.core.config import GEMINI_API_KEY

# Initialize the LLM once
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=GEMINI_API_KEY,
    temperature=0  # 0 = deterministic, we want consistent parsing not creativity
)

def parse_drive_announcement(raw_text: str) -> dict:
    """
    Takes raw placement announcement text and uses Gemini to extract
    structured data from it.
    """

    prompt = f"""
You are a placement cell assistant. Extract structured information from the following placement drive announcement.

Return ONLY a valid JSON object with these exact fields:
- company_name (string)
- eligible_branches (list of strings, e.g. ["CSE", "IT", "ECE"])
- min_cgpa (float, e.g. 7.5. If not mentioned, use 0.0)
- max_backlogs_allowed (integer. If not mentioned, assume 0)
- role (string, the job role/position)
- package_lpa (float, salary in LPA. If not mentioned, use null)
- apply_deadline (string in ISO format YYYY-MM-DD, if mentioned. Otherwise null)
- drive_date (string in ISO format YYYY-MM-DD, if mentioned. Otherwise null)

Announcement:
{raw_text}

Return only the JSON, no explanation, no markdown, no code blocks.
"""

    response = llm.invoke(prompt)
    raw_response = response.content.strip()

    # Clean up in case model adds markdown anyway
    if raw_response.startswith("```"):
        raw_response = raw_response.split("```")[1]
        if raw_response.startswith("json"):
            raw_response = raw_response[4:]

    parsed = json.loads(raw_response)
    return parsed
