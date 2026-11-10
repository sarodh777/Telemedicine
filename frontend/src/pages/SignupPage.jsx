import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Building,
  Award,
  Stethoscope,
  CheckCircle2,
  UploadCloud,
  FileCheck,
  X,
  FileText
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const SignupPage = () => {
  const { signup, registerDoctor } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState("patient"); // 'patient' or 'doctor'
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Patient specific
  const [village, setVillage] = useState("");
  const [address, setAddress] = useState("");

  // Doctor specific fields
  const [specialty, setSpecialty] = useState("General Medicine");
  const [qualifications, setQualifications] = useState("MBBS");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [experience, setExperience] = useState("5 years");
  const [hospitalName, setHospitalName] = useState("");
  const [certificateFile, setCertificateFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCertificateChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setError("Supported certificate formats: PDF, JPG, JPEG, PNG only.");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError("Certificate file size exceeds 15MB limit.");
      return;
    }

    setError("");
    setCertificateFile(file);
    setUploadProgress(100);
  };

  const handleRemoveCertificate = () => {
    setCertificateFile(null);
    setUploadProgress(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      if (role === "doctor") {
        if (!registrationNumber.trim()) {
          setError("Medical Registration Number is required for doctor verification.");
          setLoading(false);
          return;
        }

        if (!hospitalName.trim()) {
          setError("Hospital or clinic affiliation is required.");
          setLoading(false);
          return;
        }

        if (!certificateFile) {
          setError("Please upload your medical qualification or professional registration certificate.");
          setLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append("full_name", fullName.trim());
        formData.append("email", email.trim().toLowerCase());
        formData.append("phone", phone.trim());
        formData.append("password", password);
        formData.append("specialty", specialty);
        formData.append("qualifications", qualifications.trim());
        formData.append("registration_number", registrationNumber.trim());
        formData.append("experience", experience.trim());
        formData.append("hospital_name", hospitalName.trim());
        formData.append("certificate", certificateFile);

        await registerDoctor(formData);
        navigate("/doctor/dashboard");
      } else {
        // Patient registration
        const payload = {
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password: password,
          role: "patient",
          village: village.trim() || "Rural Area",
          address: address.trim() || null
        };

        await signup(payload);
        navigate("/patient/dashboard");
      }
    } catch (err) {
      const msg = err.response?.data?.detail || "Registration failed. Please check your information.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card large" style={{ maxWidth: "780px" }}>
        <div className="auth-header">
          <h2>Create TeleCare Account</h2>
          <p>Karavali Institute of Technology &bull; AIORA Hackathon 2026</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Module 1.1: Two Professional Selection Cards */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "14px", color: "#102A4C" }}>
            Select Account Type:
          </label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px"
            }}
          >
            {/* Patient Card */}
            <div
              onClick={() => {
                setRole("patient");
                setError("");
              }}
              style={{
                border: role === "patient" ? "2px solid #102A4C" : "1px solid #cbd5e1",
                background: role === "patient" ? "#E8F0F7" : "#FFFFFF",
                borderRadius: "10px",
                padding: "16px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                flexDirection: "column",
                gap: "6px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "8px",
                      background: role === "patient" ? "#102A4C" : "#f1f5f9",
                      color: role === "patient" ? "#ffffff" : "#64748b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <User size={20} />
                  </div>
                  <strong style={{ fontSize: "15px", color: "#102A4C" }}>Patient</strong>
                </div>
                {role === "patient" && <CheckCircle2 size={18} color="#102A4C" />}
              </div>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#587493", lineHeight: "1.4" }}>
                Access healthcare services, consult doctors, and store medical records offline.
              </p>
            </div>

            {/* Doctor Card */}
            <div
              onClick={() => {
                setRole("doctor");
                setError("");
              }}
              style={{
                border: role === "doctor" ? "2px solid #102A4C" : "1px solid #cbd5e1",
                background: role === "doctor" ? "#E8F0F7" : "#FFFFFF",
                borderRadius: "10px",
                padding: "16px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                flexDirection: "column",
                gap: "6px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "8px",
                      background: role === "doctor" ? "#102A4C" : "#f1f5f9",
                      color: role === "doctor" ? "#ffffff" : "#64748b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <Stethoscope size={20} />
                  </div>
                  <strong style={{ fontSize: "15px", color: "#102A4C" }}>Doctor</strong>
                </div>
                {role === "doctor" && <CheckCircle2 size={18} color="#102A4C" />}
              </div>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#587493", lineHeight: "1.4" }}>
                Provide rural telemedicine consultations and issue verified digital prescriptions.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group flex-1">
              <label>Full Name</label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={role === "doctor" ? "Dr. Rajesh Sharma" : "Ramesh Kumar"}
                />
              </div>
            </div>

            <div className="form-group flex-1">
              <label>Phone Number</label>
              <div className="input-with-icon">
                <Phone size={18} className="input-icon" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@telecare.org or patient@telecare.org"
              />
            </div>
          </div>

          {/* Patient-Only Fields */}
          {role === "patient" && (
            <div className="form-row">
              <div className="form-group flex-1">
                <label>Village / Gram Panchayat</label>
                <div className="input-with-icon">
                  <Building size={18} className="input-icon" />
                  <input
                    type="text"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    placeholder="e.g. Rampur Kalan"
                  />
                </div>
              </div>
              <div className="form-group flex-1">
                <label>Address / District</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Sitapur District"
                />
              </div>
            </div>
          )}

          {/* Doctor-Only Fields */}
          {role === "doctor" && (
            <>
              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Medical Specialty</label>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="custom-select"
                  >
                    <option value="General Medicine">General Medicine</option>
                    <option value="Pediatrics & Child Health">Pediatrics & Child Health</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Obstetrics & Maternal Health">Obstetrics & Maternal Health</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Community Medicine">Community Medicine</option>
                  </select>
                </div>

                <div className="form-group flex-1">
                  <label>Medical Qualification</label>
                  <input
                    type="text"
                    required
                    value={qualifications}
                    onChange={(e) => setQualifications(e.target.value)}
                    placeholder="e.g. MBBS, MD (Internal Medicine)"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Medical Registration Number</label>
                  <input
                    type="text"
                    required
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder="e.g. KMC/2018/78423"
                  />
                </div>

                <div className="form-group flex-1">
                  <label>Years of Experience</label>
                  <input
                    type="text"
                    required
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="e.g. 8 years"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Hospital or Clinic Name</label>
                <div className="input-with-icon">
                  <Building size={18} className="input-icon" />
                  <input
                    type="text"
                    required
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                    placeholder="e.g. Mangaluru District Hospital / Rural Health Center"
                  />
                </div>
              </div>

              {/* Module 2.1: Certificate Upload Section */}
              <div
                style={{
                  background: "#F4F6F9",
                  border: "2px dashed #cbd5e1",
                  borderRadius: "10px",
                  padding: "18px",
                  marginTop: "8px",
                  marginBottom: "16px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <UploadCloud size={20} color="#102A4C" />
                  <strong style={{ fontSize: "14px", color: "#102A4C" }}>Upload Medical Certificate</strong>
                </div>
                <p style={{ margin: "0 0 12px", fontSize: "12px", color: "#587493" }}>
                  Upload your medical qualification or professional registration certificate for administrator verification.
                </p>

                {!certificateFile ? (
                  <div>
                    <input
                      type="file"
                      id="cert-file-input"
                      required
                      accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                      onChange={handleCertificateChange}
                      style={{ display: "none" }}
                    />
                    <label
                      htmlFor="cert-file-input"
                      className="btn btn-outline btn-sm"
                      style={{ display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer" }}
                    >
                      <FileText size={15} />
                      <span>Choose Certificate (PDF / JPG / PNG, max 15MB)</span>
                    </label>
                  </div>
                ) : (
                  <div
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                      padding: "10px 14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <FileCheck size={20} color="#059669" />
                      <div>
                        <strong style={{ fontSize: "13px", color: "#102A4C", display: "block" }}>
                          {certificateFile.name}
                        </strong>
                        <span style={{ fontSize: "11px", color: "#64748b" }}>
                          {(certificateFile.size / 1024).toFixed(1)} KB &bull; Ready for verification
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <label
                        htmlFor="cert-file-input-replace"
                        style={{
                          fontSize: "12px",
                          color: "#2563eb",
                          cursor: "pointer",
                          fontWeight: "600",
                          textDecoration: "underline"
                        }}
                      >
                        Replace
                      </label>
                      <input
                        type="file"
                        id="cert-file-input-replace"
                        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                        onChange={handleCertificateChange}
                        style={{ display: "none" }}
                      />
                      <button
                        type="button"
                        onClick={handleRemoveCertificate}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}
                        title="Remove file"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Password fields */}
          <div className="form-row">
            <div className="form-group flex-1">
              <label>Password</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                />
              </div>
            </div>

            <div className="form-group flex-1">
              <label>Confirm Password</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-block btn-lg mt-3">
            {loading ? "Creating Account..." : role === "doctor" ? "Submit Registration for Verification" : "Register & Start Immediately"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login">Log in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
