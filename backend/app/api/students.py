from fastapi import APIRouter, HTTPException
from app.models.student import StudentCreate, StudentResponse
from app.core.database import supabase
from app.core.database import supabase, supabase_admin

router = APIRouter()

@router.post("/students", response_model=StudentResponse)
def create_student(student: StudentCreate):
    # Check if student already exists in DB
    existing = supabase.table("students")\
        .select("id")\
        .eq("email", student.email)\
        .execute()

    if existing.data:
        raise HTTPException(status_code=400, detail="Student with this email already exists")

    # Create Supabase Auth account
    auth_response = supabase_admin.auth.admin.create_user({
        "email": student.email,
        "password": student.password,
        "email_confirm": True  # skip email verification for now
    })

    if not auth_response.user:
        raise HTTPException(status_code=500, detail="Failed to create auth account")

    # Create student row in DB
    student_data = student.model_dump()
    student_data.pop("password")  # never store plain password in DB
    student_data["role"] = "student"

    response = supabase.table("students")\
        .insert(student_data)\
        .execute()

    return response.data[0]


@router.get("/students/{student_id}", response_model=StudentResponse)
def get_student(student_id: str):
    response = supabase.table("students")\
        .select("*")\
        .eq("id", student_id)\
        .execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Student not found")

    return response.data[0]