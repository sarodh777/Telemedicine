from typing import List, Optional
from datetime import date, datetime
import re
from uuid import uuid4
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.user import User, DoctorProfile, PatientProfile
from backend.app.models.appointment import Appointment
from backend.app.models.report import MedicalReport
from backend.app.models.prescription import Prescription
from backend.app.models.notification import Notification
from backend.app.schemas.appointment import AppointmentStatusUpdate
from backend.app.schemas.doctor import DoctorAvailabilityUpdate
from backend.app.config import UPLOAD_DIR
from backend.app.services.auth import require_role

router = APIRouter(prefix="/api/doctor", tags=["Doctor Dashboard"])

@router.get("/appointments")
def get_doctor_appointments(
    status_filter: Optional[str] = None,
    current_user: User = Depends(require_role(["doctor"])),
    db: Session = Depends(get_db)
):
    doc_prof = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.id).first()
    if not doc_prof:
        raise HTTPException(status_code=404, detail="Doctor profile not found.")

    query = db.query(Appointment).filter(Appointment.doctor_id == doc_prof.id)
    if status_filter and status_filter.lower() != "all":
        query = query.filter(Appointment.status == status_filter.lower())

    appointments = query.order_by(Appointment.created_at.desc()).all()

    results = []
    for appt in appointments:
        pat_prof = db.query(PatientProfile).filter(PatientProfile.id == appt.patient_id).first()
        pat_user = db.query(User).filter(User.id == pat_prof.user_id).first() if pat_prof else None

        results.append({
            "id": appt.id,
            "patient_id": appt.patient_id,
            "patient_user_id": pat_user.id if pat_user else None,
            "patient_name": pat_user.full_name if pat_user else "Patient",
            "patient_phone": pat_user.phone if pat_user else "-",
            "patient_village": pat_prof.village if pat_prof else "-",
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

@router.put("/appointments/{appointment_id}/status")
def update_appointment_status(
    appointment_id: int,
    data: AppointmentStatusUpdate,
    current_user: User = Depends(require_role(["doctor"])),
    db: Session = Depends(get_db)
):
    doc_prof = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.id).first()
    if not doc_prof:
        raise HTTPException(status_code=404, detail="Doctor profile not found.")

    appt = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.doctor_id == doc_prof.id
    ).first()

    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    valid_statuses = ["confirmed", "completed", "cancelled"]
    if data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Choose from {valid_statuses}")

    appt.status = data.status
    if data.rejection_reason:
        appt.rejection_reason = data.rejection_reason
    if data.doctor_notes:
        appt.doctor_notes = data.doctor_notes

    db.commit()
    db.refresh(appt)

    return {
        "message": f"Appointment successfully updated to {appt.status}",
        "appointment_id": appt.id,
        "status": appt.status,
        "rejection_reason": appt.rejection_reason,
        "doctor_notes": appt.doctor_notes
    }

@router.get("/appointments/today")
def get_today_appointments(
    current_user: User = Depends(require_role(["doctor"])),
    db: Session = Depends(get_db)
):
    doc_prof = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.id).first()
    if not doc_prof:
        raise HTTPException(status_code=404, detail="Doctor profile not found.")

    today_str = date.today().isoformat()
    appts = (
        db.query(Appointment)
        .filter(
            Appointment.doctor_id == doc_prof.id,
            Appointment.appointment_date == today_str
        )
        .order_by(Appointment.appointment_time.asc())
        .all()
    )

    results = []
    for appt in appts:
        pat_prof = db.query(PatientProfile).filter(PatientProfile.id == appt.patient_id).first()
        pat_user = db.query(User).filter(User.id == pat_prof.user_id).first() if pat_prof else None

        # Check if medical reports exist for this patient
        rep_count = db.query(MedicalReport).filter(MedicalReport.patient_id == appt.patient_id).count()

        # Check if prescription exists for this appointment
        rx_exists = db.query(Prescription).filter(
            (Prescription.appointment_id == appt.id) | 
            ((Prescription.patient_id == appt.patient_id) & (Prescription.doctor_id == doc_prof.id))
        ).count() > 0

        results.append({
            "id": appt.id,
            "patient_id": appt.patient_id,
            "patient_user_id": pat_user.id if pat_user else None,
            "patient_name": pat_user.full_name if pat_user else "Patient",
            "patient_phone": pat_user.phone if pat_user else "-",
            "patient_village": pat_prof.village if pat_prof else "-",
            "appointment_date": appt.appointment_date,
            "appointment_time": appt.appointment_time,
            "consultation_type": appt.consultation_type,
            "reason": appt.reason,
            "status": appt.status,
            "has_reports": rep_count > 0,
            "has_prescription": rx_exists,
            "doctor_notes": appt.doctor_notes,
            "created_at": appt.created_at
        })
    return results

@router.get("/availability")
def get_availability(
    current_user: User = Depends(require_role(["doctor"])),
    db: Session = Depends(get_db)
):
    doc_prof = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.id).first()
    if not doc_prof:
        raise HTTPException(status_code=404, detail="Doctor profile not found.")

    return {
        "availability": doc_prof.availability,
        "is_available": doc_prof.is_available if doc_prof.is_available is not None else True,
        "verification_status": doc_prof.verification_status,
        "rejection_reason": doc_prof.rejection_reason
    }

@router.put("/availability")
def update_availability(
    data: DoctorAvailabilityUpdate,
    current_user: User = Depends(require_role(["doctor"])),
    db: Session = Depends(get_db)
):
    doc_prof = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.id).first()
    if not doc_prof:
        raise HTTPException(status_code=404, detail="Doctor profile not found.")

    if data.availability is not None:
        doc_prof.availability = data.availability.strip()
    if data.is_available is not None:
        doc_prof.is_available = data.is_available

    db.commit()

    return {
        "message": "Availability updated successfully",
        "availability": doc_prof.availability,
        "is_available": doc_prof.is_available
    }

@router.get("/reports")
def get_doctor_patient_reports(
    current_user: User = Depends(require_role(["doctor"])),
    db: Session = Depends(get_db)
):
    doc_prof = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.id).first()
    if not doc_prof:
        return []

    # Find consulted patient IDs
    appts = db.query(Appointment).filter(Appointment.doctor_id == doc_prof.id).all()
    patient_ids = list(set([a.patient_id for a in appts]))

    reports = (
        db.query(MedicalReport)
        .filter(
            (MedicalReport.doctor_id == doc_prof.id) |
            (MedicalReport.patient_id.in_(patient_ids))
        )
        .order_by(MedicalReport.uploaded_at.desc())
        .all()
    )

    results = []
    for r in reports:
        pat_prof = db.query(PatientProfile).filter(PatientProfile.id == r.patient_id).first()
        pat_user = db.query(User).filter(User.id == pat_prof.user_id).first() if pat_prof else None

        results.append({
            "id": r.id,
            "patient_id": r.patient_id,
            "patient_name": pat_user.full_name if pat_user else "Patient",
            "patient_village": pat_prof.village if pat_prof else "Rural Community",
            "appointment_id": r.appointment_id,
            "title": r.title,
            "category": r.category,
            "original_filename": r.original_filename,
            "file_path": r.file_path,
            "original_file_path": r.original_file_path or r.file_path,
            "preview_file_path": r.preview_file_path or r.file_path,
            "file_type": r.file_type,
            "original_size": r.original_size,
            "compressed_size": r.compressed_size,
            "preview_size": r.preview_size or r.compressed_size,
            "compression_ratio": r.compression_ratio,
            "doctor_remarks": r.doctor_remarks,
            "uploaded_at": r.uploaded_at
        })
    return results

@router.get("/patients")
def get_consulted_patients(
    current_user: User = Depends(require_role(["doctor"])),
    db: Session = Depends(get_db)
):
    doc_prof = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.id).first()
    if not doc_prof:
        return []

    # Find unique patients with appointments with this doctor
    appts = db.query(Appointment).filter(Appointment.doctor_id == doc_prof.id).all()
    patient_ids = list(set([a.patient_id for a in appts]))

    patients = []
    for pid in patient_ids:
        p_prof = db.query(PatientProfile).filter(PatientProfile.id == pid).first()
        if p_prof and p_prof.user:
            patients.append({
                "patient_id": p_prof.id,
                "user_id": p_prof.user.id,
                "full_name": p_prof.user.full_name,
                "phone": p_prof.user.phone,
                "village": p_prof.village or "Rural Area",
                "gender": p_prof.gender or "Not specified",
                "date_of_birth": p_prof.date_of_birth or "N/A"
            })
    return patients

@router.get("/profile")
def get_doctor_profile(
    current_user: User = Depends(require_role(["doctor"])),
    db: Session = Depends(get_db)
):
    doc_prof = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.id).first()
    if not doc_prof:
        raise HTTPException(status_code=404, detail="Doctor profile not found.")

    return {
        "id": doc_prof.id,
        "user_id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "phone": current_user.phone,
        "specialty": doc_prof.specialty,
        "qualifications": doc_prof.qualifications,
        "experience": doc_prof.experience,
        "registration_number": doc_prof.registration_number,
        "hospital_name": doc_prof.hospital_name,
        "consultation_fee": doc_prof.consultation_fee,
        "availability": doc_prof.availability,
        "is_available": doc_prof.is_available if doc_prof.is_available is not None else True,
        "verification_status": doc_prof.verification_status,
        "certificate_filename": doc_prof.certificate_filename,
        "rejection_reason": doc_prof.rejection_reason,
        "created_at": current_user.created_at
    }

@router.put("/profile")
def update_doctor_profile(
    data: dict,
    current_user: User = Depends(require_role(["doctor"])),
    db: Session = Depends(get_db)
):
    doc_prof = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.id).first()
    if not doc_prof:
        raise HTTPException(status_code=404, detail="Doctor profile not found.")

    if "full_name" in data and data["full_name"]:
        current_user.full_name = str(data["full_name"]).strip()
    if "phone" in data and data["phone"]:
        current_user.phone = str(data["phone"]).strip()
    if "specialty" in data and data["specialty"]:
        doc_prof.specialty = str(data["specialty"]).strip()
    if "qualifications" in data and data["qualifications"]:
        doc_prof.qualifications = str(data["qualifications"]).strip()
    if "experience" in data and data["experience"]:
        doc_prof.experience = str(data["experience"]).strip()
    if "hospital_name" in data and data["hospital_name"]:
        doc_prof.hospital_name = str(data["hospital_name"]).strip()
    if "consultation_fee" in data and data["consultation_fee"]:
        doc_prof.consultation_fee = str(data["consultation_fee"]).strip()

    db.commit()
    return {"message": "Profile updated successfully"}

@router.get("/certificate")
def get_own_certificate(
    current_user: User = Depends(require_role(["doctor"])),
    db: Session = Depends(get_db)
):
    doc_prof = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.id).first()
    if not doc_prof or not doc_prof.certificate_file_path:
        raise HTTPException(status_code=404, detail="Medical certificate not found.")

    rel = doc_prof.certificate_file_path.replace("/uploads/", "")
    file_path = UPLOAD_DIR / rel
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Certificate file does not exist on disk.")

    return FileResponse(
        path=str(file_path),
        filename=doc_prof.certificate_filename or file_path.name
    )

@router.post("/resubmit-certificate")
async def resubmit_certificate(
    certificate: UploadFile = File(...),
    current_user: User = Depends(require_role(["doctor"])),
    db: Session = Depends(get_db)
):
    doc_prof = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.id).first()
    if not doc_prof:
        raise HTTPException(status_code=404, detail="Doctor profile not found.")

    allowed_exts = {".pdf", ".jpg", ".jpeg", ".png"}
    orig_name = certificate.filename or "certificate.pdf"
    file_ext = Path(orig_name).suffix.lower()

    if file_ext not in allowed_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid format '{file_ext}'. Allowed formats: PDF, JPG, JPEG, PNG."
        )

    file_bytes = await certificate.read()
    if len(file_bytes) > 15 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the 15MB limit."
        )

    cert_dir = UPLOAD_DIR / "certificates"
    cert_dir.mkdir(parents=True, exist_ok=True)
    safe_name = re.sub(r"[^a-zA-Z0-9_\-\.]", "_", Path(orig_name).stem)[:40]
    unique_filename = f"cert_{uuid4().hex[:10]}_{safe_name}{file_ext}"
    dest_path = cert_dir / unique_filename

    with open(dest_path, "wb") as f:
        f.write(file_bytes)

    doc_prof.certificate_file_path = f"/uploads/certificates/{unique_filename}"
    doc_prof.certificate_filename = orig_name
    doc_prof.verification_status = "pending"
    doc_prof.rejection_reason = None
    db.commit()

    # Create notification for doctor
    doc_notif = Notification(
        user_id=current_user.id,
        title="Certificate Resubmitted",
        message="Your updated medical certificate has been submitted and is currently awaiting administrator verification."
    )
    db.add(doc_notif)

    # Create notification for admins
    admins = db.query(User).filter(User.role == "admin").all()
    for adm in admins:
        adm_notif = Notification(
            user_id=adm.id,
            title="Doctor Certificate Resubmitted",
            message=f"Dr. {current_user.full_name} ({doc_prof.specialty}) has resubmitted their medical certificate for verification."
        )
        db.add(adm_notif)

    db.commit()

    return {
        "message": "Certificate re-submitted successfully. Verification status is now pending.",
        "verification_status": "pending",
        "certificate_filename": orig_name
    }


