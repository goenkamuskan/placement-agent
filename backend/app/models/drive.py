from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class DriveCreate(BaseModel):
    raw_text: str  # coordinator just pastes the announcement as-is

class DriveResponse(BaseModel):
    id: str
    company_name: str
    description: Optional[str]
    eligible_branches: List[str]
    min_cgpa: float
    max_backlogs_allowed: int
    role: Optional[str]
    package_lpa: Optional[float]
    apply_deadline: Optional[datetime]
    drive_date: Optional[datetime]
    parsed_by_ai: bool
