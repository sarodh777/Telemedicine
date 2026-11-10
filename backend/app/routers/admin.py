from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from backend.app.config import UPLOAD_DIR
from backend.app.database import get_db
from backend.app.models.user import User, PatientProfile, DoctorProfile
from backend.app.models.appointment import Appointment
from backend.app.models.audit_log import AuditLog
from backend.app.models.notification import Notification
from backend.app.schemas.admin import (
    DashboardStatsResponse,
    UserStatusUpdate,
    AuditLogResponse
)
from backend.app.schemas.doctor import DoctorVerificationUpdate
from backend.app.services.auth import require_role
from backend.app.services.audit import log_admin_action

router = APIRouter(prefix="/api/admin", tags=["Admin Module"])

@router.get("/dashboard", response_model=DashboardStatsResponse)
def get_admin_dashboard(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    total_users = db.query(User).count()
    total_patients = db.query(User).filter(User.role == "patient").count()
    total_doctors = db.query(User).filter(User.role == "doctor").count()
    total_appointments = db.query(Appointment).count()
    pending_appointments = db.query(Appointment).filter(Appointment.status == "pending").count()
    completed_appointments = db.query(Appointment).filter(Appointment.status == "completed").count()
    pending_verifications = db.query(DoctorProfile).filter(DoctorProfile.verification_status == "pending").count()

    # Recent activity from audit logs
    recent_logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(6).all()
    recent_activity = [
        {
            "id": l.id,
            "action": l.action,
            "target_type": l.target_type,
            "details": l.details,
            "timestamp": l.created_at.strftime("%b %d, %H:%M")
        }
        for l in recent_logs
    ]

    return DashboardStatsResponse(
        total_users=total_users,
        total_patients=total_patients,
        total_doctors=total_doctors,
        total_appointments=total_appointments,
        pending_appointments=pending_appointments,
        completed_appointments=completed_appointments,
        pending_doctor_verifications=pending_verifications,
        recent_activity=recent_activity
    )

@router.get("/users")
def get_all_users(
    role: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    query = db.query(User)

    if role and role.lower() != "all":
        query = query.filter(User.role == role.lower())
    if status and status.lower() != "all":
        query = query.filter(User.account_status == status.lower())
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter((User.full_name.ilike(term)) | (User.email.ilike(term)) | (User.phone.ilike(term)))

    users = query.order_by(User.created_at.desc()).all()

    return [
        {
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "phone": u.phone,
            "role": u.role,
            "account_status": u.account_status,
            "created_at": u.created_at
        }
        for u in users
    ]

@router.put("/users/{user_id}/status")
def update_user_status(
    user_id: int,
    data: UserStatusUpdate,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot alter own admin status.")

    old_status = user.account_status
    user.account_status = data.account_status
    db.commit()

    log_admin_action(
        db=db,
        admin_id=current_user.id,
        action=f"Changed account status from {old_status} to {data.account_status}",
        target_type="user",
        target_id=user.id,
        details=f"User: {user.full_name} ({user.email})"
    )

    return {"message": f"User status updated to {data.account_status}", "user_id": user.id}

@router.get("/doctors")
def get_all_doctors(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    doctors = db.query(DoctorProfile).all()
    results = []
    for doc in doctors:
        if doc.user:
            results.append({
                "id": doc.id,
                "user_id": doc.user_id,
                "full_name": doc.user.full_name,
                "email": doc.user.email,
                "phone": doc.user.phone,
                "specialty": doc.specialty,
                "qualifications": doc.qualifications,
                "experience": doc.experience,
                "registration_number": doc.registration_number,
                "hospital_name": doc.hospital_name,
                "verification_status": doc.verification_status,
                "availability": doc.availability,
                "is_available": doc.is_available if doc.is_available is not None else True,
                "certificate_filename": doc.certificate_filename,
                "certificate_file_path": doc.certificate_file_path,
                "rejection_reason": doc.rejection_reason,
                "account_status": doc.user.account_status,
                "registered_at": doc.user.created_at
            })
    return results

@router.get("/doctors/{doctor_id}/certificate")
def get_doctor_certificate(
    doctor_id: int,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    doc = db.query(DoctorProfile).filter(DoctorProfile.id == doctor_id).first()
    if not doc or not doc.certificate_file_path:
        raise HTTPException(status_code=404, detail="Medical certificate not found for this doctor.")

    # Secure filesystem access inside UPLOAD_DIR
    rel = doc.certificate_file_path.replace("/uploads/", "")
    file_path = UPLOAD_DIR / rel
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Certificate file does not exist on disk.")

    return FileResponse(
        path=str(file_path),
        filename=doc.certificate_filename or file_path.name
    )

@router.put("/doctors/{doctor_id}/verification")
def verify_doctor(
    doctor_id: int,
    data: DoctorVerificationUpdate,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    doc = db.query(DoctorProfile).filter(DoctorProfile.id == doctor_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Doctor profile not found")

    status_clean = data.verification_status.lower().strip()
    if status_clean not in ["approved", "rejected", "pending"]:
        raise HTTPException(status_code=400, detail="Invalid status. Choose approved, rejected, or pending.")

    doc.verification_status = status_clean
    doc.verified_by_admin_id = current_user.id
    doc.verified_at = datetime.utcnow()

    if status_clean == "rejected":
        doc.rejection_reason = data.rejection_reason or "Credentials could not be verified."
        notif = Notification(
            user_id=doc.user_id,
            title="Verification Requires Attention",
            message=f"Your doctor registration requires further review. Please check the administrator's feedback: {doc.rejection_reason}"
        )
        db.add(notif)
    elif status_clean == "approved":
        doc.rejection_reason = None
        notif = Notification(
            user_id=doc.user_id,
            title="Medical Credentials Approved",
            message="Congratulations! Your medical credentials have been verified. Your TeleCare doctor account is now approved."
        )
        db.add(notif)

    db.commit()

    log_admin_action(
        db=db,
        admin_id=current_user.id,
        action=f"Doctor verification status set to {status_clean}",
        target_type="doctor",
        target_id=doc.id,
        details=f"Doctor: {doc.user.full_name if doc.user else 'Unknown'} | Note: {data.rejection_reason or '-'}"
    )

    return {
        "message": f"Doctor successfully {status_clean}.",
        "doctor_id": doc.id,
        "verification_status": status_clean,
        "rejection_reason": doc.rejection_reason
    }

@router.get("/appointments")
def get_all_appointments(
    status: Optional[str] = None,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    query = db.query(Appointment)
    if status and status.lower() != "all":
        query = query.filter(Appointment.status == status.lower())

    appointments = query.order_by(Appointment.created_at.desc()).all()

    results = []
    for a in appointments:
        pat_prof = db.query(PatientProfile).filter(PatientProfile.id == a.patient_id).first()
        pat_name = pat_prof.user.full_name if pat_prof and pat_prof.user else "Patient"
        doc_prof = db.query(DoctorProfile).filter(DoctorProfile.id == a.doctor_id).first()
        doc_name = f"Dr. {doc_prof.user.full_name}" if doc_prof and doc_prof.user else "Doctor"

        results.append({
            "id": a.id,
            "patient_name": pat_name,
            "doctor_name": doc_name,
            "specialty": doc_prof.specialty if doc_prof else "General",
            "appointment_date": a.appointment_date,
            "appointment_time": a.appointment_time,
            "consultation_type": a.consultation_type,
            "reason": a.reason,
            "status": a.status,
            "created_at": a.created_at
        })
    return results

@router.get("/audit-logs")
def get_audit_logs(
    limit: int = 50,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    results = []
    for l in logs:
        admin_user = db.query(User).filter(User.id == l.admin_id).first() if l.admin_id else None
        results.append({
            "id": l.id,
            "admin_id": l.admin_id,
            "admin_name": admin_user.full_name if admin_user else "System",
            "action": l.action,
            "target_type": l.target_type,
            "target_id": l.target_id,
            "details": l.details,
            "created_at": l.created_at
        })
    return results

