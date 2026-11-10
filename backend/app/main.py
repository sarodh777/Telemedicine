import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.config import ALLOWED_ORIGINS, UPLOAD_DIR
from backend.app.database import engine, Base
from backend.app.seed import seed_database
from backend.app.routers import (
    auth,
    patient,
    doctors,
    doctor_dashboard,
    messages,
    admin,
    prescriptions,
    notifications
)

app = FastAPI(
    title="TeleCare API",
    description="Lightweight Telemedicine Platform Backend for Rural Healthcare",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all during development & LAN testing for rural tablets/phones
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for compressed medical reports and prescriptions
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Include Routers
app.include_router(auth.router)
app.include_router(patient.router)
app.include_router(doctors.router)
app.include_router(doctor_dashboard.router)
app.include_router(messages.router)
app.include_router(admin.router)
app.include_router(prescriptions.router)
app.include_router(notifications.router)

@app.on_event("startup")
def on_startup():
    """Initializes tables and seeds test accounts on server boot."""
    try:
        seed_database()
        print("TeleCare Database initialized and seeded successfully.")
    except Exception as e:
        print(f"Warning during database startup init: {e}")

@app.get("/")
def root():
    return {
        "platform": "TeleCare Telemedicine Platform",
        "tagline": "Healthcare Access, Wherever You Are.",
        "status": "online",
        "version": "1.0.0",
        "api_docs": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "telecare-api"}

