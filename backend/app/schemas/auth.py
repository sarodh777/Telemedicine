from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class UserSignup(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    phone: str = Field(..., min_length=6, max_length=30)
    password: str = Field(..., min_length=6)
    role: str = Field(default="patient")  # 'patient' or 'doctor'
    # Optional fields for doctor signup
    specialty: Optional[str] = "General Medicine"
    qualifications: Optional[str] = "MBBS"
    experience: Optional[str] = "3+ years"
    # Optional fields for patient signup
    village: Optional[str] = None
    address: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    full_name: str
    email: str
    verification_status: Optional[str] = "approved"
    rejection_reason: Optional[str] = None
    is_available: Optional[bool] = True

class PasswordReset(BaseModel):
    email: EmailStr
    new_password: str = Field(..., min_length=6)

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    phone: str
    role: str
    account_status: str
    created_at: datetime

    class Config:
        from_attributes = True

