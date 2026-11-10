from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class MedicalReportResponse(BaseModel):
    id: int
    patient_id: int
    appointment_id: Optional[int] = None
    doctor_id: Optional[int] = None
    title: str
    category: str
    original_filename: str
    file_path: str
    original_file_path: Optional[str] = ""
    preview_file_path: Optional[str] = ""
    file_type: str
    original_size: int
    compressed_size: int
    preview_size: Optional[int] = 0
    compression_ratio: Optional[str] = "0%"
    is_optimized: Optional[bool] = True
    doctor_remarks: Optional[str] = None
    uploaded_at: datetime

    class Config:
        from_attributes = True

