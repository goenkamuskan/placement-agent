from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.core.database import supabase

router = APIRouter()

class LoginInput(BaseModel):
    email: str
    password: str

@router.post("/auth/login")
def login(credentials: LoginInput):
    # Sign in with Supabase Auth
    response = supabase.auth.sign_in_with_password({
        "email": credentials.email,
        "password": credentials.password
    })

    if not response.user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Get role from students table
    student = supabase.table("students")\
        .select("id, full_name, role, branch, cgpa")\
        .eq("email", credentials.email)\
        .single()\
        .execute()

    if not student.data:
        raise HTTPException(status_code=404, detail="Student profile not found")

    return {
        "user": {
            "id": student.data["id"],
            "email": credentials.email,
            "full_name": student.data["full_name"],
            "role": student.data["role"],
            "branch": student.data["branch"],
            "cgpa": student.data["cgpa"],
        },
        "access_token": response.session.access_token
    }


@router.get("/auth/me")
def get_me(email: str):
    """Get user profile by email"""
    student = supabase.table("students")\
        .select("*")\
        .eq("email", email)\
        .single()\
        .execute()

    if not student.data:
        raise HTTPException(status_code=404, detail="User not found")

    return student.data