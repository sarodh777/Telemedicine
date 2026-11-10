from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.user import User, DoctorProfile
from backend.app.schemas.doctor import DoctorProfileResponse

router = APIRouter(prefix="/api/doctors", tags=["Doctors Discovery"])

@router.get("", response_model=List[DoctorProfileResponse])
def list_doctors(
    search: Optional[str] = Query(None, description="Search doctor name or specialty"),
    specialty: Optional[str] = Query(None, description="Filter by specialty"),
    db: Session = Depends(get_db)
):
    query = db.query(DoctorProfile).join(User, DoctorProfile.user_id == User.id).filter(
        User.account_status == "active",
        DoctorProfile.verification_status.in_(["approved", "verified"])
    )

    if specialty and specialty.strip() and specialty.lower() != "all":
        query = query.filter(DoctorProfile.specialty.ilike(f"%{specialty.strip()}%"))

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            (User.full_name.ilike(term)) | (DoctorProfile.specialty.ilike(term)) | (DoctorProfile.qualifications.ilike(term))
        )

    doctors = query.all()

    results = []
    for doc in doctors:
        results.append(
            DoctorProfileResponse(
                id=doc.id,
                user_id=doc.user_id,
                full_name=doc.user.full_name,
                email=doc.user.email,
                phone=doc.user.phone,
                specialty=doc.specialty,
                qualifications=doc.qualifications,
                experience=doc.experience,
                verification_status=doc.verification_status,
                availability=doc.availability,
                is_available=doc.is_available if doc.is_available is not None else True,
                registration_number=doc.registration_number,
                hospital_name=doc.hospital_name,
                consultation_fee=doc.consultation_fee
            )
        )
    return results

@router.get("/{doctor_id}", response_model=DoctorProfileResponse)
def get_doctor(doctor_id: int, db: Session = Depends(get_db)):
    doc = db.query(DoctorProfile).filter(DoctorProfile.id == doctor_id).first()
    if not doc or not doc.user:
        raise HTTPException(status_code=404, detail="Doctor not found")

    return DoctorProfileResponse(
        id=doc.id,
        user_id=doc.user_id,
        full_name=doc.user.full_name,
        email=doc.user.email,
        phone=doc.user.phone,
        specialty=doc.specialty,
        qualifications=doc.qualifications,
        experience=doc.experience,
        verification_status=doc.verification_status,
        availability=doc.availability,
        is_available=doc.is_available if doc.is_available is not None else True,
        registration_number=doc.registration_number,
        hospital_name=doc.hospital_name,
        consultation_fee=doc.consultation_fee
    )

@router.get("/{doctor_id}/availability")
def get_doctor_availability(doctor_id: int, db: Session = Depends(get_db)):
    doc = db.query(DoctorProfile).filter(DoctorProfile.id == doctor_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Doctor not found")

    # Standard available hourly slots for telemedicine
    standard_slots = [
        "09:00 AM", "09:45 AM", "10:30 AM", "11:15 AM", 
        "01:00 PM", "01:45 PM", "02:30 PM", "03:15 PM"
    ]

    return {
        "doctor_id": doc.id,
        "availability_schedule": doc.availability,
        "consultation_types": ["online", "in-person"],
        "available_slots": standard_slots
    }

