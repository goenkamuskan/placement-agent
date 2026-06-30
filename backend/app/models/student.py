from pydantic import BaseModel, EmailStr
from typing import List, Optional

class StudentCreate(BaseModel):
    email: EmailStr
    password: str  # added
    full_name: str
    branch: str
    cgpa: float
    active_backlogs: int = 0
    graduation_year: int
    skills: List[str] = []
    phone: Optional[str] = None

class StudentResponse(BaseModel):
    id: str
    email: str
    full_name: str
    branch: str
    cgpa: float
    active_backlogs: int
    graduation_year: int
    skills: List[str]
    phone: Optional[str]
    role: Optional[str]