import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  MessageSquare,
  AlertCircle,
  Check,
  Send,
  Save,
  Building,
  FileCheck,
  Plus,
  Trash2,
  Printer,
  Eye,
  Download,
  Sparkles,
  X,
  Bell,
  FileText,
  Shield,
  ShieldCheck,
  Activity,
  Upload,
  ToggleLeft,
  ToggleRight,
  ExternalLink
} from "lucide-react";
import { api, getFileUrl } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export const DoctorDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState("overview"); // 'overview', 'today', 'appointments', 'availability', 'patients', 'reports', 'prescriptions', 'messages', 'notifications', 'profile'
  const [appointments, setAppointments] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // Profile & Verification State
  const [docProfile, setDocProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    phone: "",
    specialty: "",
    qualifications: "",
    experience: "",
    hospital_name: "",
    consultation_fee: ""
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  // Re-submission State
  const [resubmitFile, setResubmitFile] = useState(null);
  const [submittingResubmit, setSubmittingResubmit] = useState(false);
  const [resubmitSuccess, setResubmitSuccess] = useState("");

  // Today's Appointments State
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [loadingToday, setLoadingToday] = useState(false);

  // Patient Reports State
  const [patientReports, setPatientReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [previewReport, setPreviewReport] = useState(null);

  // Doctor Availability State
  const [isAvailable, setIsAvailable] = useState(true);
  const [togglingAvailability, setTogglingAvailability] = useState(false);
  const [availabilitySchedule, setAvailabilitySchedule] = useState("Mon - Sat, 09:00 AM - 04:00 PM");
  const [savingAvail, setSavingAvail] = useState(false);
  const [availSuccess, setAvailSuccess] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Status Action Modal State
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [actionType, setActionType] = useState(""); // 'confirm', 'reject', 'complete'
  const [rejectionReason, setRejectionReason] = useState("");
  const [doctorNotes, setDoctorNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Consulted Patients
  const [patients, setPatients] = useState([]);

  // Digital Prescriptions State
  const [prescriptions, setPrescriptions] = useState([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
  const [showRxModal, setShowRxModal] = useState(false);
  const [rxPatientId, setRxPatientId] = useState("");
  const [rxAppointmentId, setRxAppointmentId] = useState(null);
  const [rxDiagnosis, setRxDiagnosis] = useState("");
  const [rxMedicines, setRxMedicines] = useState([
    { name: "", dosage: "", frequency: "", duration: "", instructions: "" }
  ]);
  const [rxDoctorNotes, setRxDoctorNotes] = useState("");
  const [rxFollowUpDate, setRxFollowUpDate] = useState("");
  const [submittingRx, setSubmittingRx] = useState(false);
  const [rxSuccessMsg, setRxSuccessMsg] = useState("");

  // Chat State
  const [selectedPatientChat, setSelectedPatientChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/api/doctor/profile");
      setDocProfile(res.data);
      setIsAvailable(res.data.is_available ?? true);
      if (res.data.availability) setAvailabilitySchedule(res.data.availability);
      setProfileForm({
        full_name: res.data.full_name || "",
        phone: res.data.phone || "",
        specialty: res.data.specialty || "",
        qualifications: res.data.qualifications || "",
        experience: res.data.experience || "",
        hospital_name: res.data.hospital_name || "",
        consultation_fee: res.data.consultation_fee || ""
      });
    } catch (err) {
      console.warn("Could not fetch doctor profile:", err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchTodayAppointments = async () => {
    setLoadingToday(true);
    try {
      const res = await api.get("/api/doctor/appointments/today");
      setTodayAppointments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.warn("Could not fetch today's appointments:", err);
      setTodayAppointments([]);
    } finally {
      setLoadingToday(false);
    }
  };

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== "all") params.status_filter = statusFilter;
      const res = await api.get("/api/doctor/appointments", { params });
      setAppointments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.warn("Could not fetch doctor appointments:", err);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const res = await api.get("/api/doctor/patients");
      setPatients(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.warn("Could not fetch patients:", err);
      setPatients([]);
    }
  };

  const fetchPatientReports = async () => {
    setLoadingReports(true);
    try {
      const res = await api.get("/api/doctor/reports");
      setPatientReports(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.warn("Could not fetch patient reports:", err);
      setPatientReports([]);
    } finally {
      setLoadingReports(false);
    }
  };

  const fetchPrescriptions = async () => {
    setLoadingPrescriptions(true);
    try {
      const res = await api.get("/api/prescriptions/doctor");
      setPrescriptions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.warn("Could not fetch doctor prescriptions:", err);
      setPrescriptions([]);
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const res = await api.get("/api/notifications");
      setNotifications(Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.notifications) ? res.data.notifications : []));
    } catch (err) {
      console.warn("Could not fetch notifications:", err);
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchTodayAppointments();
    fetchAppointments();
    fetchPatients();
    fetchPatientReports();
    fetchPrescriptions();
    fetchNotifications();
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter]);

  const handleToggleAvailability = async () => {
    const nextVal = !isAvailable;
    setIsAvailable(nextVal);
    setTogglingAvailability(true);
    try {
      await api.put("/api/doctor/availability", {
        is_available: nextVal,
        availability: availabilitySchedule
      });
      fetchProfile();
    } catch (err) {
      setIsAvailable(!nextVal);
      alert("Failed to update availability status.");
    } finally {
      setTogglingAvailability(false);
    }
  };

  const handleDownloadOwnCert = async () => {
    try {
      const res = await api.get("/api/doctor/certificate", { responseType: "blob" });
      const contentType = res.headers["content-type"] || "application/pdf";
      const blob = new Blob([res.data], { type: contentType });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
    } catch (err) {
      alert("Could not load your medical certificate file.");
    }
  };

  const handleResubmitCertificate = async (e) => {
    e.preventDefault();
    if (!resubmitFile) return;
    setSubmittingResubmit(true);
    try {
      const formData = new FormData();
      formData.append("certificate", resubmitFile);
      await api.post("/api/doctor/resubmit-certificate", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setResubmitSuccess("Certificate resubmitted successfully! It is now pending administrator review.");
      setResubmitFile(null);
      fetchProfile();
      fetchNotifications();
      setTimeout(() => setResubmitSuccess(""), 4500);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to resubmit certificate.");
    } finally {
      setSubmittingResubmit(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg("");
    try {
      await api.put("/api/doctor/profile", profileForm);
      setProfileMsg("Profile updated successfully!");
      fetchProfile();
      setTimeout(() => setProfileMsg(""), 3000);
    } catch (err) {
      alert("Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleMarkNotificationRead = async (notifId) => {
    try {
      await api.put(`/api/notifications/${notifId}/read`);
      setNotifications((prev) =>
        (Array.isArray(prev) ? prev : []).map((n) => (n.id === notifId ? { ...n, read_status: true } : n))
      );
    } catch (err) {
      console.warn("Could not mark notification read:", err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await api.put("/api/notifications/read-all/mark");
      setNotifications((prev) => (Array.isArray(prev) ? prev : []).map((n) => ({ ...n, read_status: true })));
    } catch (err) {
      console.warn("Could not mark all read:", err);
    }
  };

  const safeTodayAppointments = Array.isArray(todayAppointments) ? todayAppointments : [];
  const safeAppointments = Array.isArray(appointments) ? appointments : [];
  const safePatients = Array.isArray(patients) ? patients : [];
  const safePatientReports = Array.isArray(patientReports) ? patientReports : [];
  const safePrescriptions = Array.isArray(prescriptions) ? prescriptions : [];
  const safeNotifications = Array.isArray(notifications)
    ? notifications
    : (Array.isArray(notifications?.notifications) ? notifications.notifications : []);

  const verificationStatus = docProfile?.verification_status || user?.verification_status || "approved";
  const isPending = verificationStatus === "pending";
  const isRejected = verificationStatus === "rejected";
  const isRestricted = isPending || isRejected;

  // Prescription Form Actions
  const handleOpenPrescriptionModal = (patientId = "", appointmentId = null) => {
    setRxPatientId(patientId ? String(patientId) : (patients[0]?.patient_id ? String(patients[0].patient_id) : ""));
    setRxAppointmentId(appointmentId);
    setRxDiagnosis("");
    setRxMedicines([{ name: "", dosage: "", frequency: "", duration: "", instructions: "" }]);
    setRxDoctorNotes("");
    setRxFollowUpDate("");
    setRxSuccessMsg("");
    setShowRxModal(true);
  };

  const handleAddMedicineRow = () => {
    setRxMedicines((prev) => [
      ...prev,
      { name: "", dosage: "", frequency: "", duration: "", instructions: "" }
    ]);
  };

  const handleRemoveMedicineRow = (index) => {
    if (rxMedicines.length <= 1) return;
    setRxMedicines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMedicineChange = (index, field, value) => {
    setRxMedicines((prev) => {
      const copy = [...prev];
      copy[index][field] = value;
      return copy;
    });
  };

  const handleSubmitPrescription = async (e, rxStatusChoice = "finalized") => {
    if (e && e.preventDefault) e.preventDefault();
    if (!rxPatientId) {
      alert("Please select a patient.");
      return;
    }
    if (!rxDiagnosis.trim()) {
      alert("Please enter a clinical diagnosis.");
      return;
    }

    const validMedicines = rxMedicines.filter((m) => m.name.trim() !== "");
    if (validMedicines.length === 0) {
      alert("Please specify at least one prescribed medicine.");
      return;
    }

    setSubmittingRx(true);
    try {
      const payload = {
        patient_id: parseInt(rxPatientId),
        appointment_id: rxAppointmentId ? parseInt(rxAppointmentId) : null,
        diagnosis: rxDiagnosis.trim(),
        medicines: validMedicines,
        doctor_notes: rxDoctorNotes.trim(),
        follow_up_date: rxFollowUpDate || null,
        status: rxStatusChoice
      };

      await api.post("/api/prescriptions", payload);
      setRxSuccessMsg(`Prescription ${rxStatusChoice === "draft" ? "saved as draft" : "successfully issued"}!`);
      fetchPrescriptions();
      setTimeout(() => {
        setShowRxModal(false);
        setRxSuccessMsg("");
      }, 1500);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to create prescription.");
    } finally {
      setSubmittingRx(false);
    }
  };

  const handleOpenActionModal = (appt, type) => {
    setSelectedAppt(appt);
    setActionType(type);
    setRejectionReason("");
    setDoctorNotes(appt.doctor_notes || "");
  };

  const handleConfirmStatusChange = async (e) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const payload = {
        status: actionType === "confirm" ? "confirmed" : actionType === "reject" ? "cancelled" : "completed",
        rejection_reason: actionType === "reject" ? rejectionReason : null,
        doctor_notes: actionType === "complete" ? doctorNotes : null
      };

      await api.put(`/api/doctor/appointments/${selectedAppt.id}/status`, payload);
      setSelectedAppt(null);
      fetchAppointments();
    } catch (err) {
      alert("Failed to update appointment status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveAvailability = async (e) => {
    e.preventDefault();
    setSavingAvail(true);
    setAvailSuccess(false);
    try {
      await api.put("/api/doctor/availability", { availability: availabilitySchedule });
      setAvailSuccess(true);
      setTimeout(() => setAvailSuccess(false), 3000);
    } catch (err) {
      alert("Failed to update availability schedule.");
    } finally {
      setSavingAvail(false);
    }
  };

  const selectPatientChat = async (pat) => {
    setSelectedPatientChat(pat);
    try {
      const res = await api.get(`/api/messages/${pat.user_id}`);
      setChatMessages(res.data);
    } catch (err) {
      console.warn("Failed to load chat messages:", err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedPatientChat) return;

    const content = messageInput.trim();
    setMessageInput("");
    setSendingMsg(true);

    try {
      const res = await api.post("/api/messages", {
        receiver_id: selectedPatientChat.user_id,
        message_content: content
      });
      setChatMessages((prev) => [...prev, res.data]);
    } catch (err) {
      alert("Failed to send message.");
    } finally {
      setSendingMsg(false);
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-patient-badge">
          <div className="avatar-circle doctor">
            {user?.full_name ? user.full_name.replace("Dr. ", "").substring(0, 2).toUpperCase() : "DR"}
          </div>
          <div>
            <h4 className="user-name">{user?.full_name || "Doctor"}</h4>
            <span className="user-village">Medical Practitioner</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`sidebar-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <Activity size={17} />
            <span>Dashboard</span>
          </button>
          <button
            className={`sidebar-btn ${activeTab === "today" ? "active" : ""}`}
            onClick={() => setActiveTab("today")}
          >
            <Calendar size={17} />
            <span>Today's Appointments ({safeTodayAppointments.length})</span>
          </button>
          <button
            className={`sidebar-btn ${activeTab === "appointments" ? "active" : ""}`}
            onClick={() => setActiveTab("appointments")}
          >
            <Clock size={17} />
            <span>All Appointments ({safeAppointments.length})</span>
          </button>
          <button
            className={`sidebar-btn ${activeTab === "availability" ? "active" : ""}`}
            onClick={() => setActiveTab("availability")}
          >
            <CheckCircle size={17} />
            <span>Doctor Availability</span>
          </button>
          <button
            className={`sidebar-btn ${activeTab === "patients" ? "active" : ""}`}
            onClick={() => setActiveTab("patients")}
          >
            <User size={17} />
            <span>Patients ({safePatients.length})</span>
          </button>
          <button
            className={`sidebar-btn ${activeTab === "reports" ? "active" : ""}`}
            onClick={() => setActiveTab("reports")}
          >
            <FileText size={17} />
            <span>Patient Reports & Documents ({safePatientReports.length})</span>
          </button>
          <button
            className={`sidebar-btn ${activeTab === "prescriptions" ? "active" : ""}`}
            onClick={() => setActiveTab("prescriptions")}
          >
            <FileCheck size={17} />
            <span>Prescriptions ({safePrescriptions.length})</span>
          </button>
          <button
            className={`sidebar-btn ${activeTab === "messages" || activeTab === "consultations" ? "active" : ""}`}
            onClick={() => setActiveTab("messages")}
          >
            <MessageSquare size={17} />
            <span>Messages</span>
          </button>
          <button
            className={`sidebar-btn ${activeTab === "notifications" ? "active" : ""}`}
            onClick={() => setActiveTab("notifications")}
          >
            <Bell size={17} />
            <span>Notifications ({safeNotifications.filter((n) => !n.read_status).length})</span>
          </button>
          <button
            className={`sidebar-btn ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <Shield size={17} />
            <span>Profile</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Module 2.2: Pending Verification Screen */}
        {isPending && (
          <div
            className="content-card mb-4"
            style={{
              borderLeft: "6px solid #F59E0B",
              background: "#FFFBEB",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(245, 158, 11, 0.1)"
            }}
          >
            <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
              <AlertCircle size={36} color="#D97706" style={{ flexShrink: 0, marginTop: "2px" }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <h3 style={{ margin: 0, color: "#92400E" }}>Account Pending Verification</h3>
                  <span className="status-pill pending">Pending Verification</span>
                </div>
                <p style={{ margin: "0 0 4px 0", color: "#B45309", fontWeight: 600 }}>
                  Your registration has been submitted successfully.
                </p>
                <p style={{ margin: "0 0 4px 0", color: "#B45309" }}>
                  Your medical certificate is awaiting administrator verification.
                </p>
                <p style={{ margin: "0 0 16px 0", color: "#B45309" }}>
                  You will receive access to patient consultations once verified.
                </p>

                <div
                  style={{
                    background: "#FFFFFF",
                    padding: "16px",
                    borderRadius: "8px",
                    border: "1px solid #FDE68A",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "12px",
                    marginBottom: "16px"
                  }}
                >
                  <div>
                    <span style={{ fontSize: "11px", color: "#78350F", display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Doctor Full Name
                    </span>
                    <strong>{docProfile?.full_name || user?.full_name}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "#78350F", display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Medical Specialty
                    </span>
                    <strong>{docProfile?.specialty || "General Medicine"}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "#78350F", display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Registration Number
                    </span>
                    <code>{docProfile?.registration_number || "Submitted"}</code>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "#78350F", display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Submitted Certificate
                    </span>
                    <strong style={{ wordBreak: "break-all" }}>{docProfile?.certificate_filename || "Medical Certificate"}</strong>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                  <button
                    onClick={handleDownloadOwnCert}
                    className="btn btn-outline btn-sm"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      borderColor: "#D97706",
                      color: "#92400E",
                      background: "#FFFFFF"
                    }}
                  >
                    <Eye size={14} />
                    <span>Preview / Download Submitted Certificate</span>
                  </button>
                  <small style={{ color: "#92400E" }}>
                    While pending, consultation and prescription actions are protected and disabled.
                  </small>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Module 2.2: Rejected Verification Screen */}
        {isRejected && (
          <div
            className="content-card mb-4"
            style={{
              borderLeft: "6px solid #DC2626",
              background: "#FEF2F2",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(220, 38, 38, 0.1)"
            }}
          >
            <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
              <XCircle size={36} color="#DC2626" style={{ flexShrink: 0, marginTop: "2px" }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <h3 style={{ margin: 0, color: "#991B1B" }}>Verification Requires Attention</h3>
                  <span className="status-pill rejected">Verification Rejected</span>
                </div>
                <p style={{ margin: "0 0 6px 0", color: "#B91C1C", fontWeight: 600 }}>
                  Your submitted medical credentials could not be verified by the administrator.
                </p>
                <div
                  style={{
                    background: "#FFFFFF",
                    padding: "14px 16px",
                    borderRadius: "6px",
                    border: "1px solid #FECACA",
                    margin: "12px 0 16px 0"
                  }}
                >
                  <strong style={{ color: "#991B1B", display: "block", marginBottom: "4px" }}>
                    Administrator Feedback & Rejection Reason:
                  </strong>
                  <p style={{ margin: 0, color: "#7F1D1D" }}>
                    {docProfile?.rejection_reason || "Medical credentials could not be verified. Please re-upload a clear copy of your state medical council certificate."}
                  </p>
                </div>

                {resubmitSuccess && (
                  <div className="alert alert-success mb-3">
                    <CheckCircle size={15} />
                    <span>{resubmitSuccess}</span>
                  </div>
                )}

                <form
                  onSubmit={handleResubmitCertificate}
                  style={{
                    background: "#FFFFFF",
                    padding: "16px",
                    borderRadius: "8px",
                    border: "1px solid #FECACA"
                  }}
                >
                  <h4 style={{ margin: "0 0 8px 0" }}>Upload Updated Medical Certificate</h4>
                  <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "#64748B" }}>
                    Upload a clear scan of your official registration document (PDF, JPG, or PNG, max 15MB).
                  </p>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setResubmitFile(e.target.files[0])}
                      required
                      style={{ padding: "6px", border: "1px solid #CBD5E1", borderRadius: "6px" }}
                    />
                    <button
                      type="submit"
                      disabled={submittingResubmit || !resubmitFile}
                      className="btn btn-primary btn-sm"
                      style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                    >
                      <Upload size={14} />
                      <span>{submittingResubmit ? "Uploading..." : "Resubmit Certificate for Review"}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: OVERVIEW / DASHBOARD */}
        {activeTab === "overview" && (
          <div className="dashboard-tab-content">
            <div className="tab-header-row">
              <div>
                <h2>Welcome, {docProfile?.full_name || user?.full_name}</h2>
                <p>
                  {docProfile?.specialty || "Medical Practitioner"} • {docProfile?.hospital_name || "TeleCare Rural Health"}
                </p>
              </div>
              <div>
                <span className={`status-pill ${docProfile?.verification_status || "approved"}`}>
                  {(docProfile?.verification_status || "approved").toUpperCase()}
                </span>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="metrics-grid">
              <div className="metric-card" style={{ cursor: "pointer" }} onClick={() => setActiveTab("today")}>
                <div className="metric-icon blue">
                  <Calendar size={22} />
                </div>
                <div className="metric-data">
                  <span className="metric-value">{safeTodayAppointments.length}</span>
                  <span className="metric-label">Today's Appointments</span>
                </div>
              </div>

              <div className="metric-card" style={{ cursor: "pointer" }} onClick={() => setActiveTab("appointments")}>
                <div className="metric-icon navy">
                  <Clock size={22} />
                </div>
                <div className="metric-data">
                  <span className="metric-value">{safeAppointments.length}</span>
                  <span className="metric-label">Total Appointments</span>
                </div>
              </div>

              <div className="metric-card" style={{ cursor: "pointer" }} onClick={() => setActiveTab("patients")}>
                <div className="metric-icon green">
                  <User size={22} />
                </div>
                <div className="metric-data">
                  <span className="metric-value">{safePatients.length}</span>
                  <span className="metric-label">Consulted Patients</span>
                </div>
              </div>

              <div className="metric-card" style={{ cursor: "pointer" }} onClick={() => setActiveTab("prescriptions")}>
                <div className="metric-icon warning">
                  <FileCheck size={22} />
                </div>
                <div className="metric-data">
                  <span className="metric-value">{safePrescriptions.length}</span>
                  <span className="metric-label">Prescriptions Issued</span>
                </div>
              </div>
            </div>

            {/* Availability Quick Status Banner */}
            <div
              className="content-card mt-4"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "16px",
                borderLeft: isAvailable ? "5px solid #10B981" : "5px solid #F59E0B"
              }}
            >
              <div>
                <h3 style={{ margin: "0 0 4px 0" }}>
                  Booking Availability:{" "}
                  <span style={{ color: isAvailable ? "#10B981" : "#D97706" }}>
                    {isAvailable ? "Available for Bookings" : "Currently Unavailable"}
                  </span>
                </h3>
                <p style={{ margin: 0, fontSize: "14px", color: "#64748B" }}>
                  Working Hours: {availabilitySchedule} •{" "}
                  {isAvailable
                    ? "Patients can book consultations according to your schedule."
                    : "Patients cannot book appointments while unavailable."}
                </p>
              </div>
              <button
                onClick={handleToggleAvailability}
                disabled={togglingAvailability}
                className={`btn btn-sm ${isAvailable ? "btn-outline" : "btn-primary"}`}
                style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
              >
                {isAvailable ? <ToggleRight size={18} color="#10B981" /> : <ToggleLeft size={18} />}
                <span>{isAvailable ? "Turn Unavailable" : "Turn Available"}</span>
              </button>
            </div>

            {/* Today's Schedule Snapshot */}
            <div className="content-card mt-4">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ margin: 0 }}>Today's Scheduled Consultations</h3>
                <button onClick={() => setActiveTab("today")} className="btn btn-outline btn-sm">
                  View Today's Details
                </button>
              </div>
              {safeTodayAppointments.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0", color: "#64748B" }}>
                  <Calendar size={36} color="#94A3B8" className="mx-auto mb-2" />
                  <p style={{ margin: 0, fontWeight: 500 }}>You have no appointments scheduled for today.</p>
                </div>
              ) : (
                <div className="reports-table-wrap">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Patient</th>
                        <th>Village</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Reports</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {safeTodayAppointments.map((appt) => (
                        <tr key={appt.id}>
                          <td><strong>{appt.appointment_time}</strong></td>
                          <td>{appt.patient_name}</td>
                          <td>{appt.patient_village}</td>
                          <td><span className="capitalize">{appt.consultation_type}</span></td>
                          <td><span className={`status-pill ${appt.status}`}>{appt.status}</span></td>
                          <td>
                            {appt.has_reports ? (
                              <span className="status-pill confirmed">Uploaded</span>
                            ) : (
                              <span className="text-muted text-sm">None</span>
                            )}
                          </td>
                          <td>
                            <button
                              onClick={() => {
                                if (isRestricted) {
                                  alert("Action restricted: Your medical certificate is pending verification.");
                                  return;
                                }
                                handleOpenPrescriptionModal(appt.patient_id, appt.id);
                              }}
                              className="btn btn-primary btn-sm"
                              disabled={isRestricted}
                              title={isRestricted ? "Verification pending" : "Start Consultation"}
                            >
                              Start
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: TODAY'S APPOINTMENTS (Module 5.3) */}
        {activeTab === "today" && (
          <div className="dashboard-tab-content">
            <div className="tab-header-row">
              <div>
                <h2>Today's Appointments</h2>
                <p>Scheduled consultations for today ({new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })})</p>
              </div>
              <button onClick={fetchTodayAppointments} className="btn btn-outline btn-sm">
                Refresh
              </button>
            </div>

            {loadingToday ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading today's appointments...</p>
              </div>
            ) : safeTodayAppointments.length === 0 ? (
              <div className="empty-state">
                <Calendar size={52} color="#587493" />
                <h3>You have no appointments scheduled for today.</h3>
                <p>Upcoming consultations scheduled for future dates will appear here on their appointment day.</p>
              </div>
            ) : (
              <div className="appointments-grid">
                {safeTodayAppointments.map((a) => (
                  <div key={a.id} className="appointment-card-full" style={{ borderTop: "4px solid var(--primary-blue)" }}>
                    <div className="appt-top">
                      <div>
                        <h3>{a.patient_name}</h3>
                        <span className="specialty-text">
                          Village: {a.patient_village || "Rural Community"} • Phone: {a.patient_phone || "-"}
                        </span>
                      </div>
                      <span className={`status-pill ${a.status}`}>{a.status}</span>
                    </div>

                    <div className="appt-details-row">
                      <div className="detail-item">
                        <Clock size={15} />
                        <span><strong>Time:</strong> {a.appointment_time}</span>
                      </div>
                      <div className="detail-item">
                        <Building size={15} />
                        <span className="capitalize"><strong>Type:</strong> {a.consultation_type} consultation</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "10px", margin: "10px 0", flexWrap: "wrap" }}>
                      <div style={{ fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                        <strong>Reports:</strong>
                        {a.has_reports ? (
                          <span className="status-pill confirmed" style={{ padding: "2px 8px", fontSize: "11px" }}>
                            <CheckCircle size={11} /> Reports Available
                          </span>
                        ) : (
                          <span className="text-muted" style={{ fontSize: "11px" }}>No reports</span>
                        )}
                      </div>
                      <div style={{ fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                        <strong>Prescription:</strong>
                        {a.has_prescription ? (
                          <span className="status-pill confirmed" style={{ padding: "2px 8px", fontSize: "11px" }}>
                            <CheckCircle size={11} /> Issued
                          </span>
                        ) : (
                          <span className="status-pill pending" style={{ padding: "2px 8px", fontSize: "11px" }}>
                            Not Issued
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="appt-reason-box">
                      <strong>Patient Consultation Reason:</strong>
                      <p>{a.reason}</p>
                    </div>

                    {a.doctor_notes && (
                      <div className="doctor-notes-box">
                        <strong>My Consultation Notes:</strong>
                        <p>{a.doctor_notes}</p>
                      </div>
                    )}

                    {/* Quick Action Buttons */}
                    <div className="doc-action-buttons mt-3" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button
                        onClick={() => {
                          const matchedPat = patients.find((p) => p.patient_id === a.patient_id);
                          if (matchedPat) {
                            selectPatientChat(matchedPat);
                            setActiveTab("messages");
                          } else {
                            setActiveTab("patients");
                          }
                        }}
                        className="btn btn-outline btn-sm"
                        title="View Patient Details & Contact"
                      >
                        <User size={13} />
                        <span>View Patient</span>
                      </button>

                      <button
                        onClick={() => setActiveTab("reports")}
                        className="btn btn-outline btn-sm"
                        title="View Medical Reports"
                      >
                        <FileText size={13} />
                        <span>View Reports</span>
                      </button>

                      <button
                        onClick={() => {
                          if (isRestricted) {
                            alert("Action restricted: Your medical certificate is pending verification.");
                            return;
                          }
                          handleOpenPrescriptionModal(a.patient_id, a.id);
                        }}
                        className="btn btn-primary btn-sm"
                        disabled={isRestricted}
                        title={isRestricted ? "Verification pending" : "Start Consultation & Add Prescription"}
                      >
                        <FileCheck size={13} />
                        <span>Start Consultation / Add Rx</span>
                      </button>

                      {a.status === "pending" && (
                        <button
                          onClick={() => {
                            if (isRestricted) {
                              alert("Action restricted: Verification pending.");
                              return;
                            }
                            handleOpenActionModal(a, "confirm");
                          }}
                          className="btn btn-success btn-sm"
                          disabled={isRestricted}
                        >
                          <Check size={13} />
                          <span>Confirm</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ALL APPOINTMENTS */}
        {activeTab === "appointments" && (
          <div className="dashboard-tab-content">
            <div className="tab-header-row">
              <div>
                <h2>Rural Patient Consultation Schedule</h2>
                <p>Review appointment requests, confirm bookings, and log completed medical advice</p>
              </div>

              {/* Status Filter */}
              <div className="filter-pill-group">
                {["all", "pending", "confirmed", "completed", "cancelled"].map((st) => (
                  <button
                    key={st}
                    className={`filter-pill ${statusFilter === st ? "active" : ""}`}
                    onClick={() => setStatusFilter(st)}
                  >
                    {st.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading patient consultations...</p>
              </div>
            ) : safeAppointments.length === 0 ? (
              <div className="empty-state">
                <Calendar size={48} color="#587493" />
                <h3>No appointments found under this filter</h3>
                <p>When rural patients request consultations, they will appear here.</p>
              </div>
            ) : (
              <div className="appointments-grid">
                {safeAppointments.map((a) => (
                  <div key={a.id} className="appointment-card-full">
                    <div className="appt-top">
                      <div>
                        <h3>{a.patient_name}</h3>
                        <span className="specialty-text">
                          Village: {a.patient_village || "Rural Area"} • Tel: {a.patient_phone || "-"}
                        </span>
                      </div>
                      <span className={`status-pill ${a.status}`}>{a.status}</span>
                    </div>

                    <div className="appt-details-row">
                      <div className="detail-item">
                        <Calendar size={14} />
                        <span>Date: {a.appointment_date} at {a.appointment_time}</span>
                      </div>
                      <div className="detail-item">
                        <Building size={14} />
                        <span className="capitalize">{a.consultation_type} consultation</span>
                      </div>
                    </div>

                    <div className="appt-reason-box">
                      <strong>Patient Symptoms & Request:</strong>
                      <p>{a.reason}</p>
                    </div>

                    {a.doctor_notes && (
                      <div className="doctor-notes-box">
                        <strong>My Consultation Advice / Prescription:</strong>
                        <p>{a.doctor_notes}</p>
                      </div>
                    )}

                    {a.rejection_reason && (
                      <div className="alert alert-error mt-2">
                        <span>Rejection Reason: {a.rejection_reason}</span>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="doc-action-buttons mt-3" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button
                        onClick={() => {
                          if (isRestricted) {
                            alert("Action restricted: Doctor verification is pending approval.");
                            return;
                          }
                          handleOpenPrescriptionModal(a.patient_id, a.id);
                        }}
                        className="btn btn-outline btn-sm"
                        disabled={isRestricted}
                        title={isRestricted ? "Verification pending" : "Issue digital prescription"}
                      >
                        <FileCheck size={14} />
                        <span>Issue Rx</span>
                      </button>

                      {a.status === "pending" && (
                        <>
                          <button
                            onClick={() => {
                              if (isRestricted) {
                                alert("Action restricted: Verification pending.");
                                return;
                              }
                              handleOpenActionModal(a, "confirm");
                            }}
                            className="btn btn-success btn-sm"
                            disabled={isRestricted}
                          >
                            <Check size={14} />
                            <span>Confirm Slot</span>
                          </button>
                          <button
                            onClick={() => handleOpenActionModal(a, "reject")}
                            className="btn btn-danger btn-sm"
                          >
                            <XCircle size={14} />
                            <span>Reject</span>
                          </button>
                        </>
                      )}

                      {a.status === "confirmed" && (
                        <button
                          onClick={() => handleOpenActionModal(a, "complete")}
                          className="btn btn-primary btn-sm"
                        >
                          <CheckCircle size={14} />
                          <span>Mark Consultation Completed</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: DOCTOR AVAILABILITY (Module 5.1) */}
        {activeTab === "availability" && (
          <div className="dashboard-tab-content">
            <div className="tab-header-row">
              <div>
                <h2>Doctor Availability & Scheduling</h2>
                <p>Manage your real-time booking availability and clinic consultation schedule</p>
              </div>
            </div>

            <div className="content-card mb-4">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px",
                  borderRadius: "8px",
                  background: isAvailable ? "#F0FDF4" : "#FEF3C7",
                  border: isAvailable ? "1px solid #BBF7D0" : "1px solid #FDE68A",
                  marginBottom: "20px"
                }}
              >
                <div>
                  <h3 style={{ margin: "0 0 6px 0", color: isAvailable ? "#166534" : "#92400E" }}>
                    Doctor Availability Status: {isAvailable ? "Available" : "Unavailable"}
                  </h3>
                  <p style={{ margin: 0, fontSize: "14px", color: isAvailable ? "#15803D" : "#B45309" }}>
                    {isAvailable
                      ? "Your profile is active in the directory. Rural patients can book appointments with you."
                      : "This doctor is currently unavailable for booking. Patients cannot book new slots."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleAvailability}
                  disabled={togglingAvailability}
                  className={`btn ${isAvailable ? "btn-danger" : "btn-success"}`}
                  style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
                >
                  {isAvailable ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                  <span>{isAvailable ? "Set Unavailable" : "Set Available"}</span>
                </button>
              </div>

              {!isAvailable && (
                <div className="alert alert-warning mb-4">
                  <AlertCircle size={16} />
                  <span>
                    When unavailable, the doctor directory clearly shows: <strong>"This doctor is currently unavailable for booking."</strong> Appointment booking is blocked for patients until you turn this back on.
                  </span>
                </div>
              )}

              {availSuccess && (
                <div className="alert alert-success mb-3">
                  <CheckCircle size={16} />
                  <span>Availability schedule updated successfully!</span>
                </div>
              )}

              <form onSubmit={handleSaveAvailability} className="profile-form">
                <div className="form-group">
                  <label>Weekly Consultation Working Hours</label>
                  <input
                    type="text"
                    required
                    value={availabilitySchedule}
                    onChange={(e) => setAvailabilitySchedule(e.target.value)}
                    placeholder="e.g. Mon - Sat, 09:00 AM - 04:00 PM"
                  />
                  <small className="help-text">
                    This schedule is displayed to rural patients when browsing your profile in the doctor directory.
                  </small>
                </div>

                <button type="submit" disabled={savingAvail} className="btn btn-primary">
                  <Save size={16} />
                  <span>{savingAvail ? "Saving..." : "Update Availability Schedule"}</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 5: PATIENTS */}
        {activeTab === "patients" && (
          <div className="dashboard-tab-content">
            <div className="tab-header-row">
              <div>
                <h2>Consulted Patients Directory</h2>
                <p>Patients who have booked or attended appointments with your clinic</p>
              </div>
            </div>

            <div className="content-card">
              {safePatients.length === 0 ? (
                <p className="text-muted py-3">No patients recorded yet.</p>
              ) : (
                <div className="reports-table-wrap">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Patient Name</th>
                        <th>Village / District</th>
                        <th>Phone</th>
                        <th>Gender</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {safePatients.map((p) => (
                        <tr key={p.patient_id}>
                          <td><strong>{p.full_name || "Patient"}</strong></td>
                          <td>{p.village}</td>
                          <td>{p.phone}</td>
                          <td>{p.gender}</td>
                          <td>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button
                                onClick={() => {
                                  selectPatientChat(p);
                                  setActiveTab("messages");
                                }}
                                className="btn btn-primary btn-sm"
                              >
                                <MessageSquare size={13} />
                                <span>Message</span>
                              </button>
                              <button
                                onClick={() => {
                                  if (isRestricted) {
                                    alert("Action restricted: Verification pending.");
                                    return;
                                  }
                                  handleOpenPrescriptionModal(p.patient_id);
                                }}
                                className="btn btn-outline btn-sm"
                                disabled={isRestricted}
                              >
                                <FileCheck size={13} />
                                <span>Write Rx</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: PATIENT REPORTS & DOCUMENTS (Module 6.3) */}
        {activeTab === "reports" && (
          <div className="dashboard-tab-content">
            <div className="tab-header-row">
              <div>
                <h2>Patient Reports & Documents</h2>
                <p>Diagnostic documents, lab investigations, and medical records uploaded by your patients</p>
              </div>
              <button onClick={fetchPatientReports} className="btn btn-outline btn-sm">
                Refresh
              </button>
            </div>

            {loadingReports ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading medical documents...</p>
              </div>
            ) : safePatientReports.length === 0 ? (
              <div className="empty-state">
                <FileText size={48} color="#587493" />
                <h3>No medical reports found</h3>
                <p>When consulted patients upload diagnostic files or assign records to you, they will appear here with Fast Preview and Download options.</p>
              </div>
            ) : (
              <div className="content-card">
                <div className="reports-table-wrap">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Patient Name</th>
                        <th>Village</th>
                        <th>Report Title</th>
                        <th>Category</th>
                        <th>Upload Date</th>
                        <th>Dual Storage / Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {safePatientReports.map((r) => (
                        <tr key={r.id}>
                          <td><strong>{r.patient_name}</strong></td>
                          <td>{r.patient_village}</td>
                          <td>
                            <strong>{r.title}</strong>
                            <div style={{ fontSize: "11px", color: "#64748B" }}>{r.original_filename}</div>
                          </td>
                          <td>
                            <span className="category-pill">{r.category}</span>
                          </td>
                          <td>{new Date(r.uploaded_at).toLocaleDateString()}</td>
                          <td>
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                              {/* Fast Preview */}
                              <button
                                onClick={() => setPreviewReport(r)}
                                className="btn btn-outline btn-sm"
                                title="Fast compressed preview for low-bandwidth connections"
                                style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                              >
                                <Eye size={13} />
                                <span>Fast Preview</span>
                              </button>

                              {/* Download Original */}
                              <a
                                href={getFileUrl(r.original_file_path || r.file_path)}
                                download={r.original_filename}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-primary btn-sm"
                                title="Download original high-resolution document"
                                style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                              >
                                <Download size={13} />
                                <span>Download Original</span>
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 1.5: DIGITAL PRESCRIPTIONS MANAGEMENT */}
        {activeTab === "prescriptions" && (
          <div className="dashboard-tab-content">
            <div className="tab-header-row">
              <div>
                <h2>Digital Prescriptions & Treatment Regimens</h2>
                <p>Create and manage official medical prescriptions with itemized dosages and instructions</p>
              </div>
              <button onClick={() => handleOpenPrescriptionModal()} className="btn btn-primary btn-sm">
                <Plus size={16} />
                <span>Issue New Prescription</span>
              </button>
            </div>

            {loadingPrescriptions ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading issued prescriptions...</p>
              </div>
            ) : safePrescriptions.length === 0 ? (
              <div className="empty-state">
                <FileCheck size={48} color="#587493" />
                <h3>No digital prescriptions issued yet</h3>
                <p>Click "Issue New Prescription" to write a digital prescription with medication dosages and lifestyle advice.</p>
                <button onClick={() => handleOpenPrescriptionModal()} className="btn btn-primary mt-3">
                  Write First Prescription
                </button>
              </div>
            ) : (
              <div className="content-card">
                <div className="reports-table-wrap">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Rx Code</th>
                        <th>Patient</th>
                        <th>Diagnosis</th>
                        <th>Medications</th>
                        <th>Issued Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {safePrescriptions.map((rx) => (
                        <tr key={rx.id}>
                          <td><strong>RX-{String(rx.id).padStart(5, "0")}</strong></td>
                          <td>
                            <strong>{rx.patient_name}</strong>
                            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{rx.patient_village || "Rural Area"}</div>
                          </td>
                          <td>{rx.diagnosis}</td>
                          <td>
                            <span className="badge" style={{ background: "#eff6ff", color: "#1d4ed8" }}>
                              {rx.medicines?.length || 0} item(s)
                            </span>
                          </td>
                          <td>{new Date(rx.created_at).toLocaleDateString()}</td>
                          <td>
                            <span className={`status-pill ${rx.status}`}>
                              {rx.status.toUpperCase()} {rx.version > 1 ? `(v${rx.version})` : ""}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <a
                                href={`http://${window.location.hostname || "localhost"}:8000/api/prescriptions/${rx.id}/print`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-primary btn-sm"
                                style={{ padding: "4px 8px", fontSize: "0.8rem" }}
                                title="Print prescription slip"
                              >
                                <Printer size={13} />
                                <span>Print</span>
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PATIENT MESSAGING */}
        {(activeTab === "messages" || activeTab === "consultations") && (
          <div className="dashboard-tab-content">
            <div className="tab-header-row">
              <div>
                <h2>Patient Messaging & Consultation Chat</h2>
                <p>Provide medical follow-ups and respond to patient questions via low-bandwidth text messaging</p>
              </div>
            </div>

            <div className="chat-container-layout">
              {/* Patients list */}
              <div className="chat-contacts-panel">
                <h4>Registered Patients</h4>
                <div className="contacts-list">
                  {safePatients.length === 0 ? (
                    <p className="p-3 text-muted">No patient contacts yet.</p>
                  ) : (
                    safePatients.map((pat) => (
                      <div
                        key={pat.patient_id}
                        className={`contact-item ${selectedPatientChat?.patient_id === pat.patient_id ? "active" : ""}`}
                        onClick={() => selectPatientChat(pat)}
                      >
                        <div className="doc-avatar small">
                          {(pat?.full_name || "Patient").substring(0, 2).toUpperCase()}
                        </div>
                        <div className="contact-info">
                          <h5>{pat?.full_name || "Patient"}</h5>
                          <small>{pat?.village || "Rural Community"} • {pat?.phone || "-"}</small>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Chat Thread */}
              <div className="chat-thread-panel">
                {selectedPatientChat ? (
                  <>
                    <div className="chat-header">
                      <div>
                        <h4>{selectedPatientChat.full_name}</h4>
                        <small>Village: {selectedPatientChat.village} • Phone: {selectedPatientChat.phone}</small>
                      </div>
                    </div>

                    <div className="chat-messages-scroll">
                      {chatMessages.length === 0 ? (
                        <p className="no-chat-msg">No messages in this consultation thread yet.</p>
                      ) : (
                        chatMessages.map((m, idx) => {
                          const isMe = m.sender_id === user?.id;
                          return (
                            <div key={idx} className={`chat-bubble-row ${isMe ? "me" : "them"}`}>
                              <div className={`chat-bubble ${isMe ? "bubble-me" : "bubble-them"}`}>
                                <p>{m.message_content}</p>
                                <div className="chat-meta">
                                  <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <form onSubmit={handleSendMessage} className="chat-input-bar">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type medical prescription or advice for patient..."
                      />
                      <button type="submit" disabled={sendingMsg || !messageInput.trim()} className="btn btn-primary">
                        <Send size={16} />
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="chat-empty-state">
                    <MessageSquare size={48} color="#587493" />
                    <h4>Select a patient from the left panel to begin consultation</h4>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: NOTIFICATIONS */}
        {activeTab === "notifications" && (
          <div className="dashboard-tab-content">
            <div className="tab-header-row">
              <div>
                <h2>System & Medical Notifications</h2>
                <p>Real-time updates regarding appointment bookings, status updates, and credentials</p>
              </div>
              {safeNotifications.some((n) => !n.read_status) && (
                <button onClick={handleMarkAllNotificationsRead} className="btn btn-outline btn-sm">
                  Mark All as Read
                </button>
              )}
            </div>

            <div className="content-card">
              {loadingNotifications ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading notifications...</p>
                </div>
              ) : safeNotifications.length === 0 ? (
                <div className="empty-state">
                  <Bell size={48} color="#587493" />
                  <h3>No notifications yet</h3>
                  <p>You will receive alerts here when patients book appointments or administrators review your credentials.</p>
                </div>
              ) : (
                <div className="notifications-list">
                  {safeNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        padding: "14px 16px",
                        borderRadius: "8px",
                        border: notif.read_status ? "1px solid #E2E8F0" : "1px solid #BFDBFE",
                        background: notif.read_status ? "#FFFFFF" : "#EFF6FF",
                        marginBottom: "10px"
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <h4 style={{ margin: 0, fontSize: "15px" }}>{notif.title}</h4>
                          {!notif.read_status && (
                            <span className="status-pill pending" style={{ padding: "1px 6px", fontSize: "10px" }}>
                              New
                            </span>
                          )}
                        </div>
                        <p style={{ margin: "0 0 6px 0", color: "#475569", fontSize: "14px" }}>
                          {notif.message}
                        </p>
                        <small style={{ color: "#94A3B8" }}>
                          {new Date(notif.created_at).toLocaleString()}
                        </small>
                      </div>
                      {!notif.read_status && (
                        <button
                          onClick={() => handleMarkNotificationRead(notif.id)}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: "12px", padding: "4px 8px" }}
                        >
                          Mark Read
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 9: PROFILE */}
        {activeTab === "profile" && (
          <div className="dashboard-tab-content">
            <div className="tab-header-row">
              <div>
                <h2>Doctor Profile & Professional Credentials</h2>
                <p>Manage your medical specialties, hospital affiliations, and contact information</p>
              </div>
            </div>

            <div className="content-card">
              {profileMsg && (
                <div className="alert alert-success mb-3">
                  <CheckCircle size={16} />
                  <span>{profileMsg}</span>
                </div>
              )}

              <form onSubmit={handleProfileSave} className="profile-form">
                <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="form-group">
                    <label>Doctor Full Name</label>
                    <input
                      type="text"
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="form-group">
                    <label>Medical Specialty</label>
                    <input
                      type="text"
                      value={profileForm.specialty}
                      onChange={(e) => setProfileForm({ ...profileForm, specialty: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Medical Qualifications</label>
                    <input
                      type="text"
                      value={profileForm.qualifications}
                      onChange={(e) => setProfileForm({ ...profileForm, qualifications: e.target.value })}
                      placeholder="e.g. MBBS, MD (General Medicine)"
                      required
                    />
                  </div>
                </div>

                <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="form-group">
                    <label>Hospital or Clinic Name</label>
                    <input
                      type="text"
                      value={profileForm.hospital_name}
                      onChange={(e) => setProfileForm({ ...profileForm, hospital_name: e.target.value })}
                      placeholder="e.g. Karavali Health Center"
                    />
                  </div>
                  <div className="form-group">
                    <label>Years of Clinical Experience</label>
                    <input
                      type="text"
                      value={profileForm.experience}
                      onChange={(e) => setProfileForm({ ...profileForm, experience: e.target.value })}
                      placeholder="e.g. 8 years"
                    />
                  </div>
                </div>

                <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="form-group">
                    <label>Medical Registration Number (State Council)</label>
                    <input
                      type="text"
                      value={docProfile?.registration_number || "Not specified"}
                      disabled
                      style={{ background: "#F1F5F9", cursor: "not-allowed" }}
                    />
                    <small className="help-text">Immutable verified credential.</small>
                  </div>
                  <div className="form-group">
                    <label>Consultation Fee</label>
                    <input
                      type="text"
                      value={profileForm.consultation_fee}
                      onChange={(e) => setProfileForm({ ...profileForm, consultation_fee: e.target.value })}
                      placeholder="e.g. Free / Rs 150"
                    />
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "16px",
                    padding: "16px",
                    background: "#F8FAFC",
                    borderRadius: "8px",
                    border: "1px solid #E2E8F0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div>
                    <strong>Uploaded Medical Certificate:</strong>
                    <div style={{ fontSize: "13px", color: "#64748B" }}>
                      {docProfile?.certificate_filename || "Medical Certificate on File"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadOwnCert}
                    className="btn btn-outline btn-sm"
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    <Eye size={14} />
                    <span>Preview / Download</span>
                  </button>
                </div>

                <div style={{ marginTop: "20px" }}>
                  <button type="submit" disabled={savingProfile} className="btn btn-primary">
                    <Save size={16} />
                    <span>{savingProfile ? "Saving Profile..." : "Save Profile Details"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Fast Preview Report Modal */}
      {previewReport && (
        <div className="modal-backdrop" onClick={() => setPreviewReport(null)}>
          <div
            className="modal-dialog"
            style={{ maxWidth: "750px", width: "90%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>Fast Preview: {previewReport.title}</h3>
                <span className="text-muted text-sm">
                  Patient: {previewReport.patient_name} • Category: {previewReport.category}
                </span>
              </div>
              <button className="modal-close" onClick={() => setPreviewReport(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: "16px", maxHeight: "70vh", overflowY: "auto", textAlign: "center" }}>
              {previewReport.preview_file_path?.toLowerCase().endsWith(".pdf") || previewReport.original_filename?.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={getFileUrl(previewReport.preview_file_path || previewReport.file_path)}
                  title="Report Preview"
                  style={{ width: "100%", height: "480px", border: "1px solid #CBD5E1", borderRadius: "6px" }}
                />
              ) : (
                <img
                  src={getFileUrl(previewReport.preview_file_path || previewReport.file_path)}
                  alt={previewReport.title}
                  style={{ maxWidth: "100%", maxHeight: "500px", objectFit: "contain", borderRadius: "6px" }}
                />
              )}
            </div>
            <div className="modal-footer" style={{ display: "flex", justifyContent: "space-between" }}>
              <a
                href={getFileUrl(previewReport.original_file_path || previewReport.file_path)}
                download={previewReport.original_filename}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-sm"
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <Download size={14} />
                <span>Download Original File</span>
              </a>
              <button onClick={() => setPreviewReport(null)} className="btn btn-outline btn-sm">
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Action Modal (Confirm / Reject / Complete) */}
      {selectedAppt && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>
                {actionType === "confirm" && "Confirm Appointment"}
                {actionType === "reject" && "Reject Appointment Request"}
                {actionType === "complete" && "Mark Consultation as Completed"}
              </h3>
              <button className="modal-close" onClick={() => setSelectedAppt(null)}>×</button>
            </div>

            <form onSubmit={handleConfirmStatusChange} className="modal-body">
              <p className="mb-3">
                Patient: <strong>{selectedAppt.patient_name}</strong> ({selectedAppt.appointment_date} at {selectedAppt.appointment_time})
              </p>

              {actionType === "reject" && (
                <div className="form-group">
                  <label>Reason for Rejection (Visible to patient)</label>
                  <textarea
                    required
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Doctor unavailable on selected date, emergency hospital duty..."
                  />
                </div>
              )}

              {actionType === "complete" && (
                <div className="form-group">
                  <label>Doctor Advice / Prescribed Medicines (Visible to patient)</label>
                  <textarea
                    required
                    rows={4}
                    value={doctorNotes}
                    onChange={(e) => setDoctorNotes(e.target.value)}
                    placeholder="Enter clinical assessment, dosage instructions, or follow-up recommendations..."
                  />
                </div>
              )}

              {actionType === "confirm" && (
                <p className="text-muted">
                  Are you sure you want to confirm this appointment slot? The patient will be notified.
                </p>
              )}

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setSelectedAppt(null)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`btn ${actionType === "reject" ? "btn-danger" : "btn-primary"}`}
                >
                  {actionLoading ? "Processing..." : "Confirm Action"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Digital Prescription Issuance Modal */}
      {showRxModal && (
        <div className="rx-modal-overlay">
          <div className="rx-modal-card" style={{ maxWidth: "800px" }}>
            <div className="rx-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="rx-header-badge">&#8478; Issue Prescription</span>
                <span style={{ fontSize: "0.85rem", color: "var(--secondary-blue)" }}>
                  Karavali Institute of Technology &bull; TeleCare
                </span>
              </div>
              <button
                onClick={() => setShowRxModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: "#64748b" }}
              >
                ×
              </button>
            </div>

            <div className="rx-modal-body">
              {rxSuccessMsg && (
                <div className="alert alert-success mb-3">
                  <CheckCircle size={16} />
                  <span>{rxSuccessMsg}</span>
                </div>
              )}

              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Select Patient</label>
                  <select
                    value={rxPatientId}
                    onChange={(e) => setRxPatientId(e.target.value)}
                    className="custom-select"
                  >
                    <option value="">-- Choose Patient --</option>
                    {safePatients.map((p) => (
                      <option key={p.patient_id} value={p.patient_id}>
                        {p.full_name || "Patient"} ({p.village || "Rural Area"})
                      </option>
                    ))}
                    {/* Fallback if patients array empty */}
                    {safePatients.length === 0 && (
                      <option value="1">Ramesh Kumar (Sitapur District)</option>
                    )}
                  </select>
                </div>

                <div className="form-group flex-1">
                  <label>Scheduled Follow-up Date</label>
                  <input
                    type="date"
                    value={rxFollowUpDate}
                    onChange={(e) => setRxFollowUpDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Clinical Diagnosis & Primary Symptoms</label>
                <input
                  type="text"
                  required
                  value={rxDiagnosis}
                  onChange={(e) => setRxDiagnosis(e.target.value)}
                  placeholder="e.g. Acute Upper Respiratory Tract Infection, Seasonal Bronchitis"
                />
              </div>

              {/* Dynamic Medicine Rows */}
              <div style={{ marginTop: "16px", marginBottom: "16px" }}>
                <div className="flex-between mb-2">
                  <strong style={{ fontSize: "0.9rem", color: "var(--primary-navy)", textTransform: "uppercase" }}>
                    Prescribed Medicines ({rxMedicines.length})
                  </strong>
                  <button
                    type="button"
                    onClick={handleAddMedicineRow}
                    className="btn btn-outline btn-sm"
                    style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.8rem", padding: "4px 8px" }}
                  >
                    <Plus size={14} />
                    <span>Add Medicine</span>
                  </button>
                </div>

                {rxMedicines.map((med, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "var(--bg-light)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "6px",
                      padding: "12px",
                      marginBottom: "10px"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--primary-navy)" }}>
                        Medicine #{idx + 1}
                      </span>
                      {rxMedicines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMedicineRow(idx)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "3px",
                            fontSize: "0.78rem"
                          }}
                        >
                          <Trash2 size={13} />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1.5fr 1fr", gap: "8px", marginBottom: "8px" }}>
                      <div>
                        <label style={{ fontSize: "0.75rem", color: "var(--secondary-blue)", display: "block" }}>Medicine Name & Strength</label>
                        <input
                          type="text"
                          required
                          value={med.name}
                          onChange={(e) => handleMedicineChange(idx, "name", e.target.value)}
                          placeholder="e.g. Paracetamol 500mg"
                          style={{ padding: "6px 8px", fontSize: "0.85rem", width: "100%", border: "1px solid var(--border-color)", borderRadius: "4px" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.75rem", color: "var(--secondary-blue)", display: "block" }}>Dosage</label>
                        <input
                          type="text"
                          required
                          value={med.dosage}
                          onChange={(e) => handleMedicineChange(idx, "dosage", e.target.value)}
                          placeholder="e.g. 1 Tablet"
                          style={{ padding: "6px 8px", fontSize: "0.85rem", width: "100%", border: "1px solid var(--border-color)", borderRadius: "4px" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.75rem", color: "var(--secondary-blue)", display: "block" }}>Frequency</label>
                        <input
                          type="text"
                          required
                          value={med.frequency}
                          onChange={(e) => handleMedicineChange(idx, "frequency", e.target.value)}
                          placeholder="e.g. Twice daily after meals"
                          style={{ padding: "6px 8px", fontSize: "0.85rem", width: "100%", border: "1px solid var(--border-color)", borderRadius: "4px" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.75rem", color: "var(--secondary-blue)", display: "block" }}>Duration</label>
                        <input
                          type="text"
                          required
                          value={med.duration}
                          onChange={(e) => handleMedicineChange(idx, "duration", e.target.value)}
                          placeholder="e.g. 5 days"
                          style={{ padding: "6px 8px", fontSize: "0.85rem", width: "100%", border: "1px solid var(--border-color)", borderRadius: "4px" }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: "0.75rem", color: "var(--secondary-blue)", display: "block" }}>Special Instructions</label>
                      <input
                        type="text"
                        value={med.instructions}
                        onChange={(e) => handleMedicineChange(idx, "instructions", e.target.value)}
                        placeholder="e.g. Drink plenty of warm water, take after breakfast"
                        style={{ padding: "6px 8px", fontSize: "0.85rem", width: "100%", border: "1px solid var(--border-color)", borderRadius: "4px" }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="form-group">
                <label>Doctor Advice, Dietary Notes & Precautions</label>
                <textarea
                  rows={3}
                  value={rxDoctorNotes}
                  onChange={(e) => setRxDoctorNotes(e.target.value)}
                  placeholder="e.g. Maintain light low-salt diet, avoid cold beverages, report back if symptoms continue beyond 5 days."
                />
              </div>
            </div>

            <div className="rx-modal-footer">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowRxModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingRx}
                onClick={(e) => handleSubmitPrescription(e, "draft")}
                className="btn btn-outline"
              >
                Save as Draft
              </button>
              <button
                type="button"
                disabled={submittingRx}
                onClick={(e) => handleSubmitPrescription(e, "finalized")}
                className="btn btn-primary"
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <FileCheck size={16} />
                <span>{submittingRx ? "Issuing..." : "Finalize & Issue Prescription"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

