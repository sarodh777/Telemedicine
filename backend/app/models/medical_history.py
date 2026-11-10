from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base

class MedicalHistoryRecord(Base):
    __tablename__ = "medical_history_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patient_profiles.id", ondelete="CASCADE"), nullable=False)
    record_type = Column(String(50), nullable=False, default="condition") # 'condition', 'allergy', 'diagnosis', 'medication', 'note'
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    doctor_name = Column(String(100), nullable=True)
    recorded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    patient = relationship("PatientProfile", back_populates="history_records")

