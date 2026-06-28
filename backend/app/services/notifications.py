from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from app.core.config import SENDGRID_API_KEY, SENDGRID_FROM_EMAIL
from app.core.database import supabase


def send_email_notification(student: dict, drive: dict) -> bool:
    """
    Sends an email to a student about a new placement drive they qualify for.
    """
    message = Mail(
        from_email=SENDGRID_FROM_EMAIL,
        to_emails=student["email"],
        subject=f"New Placement Drive: {drive['company_name']}",
        html_content=f"""
        <h2>Hi {student['full_name']}! 👋</h2>
        <p>You are eligible for a new placement drive:</p>
        
        <table style="border-collapse: collapse; width: 100%;">
            <tr>
                <td><strong>Company</strong></td>
                <td>{drive['company_name']}</td>
            </tr>
            <tr>
                <td><strong>Role</strong></td>
                <td>{drive.get('role', 'Not specified')}</td>
            </tr>
            <tr>
                <td><strong>Package</strong></td>
                <td>{drive.get('package_lpa', 'Not disclosed')} LPA</td>
            </tr>
            <tr>
                <td><strong>Apply By</strong></td>
                <td>{drive.get('apply_deadline', 'Check with placement cell')}</td>
            </tr>
            <tr>
                <td><strong>Drive Date</strong></td>
                <td>{drive.get('drive_date', 'TBA')}</td>
            </tr>
        </table>
        
        <p>Log in to your placement portal to apply.</p>
        <p>Best of luck! 🚀</p>
        """
    )

    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        sg.send(message)

        # Log notification in database
        supabase.table("notifications").insert({
            "student_id": student["id"],
            "drive_id": drive["id"],
            "channel": "email",
            "status": "sent"
        }).execute()

        return True

    except Exception as e:
        print(f"Email failed for {student['email']}: {e}")

        # Log failed notification too
        supabase.table("notifications").insert({
            "student_id": student["id"],
            "drive_id": drive["id"],
            "channel": "email",
            "status": "failed"
        }).execute()

        return False


def notify_eligible_students(students: list, drive: dict) -> dict:
    """
    Sends notifications to all eligible students for a drive.
    Returns a summary of what was sent.
    """
    sent = 0
    failed = 0

    for student in students:
        success = send_email_notification(student, drive)
        if success:
            sent += 1
        else:
            failed += 1

    return {
        "total": len(students),
        "sent": sent,
        "failed": failed
    }
