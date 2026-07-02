from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from app.models.drive import DriveCreate, DriveResponse
from app.agents.drive_parser import parse_drive_announcement
from app.services.eligibility import get_eligible_students
from app.core.database import supabase
from app.services.notifications import notify_eligible_students
from app.agents.query_agent import answer_placement_query
from pydantic import BaseModel
from pydantic import BaseModel as PydanticBaseModel
import pandas as pd
import io

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

@router.get("/drives/{drive_id}/applicants")
def get_drive_applicants(drive_id: str):
    response = supabase.table("applications")\
        .select("*, students(*)")\
        .eq("drive_id", drive_id)\
        .execute()
    return response.data


@router.patch("/applications/{application_id}/status")
def update_application_status(application_id: str, status: dict):
    # Get application details first
    app = supabase.table("applications")\
        .select("*, students(*), drives(*)")\
        .eq("id", application_id)\
        .single()\
        .execute()

    if not app.data:
        raise HTTPException(status_code=404, detail="Application not found")

    new_status = status["status"]

    # Update status
    supabase.table("applications")\
        .update({"status": new_status})\
        .eq("id", application_id)\
        .execute()

    # Send email notification to student
    student = app.data["students"]
    drive = app.data["drives"]

    status_messages = {
        "shortlisted": f"🎉 Congratulations! You have been shortlisted for {drive['company_name']}.",
        "offered": f"🎊 Amazing news! You have received an offer from {drive['company_name']}!",
        "rejected": f"Thank you for applying to {drive['company_name']}. Unfortunately, you were not selected this time. Keep going!",
        "applied": None
    }

    message = status_messages.get(new_status)

    if message and student.get("email"):
        from app.services.notifications import send_status_email
        send_status_email(student, drive, new_status, message)

    return app.data

@router.post("/drives/{drive_id}/upload-results")
async def upload_results(drive_id: str, file: UploadFile = File(...)):
    """
    Coordinator uploads Excel/CSV with company results.
    System auto-updates student statuses.
    """
    contents = await file.read()

    # Parse Excel or CSV
    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse file: {str(e)}")

    # Normalize column names to lowercase
    df.columns = df.columns.str.lower().str.strip()

    # Must have email and status columns
    if 'email' not in df.columns or 'status' not in df.columns:
        raise HTTPException(
            status_code=400,
            detail="Excel file must have 'email' and 'status' columns"
        )

    updated = 0
    not_found = []

    for _, row in df.iterrows():
        email = str(row['email']).strip().lower()
        status = str(row['status']).strip().lower()

        # Validate status
        if status not in ['applied', 'shortlisted', 'rejected', 'offered']:
            status = 'applied'  # default if invalid

        # Find student by email
        student = supabase.table("students")\
            .select("id")\
            .eq("email", email)\
            .execute()

        if not student.data:
            not_found.append(email)
            continue

        student_id = student.data[0]["id"]

        # Update application status
        supabase.table("applications")\
            .update({"status": status})\
            .eq("student_id", student_id)\
            .eq("drive_id", drive_id)\
            .execute()

        updated += 1
        # Update application status
        supabase.table("applications")\
            .update({"status": status})\
            .eq("student_id", student_id)\
            .eq("drive_id", drive_id)\
            .execute()

        updated += 1

        # Send status email — ADD HERE
        if status in ['shortlisted', 'rejected', 'offered']:
            student_data = supabase.table("students")\
                .select("*")\
                .eq("id", student_id)\
                .single()\
                .execute()

            drive_data = supabase.table("drives")\
                .select("*")\
                .eq("id", drive_id)\
                .single()\
                .execute()

            if student_data.data and drive_data.data:
                status_messages = {
                    "shortlisted": f"🎉 Congratulations! You have been shortlisted for {drive_data.data['company_name']}.",
                    "offered": f"🎊 Amazing news! You have received an offer from {drive_data.data['company_name']}!",
                    "rejected": f"Thank you for applying to {drive_data.data['company_name']}. Unfortunately, you were not selected this time. Keep going!",
                }
                from app.services.notifications import send_status_email
                send_status_email(student_data.data, drive_data.data, status, status_messages[status])
                result = send_status_email(student_data.data, drive_data.data, status, status_messages[status])
                print(f"Email sent to {email}: {result}")

    return {
        "message": "Results uploaded successfully",
        "updated": updated,
        "not_found": not_found,
        "total_in_file": len(df)
    }