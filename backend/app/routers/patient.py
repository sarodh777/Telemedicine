from typing import List, Optional
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.user import User, PatientProfile, DoctorProfile
from backend.app.models.appointment import Appointment
from backend.app.models.report import MedicalReport
from backend.app.models.notification import Notification
from backend.app.models.medical_history import MedicalHistoryRecord
from backend.app.schemas.patient import (
    PatientProfileUpdate,
    PatientProfileResponse,
    MedicalHistoryCreate,
    MedicalHistoryResponse
)
from backend.app.schemas.appointment import AppointmentCreate, AppointmentResponse
from backend.app.schemas.report import MedicalReportResponse
from backend.app.services.auth import require_role
from backend.app.services.compression import optimize_and_store_medical_document

router = APIRouter(prefix="/api/patient", tags=["Patient Services"])

@router.get("/profile")
def get_patient_profile(
    current_user: User = Depends(require_role(["patient"])),
    db: Session = Depends(get_db)
):
    profile = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
    if not profile:
        profile = PatientProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    return {
        "id": profile.id,
        "user_id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "phone": current_user.phone,
        "date_of_birth": profile.date_of_birth,
        "gender": profile.gender,
        "address": profile.address,
        "village": profile.village,
        "emergency_contact": profile.emergency_contact
    }

@router.put("/profile")
def update_patient_profile(
    data: PatientProfileUpdate,
    current_user: User = Depends(require_role(["patient"])),
    db: Session = Depends(get_db)
):
    profile = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
    if not profile:
        profile = PatientProfile(user_id=current_user.id)
        db.add(profile)

    if data.full_name:
        current_user.full_name = data.full_name.strip()
    if data.phone:
        current_user.phone = data.phone.strip()

    if data.date_of_birth is not None:
        profile.date_of_birth = data.date_of_birth
    if data.gender is not None:
        profile.gender = data.gender
    if data.address is not None:
        profile.address = data.address
    if data.village is not None:
        profile.village = data.village
    if data.emergency_contact is not None:
        profile.emergency_contact = data.emergency_contact

    db.commit()
    db.refresh(profile)

    return {
        "id": profile.id,
        "user_id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "phone": current_user.phone,
        "date_of_birth": profile.date_of_birth,
        "gender": profile.gender,
        "address": profile.address,
        "village": profile.village,
        "emergency_contact": profile.emergency_contact
    }

@router.get("/medical-history", response_model=List[MedicalHistoryResponse])
def get_medical_history(
    current_user: User = Depends(require_role(["patient", "doctor", "admin"])),
    patient_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    # If called by patient, view own history
    if current_user.role == "patient":
        prof = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
        target_patient_id = prof.id if prof else 0
    else:
        # Doctor or admin viewing patient's history
        target_patient_id = patient_id

    records = db.query(MedicalHistoryRecord).filter(
        MedicalHistoryRecord.patient_id == target_patient_id
    ).order_by(MedicalHistoryRecord.recorded_at.desc()).all()
    return records

@router.post("/medical-history", response_model=MedicalHistoryResponse)
def add_medical_history(
    data: MedicalHistoryCreate,
    current_user: User = Depends(require_role(["patient", "doctor"])),
    patient_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    if current_user.role == "patient":
        prof = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
        target_patient_id = prof.id
        doc_name = "Self reported"
    else:
        target_patient_id = patient_id
        doc_name = f"Dr. {current_user.full_name}"

    record = MedicalHistoryRecord(
        patient_id=target_patient_id,
        record_type=data.record_type,
        title=data.title,
        description=data.description,
        doctor_name=data.doctor_name or doc_name
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

@router.get("/appointments")
def get_patient_appointments(
    current_user: User = Depends(require_role(["patient"])),
    db: Session = Depends(get_db)
):
    prof = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
    if not prof:
        return []

    appointments = db.query(Appointment).filter(
        Appointment.patient_id == prof.id
    ).order_by(Appointment.created_at.desc()).all()

    results = []
    for appt in appointments:
        doc = db.query(DoctorProfile).filter(DoctorProfile.id == appt.doctor_id).first()
        doc_user = db.query(User).filter(User.id == doc.user_id).first() if doc else None

        results.append({
            "id": appt.id,
            "patient_id": appt.patient_id,
            "doctor_id": appt.doctor_id,
            "doctor_user_id": doc_user.id if doc_user else None,
            "doctor_name": f"Dr. {doc_user.full_name}" if doc_user else "Doctor",
            "doctor_specialty": doc.specialty if doc else "General",
            "appointment_date": appt.appointment_date,
            "appointment_time": appt.appointment_time,
            "consultation_type": appt.consultation_type,
            "reason": appt.reason,
            "status": appt.status,
            "rejection_reason": appt.rejection_reason,
            "doctor_notes": appt.doctor_notes,
            "created_at": appt.created_at
        })
    return results

@router.post("/appointments")
def book_appointment(
    data: AppointmentCreate,
    current_user: User = Depends(require_role(["patient"])),
    db: Session = Depends(get_db)
):
    prof = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
    if not prof:
        prof = PatientProfile(user_id=current_user.id)
        db.add(prof)
        db.commit()
        db.refresh(prof)

    # 1. Validate Doctor & Availability
    doc = db.query(DoctorProfile).filter(DoctorProfile.id == data.doctor_id).first()
    if not doc or doc.verification_status not in ["approved", "verified"]:
        raise HTTPException(
            status_code=400,
            detail="This doctor is not currently available for consultation."
        )

    if doc.is_available is False:
        raise HTTPException(
            status_code=400,
            detail="This doctor is currently unavailable for booking."
        )

    # 2. Validate Date and Time (Prevent Past Dates)
    today_str = date.today().isoformat()
    if data.appointment_date < today_str:
        raise HTTPException(
            status_code=400,
            detail="Cannot book appointments for past dates. Please choose today or a future date."
        )

    # 3. Check for duplicate appointment with same doctor at same date and time
    existing = db.query(Appointment).filter(
        Appointment.doctor_id == data.doctor_id,
        Appointment.appointment_date == data.appointment_date,
        Appointment.appointment_time == data.appointment_time,
        Appointment.status.in_(["pending", "confirmed"])
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="This appointment slot is already reserved. Please choose another time or date."
        )

    appt = Appointment(
        patient_id=prof.id,
        doctor_id=data.doctor_id,
        appointment_date=data.appointment_date,
        appointment_time=data.appointment_time,
        consultation_type=data.consultation_type,
        reason=data.reason,
        status="pending"
    )
    db.add(appt)
    db.commit()
    db.refresh(appt)

    # 4. Notify Doctor of Consultation Booking
    doc_user = db.query(User).filter(User.id == doc.user_id).first() if doc else None
    if doc_user:
        notif = Notification(
            user_id=doc_user.id,
            title="New Appointment Request",
            message=f"Patient {current_user.full_name} has booked a {data.consultation_type} consultation on {data.appointment_date} at {data.appointment_time}."
        )
        db.add(notif)
        db.commit()

    return {
        "id": appt.id,
        "patient_id": appt.patient_id,
        "doctor_id": appt.doctor_id,
        "doctor_name": f"Dr. {doc_user.full_name}" if doc_user else "Doctor",
        "doctor_specialty": doc.specialty if doc else "General",
        "appointment_date": appt.appointment_date,
        "appointment_time": appt.appointment_time,
        "consultation_type": appt.consultation_type,
        "reason": appt.reason,
        "status": appt.status,
        "created_at": appt.created_at
    }

@router.get("/reports", response_model=List[MedicalReportResponse])
def get_patient_reports(
    current_user: User = Depends(require_role(["patient", "doctor", "admin"])),
    patient_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    if current_user.role == "patient":
        prof = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
        target_id = prof.id if prof else 0
    else:
        target_id = patient_id

    reports = db.query(MedicalReport).filter(
        MedicalReport.patient_id == target_id
    ).order_by(MedicalReport.uploaded_at.desc()).all()
    return reports

@router.post("/reports", response_model=MedicalReportResponse)
def upload_medical_report(
    title: str = Form(...),
    category: str = Form("prescription"),
    appointment_id: Optional[int] = Form(None),
    doctor_id: Optional[int] = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(["patient"])),
    db: Session = Depends(get_db)
):
    prof = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
    if not prof:
        prof = PatientProfile(user_id=current_user.id)
        db.add(prof)
        db.commit()
        db.refresh(prof)

    # Process and compress with Dual Storage (Original preserved + lightweight preview)
    result = optimize_and_store_medical_document(file)

    # Validate assigned doctor if provided
    assigned_doc_id = None
    target_doc = None
    if doctor_id:
        target_doc = db.query(DoctorProfile).filter(DoctorProfile.id == doctor_id).first()
        if target_doc:
            assigned_doc_id = target_doc.id

    report = MedicalReport(
        patient_id=prof.id,
        appointment_id=appointment_id,
        doctor_id=assigned_doc_id,
        title=title.strip(),
        category=category,
        original_filename=result["original_filename"],
        file_path=result["file_path"],
        original_file_path=result["original_file_path"],
        preview_file_path=result.get("preview_file_path") or result["file_path"],
        file_type=result["file_type"],
        original_size=result["original_size"],
        compressed_size=result["compressed_size"],
        preview_size=result.get("preview_size", result["compressed_size"]),
        compression_ratio=result["compression_ratio"],
        is_optimized=result.get("is_optimized", True)
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    # Notify doctor if report is assigned
    if target_doc and target_doc.user_id:
        notif = Notification(
            user_id=target_doc.user_id,
            title="New Patient Report Uploaded",
            message=f"Patient {current_user.full_name} has uploaded a new {category} document: '{title.strip()}'."
        )
        db.add(notif)
        db.commit()

    return report

