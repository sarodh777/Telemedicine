import os
import re
from uuid import uuid4
from pathlib import Path
from datetime import timedelta, datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from backend.app.config import UPLOAD_DIR
from backend.app.database import get_db
from backend.app.models.user import User, PatientProfile, DoctorProfile
from backend.app.models.notification import Notification
from backend.app.schemas.auth import UserSignup, UserLogin, Token, PasswordReset, UserResponse
from backend.app.services.auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/signup", response_model=Token)
def signup(data: UserSignup, db: Session = Depends(get_db)):
    # Check if email already exists
    existing = db.query(User).filter(User.email == data.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # Validate role
    role = data.role.lower().strip()
    if role not in ["patient", "doctor"]:
        role = "patient"

    # Status: patients are active immediately; doctors active or pending admin verification
    account_status = "active"
    verification_status = "verified" if role == "patient" else "pending"

    # Create user
    new_user = User(
        full_name=data.full_name.strip(),
        email=data.email.lower().strip(),
        phone=data.phone.strip(),
        password_hash=get_password_hash(data.password),
        role=role,
        account_status=account_status
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create associated profile
    if role == "patient":
        patient_prof = PatientProfile(
            user_id=new_user.id,
            village=data.village,
            address=data.address
        )
        db.add(patient_prof)
    elif role == "doctor":
        doctor_prof = DoctorProfile(
            user_id=new_user.id,
            specialty=data.specialty or "General Medicine",
            qualifications=data.qualifications or "MBBS",
            experience=data.experience or "3+ years",
            verification_status="pending",
            availability="Mon - Sat, 09:00 AM - 04:00 PM",
            is_available=True
        )
        db.add(doctor_prof)

    db.commit()

    # Generate JWT token immediately without email verification
    access_token = create_access_token(data={"sub": str(new_user.id), "role": new_user.role})

    return Token(
        access_token=access_token,
        token_type="bearer",
        role=new_user.role,
        user_id=new_user.id,
        full_name=new_user.full_name,
        email=new_user.email,
        verification_status="approved" if role == "patient" else "pending",
        is_available=True
    )

@router.post("/register-doctor", response_model=Token)
async def register_doctor(
    full_name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    password: str = Form(...),
    specialty: str = Form("General Medicine"),
    qualifications: str = Form("MBBS"),
    registration_number: str = Form(...),
    experience: str = Form("3+ years"),
    hospital_name: str = Form(...),
    certificate: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # 1. Validate email uniqueness
    cleaned_email = email.lower().strip()
    existing = db.query(User).filter(User.email == cleaned_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    if len(password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long."
        )

    # 2. Validate Certificate File
    allowed_exts = {".pdf", ".jpg", ".jpeg", ".png"}
    orig_name = certificate.filename or "certificate.pdf"
    file_ext = Path(orig_name).suffix.lower()

    if file_ext not in allowed_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file format: '{file_ext}'. Allowed formats: PDF, JPG, JPEG, PNG."
        )

    file_bytes = await certificate.read()
    if len(file_bytes) > 15 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Medical certificate file size exceeds the 15MB maximum limit."
        )

    # 3. Securely store certificate file
    cert_dir = UPLOAD_DIR / "certificates"
    cert_dir.mkdir(parents=True, exist_ok=True)
    safe_name = re.sub(r"[^a-zA-Z0-9_\-\.]", "_", Path(orig_name).stem)[:40]
    unique_filename = f"cert_{uuid4().hex[:10]}_{safe_name}{file_ext}"
    dest_path = cert_dir / unique_filename

    with open(dest_path, "wb") as f:
        f.write(file_bytes)

    relative_file_path = f"/uploads/certificates/{unique_filename}"

    # 4. Create User
    new_user = User(
        full_name=full_name.strip(),
        email=cleaned_email,
        phone=phone.strip(),
        password_hash=get_password_hash(password),
        role="doctor",
        account_status="active"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 5. Create Doctor Profile with 'pending' verification status
    doctor_prof = DoctorProfile(
        user_id=new_user.id,
        specialty=specialty.strip(),
        qualifications=qualifications.strip(),
        experience=experience.strip(),
        registration_number=registration_number.strip(),
        hospital_name=hospital_name.strip(),
        certificate_file_path=relative_file_path,
        certificate_filename=orig_name,
        verification_status="pending",
        availability="Mon - Sat, 09:00 AM - 04:00 PM",
        is_available=True
    )
    db.add(doctor_prof)

    # 6. Create Initial System Notification
    welcome_notif = Notification(
        user_id=new_user.id,
        title="Registration Submitted",
        message="Your registration has been submitted successfully. Your medical certificate is awaiting administrator verification."
    )
    db.add(welcome_notif)
    db.commit()

    # 7. Issue JWT token
    access_token = create_access_token(data={"sub": str(new_user.id), "role": "doctor"})

    return Token(
        access_token=access_token,
        token_type="bearer",
        role="doctor",
        user_id=new_user.id,
        full_name=new_user.full_name,
        email=new_user.email,
        verification_status="pending",
        is_available=True
    )

@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email.lower().strip()).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password credentials."
        )

    if user.account_status == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended by an administrator."
        )

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})

    verif_status = "approved"
    rejection_reason = None
    is_available = True

    if user.role == "doctor":
        doc = db.query(DoctorProfile).filter(DoctorProfile.user_id == user.id).first()
        if doc:
            verif_status = doc.verification_status or "pending"
            rejection_reason = doc.rejection_reason
            is_available = doc.is_available if doc.is_available is not None else True

    return Token(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
        verification_status=verif_status,
        rejection_reason=rejection_reason,
        is_available=is_available
    )

@router.get("/me")
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile_data = {
        "id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "phone": current_user.phone,
        "role": current_user.role,
        "account_status": current_user.account_status,
        "created_at": current_user.created_at
    }

    if current_user.role == "patient" and current_user.patient_profile:
        p = current_user.patient_profile
        profile_data["patient_profile"] = {
            "id": p.id,
            "date_of_birth": p.date_of_birth,
            "gender": p.gender,
            "address": p.address,
            "village": p.village,
            "emergency_contact": p.emergency_contact
        }
    elif current_user.role == "doctor" and current_user.doctor_profile:
        d = current_user.doctor_profile
        profile_data["doctor_profile"] = {
            "id": d.id,
            "specialty": d.specialty,
            "qualifications": d.qualifications,
            "experience": d.experience,
            "verification_status": d.verification_status,
            "is_available": d.is_available if d.is_available is not None else True,
            "rejection_reason": d.rejection_reason,
            "hospital_name": d.hospital_name,
            "registration_number": d.registration_number,
            "certificate_filename": d.certificate_filename,
            "availability": d.availability,
            "consultation_fee": d.consultation_fee
        }

    return profile_data

@router.post("/forgot-password")
def forgot_password(data: dict, db: Session = Depends(get_db)):
    email = data.get("email", "").lower().strip()
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account registered with this email address."
        )
    return {
        "message": "Account verified. You can now reset your password directly in development mode.",
        "email": user.email
    }

@router.post("/reset-password")
def reset_password(data: PasswordReset, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email.lower().strip()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found."
        )
    user.password_hash = get_password_hash(data.new_password)
    db.commit()
    return {"message": "Password has been successfully updated. You can now login."}

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Successfully logged out."}

