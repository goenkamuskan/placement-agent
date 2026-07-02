from fastapi import APIRouter, HTTPException
from app.models.student import StudentCreate, StudentResponse
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
    try:
        auth_response = supabase_admin.auth.admin.create_user({
            "email": student.email,
            "password": student.password,
            "email_confirm": True
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail="This email is already registered. Please login instead.")

    # Create student row in DB
    student_data = student.model_dump()
    student_data.pop("password")
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
