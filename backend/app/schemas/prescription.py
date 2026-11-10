from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, Field

class MedicineItem(BaseModel):
    name: str = Field(..., description="Name of the medicine")
    dosage: str = Field(..., description="Dosage (e.g., 500mg, 1 tablet, 5ml)")
    frequency: str = Field(..., description="Frequency (e.g., Twice daily after food, 1-0-1)")
    duration: str = Field(..., description="Duration (e.g., 5 days, 1 month)")
    instructions: Optional[str] = Field("", description="Special instructions (e.g., With warm water, avoid dairy)")

class PrescriptionCreate(BaseModel):
    patient_id: int
    appointment_id: Optional[int] = None
    diagnosis: str
    medicines: List[MedicineItem]
    doctor_notes: Optional[str] = ""
    follow_up_date: Optional[str] = None
    status: Optional[str] = "finalized" # 'draft' or 'finalized'

class PrescriptionUpdate(BaseModel):
    diagnosis: Optional[str] = None
    medicines: Optional[List[MedicineItem]] = None
    doctor_notes: Optional[str] = None
    follow_up_date: Optional[str] = None
    status: Optional[str] = None # 'draft', 'finalized', 'amended'

class PrescriptionResponse(BaseModel):
    id: int
    appointment_id: Optional[int] = None
    doctor_id: int
    patient_id: int
    diagnosis: str
    medicines: List[Any]
    doctor_notes: Optional[str] = None
    follow_up_date: Optional[str] = None
    status: str
    version: int
    parent_prescription_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Doctor and patient enriched details
    doctor_name: Optional[str] = None
    doctor_specialty: Optional[str] = None
    doctor_qualifications: Optional[str] = None
    patient_name: Optional[str] = None
    patient_gender: Optional[str] = None

    class Config:
        from_attributes = True

