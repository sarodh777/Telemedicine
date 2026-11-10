from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class DashboardStatsResponse(BaseModel):
    total_users: int
    total_patients: int
    total_doctors: int
    total_appointments: int
    pending_appointments: int
    completed_appointments: int
    pending_doctor_verifications: int
    recent_activity: List[Dict[str, Any]] = []

class UserStatusUpdate(BaseModel):
    account_status: str  # 'active', 'suspended', 'pending'

class AuditLogResponse(BaseModel):
    id: int
    admin_id: Optional[int] = None
    admin_name: Optional[str] = None
    action: str
    target_type: str
    target_id: Optional[int] = None
    details: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

