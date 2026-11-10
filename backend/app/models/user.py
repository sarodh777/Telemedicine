from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from backend.app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    full_name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    phone = Column(String(30), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="patient")  # 'patient', 'doctor', 'admin'
    account_status = Column(String(20), nullable=False, default="active")  # 'active', 'suspended', 'pending'
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    patient_profile = relationship("PatientProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    doctor_profile = relationship("DoctorProfile", foreign_keys="DoctorProfile.user_id", back_populates="user", uselist=False, cascade="all, delete-orphan")
    admin_profile = relationship("AdminProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    
    sent_messages = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender", cascade="all, delete-orphan")
    received_messages = relationship("Message", foreign_keys="Message.receiver_id", back_populates="receiver", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    date_of_birth = Column(String(30), nullable=True)
    gender = Column(String(20), nullable=True)
    address = Column(String(255), nullable=True)
    village = Column(String(100), nullable=True)
    emergency_contact = Column(String(50), nullable=True)

    user = relationship("User", back_populates="patient_profile")
    appointments = relationship("Appointment", back_populates="patient", cascade="all, delete-orphan")
    reports = relationship("MedicalReport", back_populates="patient", cascade="all, delete-orphan")
    history_records = relationship("MedicalHistoryRecord", back_populates="patient", cascade="all, delete-orphan")


class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    specialty = Column(String(100), nullable=False, default="General Medicine")
    qualifications = Column(String(200), nullable=False, default="MBBS")
    experience = Column(String(50), nullable=False, default="5+ years")
    verification_status = Column(String(20), nullable=False, default="pending")  # 'pending', 'approved', 'rejected'
    availability = Column(String(255), nullable=False, default="Mon - Sat, 09:00 AM - 04:00 PM")
    is_available = Column(Boolean, nullable=False, default=True)
    consultation_fee = Column(String(50), nullable=True, default="Free / Community Subsidized")
    
    # Registration & Verification Credentials
    registration_number = Column(String(100), nullable=True)
    hospital_name = Column(String(200), nullable=True)
    certificate_file_path = Column(String(500), nullable=True)
    certificate_filename = Column(String(255), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    verified_by_admin_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    verified_at = Column(DateTime, nullable=True)

    user = relationship("User", foreign_keys=[user_id], back_populates="doctor_profile")
    appointments = relationship("Appointment", back_populates="doctor", cascade="all, delete-orphan")


class AdminProfile(Base):
    __tablename__ = "admin_profiles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    permissions = Column(String(100), nullable=False, default="all")

    user = relationship("User", back_populates="admin_profile")

