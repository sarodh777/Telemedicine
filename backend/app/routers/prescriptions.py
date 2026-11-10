from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.user import User, PatientProfile, DoctorProfile
from backend.app.models.appointment import Appointment
from backend.app.models.prescription import Prescription
from backend.app.schemas.prescription import (
    PrescriptionCreate,
    PrescriptionUpdate,
    PrescriptionResponse
)
from backend.app.services.auth import require_role

router = APIRouter(prefix="/api/prescriptions", tags=["Digital Prescriptions"])

def enrich_prescription(rx: Prescription, db: Session) -> dict:
    """Helper to enrich prescription ORM with doctor and patient details."""
    doc_prof = db.query(DoctorProfile).filter(DoctorProfile.id == rx.doctor_id).first()
    doc_user = db.query(User).filter(User.id == doc_prof.user_id).first() if doc_prof else None

    pat_prof = db.query(PatientProfile).filter(PatientProfile.id == rx.patient_id).first()
    pat_user = db.query(User).filter(User.id == pat_prof.user_id).first() if pat_prof else None

    return {
        "id": rx.id,
        "appointment_id": rx.appointment_id,
        "doctor_id": rx.doctor_id,
        "patient_id": rx.patient_id,
        "diagnosis": rx.diagnosis,
        "medicines": rx.medicines or [],
        "doctor_notes": rx.doctor_notes,
        "follow_up_date": rx.follow_up_date,
        "status": rx.status,
        "version": rx.version,
        "parent_prescription_id": rx.parent_prescription_id,
        "created_at": rx.created_at,
        "updated_at": rx.updated_at,
        "doctor_name": doc_user.full_name if (doc_user and doc_user.full_name.startswith("Dr.")) else (f"Dr. {doc_user.full_name}" if doc_user else "Doctor"),
        "doctor_specialty": doc_prof.specialty if doc_prof else "General Physician",
        "doctor_qualifications": doc_prof.qualifications if doc_prof else "MBBS",
        "patient_name": pat_user.full_name if pat_user else "Patient",
        "patient_gender": pat_prof.gender if pat_prof else "-",
        "patient_village": pat_prof.village if pat_prof else "-"
    }

@router.get("/patient", response_model=List[PrescriptionResponse])
def get_patient_prescriptions(
    appointment_id: Optional[int] = None,
    current_user: User = Depends(require_role(["patient"])),
    db: Session = Depends(get_db)
):
    prof = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
    if not prof:
        return []

    query = db.query(Prescription).filter(Prescription.patient_id == prof.id)
    if appointment_id:
        query = query.filter(Prescription.appointment_id == appointment_id)

    prescriptions = query.order_by(Prescription.created_at.desc()).all()
    return [enrich_prescription(p, db) for p in prescriptions]

@router.get("/doctor", response_model=List[PrescriptionResponse])
def get_doctor_prescriptions(
    patient_id: Optional[int] = None,
    appointment_id: Optional[int] = None,
    current_user: User = Depends(require_role(["doctor"])),
    db: Session = Depends(get_db)
):
    doc = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.id).first()
    if not doc:
        return []

    query = db.query(Prescription).filter(Prescription.doctor_id == doc.id)
    if patient_id:
        query = query.filter(Prescription.patient_id == patient_id)
    if appointment_id:
        query = query.filter(Prescription.appointment_id == appointment_id)

    prescriptions = query.order_by(Prescription.created_at.desc()).all()
    return [enrich_prescription(p, db) for p in prescriptions]

@router.get("/{prescription_id}", response_model=PrescriptionResponse)
def get_prescription_by_id(
    prescription_id: int,
    current_user: User = Depends(require_role(["patient", "doctor", "admin"])),
    db: Session = Depends(get_db)
):
    rx = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not rx:
        raise HTTPException(status_code=404, detail="Prescription not found")

    # Role permission check
    if current_user.role == "patient":
        pat_prof = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
        if not pat_prof or rx.patient_id != pat_prof.id:
            raise HTTPException(status_code=403, detail="Unauthorized access to prescription")
    elif current_user.role == "doctor":
        doc_prof = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.id).first()
        if not doc_prof or rx.doctor_id != doc_prof.id:
            raise HTTPException(status_code=403, detail="Unauthorized access to prescription")

    return enrich_prescription(rx, db)

@router.post("", response_model=PrescriptionResponse)
def create_prescription(
    data: PrescriptionCreate,
    current_user: User = Depends(require_role(["doctor"])),
    db: Session = Depends(get_db)
):
    doc_prof = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.id).first()
    if not doc_prof:
        raise HTTPException(status_code=400, detail="Doctor profile not found")

    # Validate patient exists
    pat_prof = db.query(PatientProfile).filter(PatientProfile.id == data.patient_id).first()
    if not pat_prof:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    # Serialize medicines
    med_list = [m.model_dump() if hasattr(m, "model_dump") else m.dict() for m in data.medicines]

    rx = Prescription(
        doctor_id=doc_prof.id,
        patient_id=data.patient_id,
        appointment_id=data.appointment_id,
        diagnosis=data.diagnosis.strip(),
        medicines=med_list,
        doctor_notes=data.doctor_notes or "",
        follow_up_date=data.follow_up_date,
        status=data.status or "finalized",
        version=1
    )
    db.add(rx)
    db.commit()
    db.refresh(rx)

    return enrich_prescription(rx, db)

@router.put("/{prescription_id}", response_model=PrescriptionResponse)
def update_prescription(
    prescription_id: int,
    data: PrescriptionUpdate,
    current_user: User = Depends(require_role(["doctor"])),
    db: Session = Depends(get_db)
):
    doc_prof = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.id).first()
    if not doc_prof:
        raise HTTPException(status_code=400, detail="Doctor profile not found")

    rx = db.query(Prescription).filter(
        Prescription.id == prescription_id,
        Prescription.doctor_id == doc_prof.id
    ).first()
    if not rx:
        raise HTTPException(status_code=404, detail="Prescription not found")

    if data.diagnosis is not None:
        rx.diagnosis = data.diagnosis.strip()
    if data.medicines is not None:
        rx.medicines = [m.model_dump() if hasattr(m, "model_dump") else m.dict() for m in data.medicines]
    if data.doctor_notes is not None:
        rx.doctor_notes = data.doctor_notes
    if data.follow_up_date is not None:
        rx.follow_up_date = data.follow_up_date

    if data.status:
        rx.status = data.status
        if data.status == "amended" or rx.status == "finalized":
            rx.version = (rx.version or 1) + 1

    rx.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(rx)

    return enrich_prescription(rx, db)

@router.get("/{prescription_id}/print", response_class=HTMLResponse)
def get_printable_prescription(
    prescription_id: int,
    current_user: User = Depends(require_role(["patient", "doctor", "admin"])),
    db: Session = Depends(get_db)
):
    rx_data = get_prescription_by_id(prescription_id, current_user, db)

    medicines_rows = ""
    for idx, m in enumerate(rx_data["medicines"], 1):
        medicines_rows += f"""
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px; font-weight: 600; color: #1e293b;">{idx}. {m.get('name', '')}</td>
            <td style="padding: 10px; color: #475569;">{m.get('dosage', '')}</td>
            <td style="padding: 10px; color: #475569;">{m.get('frequency', '')}</td>
            <td style="padding: 10px; color: #475569;">{m.get('duration', '')}</td>
            <td style="padding: 10px; color: #64748b; font-style: italic;">{m.get('instructions', '-')}</td>
        </tr>
        """

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>TeleCare Prescription #{rx_data['id']}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 30px;
            color: #102A4C;
            background: #fff;
        }}
        .rx-card {{
            max-width: 800px;
            margin: 0 auto;
            border: 2px solid #102A4C;
            border-radius: 8px;
            padding: 24px;
        }}
        .header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #102A4C;
            padding-bottom: 16px;
            margin-bottom: 20px;
        }}
        .branding h1 {{
            margin: 0;
            font-size: 24px;
            color: #102A4C;
            letter-spacing: -0.5px;
        }}
        .branding p {{
            margin: 2px 0 0;
            font-size: 11px;
            color: #587493;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}
        .badge {{
            background: #E8F0F7;
            color: #102A4C;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
        }}
        .doctor-info {{
            text-align: right;
        }}
        .doctor-info h3 {{
            margin: 0;
            color: #102A4C;
            font-size: 16px;
        }}
        .doctor-info p {{
            margin: 2px 0;
            font-size: 12px;
            color: #587493;
        }}
        .patient-box {{
            background: #F4F6F9;
            border-radius: 6px;
            padding: 12px 16px;
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            font-size: 13px;
        }}
        .section-title {{
            font-size: 14px;
            font-weight: 700;
            color: #102A4C;
            text-transform: uppercase;
            margin: 16px 0 8px;
            border-left: 4px solid #102A4C;
            padding-left: 8px;
        }}
        .rx-symbol {{
            font-family: Georgia, serif;
            font-size: 28px;
            font-weight: bold;
            color: #102A4C;
            margin-bottom: 8px;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
            margin-bottom: 20px;
        }}
        th {{
            background: #E8F0F7;
            color: #102A4C;
            text-align: left;
            padding: 10px;
            font-weight: 600;
        }}
        .footer {{
            margin-top: 40px;
            border-top: 1px dashed #cbd5e1;
            padding-top: 16px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }}
        .signature-box {{
            text-align: center;
            border-top: 1px solid #102A4C;
            width: 200px;
            padding-top: 6px;
            font-size: 12px;
            font-weight: 600;
        }}
        @media print {{
            body {{ padding: 0; }}
            .rx-card {{ border: none; }}
            .no-print {{ display: none; }}
        }}
    </style>
</head>
<body>
    <div style="text-align: center; margin-bottom: 16px;" class="no-print">
        <button onclick="window.print()" style="background: #102A4C; color: #fff; border: none; padding: 8px 18px; border-radius: 6px; font-weight: 600; cursor: pointer;">
            🖨️ Print Prescription
        </button>
    </div>

    <div class="rx-card">
        <div class="header">
            <div class="branding">
                <h1>TeleCare Rural Medical Network</h1>
                <p>Karavali Institute of Technology &bull; AIORA Hackathon 2026</p>
                <span class="badge">Official Digital Medical Prescription</span>
            </div>
            <div class="doctor-info">
                <h3>{rx_data['doctor_name']}</h3>
                <p>{rx_data['doctor_qualifications']}</p>
                <p>Specialty: {rx_data['doctor_specialty']}</p>
            </div>
        </div>

        <div class="patient-box">
            <div>
                <strong>Patient:</strong> {rx_data['patient_name']}<br>
                <strong>Gender:</strong> {rx_data.get('patient_gender', '-')}<br>
                <strong>Village/Region:</strong> {rx_data.get('patient_village', '-')}
            </div>
            <div style="text-align: right;">
                <strong>Prescription #:</strong> RX-{rx_data['id']:05d}<br>
                <strong>Date:</strong> {rx_data['created_at'].strftime('%d %B %Y')}<br>
                <strong>Status:</strong> <span style="text-transform: capitalize;">{rx_data['status']} (v{rx_data['version']})</span>
            </div>
        </div>

        <div class="section-title">Clinical Diagnosis</div>
        <p style="margin: 4px 0 16px 8px; font-size: 14px; font-weight: 500; color: #1e293b;">{rx_data['diagnosis']}</p>

        <div class="rx-symbol">&#8478;</div>
        <table>
            <thead>
                <tr>
                    <th>Medicine</th>
                    <th>Dosage</th>
                    <th>Frequency</th>
                    <th>Duration</th>
                    <th>Instructions</th>
                </tr>
            </thead>
            <tbody>
                {medicines_rows}
            </tbody>
        </table>

        {f'''
        <div class="section-title">Doctor's Advice & Dietary Notes</div>
        <p style="margin: 4px 0 16px 8px; font-size: 13px; color: #334155;">{rx_data['doctor_notes']}</p>
        ''' if rx_data.get('doctor_notes') else ''}

        {f'''
        <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 8px 12px; margin-top: 12px; font-size: 13px;">
            <strong>Scheduled Follow-Up:</strong> {rx_data['follow_up_date']}
        </div>
        ''' if rx_data.get('follow_up_date') else ''}

        <div class="footer">
            <div style="font-size: 11px; color: #64748b;">
                Generated digitally via TeleCare Secure Rural Network.<br>
                Valid without physical signature for telemedicine consultations.
            </div>
            <div class="signature-box">
                {rx_data['doctor_name']}<br>
                <span style="font-size: 10px; font-weight: normal; color: #64748b;">Digitally Verified Doctor</span>
            </div>
        </div>
    </div>
</body>
</html>"""
    return HTMLResponse(content=html)
