# 🎓 Placement Agent

An autonomous AI agent that automates the entire college placement process — from parsing drive announcements to notifying students, matching eligibility, and drafting recruiter emails.

## The Problem
College placement cells run on WhatsApp forwards and Excel sheets. Students miss drives, don't know eligibility criteria, and scramble at the last minute.

## The Solution
An agent that:
- Parses placement drive announcements automatically
- Matches each student's profile against eligibility criteria
- Sends WhatsApp + email notifications with deadlines
- Answers natural language queries ("which drives can I apply to with 6.8 CGPA?")
- Drafts personalized cold emails to recruiters

## Tech Stack
- **Backend:** FastAPI (Python)
- **Agent Framework:** LangGraph
- **LLM:** Gemini 1.5 Flash
- **Database:** Supabase (PostgreSQL)
- **Notifications:** Twilio (WhatsApp) + SendGrid (Email)
- **Frontend:** React + Tailwind CSS
- **Deployment:** Railway + Vercel

## Status
🚧 Under active development