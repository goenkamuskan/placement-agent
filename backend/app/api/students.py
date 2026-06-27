from fastapi import APIRouter, HTTPException
from app.models.student import StudentCreate, StudentResponse
from app.core.database import supabase

router = APIRouter()

@router.post("/students", response_model=StudentResponse)
def create_student(student: StudentCreate):
    # Check if student already exists
    existing = supabase.table("students")\
        .select("id")\
        .eq("email", student.email)\
        .execute()
    
    if existing.data:
        raise HTTPException(status_code=400, detail="Student with this email already exists")
    
    response = supabase.table("students")\
        .insert(student.model_dump())\
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
