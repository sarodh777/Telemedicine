from typing import Optional
from sqlalchemy.orm import Session
from backend.app.models.audit_log import AuditLog

def log_admin_action(
    db: Session,
    admin_id: Optional[int],
    action: str,
    target_type: str,
    target_id: Optional[int] = None,
    details: Optional[str] = None
):
    """Logs an administrative action for security auditing."""
    log_entry = AuditLog(
        admin_id=admin_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        details=details
    )
    db.add(log_entry)
    db.commit()

