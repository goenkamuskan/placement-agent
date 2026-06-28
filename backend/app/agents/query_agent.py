import json
from langchain_google_genai import ChatGoogleGenerativeAI
from app.core.config import GEMINI_API_KEY
from app.core.database import supabase

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=GEMINI_API_KEY,
    temperature=0
)


def extract_filters(question: str) -> dict:
    """
    Uses Gemini to extract query filters from a natural language question.
    """
    prompt = f"""
You are a placement cell assistant. A student asked this question:
"{question}"

Extract search filters for placement drives from this question.
Return ONLY a valid JSON object with these optional fields:
- min_package (float, minimum LPA they want)
- max_package (float, maximum LPA)
- branches (list of strings, e.g. ["CSE", "IT"])
- min_cgpa (float, minimum CGPA required by company)
- max_backlogs (integer, maximum backlogs allowed)
- company_name (string, if they asked about a specific company)
- role (string, if they asked about a specific role)

Only include fields that are clearly mentioned or implied. Return empty dict {{}} if no filters found.
Return only JSON, no explanation.
"""
    response = llm.invoke(prompt)
    raw = response.content.strip()

    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]

    try:
        return json.loads(raw)
    except:
        return {}


def query_drives(filters: dict) -> list:
    """
    Runs a safe, controlled query on the drives table using extracted filters.
    """
    query = supabase.table("drives").select("*")

    if filters.get("min_package"):
        query = query.gte("package_lpa", filters["min_package"])

    if filters.get("max_package"):
        query = query.lte("package_lpa", filters["max_package"])

    if filters.get("min_cgpa"):
        query = query.lte("min_cgpa", filters["min_cgpa"])

    if filters.get("max_backlogs") is not None:
        query = query.lte("max_backlogs_allowed", filters["max_backlogs"])

    if filters.get("company_name"):
        query = query.ilike("company_name", f"%{filters['company_name']}%")

    if filters.get("role"):
        query = query.ilike("role", f"%{filters['role']}%")

    response = query.execute()
    return response.data


def generate_answer(question: str, drives: list) -> str:
    """
    Uses Gemini to convert raw database results into a friendly answer.
    """
    if not drives:
        return "I couldn't find any placement drives matching your query. Check back later or ask your placement coordinator."

    drives_text = json.dumps(drives, indent=2, default=str)

    prompt = f"""
A student asked: "{question}"

Here are the matching placement drives from the database:
{drives_text}

Write a helpful, friendly response to the student summarizing these drives.
Be concise. Mention company name, role, package, and deadline for each drive.
If there are many drives, summarize the key ones.
"""
    response = llm.invoke(prompt)
    return response.content.strip()


def answer_placement_query(question: str) -> dict:
    """
    Main function — takes a natural language question and returns an answer.
    """
    # Step 1: Extract filters from the question
    filters = extract_filters(question)

    # Step 2: Query database with those filters
    drives = query_drives(filters)

    # Step 3: Generate human-readable answer
    answer = generate_answer(question, drives)

    return {
        "question": question,
        "filters_extracted": filters,
        "drives_found": len(drives),
        "answer": answer
    }
