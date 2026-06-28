import os
from dotenv import load_dotenv
from pathlib import Path

# Go up one level from backend/ to find .env in project root
load_dotenv(Path(__file__).resolve().parents[3] / ".env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")