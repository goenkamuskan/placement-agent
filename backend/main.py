from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import students
from app.api import students, drives

app = FastAPI(
    title="Placement Agent API",
    description="Autonomous placement cell agent for college students",
    version="0.1.0"
)

# CORS — allows frontend (React) to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(students.router, prefix="/api/v1", tags=["students"])
app.include_router(drives.router, prefix="/api/v1", tags=["drives"])

@app.get("/")
def root():
    return {"message": "Placement Agent API is running 🚀"}
