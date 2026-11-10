from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class PatientProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    village: Optional[str] = None
    emergency_contact: Optional[str] = None

class PatientProfileResponse(BaseModel):
    id: int
    user_id: int
    full_name: str
    email: str
    phone: str
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    village: Optional[str] = None
    emergency_contact: Optional[str] = None

    class Config:
        from_attributes = True

class MedicalHistoryCreate(BaseModel):
    record_type: str = "condition"  # 'condition', 'allergy', 'diagnosis', 'medication', 'note'
    title: str
    description: str
    doctor_name: Optional[str] = None

class MedicalHistoryResponse(BaseModel):
    id: int
    patient_id: int
    record_type: str
    title: str
    description: str
    doctor_name: Optional[str] = None
    recorded_at: datetime

    class Config:
        from_attributes = True

