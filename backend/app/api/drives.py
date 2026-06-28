from fastapi import APIRouter, HTTPException
from app.models.drive import DriveCreate, DriveResponse
from app.agents.drive_parser import parse_drive_announcement
from app.services.eligibility import get_eligible_students
from app.core.database import supabase

router = APIRouter()

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

    # Step 4: Return everything
    return {
        "drive": saved_drive,
        "parsed_by_ai": True,
        "eligible_students_count": len(eligible_students),
        "eligible_students": eligible_students
    }
