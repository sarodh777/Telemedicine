from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from backend.app.database import Base

class MedicalReport(Base):
    __tablename__ = "medical_reports"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patient_profiles.id", ondelete="CASCADE"), nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.id", ondelete="SET NULL"), nullable=True)
    doctor_id = Column(Integer, ForeignKey("doctor_profiles.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(200), nullable=False)
    category = Column(String(50), nullable=False, default="prescription")  # 'prescription', 'lab_report', 'scan', 'other'
    original_filename = Column(String(255), nullable=False)
    
    # Dual file references: original preserved document + optimized bandwidth preview
    original_file_path = Column(String(500), nullable=False, default="")
    preview_file_path = Column(String(500), nullable=True)
    file_path = Column(String(500), nullable=False) # Default access path (points to preview or original)
    
    file_type = Column(String(50), nullable=False)
    original_size = Column(Integer, nullable=False, default=0)
    compressed_size = Column(Integer, nullable=False, default=0)
    preview_size = Column(Integer, nullable=False, default=0)
    compression_ratio = Column(String(50), nullable=True, default="0%")
    is_optimized = Column(Boolean, nullable=False, default=True)
    
    doctor_remarks = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    patient = relationship("PatientProfile", back_populates="reports")
    appointment = relationship("Appointment", backref="reports")
    doctor = relationship("DoctorProfile", backref="assigned_reports")
