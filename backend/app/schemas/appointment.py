from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class AppointmentCreate(BaseModel):
    doctor_id: int
    appointment_date: str
    appointment_time: str
    consultation_type: str = "online"  # 'online' or 'in-person'
    reason: str

class AppointmentStatusUpdate(BaseModel):
    status: str  # 'confirmed', 'completed', 'cancelled'
    rejection_reason: Optional[str] = None
    doctor_notes: Optional[str] = None

class AppointmentResponse(BaseModel):
    id: int
    patient_id: int
    doctor_id: int
    patient_name: Optional[str] = None
    patient_phone: Optional[str] = None
    patient_village: Optional[str] = None
    doctor_name: Optional[str] = None
    doctor_specialty: Optional[str] = None
    appointment_date: str
    appointment_time: str
    consultation_type: str
    reason: str
    status: str
    rejection_reason: Optional[str] = None
    doctor_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

