from typing import Optional
from pydantic import BaseModel

class DoctorProfileResponse(BaseModel):
    id: int
    user_id: int
    full_name: str
    email: str
    phone: str
    specialty: str
    qualifications: str
    experience: str
    verification_status: str
    availability: str
    is_available: bool = True
    registration_number: Optional[str] = None
    hospital_name: Optional[str] = None
    consultation_fee: Optional[str] = "Free / Community Subsidized"

    class Config:
        from_attributes = True

class DoctorAvailabilityUpdate(BaseModel):
    availability: Optional[str] = None
    is_available: Optional[bool] = None

class DoctorVerificationUpdate(BaseModel):
    verification_status: str  # 'approved', 'rejected', 'pending'
    rejection_reason: Optional[str] = None

