from fastapi import APIRouter, HTTPException
from app.models.drive import DriveCreate, DriveResponse
from app.agents.drive_parser import parse_drive_announcement
from app.services.eligibility import get_eligible_students
from app.core.database import supabase
from app.services.notifications import notify_eligible_students
from app.agents.query_agent import answer_placement_query
from pydantic import BaseModel
from pydantic import BaseModel as PydanticBaseModel


class QueryInput(BaseModel):
    question: str

router = APIRouter()

class ApplyInput(PydanticBaseModel):
    student_id: str
    drive_id: str

@router.post("/drives/parse")
def parse_and_create_drive(drive_input: DriveCreate):
    """
    Accepts raw announcement text, uses AI to parse it,
    saves the drive, and returns eligible students.
    """

    # Step 1: Ask Gemini to parse the raw text
    try:
        parsed = parse_drive_announcement(drive_input.raw_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI parsing failed: {str(e)}")

    # Step 2: Save the parsed drive to database
    drive_data = {
        "company_name": parsed.get("company_name"),
        "description": drive_input.raw_text,  # store original text too
        "eligible_branches": parsed.get("eligible_branches", []),
        "min_cgpa": parsed.get("min_cgpa", 0.0),
        "max_backlogs_allowed": parsed.get("max_backlogs_allowed", 0),
        "role": parsed.get("role"),
        "package_lpa": parsed.get("package_lpa"),
        "apply_deadline": parsed.get("apply_deadline"),
        "drive_date": parsed.get("drive_date"),
        "parsed_by_ai": True
    }

    response = supabase.table("drives").insert(drive_data).execute()
    saved_drive = response.data[0]

    # Step 3: Find eligible students
    eligible_students = get_eligible_students(
        eligible_branches=parsed.get("eligible_branches", []),
        min_cgpa=parsed.get("min_cgpa", 0.0),
        max_backlogs_allowed=parsed.get("max_backlogs_allowed", 0)
    )

    # Step 4: Notify eligible students
    notification_summary = notify_eligible_students(eligible_students, saved_drive)

    # Step 5: Return everything
    return {
        "drive": saved_drive,
        "parsed_by_ai": True,
        "eligible_students_count": len(eligible_students),
        "eligible_students": eligible_students,
        "notifications": notification_summary
    }
    
@router.post("/drives/query")
def query_drives_nl(query_input: QueryInput):
    """
    Accepts a natural language question about placement drives
    and returns an AI-generated answer.
    """
    result = answer_placement_query(query_input.question)
    return result

@router.get("/drives")
def get_all_drives():
    response = supabase.table("drives").select("*").order("created_at", desc=True).execute()
    return response.data

@router.post("/applications")
def apply_to_drive(data: ApplyInput):
    # Check if already applied
    existing = supabase.table("applications")\
        .select("id")\
        .eq("student_id", data.student_id)\
        .eq("drive_id", data.drive_id)\
        .execute()

    if existing.data:
        raise HTTPException(status_code=400, detail="You have already applied to this drive")

    response = supabase.table("applications").insert({
        "student_id": data.student_id,
        "drive_id": data.drive_id,
        "status": "applied"
    }).execute()

    return response.data[0]


@router.get("/applications/student/{student_id}")
def get_student_applications(student_id: str):
    response = supabase.table("applications")\
        .select("*, drives(*)")\
        .eq("student_id", student_id)\
        .execute()
    return response.data