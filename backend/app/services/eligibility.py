from app.core.database import supabase

def get_eligible_students(
    eligible_branches: list,
    min_cgpa: float,
    max_backlogs_allowed: int
) -> list:
    """
    Queries the database for students who meet the drive's eligibility criteria.
    """

    response = supabase.table("students")\
        .select("*")\
        .in_("branch", eligible_branches)\
        .gte("cgpa", min_cgpa)\
        .lte("active_backlogs", max_backlogs_allowed)\
        .execute()

    return response.data
