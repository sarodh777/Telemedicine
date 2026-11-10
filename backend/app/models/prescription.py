from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id", ondelete="SET NULL"), nullable=True)
    doctor_id = Column(Integer, ForeignKey("doctor_profiles.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patient_profiles.id", ondelete="CASCADE"), nullable=False)
    
    diagnosis = Column(Text, nullable=False)
    # Stored as JSON array: [{ name, dosage, frequency, duration, instructions }]
    medicines = Column(JSON, nullable=False, default=list)
    doctor_notes = Column(Text, nullable=True)
    follow_up_date = Column(String(50), nullable=True)
    
    # Status: 'draft', 'finalized', 'amended'
    status = Column(String(20), nullable=False, default="finalized")
    version = Column(Integer, nullable=False, default=1)
    parent_prescription_id = Column(Integer, nullable=True)  # For revision audit trail
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    doctor = relationship("DoctorProfile", backref="prescriptions")
    patient = relationship("PatientProfile", backref="prescriptions")
    appointment = relationship("Appointment", backref="prescriptions")

