from datetime import datetime
from sqlalchemy.orm import Session
from backend.app.database import engine, Base, SessionLocal
from backend.app.models.user import User, PatientProfile, DoctorProfile, AdminProfile
from backend.app.models.appointment import Appointment
from backend.app.models.report import MedicalReport
from backend.app.models.medical_history import MedicalHistoryRecord
from backend.app.models.prescription import Prescription
from backend.app.models.audit_log import AuditLog
from backend.app.services.auth import get_password_hash

def seed_database():
    """Initializes tables and seeds initial administrative and demonstration accounts."""
    # Create all tables
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    try:
        # 1. Seed Admin
        admin_email = "admin@telecare.org"
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            admin = User(
                full_name="TeleCare System Administrator",
                email=admin_email,
                phone="+91 98765 00000",
                password_hash=get_password_hash("Admin@123"),
                role="admin",
                account_status="active"
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)

            admin_prof = AdminProfile(user_id=admin.id, permissions="all")
            db.add(admin_prof)

            log = AuditLog(
                admin_id=admin.id,
                action="System Initialization & Admin Seeding",
                target_type="system",
                details="Initial platform admin provisioned."
            )
            db.add(log)
            db.commit()
            print("Seeded Admin: admin@telecare.org / Admin@123")

        # 2. Seed Sample Doctors
        doctors_data = [
            {
                "name": "Dr. Rajesh Sharma",
                "email": "dr.rajesh@telecare.org",
                "phone": "+91 98111 22334",
                "specialty": "General Medicine",
                "qualifications": "MBBS, MD (Internal Medicine)",
                "experience": "12 years",
                "availability": "Mon - Sat, 09:00 AM - 02:00 PM"
            },
            {
                "name": "Dr. Ananya Sen",
                "email": "dr.ananya@telecare.org",
                "phone": "+91 98222 33445",
                "specialty": "Pediatrics & Child Health",
                "qualifications": "MBBS, DCH, DNB (Pediatrics)",
                "experience": "9 years",
                "availability": "Mon - Fri, 10:00 AM - 04:00 PM"
            },
            {
                "name": "Dr. Vikram Mehta",
                "email": "dr.vikram@telecare.org",
                "phone": "+91 98333 44556",
                "specialty": "Cardiology",
                "qualifications": "MBBS, MD, DM (Cardiology)",
                "experience": "15 years",
                "availability": "Tue, Thu, Sat, 11:00 AM - 03:00 PM"
            },
            {
                "name": "Dr. Sunita Rao",
                "email": "dr.sunita@telecare.org",
                "phone": "+91 98444 55667",
                "specialty": "Obstetrics & Maternal Health",
                "qualifications": "MBBS, MS (OBG)",
                "experience": "11 years",
                "availability": "Mon - Sat, 08:30 AM - 01:30 PM"
            }
        ]

        seeded_doc_profiles = []
        for d in doctors_data:
            existing_doc = db.query(User).filter(User.email == d["email"]).first()
            if not existing_doc:
                doc_user = User(
                    full_name=d["name"],
                    email=d["email"],
                    phone=d["phone"],
                    password_hash=get_password_hash("Doctor@123"),
                    role="doctor",
                    account_status="active"
                )
                db.add(doc_user)
                db.commit()
                db.refresh(doc_user)

                doc_prof = DoctorProfile(
                    user_id=doc_user.id,
                    specialty=d["specialty"],
                    qualifications=d["qualifications"],
                    experience=d["experience"],
                    verification_status="verified",
                    availability=d["availability"],
                    consultation_fee="Free / Community Subsidized"
                )
                db.add(doc_prof)
                db.commit()
                db.refresh(doc_prof)
                seeded_doc_profiles.append(doc_prof)
                print(f"Seeded Doctor: {d['email']} / Doctor@123")
            else:
                prof = db.query(DoctorProfile).filter(DoctorProfile.user_id == existing_doc.id).first()
                if prof:
                    seeded_doc_profiles.append(prof)

        # 3. Seed Sample Patient
        patient_email = "patient@telecare.org"
        patient_user = db.query(User).filter(User.email == patient_email).first()
        if not patient_user:
            patient_user = User(
                full_name="Ramesh Kumar",
                email=patient_email,
                phone="+91 97555 66778",
                password_hash=get_password_hash("Patient@123"),
                role="patient",
                account_status="active"
            )
            db.add(patient_user)
            db.commit()
            db.refresh(patient_user)

            pat_prof = PatientProfile(
                user_id=patient_user.id,
                date_of_birth="1988-06-15",
                gender="Male",
                address="Near Panchayat Bhavan, House No. 24",
                village="Rampur Kalan, District Sitapur",
                emergency_contact="+91 97555 99000 (Brother - Suresh)"
            )
            db.add(pat_prof)
            db.commit()
            db.refresh(pat_prof)

            # Seed medical history
            histories = [
                MedicalHistoryRecord(
                    patient_id=pat_prof.id,
                    record_type="condition",
                    title="Essential Hypertension",
                    description="Mild elevated blood pressure, managed with low sodium diet and regular monitoring.",
                    doctor_name="Dr. Rajesh Sharma"
                ),
                MedicalHistoryRecord(
                    patient_id=pat_prof.id,
                    record_type="allergy",
                    title="Penicillin Sensitivity",
                    description="Causes mild skin hives. Avoid Amoxicillin / Penicillin derivatives.",
                    doctor_name="Dr. Rajesh Sharma"
                ),
                MedicalHistoryRecord(
                    patient_id=pat_prof.id,
                    record_type="medication",
                    title="Amlodipine 5mg",
                    description="Take 1 tablet daily after breakfast.",
                    doctor_name="Dr. Rajesh Sharma"
                )
            ]
            db.add_all(histories)

            # Seed an appointment
            if seeded_doc_profiles:
                first_doc = seeded_doc_profiles[0]
                sample_appt = Appointment(
                    patient_id=pat_prof.id,
                    doctor_id=first_doc.id,
                    appointment_date="2026-11-12",
                    appointment_time="10:30 AM",
                    consultation_type="online",
                    reason="Routine follow-up on seasonal cough and blood pressure check.",
                    status="confirmed"
                )
                db.add(sample_appt)

            # Seed a sample report record
            sample_report = MedicalReport(
                patient_id=pat_prof.id,
                title="Blood Pressure & Routine Lab Report",
                category="lab_report",
                original_filename="lab_report_nov2026.pdf",
                file_path="/uploads/sample_lab_report.pdf",
                original_file_path="/uploads/sample_lab_report.pdf",
                preview_file_path="/uploads/sample_lab_report.pdf",
                file_type="application/pdf",
                original_size=245000,
                compressed_size=165000,
                preview_size=165000,
                compression_ratio="32.6% reduction",
                is_optimized=True
            )
            db.add(sample_report)
            db.commit()

            # Seed a sample prescription
            if seeded_doc_profiles:
                first_doc = seeded_doc_profiles[0]
                sample_rx = Prescription(
                    doctor_id=first_doc.id,
                    patient_id=pat_prof.id,
                    appointment_id=sample_appt.id if 'sample_appt' in locals() else None,
                    diagnosis="Mild Hypertension & Seasonal Bronchial Irritation",
                    medicines=[
                        {
                            "name": "Amlodipine 5mg",
                            "dosage": "1 Tablet",
                            "frequency": "Once daily (Morning after breakfast)",
                            "duration": "30 days",
                            "instructions": "Take with water. Monitor blood pressure weekly."
                        },
                        {
                            "name": "Levocetirizine 5mg",
                            "dosage": "1 Tablet",
                            "frequency": "Once daily at bedtime",
                            "duration": "5 days",
                            "instructions": "For allergic dry cough relief."
                        },
                        {
                            "name": "Steam Inhalation & Salt Water Gargle",
                            "dosage": "2 times daily",
                            "frequency": "Morning & Night",
                            "duration": "7 days",
                            "instructions": "Avoid cold beverages."
                        }
                    ],
                    doctor_notes="Patient is advised to maintain low sodium intake and take a 20-minute daily brisk walk. Report back if cough persists beyond 7 days.",
                    follow_up_date="2026-12-10",
                    status="finalized",
                    version=1
                )
                db.add(sample_rx)
                db.commit()

            print("Seeded Patient: patient@telecare.org / Patient@123")

        # Check if prescription exists, seed if missing
        rx_count = db.query(Prescription).count()
        if rx_count == 0:
            doc_prof = db.query(DoctorProfile).first()
            pat_prof = db.query(PatientProfile).first()
            if doc_prof and pat_prof:
                sample_rx = Prescription(
                    doctor_id=doc_prof.id,
                    patient_id=pat_prof.id,
                    diagnosis="Mild Hypertension & Seasonal Bronchial Irritation",
                    medicines=[
                        {
                            "name": "Amlodipine 5mg",
                            "dosage": "1 Tablet",
                            "frequency": "Once daily (Morning after breakfast)",
                            "duration": "30 days",
                            "instructions": "Take with water. Monitor blood pressure weekly."
                        },
                        {
                            "name": "Levocetirizine 5mg",
                            "dosage": "1 Tablet",
                            "frequency": "Once daily at bedtime",
                            "duration": "5 days",
                            "instructions": "For allergic dry cough relief."
                        },
                        {
                            "name": "Steam Inhalation & Salt Water Gargle",
                            "dosage": "2 times daily",
                            "frequency": "Morning & Night",
                            "duration": "7 days",
                            "instructions": "Avoid cold beverages."
                        }
                    ],
                    doctor_notes="Patient is advised to maintain low sodium intake and take a 20-minute daily brisk walk. Report back if cough persists beyond 7 days.",
                    follow_up_date="2026-12-10",
                    status="finalized",
                    version=1
                )
                db.add(sample_rx)
                db.commit()
                print("Seeded sample prescription for demonstration.")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()

