import React, { useState, useEffect } from "react";
import {
  User,
  Calendar,
  FileText,
  MessageSquare,
  Clock,
  Upload,
  AlertCircle,
  CheckCircle,
  Wifi,
  WifiOff,
  Volume2,
  Phone,
  Building,
  RefreshCw,
  Send,
  PlusCircle,
  Download,
  Eye,
  Shield,
  FileCheck,
  Printer,
  Search,
  Filter,
  Layers,
  ExternalLink,
  Pill,
  Sparkles,
  X,
  BookOpen,
  Stethoscope,
  Bell,
  ShieldCheck
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api, getFileUrl } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  cacheAppointments,
  getCachedAppointments,
  cacheReports,
  getCachedReports,
  cacheHistory,
  getCachedHistory,
  cachePrescriptions,
  getCachedPrescriptions,
  cacheDoctors,
  getCachedDoctors,
  queueOfflineMessage,
  getPendingMessages,
  queueOfflineAppointment
} from "../services/offlineStorage";

export const PatientDashboard = () => {
  const { user } = useAuth();
  const { t, readAloud } = useLanguage();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview"); // 'overview', 'doctors', 'appointments', 'reports', 'prescriptions', 'messages', 'guide', 'history', 'profile', 'notifications'
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Doctor Discovery & In-Dashboard Booking State
  const [selectedSpecialtyFilter, setSelectedSpecialtyFilter] = useState("All");
  const [doctorSearchTerm, setDoctorSearchTerm] = useState("");
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("10:30 AM");
  const [bookingConsultationType, setBookingConsultationType] = useState("online");
  const [bookingReason, setBookingReason] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState("");

  // Profile State
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    address: "",
    village: "",
    emergency_contact: ""
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  // Appointments State
  const [appointments, setAppointments] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(true);

  // Digital Prescriptions State
  const [prescriptions, setPrescriptions] = useState([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  // Reports State
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState("prescription");
  const [selectedDocForReport, setSelectedDocForReport] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [compressionResult, setCompressionResult] = useState(null);

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // History & Interactive Timeline State
  const [historyRecords, setHistoryRecords] = useState([]);
  const [timelineSearch, setTimelineSearch] = useState("");
  const [timelineFilter, setTimelineFilter] = useState("all");
  const [timelineSort, setTimelineSort] = useState("newest");

  // Messaging State
  const [conversations, setConversations] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [doctorsList, setDoctorsList] = useState([]);

  // Online / Offline listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Fetch initial profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await api.get("/api/patient/profile");
        setProfile(res.data);
        setProfileForm({
          full_name: res.data.full_name || "",
          phone: res.data.phone || "",
          date_of_birth: res.data.date_of_birth || "",
          gender: res.data.gender || "Male",
          address: res.data.address || "",
          village: res.data.village || "",
          emergency_contact: res.data.emergency_contact || ""
        });
      } catch (err) {
        console.warn("Could not load patient profile:", err);
      }
    };
    loadProfile();
  }, []);

  // Fetch appointments (with IndexedDB fallback)
  const fetchAppointments = async () => {
    setLoadingAppts(true);
    try {
      const res = await api.get("/api/patient/appointments");
      setAppointments(res.data);
      cacheAppointments(res.data);
    } catch (err) {
      console.warn("Using offline cached appointments:", err);
      const cached = await getCachedAppointments();
      setAppointments(cached);
    } finally {
      setLoadingAppts(false);
    }
  };

  // Fetch prescriptions (with IndexedDB fallback)
  const fetchPrescriptions = async () => {
    setLoadingPrescriptions(true);
    try {
      const res = await api.get("/api/prescriptions/patient");
      setPrescriptions(res.data);
      cachePrescriptions(res.data);
    } catch (err) {
      console.warn("Using offline cached prescriptions:", err);
      const cached = await getCachedPrescriptions();
      setPrescriptions(cached);
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  // Fetch reports (with IndexedDB fallback)
  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const res = await api.get("/api/patient/reports");
      setReports(res.data);
      cacheReports(res.data);
    } catch (err) {
      console.warn("Using offline cached reports:", err);
      const cached = await getCachedReports();
      setReports(cached);
    } finally {
      setLoadingReports(false);
    }
  };

  // Fetch medical history
  const fetchHistory = async () => {
    try {
      const res = await api.get("/api/patient/medical-history");
      setHistoryRecords(res.data);
      cacheHistory(res.data);
    } catch (err) {
      const cached = await getCachedHistory();
      setHistoryRecords(cached);
    }
  };

  // Fetch doctors for messaging initiation and in-dashboard discovery
  const fetchDoctors = async () => {
    try {
      const res = await api.get("/api/doctors");
      const list = Array.isArray(res.data) ? res.data : [];
      setDoctorsList(list);
      cacheDoctors(list);
    } catch (err) {
      console.warn("Could not fetch doctors from API, using offline cache:", err);
      const cached = await getCachedDoctors();
      setDoctorsList(Array.isArray(cached) ? cached : []);
    }
  };

  const safeNotifications = Array.isArray(notifications)
    ? notifications
    : (Array.isArray(notifications?.notifications) ? notifications.notifications : []);
  const safeAppointments = Array.isArray(appointments) ? appointments : [];
  const safeReports = Array.isArray(reports) ? reports : [];
  const safePrescriptions = Array.isArray(prescriptions) ? prescriptions : [];
  const safeDoctors = Array.isArray(doctorsList) ? doctorsList : [];
  const safeHistory = Array.isArray(historyRecords) ? historyRecords : [];

  const handleOpenBooking = (doc) => {
    if (doc.is_available === false) {
      alert("This doctor is currently unavailable for booking.");
      return;
    }
    setBookingDoctor(doc);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setBookingDate(tomorrow.toISOString().split("T")[0]);
    setBookingReason("");
    setBookingSuccessMsg("");
  };

  const handleConfirmDashboardBooking = async (e) => {
    e.preventDefault();
    const todayStr = new Date().toISOString().split("T")[0];
    if (bookingDate < todayStr) {
      alert("Please select a valid future date or today. Past dates are not allowed.");
      return;
    }

    setBookingLoading(true);
    setBookingSuccessMsg("");

    const payload = {
      doctor_id: bookingDoctor.id,
      appointment_date: bookingDate,
      appointment_time: bookingTime,
      consultation_type: bookingConsultationType,
      reason: bookingReason.trim()
    };

    try {
      if (navigator.onLine) {
        await api.post("/api/patient/appointments", payload);
      } else {
        await queueOfflineAppointment({
          ...payload,
          doctor_name: bookingDoctor.full_name,
          doctor_specialty: bookingDoctor.specialty
        });
      }
      setBookingSuccessMsg("Appointment request successfully booked!");
      fetchAppointments();
      fetchNotifications();
      setTimeout(() => {
        setBookingDoctor(null);
        setBookingSuccessMsg("");
        setActiveTab("appointments");
      }, 1500);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to book appointment slot.");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleMessageDoctorShortcut = (doc) => {
    selectDoctorChat(doc);
    setActiveTab("messages");
  };

  const handleReadDoctor = (doc) => {
    const text = `${doc?.full_name || "Doctor"}. Specialty: ${doc?.specialty || "General Medicine"}. Qualifications: ${doc?.qualifications || "MBBS"}. Available hours: ${doc?.availability || "Regular hours"}. Fee: ${doc?.consultation_fee || "Community Subsidized"}.`;
    readAloud(text);
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

  const handleMarkNotificationRead = async (notifId) => {
    try {
      await api.put(`/api/notifications/${notifId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, read_status: true } : n))
      );
    } catch (err) {
      console.warn("Could not mark notification read:", err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await api.put("/api/notifications/read-all/mark");
      setNotifications((prev) => prev.map((n) => ({ ...n, read_status: true })));
    } catch (err) {
      console.warn("Could not mark all notifications read:", err);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchPrescriptions();
    fetchReports();
    fetchHistory();
    fetchDoctors();
    fetchNotifications();

    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get("tab");
    if (tabParam && ["overview", "doctors", "appointments", "reports", "prescriptions", "messages", "guide", "history", "profile", "notifications"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);

  // Handle Profile Update
  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg("");
    try {
      const res = await api.put("/api/patient/profile", profileForm);
      setProfile(res.data);
      setProfileMsg("Profile updated successfully!");
      setTimeout(() => setProfileMsg(""), 3000);
    } catch (err) {
      alert("Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Report Upload with Pillow Compression metrics
  const handleReportUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setCompressionResult(null);

    const formData = new FormData();
    formData.append("title", uploadTitle);
    formData.append("category", uploadCategory);
    formData.append("file", selectedFile);
    if (selectedDocForReport) {
      formData.append("doctor_id", selectedDocForReport);
    }

    try {
      const res = await api.post("/api/patient/reports", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setCompressionResult(res.data);
      setUploadTitle("");
      setSelectedDocForReport("");
      setSelectedFile(null);
      fetchReports();
      fetchNotifications();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to upload medical report.");
    } finally {
      setUploading(false);
    }
  };

  // Load chat for selected doctor
  const selectDoctorChat = async (doc) => {
    setSelectedContact(doc);
    try {
      const res = await api.get(`/api/messages/${doc.user_id}`);
      setChatMessages(res.data);
    } catch {
      // Offline fallback: check pending offline messages for this doctor
      const pending = await getPendingMessages();
      const relevant = pending.filter((m) => m.receiver_id === doc.user_id);
      setChatMessages(relevant);
    }
  };

  // Send message with offline queueing
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedContact) return;

    const content = messageInput.trim();
    setMessageInput("");
    setSendingMsg(true);

    const clientMsgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (!isOnline) {
      // Save offline message to IndexedDB
      const pendingMsg = await queueOfflineMessage({
        receiver_id: selectedContact.user_id,
        message_content: content,
        client_msg_id: clientMsgId
      });
      setChatMessages((prev) => [...prev, pendingMsg]);
      setSendingMsg(false);
      return;
    }

    try {
      const res = await api.post("/api/messages", {
        receiver_id: selectedContact.user_id,
        message_content: content,
        client_msg_id: clientMsgId
      });
      setChatMessages((prev) => [...prev, res.data]);
    } catch (err) {
      // On network failure, fallback queue to IndexedDB
      const pendingMsg = await queueOfflineMessage({
        receiver_id: selectedContact.user_id,
        message_content: content,
        client_msg_id: clientMsgId
      });
      setChatMessages((prev) => [...prev, pendingMsg]);
    } finally {
      setSendingMsg(false);
    }
  };

  const handleReadPrescription = (report) => {
    readAloud(`Medical Report: ${report.title}. Category: ${report.category}. Uploaded on ${new Date(report.uploaded_at).toLocaleDateString()}. Saved on device for offline access.`);
  };

  const handleReadPrescriptionAudio = (rx) => {
    const medsText = rx.medicines && rx.medicines.length > 0
      ? rx.medicines.map((m, i) => `Medicine ${i+1}: ${m.name}, dosage: ${m.dosage}, frequency: ${m.frequency}, duration: ${m.duration}. ${m.instructions ? 'Instructions: ' + m.instructions : ''}`).join(". ")
      : "No specific medicines";
    const advice = rx.doctor_notes ? `Doctor advice: ${rx.doctor_notes}.` : "";
    const followUp = rx.follow_up_date ? `Follow-up scheduled for ${rx.follow_up_date}.` : "";
    readAloud(`Prescription issued by ${rx.doctor_name}. Diagnosis: ${rx.diagnosis}. Prescribed medicines: ${medsText}. ${advice} ${followUp}`);
  };

  // Compile unified interactive medical timeline events
  const getTimelineEvents = () => {
    const events = [];

    // 1. Digital Prescriptions
    prescriptions.forEach((rx) => {
      events.push({
        id: `rx_${rx.id}`,
        type: "prescription",
        date: rx.created_at,
        title: rx.diagnosis || "Medical Prescription",
        subtitle: `${rx.doctor_name} (${rx.doctor_specialty || "Physician"})`,
        details: rx.doctor_notes,
        medicines: rx.medicines || [],
        follow_up: rx.follow_up_date,
        status: rx.status,
        version: rx.version,
        raw: rx
      });
    });

    // 2. Doctor Consultations / Appointments
    appointments.forEach((appt) => {
      events.push({
        id: `appt_${appt.id}`,
        type: "consultation",
        date: `${appt.appointment_date}T${appt.appointment_time ? "10:00:00" : "00:00:00"}`,
        title: `${appt.consultation_type ? appt.consultation_type.toUpperCase() : 'CLINICAL'} Consultation`,
        subtitle: `${appt.doctor_name} • ${appt.doctor_specialty}`,
        details: appt.reason,
        doctor_notes: appt.doctor_notes,
        status: appt.status,
        raw: appt
      });
    });

    // 3. Medical & Diagnostic Reports
    reports.forEach((rep) => {
      events.push({
        id: `rep_${rep.id}`,
        type: "report",
        date: rep.uploaded_at,
        title: rep.title,
        subtitle: `Category: ${rep.category} • ${rep.compression_ratio || "Optimized"}`,
        details: rep.doctor_remarks || `File: ${rep.original_filename}`,
        file_path: rep.preview_file_path || rep.file_path,
        original_file_path: rep.original_file_path || rep.file_path,
        original_size: rep.original_size,
        preview_size: rep.preview_size || rep.compressed_size,
        raw: rep
      });
    });

    // 4. Clinical History / Chronic conditions
    historyRecords.forEach((h) => {
      events.push({
        id: `hist_${h.id}`,
        type: "condition",
        date: h.recorded_at,
        title: h.title,
        subtitle: `Type: ${h.record_type.toUpperCase()} • Dr. ${h.doctor_name || "Doctor"}`,
        details: h.description,
        raw: h
      });
    });

    // Filter by type
    let filtered = events;
    if (timelineFilter === "prescriptions") filtered = filtered.filter((e) => e.type === "prescription");
    else if (timelineFilter === "consultations") filtered = filtered.filter((e) => e.type === "consultation");
    else if (timelineFilter === "reports") filtered = filtered.filter((e) => e.type === "report");
    else if (timelineFilter === "conditions") filtered = filtered.filter((e) => e.type === "condition");

    // Filter by search query
    if (timelineSearch.trim()) {
      const q = timelineSearch.toLowerCase();
      filtered = filtered.filter((e) => {
        const textMatch =
          e.title?.toLowerCase().includes(q) ||
          e.subtitle?.toLowerCase().includes(q) ||
          e.details?.toLowerCase().includes(q);
        const medMatch = e.medicines?.some((m) => m.name?.toLowerCase().includes(q));
        return textMatch || medMatch;
      });
    }

    // Sort by date
    filtered.sort((a, b) => {
      const timeA = new Date(a.date).getTime() || 0;
      const timeB = new Date(b.date).getTime() || 0;
      return timelineSort === "newest" ? timeB - timeA : timeA - timeB;
    });

    return filtered;
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-patient-badge">
          <div className="avatar-circle">
            {user?.full_name ? user.full_name.substring(0, 2).toUpperCase() : "PT"}
          </div>
          <div>
            <h4 className="user-name">{user?.full_name || "Patient"}</h4>
            <span className="user-village">{profile?.village || "Rural Community"}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`sidebar-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <Clock size={17} />
            <span>{t("healthSummary")}</span>
          </button>
          <button
            className={`sidebar-btn ${activeTab === "doctors" ? "active" : ""}`}
            onClick={() => setActiveTab("doctors")}
            title="Search verified doctors"
          >
            <Stethoscope size={17} />
            <span>Find Doctors ({safeDoctors.length})</span>
          </button>
          <button
            className={`sidebar-btn ${activeTab === "appointments" ? "active" : ""}`}
            onClick={() => setActiveTab("appointments")}
          >
            <Calendar size={17} />
            <span>{t("myAppointments")} ({safeAppointments.length})</span>
          </button>
          <button
            className={`sidebar-btn ${activeTab === "reports" ? "active" : ""}`}
            onClick={() => setActiveTab("reports")}
          >
            <FileText size={17} />
            <span>Medical Reports ({safeReports.length})</span>
          </button>
          <button
            className={`sidebar-btn ${activeTab === "prescriptions" ? "active" : ""}`}
            onClick={() => setActiveTab("prescriptions")}
          >
            <FileCheck size={17} />
            <span>My Prescriptions ({safePrescriptions.length})</span>
          </button>
          <button
            className={`sidebar-btn ${activeTab === "messages" ? "active" : ""}`}
            onClick={() => setActiveTab("messages")}
          >
            <MessageSquare size={17} />
            <span>{t("messages")}</span>
          </button>
          <button
            className={`sidebar-btn ${activeTab === "guide" ? "active" : ""}`}
            onClick={() => setActiveTab("guide")}
          >
            <BookOpen size={17} />
            <span>Offline Health Guide</span>
          </button>
          <button
            className={`sidebar-btn ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            <Shield size={17} />
            <span>{t("medicalHistory")}</span>
          </button>
          <button
            className={`sidebar-btn ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <User size={17} />
            <span>{t("profile")}</span>
          </button>
          <button
            className={`sidebar-btn ${activeTab === "notifications" ? "active" : ""}`}
            onClick={() => setActiveTab("notifications")}
          >
            <Bell size={17} />
            <span>Notifications ({safeNotifications.filter((n) => !n.read_status).length})</span>
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="dashboard-main">
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="dashboard-tab-content">
            <div className="welcome-banner">
              <div>
                <h2>{t("welcomeBack")}, {user?.full_name || "Patient"}!</h2>
                <p>Village: <strong>{profile?.village || "Sitapur District"}</strong> | Emergency: {profile?.emergency_contact || "Configured"}</p>
              </div>
              <button
                onClick={() => setActiveTab("doctors")}
                className="btn btn-primary btn-sm"
              >
                <PlusCircle size={15} />
                <span>Book New Consultation</span>
              </button>
            </div>

            {/* Quick Metrics Cards */}
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-icon navy">
                  <Calendar size={22} />
                </div>
                <div className="metric-data">
                  <span className="metric-value">{safeAppointments.filter(a => a.status !== 'completed').length}</span>
                  <span className="metric-label">Active Consultations</span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon blue">
                  <FileText size={22} />
                </div>
                <div className="metric-data">
                  <span className="metric-value">{safeReports.length}</span>
                  <span className="metric-label">Cached Medical Reports</span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon green">
                  <Shield size={22} />
                </div>
                <div className="metric-data">
                  <span className="metric-value">{safeHistory.length}</span>
                  <span className="metric-label">Recorded Health Conditions</span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>
                  <FileCheck size={22} />
                </div>
                <div className="metric-data">
                  <span className="metric-value">{safePrescriptions.length}</span>
                  <span className="metric-label">Digital Prescriptions</span>
                </div>
              </div>
            </div>

            {/* Upcoming Appointments Section */}
            <div className="content-card mt-4">
              <div className="card-header-row">
                <h3>{t("upcomingAppointments")}</h3>
                <button onClick={() => setActiveTab("appointments")} className="link-btn">
                  View All
                </button>
              </div>

              {appointments.length === 0 ? (
                <p className="text-muted py-3">{t("allCaughtUp")}</p>
              ) : (
                <div className="appointments-list-compact">
                  {appointments.slice(0, 2).map((a) => (
                    <div key={a.id} className="appointment-card-compact">
                      <div className="appt-date-box">
                        <span className="month">{a.appointment_date.split("-")[1]}</span>
                        <span className="day">{a.appointment_date.split("-")[2]}</span>
                      </div>
                      <div className="appt-info">
                        <h4>{a.doctor_name}</h4>
                        <p className="specialty">{a.doctor_specialty} • {a.appointment_time}</p>
                        <p className="reason">Reason: {a.reason}</p>
                      </div>
                      <span className={`status-pill ${a.status}`}>{a.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Medical Reports Section */}
            <div className="content-card mt-4">
              <div className="card-header-row">
                <h3>{t("recentReports")}</h3>
                <button onClick={() => setActiveTab("reports")} className="btn btn-outline btn-sm">
                  <Upload size={14} />
                  <span>Upload Report</span>
                </button>
              </div>

              {reports.length === 0 ? (
                <p className="text-muted py-3">No medical reports uploaded yet.</p>
              ) : (
                <div className="reports-table-wrap">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Report Title</th>
                        <th>Category</th>
                        <th>Data Compression</th>
                        <th>Offline Cached</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.slice(0, 3).map((r) => (
                        <tr key={r.id}>
                          <td><strong>{r.title}</strong></td>
                          <td><span className="category-pill">{r.category}</span></td>
                          <td>
                            <span className="compression-badge">
                              {r.compression_ratio || "Saved"}
                            </span>
                          </td>
                          <td>
                            <span className="offline-ready-badge">
                              <CheckCircle size={13} color="#10B981" />
                              <span>Ready</span>
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => handleReadPrescription(r)}
                              className="btn-icon-audio mr-2"
                              title="Listen to prescription details"
                            >
                              <Volume2 size={15} />
                            </button>
                            <a
                              href={getFileUrl(r.file_path)}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-outline btn-sm"
                            >
                              <Eye size={13} />
                              <span>View</span>
                            </a>
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

        {/* TAB: FIND DOCTORS (Module 3.1) */}
        {activeTab === "doctors" && (
          <div className="dashboard-tab-content">
            <div className="tab-header-row">
              <div>
                <h2>Find Certified Rural Care Doctors</h2>
                <p>Browse verified medical specialists, check clinic hours, and book consultations</p>
              </div>
              <button onClick={fetchDoctors} className="btn btn-outline btn-sm">
                <RefreshCw size={14} />
                <span>Refresh Directory</span>
              </button>
            </div>

            {/* Search & Specialty Filter Bar */}
            <div className="search-filter-container mb-4">
              <div className="search-bar-form">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  value={doctorSearchTerm}
                  onChange={(e) => setDoctorSearchTerm(e.target.value)}
                  placeholder="Search by doctor name, specialty, or clinic..."
                />
                {doctorSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setDoctorSearchTerm("")}
                    className="btn btn-text btn-sm"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="specialty-chips">
                {[
                  "All",
                  "General Medicine",
                  "Pediatrics & Child Health",
                  "Cardiology",
                  "Obstetrics & Maternal Health",
                  "Dermatology"
                ].map((spec) => (
                  <button
                    key={spec}
                    className={`chip ${selectedSpecialtyFilter === spec ? "active" : ""}`}
                    onClick={() => setSelectedSpecialtyFilter(spec)}
                  >
                    {spec}
                  </button>
                ))}
              </div>
            </div>

            {/* Doctor Cards Grid */}
            {safeDoctors.filter((doc) => {
              const matchesSpec =
                selectedSpecialtyFilter === "All" ||
                (doc.specialty && doc.specialty.toLowerCase().includes(selectedSpecialtyFilter.toLowerCase()));
              const q = doctorSearchTerm.toLowerCase().trim();
              const matchesSearch =
                !q ||
                (doc.full_name && doc.full_name.toLowerCase().includes(q)) ||
                (doc.specialty && doc.specialty.toLowerCase().includes(q)) ||
                (doc.qualifications && doc.qualifications.toLowerCase().includes(q));
              return matchesSpec && matchesSearch;
            }).length === 0 ? (
              <div className="empty-state">
                <Stethoscope size={48} color="#587493" />
                <h3>No doctors match your criteria</h3>
                <p>Try clearing search terms or selecting a different specialty filter.</p>
                <button
                  onClick={() => {
                    setSelectedSpecialtyFilter("All");
                    setDoctorSearchTerm("");
                  }}
                  className="btn btn-outline mt-3"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="doctors-grid">
                {safeDoctors
                  .filter((doc) => {
                    const matchesSpec =
                      selectedSpecialtyFilter === "All" ||
                      (doc.specialty && doc.specialty.toLowerCase().includes(selectedSpecialtyFilter.toLowerCase()));
                    const q = doctorSearchTerm.toLowerCase().trim();
                    const matchesSearch =
                      !q ||
                      (doc.full_name && doc.full_name.toLowerCase().includes(q)) ||
                      (doc.specialty && doc.specialty.toLowerCase().includes(q)) ||
                      (doc.qualifications && doc.qualifications.toLowerCase().includes(q));
                    return matchesSpec && matchesSearch;
                  })
                  .map((doc) => (
                    <div key={doc.id} className="doctor-card elevated">
                      <div className="doc-card-header">
                        <div className="doc-avatar large">
                          {(doc?.full_name || "Doctor").replace("Dr. ", "").substring(0, 2).toUpperCase()}
                        </div>
                        <div className="doc-meta">
                          <div className="doc-name-row">
                            <h3 className="doc-name">{doc?.full_name || "Doctor"}</h3>
                            <button
                              onClick={() => handleReadDoctor(doc)}
                              className="btn-icon-audio"
                              title="Listen to doctor profile audio"
                            >
                              <Volume2 size={16} />
                            </button>
                          </div>
                          <span className="doc-specialty-badge">{doc?.specialty || "General Medicine"}</span>
                          <span className="verification-pill verified">
                            <ShieldCheck size={12} />
                            <span>Verified Doctor</span>
                          </span>
                        </div>
                      </div>

                      <div className="doc-card-details">
                        <div className="detail-row">
                          <span className="detail-label">Qualifications:</span>
                          <span className="detail-value">{doc?.qualifications || "MBBS"}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Experience:</span>
                          <span className="detail-value">{doc?.experience || "Experienced"}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Clinic Hours:</span>
                          <span className="detail-value">{doc?.availability || "Mon - Sat, 09:00 AM - 04:00 PM"}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Consultation Fee:</span>
                          <span className="detail-value fee">{doc?.consultation_fee || "Free / Community Subsidized"}</span>
                        </div>
                      </div>

                      {doc.is_available === false && (
                        <div
                          style={{
                            background: "#FEF2F2",
                            border: "1px solid #FECACA",
                            color: "#991B1B",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            margin: "8px 16px 0 16px",
                            textAlign: "center",
                            fontWeight: 500
                          }}
                        >
                          This doctor is currently unavailable for booking.
                        </div>
                      )}

                      <div className="doc-card-footer" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {doc.is_available === false ? (
                          <button
                            disabled
                            className="btn btn-outline btn-block"
                            style={{ opacity: 0.6, cursor: "not-allowed", flex: 1 }}
                            title="This doctor is currently unavailable for booking."
                          >
                            <Calendar size={15} />
                            <span>Unavailable</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenBooking(doc)}
                            className="btn btn-primary btn-sm"
                            style={{ flex: 1 }}
                          >
                            <Calendar size={15} />
                            <span>Book Consultation</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleMessageDoctorShortcut(doc)}
                          className="btn btn-outline btn-sm"
                          title="Send a message to this doctor"
                        >
                          <MessageSquare size={15} />
                          <span>Message</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: APPOINTMENTS */}
        {activeTab === "appointments" && (
          <div className="dashboard-tab-content">
            <div className="tab-header-row">
              <div>
                <h2>{t("myAppointments")}</h2>
                <p>Manage your doctor consultations and medical visits</p>
              </div>
              <button onClick={() => setActiveTab("doctors")} className="btn btn-primary btn-sm">
                <PlusCircle size={16} />
                <span>Book New Appointment</span>
              </button>
            </div>

            {loadingAppts ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading appointments...</p>
              </div>
            ) : safeAppointments.length === 0 ? (
              <div className="empty-state">
                <Calendar size={48} color="#587493" />
                <h3>No appointments booked yet</h3>
                <p>Browse our verified rural medical doctors and reserve your slot.</p>
                <button onClick={() => setActiveTab("doctors")} className="btn btn-primary mt-3">Find a Doctor</button>
              </div>
            ) : (
              <div className="appointments-grid">
                {safeAppointments.map((a) => (
                  <div key={a.id} className="appointment-card-full">
                    <div className="appt-top">
                      <div>
                        <h3>{a.doctor_name}</h3>
                        <span className="specialty-text">{a.doctor_specialty}</span>
                      </div>
                      <span className={`status-pill ${a.status}`}>{a.status}</span>
                    </div>

                    <div className="appt-details-row">
                      <div className="detail-item">
                        <Calendar size={14} />
                        <span>{a.appointment_date} at {a.appointment_time}</span>
                      </div>
                      <div className="detail-item">
                        <Building size={14} />
                        <span className="capitalize">{a.consultation_type} consultation</span>
                      </div>
                    </div>

                    <div className="appt-reason-box">
                      <strong>Symptoms / Reason:</strong>
                      <p>{a.reason}</p>
                    </div>

                    {a.doctor_notes && (
                      <div className="doctor-notes-box">
                        <div className="flex-between">
                          <strong>Doctor Advice & Prescription:</strong>
                          <button
                            onClick={() => readAloud(`Doctor advice from ${a.doctor_name}: ${a.doctor_notes}`)}
                            className="btn-icon-audio"
                            title="Listen to doctor's advice"
                          >
                            <Volume2 size={15} />
                          </button>
                        </div>
                        <p>{a.doctor_notes}</p>
                      </div>
                    )}

                    {a.rejection_reason && (
                      <div className="alert alert-error mt-2">
                        <span>Doctor feedback: {a.rejection_reason}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2.5: DIGITAL PRESCRIPTIONS */}
        {activeTab === "prescriptions" && (
          <div className="dashboard-tab-content">
            <div className="tab-header-row">
              <div>
                <h2>Digital Prescriptions & Medical Regimens</h2>
                <p>Doctor-verified digital prescriptions cached locally for offline rural pharmacy visits</p>
              </div>
              {!isOnline && (
                <span className="badge badge-offline">
                  <WifiOff size={13} />
                  <span>Offline Mode (Cached in IndexedDB)</span>
                </span>
              )}
            </div>

            {loadingPrescriptions ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading medical prescriptions...</p>
              </div>
            ) : prescriptions.length === 0 ? (
              <div className="empty-state">
                <FileCheck size={48} color="#587493" />
                <h3>No digital prescriptions issued yet</h3>
                <p>When your consulting doctor issues an official prescription, it will appear here with full dosage and instructions.</p>
              </div>
            ) : (
              <div className="prescriptions-grid" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {prescriptions.map((rx) => (
                  <div key={rx.id} className="content-card" style={{ borderLeft: "4px solid var(--primary-navy)" }}>
                    <div className="flex-between mb-3" style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                          <span className="rx-header-badge">&#8478; RX-{String(rx.id).padStart(5, "0")}</span>
                          <span className={`status-pill ${rx.status}`}>
                            {rx.status.toUpperCase()} {rx.version > 1 ? `(v${rx.version})` : ""}
                          </span>
                        </div>
                        <h3 style={{ margin: "4px 0 2px" }}>{rx.doctor_name}</h3>
                        <p style={{ fontSize: "0.85rem", color: "var(--secondary-blue)", margin: 0 }}>
                          {rx.doctor_qualifications} &bull; {rx.doctor_specialty}
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "0.82rem", color: "var(--secondary-blue)", fontWeight: "600" }}>
                          Issued on: {new Date(rx.created_at).toLocaleDateString()}
                        </span>
                        {rx.follow_up_date && (
                          <div style={{ fontSize: "0.82rem", color: "#2563eb", fontWeight: "600", marginTop: "4px" }}>
                            Next Follow-up: {rx.follow_up_date}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--primary-navy)", textTransform: "uppercase" }}>
                        Clinical Diagnosis:
                      </span>
                      <p style={{ margin: "4px 0 0", fontSize: "0.98rem", fontWeight: "600", color: "#1e293b" }}>
                        {rx.diagnosis}
                      </p>
                    </div>

                    {/* Medicines Table */}
                    <div style={{ overflowX: "auto", marginBottom: "16px" }}>
                      <table className="rx-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Medicine Name</th>
                            <th>Dosage</th>
                            <th>Frequency</th>
                            <th>Duration</th>
                            <th>Special Instructions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rx.medicines && rx.medicines.map((m, idx) => (
                            <tr key={idx}>
                              <td>{idx + 1}</td>
                              <td className="rx-medicine-name">{m.name}</td>
                              <td>{m.dosage}</td>
                              <td>{m.frequency}</td>
                              <td>{m.duration}</td>
                              <td style={{ color: "#64748b", fontStyle: "italic" }}>{m.instructions || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {rx.doctor_notes && (
                      <div style={{ background: "var(--bg-light)", padding: "12px", borderRadius: "6px", marginBottom: "16px" }}>
                        <strong style={{ fontSize: "0.85rem", color: "var(--primary-navy)" }}>Doctor Advice & Dietary Care:</strong>
                        <p style={{ margin: "4px 0 0", fontSize: "0.9rem", color: "#334155" }}>{rx.doctor_notes}</p>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex-between pt-2" style={{ borderTop: "1px dashed var(--border-color)" }}>
                      <button
                        onClick={() => handleReadPrescriptionAudio(rx)}
                        className="btn btn-outline btn-sm"
                        title="Listen to medicine instructions"
                      >
                        <Volume2 size={15} />
                        <span>Listen in Voice (Audio)</span>
                      </button>

                      <div style={{ display: "flex", gap: "8px" }}>
                        <a
                          href={`http://${window.location.hostname || "localhost"}:8000/api/prescriptions/${rx.id}/print`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-primary btn-sm"
                          title="Print official prescription slip"
                        >
                          <Printer size={15} />
                          <span>Print / PDF Slip</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MEDICAL REPORTS & DUAL STORAGE COMPRESSION */}
        {activeTab === "reports" && (
          <div className="dashboard-tab-content">
            <div className="tab-header-row">
              <div>
                <h2>{t("recentReports")} & Diagnostic Documents</h2>
                <p>Dual Storage Engine: High-resolution originals preserved for specialists while lightweight previews are generated for rural low bandwidth</p>
              </div>
            </div>

            {/* Upload Box */}
            <div className="content-card upload-card mb-4">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <div>
                  <h3 style={{ margin: 0 }}>Upload Medical Report or Diagnostic Scan</h3>
                  <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--secondary-blue)" }}>
                    Original file is preserved 100% intact. An optimized preview is created automatically.
                  </p>
                </div>
                <span className="dual-file-badge">
                  <Sparkles size={13} />
                  <span>Dual Storage Active</span>
                </span>
              </div>

              <form onSubmit={handleReportUpload} className="upload-form mt-3">
                <div className="form-row">
                  <div className="form-group flex-1">
                    <label>Report / Document Title</label>
                    <input
                      type="text"
                      required
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      placeholder="e.g. Blood Sugar Report, Chest X-Ray"
                    />
                  </div>
                  <div className="form-group flex-1">
                    <label>Category / Report Type</label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                      className="custom-select"
                    >
                      <option value="lab_report">Lab Test Results</option>
                      <option value="prescription">Prescriptions</option>
                      <option value="discharge_summary">Discharge Summaries</option>
                      <option value="scan">Diagnostic Scans / X-Ray</option>
                      <option value="clinical_notes">Clinical Notes</option>
                      <option value="other">Other Medical Document</option>
                    </select>
                  </div>
                  <div className="form-group flex-1">
                    <label>Assign to Doctor (Optional)</label>
                    <select
                      value={selectedDocForReport}
                      onChange={(e) => setSelectedDocForReport(e.target.value)}
                      className="custom-select"
                    >
                      <option value="">-- Optional: Notify Consulted Doctor --</option>
                      {safeDoctors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.full_name || "Doctor"} ({d.specialty || "General Medicine"})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Select Document (Image or PDF)</label>
                  <input
                    type="file"
                    required
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    className="file-input"
                  />
                  <small className="help-text">Max 15MB. Server creates WebP/compressed stream preview while saving original file untouched.</small>
                </div>

                <button type="submit" disabled={uploading} className="btn btn-primary">
                  <Upload size={16} />
                  <span>{uploading ? "Optimizing & Uploading..." : "Upload & Optimize Document"}</span>
                </button>
              </form>

              {/* Compression Metric Feedback */}
              {compressionResult && (
                <div className="compression-feedback-box mt-3">
                  <CheckCircle size={20} color="#10B981" />
                  <div>
                    <h4>Dual Storage Processing Complete!</h4>
                    <p>
                      Original Preserved: <strong>{(compressionResult.original_size / 1024).toFixed(1)} KB</strong> &bull; 
                      Low-Data Preview: <strong>{((compressionResult.preview_size || compressionResult.compressed_size) / 1024).toFixed(1)} KB</strong> 
                      ({compressionResult.compression_ratio})
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Reports List */}
            <div className="content-card">
              <h3>My Uploaded Medical Documents</h3>
              {loadingReports ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading reports...</p>
                </div>
              ) : reports.length === 0 ? (
                <p className="text-muted py-3">No reports saved yet.</p>
              ) : (
                <div className="reports-table-wrap">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Title & File</th>
                        <th>Category</th>
                        <th>Original File</th>
                        <th>Optimized Preview</th>
                        <th>Bandwidth Saved</th>
                        <th>Dual Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <strong>{r.title}</strong>
                            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{r.original_filename}</div>
                          </td>
                          <td><span className="category-pill">{r.category}</span></td>
                          <td>{(r.original_size / 1024).toFixed(1)} KB</td>
                          <td>{((r.preview_size || r.compressed_size) / 1024).toFixed(1)} KB</td>
                          <td><span className="compression-badge">{r.compression_ratio}</span></td>
                          <td>
                            <div className="dual-file-actions">
                              <button
                                onClick={() => handleReadPrescription(r)}
                                className="btn-icon-audio"
                                title="Listen to report audio"
                              >
                                <Volume2 size={14} />
                              </button>
                              <a
                                href={getFileUrl(r.preview_file_path || r.file_path)}
                                target="_blank"
                                rel="noreferrer"
                                className="btn-dual-preview"
                                title="Fast preview optimized for rural internet"
                              >
                                <Eye size={12} />
                                <span>Preview</span>
                              </a>
                              <a
                                href={getFileUrl(r.original_file_path || r.file_path)}
                                target="_blank"
                                rel="noreferrer"
                                className="btn-dual-original"
                                title="Download untouched original file for doctor/hospital referral"
                              >
                                <Download size={12} />
                                <span>Original</span>
                              </a>
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

        {/* TAB 4: MESSAGING WITH OFFLINE QUEUEING */}
        {activeTab === "messages" && (
          <div className="dashboard-tab-content">
            <div className="tab-header-row">
              <div>
                <h2>Doctor Consultations & Messaging</h2>
                <p>Send text messages. Messages sent while offline will automatically sync when internet reconnects.</p>
              </div>
            </div>

            <div className="chat-container-layout">
              {/* Doctor contacts list */}
              <div className="chat-contacts-panel">
                <h4>Select a Doctor</h4>
                <div className="contacts-list">
                  {safeDoctors.map((doc) => (
                    <div
                      key={doc.id}
                      className={`contact-item ${selectedContact?.id === doc.id ? "active" : ""}`}
                      onClick={() => selectDoctorChat(doc)}
                    >
                      <div className="doc-avatar small">
                        {(doc?.full_name || "Doctor").replace("Dr. ", "").substring(0, 2).toUpperCase()}
                      </div>
                      <div className="contact-info">
                        <h5>{doc?.full_name || "Doctor"}</h5>
                        <small>{doc?.specialty || "Specialist"}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Thread */}
              <div className="chat-thread-panel">
                {selectedContact ? (
                  <>
                    <div className="chat-header">
                      <div>
                        <h4>{selectedContact?.full_name || "Doctor"}</h4>
                        <small>{selectedContact?.specialty || "Telemedicine Specialist"} • Community Telemedicine</small>
                      </div>
                      {!isOnline && (
                        <span className="badge badge-offline">
                          <WifiOff size={12} />
                          <span>Offline Queue Active</span>
                        </span>
                      )}
                    </div>

                    <div className="chat-messages-scroll">
                      {chatMessages.length === 0 ? (
                        <p className="no-chat-msg">No messages yet. Send a message to start consultation.</p>
                      ) : (
                        chatMessages.map((m, idx) => {
                          const isMe = m.sender_id === user?.id || m.is_pending_sync;
                          return (
                            <div key={idx} className={`chat-bubble-row ${isMe ? "me" : "them"}`}>
                              <div className={`chat-bubble ${isMe ? "bubble-me" : "bubble-them"}`}>
                                <p>{m.message_content}</p>
                                <div className="chat-meta">
                                  <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  {m.is_pending_sync ? (
                                    <span className="sync-status pending">⏳ Pending Sync</span>
                                  ) : (
                                    <span className="sync-status delivered">✓ Sent</span>
                                  )}
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
                        placeholder={isOnline ? "Type health question for doctor..." : "Type message (will queue offline & sync)..."}
                      />
                      <button type="submit" disabled={sendingMsg || !messageInput.trim()} className="btn btn-primary">
                        <Send size={16} />
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="chat-empty-state">
                    <MessageSquare size={48} color="#587493" />
                    <h4>Select a doctor from the left to start communication</h4>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: INTERACTIVE TIMELINE-BASED MEDICAL DASHBOARD */}
        {activeTab === "history" && (
          <div className="dashboard-tab-content">
            <div className="tab-header-row">
              <div>
                <h2>Interactive Medical Records Timeline</h2>
                <p>Unified chronological health history merging prescriptions, consultations, lab tests & chronic conditions</p>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <span className="badge badge-online">
                  <CheckCircle size={13} />
                  <span>Fully Cached Offline</span>
                </span>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="timeline-filter-bar">
              <div className="timeline-search-row">
                <div style={{ position: "relative", flex: 1 }}>
                  <Search size={16} color="#64748b" style={{ position: "absolute", left: "12px", top: "12px" }} />
                  <input
                    type="text"
                    value={timelineSearch}
                    onChange={(e) => setTimelineSearch(e.target.value)}
                    placeholder="Search by condition, medicine, doctor, or diagnosis..."
                    className="timeline-search-input"
                    style={{ paddingLeft: "36px" }}
                  />
                  {timelineSearch && (
                    <button
                      onClick={() => setTimelineSearch("")}
                      style={{ position: "absolute", right: "10px", top: "10px", background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <select
                  value={timelineSort}
                  onChange={(e) => setTimelineSort(e.target.value)}
                  className="timeline-sort-select"
                >
                  <option value="newest">Sort: Newest First</option>
                  <option value="oldest">Sort: Oldest First</option>
                </select>
              </div>

              {/* Category Filter Chips */}
              <div className="timeline-chips-row">
                {[
                  { id: "all", label: "All Health Events" },
                  { id: "prescriptions", label: `Digital Prescriptions (${prescriptions.length})` },
                  { id: "consultations", label: `Doctor Visits (${appointments.length})` },
                  { id: "reports", label: `Diagnostic Reports (${reports.length})` },
                  { id: "conditions", label: `Conditions & Allergies (${historyRecords.length})` }
                ].map((chip) => (
                  <button
                    key={chip.id}
                    className={`timeline-chip ${timelineFilter === chip.id ? "active" : ""}`}
                    onClick={() => setTimelineFilter(chip.id)}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Timeline Events Track */}
            {getTimelineEvents().length === 0 ? (
              <div className="empty-state">
                <Shield size={48} color="#587493" />
                <h3>No medical records matched your filter</h3>
                <p>Try clearing your search query or switching to 'All Health Events'.</p>
                {timelineSearch && (
                  <button onClick={() => setTimelineSearch("")} className="btn btn-outline btn-sm mt-3">
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <div className="medical-timeline-track">
                {getTimelineEvents().map((item) => (
                  <div key={item.id} className="timeline-event-card">
                    {/* Node marker */}
                    <div className={`timeline-node-icon timeline-node-${item.type}`}>
                      {item.type === "prescription" && <Pill size={14} />}
                      {item.type === "consultation" && <Calendar size={14} />}
                      {item.type === "report" && <FileText size={14} />}
                      {item.type === "condition" && <Shield size={14} />}
                    </div>

                    <div className="timeline-card-header">
                      <div>
                        <span className={`timeline-type-badge timeline-badge-${item.type}`}>
                          {item.type === "prescription" ? "Digital Prescription" :
                           item.type === "consultation" ? "Doctor Consultation" :
                           item.type === "report" ? "Diagnostic Report" : "Health Condition"}
                        </span>
                        <h4 style={{ margin: "2px 0 4px", fontSize: "1.08rem", color: "var(--primary-navy)" }}>{item.title}</h4>
                        <div style={{ fontSize: "0.82rem", color: "var(--secondary-blue)", fontWeight: "500" }}>{item.subtitle}</div>
                      </div>
                      <div className="timeline-date-stamp">
                        {new Date(item.date).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" })}
                      </div>
                    </div>

                    <div className="timeline-card-body" style={{ marginTop: "10px" }}>
                      {item.details && (
                        <p style={{ margin: "0 0 10px", fontSize: "0.9rem", color: "#334155" }}>
                          {item.details}
                        </p>
                      )}

                      {/* Special preview for prescription medicines */}
                      {item.type === "prescription" && item.medicines && item.medicines.length > 0 && (
                        <div style={{ background: "var(--bg-light)", padding: "10px 14px", borderRadius: "6px", margin: "10px 0" }}>
                          <strong style={{ fontSize: "0.82rem", color: "var(--primary-navy)", textTransform: "uppercase" }}>
                            Prescribed Medication ({item.medicines.length}):
                          </strong>
                          <ul style={{ margin: "6px 0 0", paddingLeft: "20px", fontSize: "0.88rem", color: "#1e293b" }}>
                            {item.medicines.map((m, mIdx) => (
                              <li key={mIdx}>
                                <strong>{m.name}</strong> &bull; {m.dosage} &bull; {m.frequency} ({m.duration})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Actions row for timeline event */}
                      <div className="timeline-actions-row">
                        <button
                          onClick={() => {
                            if (item.type === "prescription") handleReadPrescriptionAudio(item.raw);
                            else if (item.type === "report") handleReadPrescription(item.raw);
                            else readAloud(`${item.title}. ${item.subtitle}. ${item.details || ""}`);
                          }}
                          className="btn-icon-audio"
                          title="Listen to this medical event"
                          style={{ padding: "4px 8px", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.78rem" }}
                        >
                          <Volume2 size={13} />
                          <span>Voice Read</span>
                        </button>

                        <div style={{ display: "flex", gap: "8px" }}>
                          {item.type === "prescription" && (
                            <a
                              href={`http://${window.location.hostname || "localhost"}:8000/api/prescriptions/${item.raw.id}/print`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-primary btn-sm"
                              style={{ fontSize: "0.78rem", padding: "4px 10px" }}
                            >
                              <Printer size={13} />
                              <span>Print Prescription</span>
                            </a>
                          )}

                          {item.type === "report" && (
                            <div className="dual-file-actions">
                              <a
                                href={getFileUrl(item.file_path)}
                                target="_blank"
                                rel="noreferrer"
                                className="btn-dual-preview"
                              >
                                <Eye size={12} />
                                <span>Preview</span>
                              </a>
                              <a
                                href={getFileUrl(item.original_file_path)}
                                target="_blank"
                                rel="noreferrer"
                                className="btn-dual-original"
                              >
                                <Download size={12} />
                                <span>Original</span>
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: PROFILE */}
        {activeTab === "profile" && (
          <div className="dashboard-tab-content">
            <div className="tab-header-row">
              <div>
                <h2>{t("profile")}</h2>
                <p>Update personal and emergency contact details for rural clinics</p>
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
                <div className="form-row">
                  <div className="form-group flex-1">
                    <label>Full Name</label>
                    <input
                      type="text"
                      required
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                    />
                  </div>
                  <div className="form-group flex-1">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group flex-1">
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      value={profileForm.date_of_birth}
                      onChange={(e) => setProfileForm({ ...profileForm, date_of_birth: e.target.value })}
                    />
                  </div>
                  <div className="form-group flex-1">
                    <label>Gender</label>
                    <select
                      value={profileForm.gender}
                      onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                      className="custom-select"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group flex-1">
                    <label>Village / Gram Panchayat</label>
                    <input
                      type="text"
                      value={profileForm.village}
                      onChange={(e) => setProfileForm({ ...profileForm, village: e.target.value })}
                      placeholder="e.g. Rampur Kalan"
                    />
                  </div>
                  <div className="form-group flex-1">
                    <label>Full Address / Landmark</label>
                    <input
                      type="text"
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                      placeholder="e.g. House 42, Near Panchayat Bhavan"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Emergency Contact (Name & Phone)</label>
                  <input
                    type="text"
                    value={profileForm.emergency_contact}
                    onChange={(e) => setProfileForm({ ...profileForm, emergency_contact: e.target.value })}
                    placeholder="+91 98765 00000 (Brother / Village Health Worker)"
                  />
                </div>

                <button type="submit" disabled={savingProfile} className="btn btn-primary">
                  {savingProfile ? "Saving..." : t("saveChanges")}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 7: OFFLINE HEALTH GUIDE */}
        {activeTab === "guide" && (
          <div className="dashboard-tab-content">
            <div className="tab-header-row">
              <div>
                <h2>Offline Rural Health Guide & First Aid</h2>
                <p>Crucial medical guidelines, emergency response steps, and hygiene protocols stored for offline use</p>
              </div>
              <div className="tag-offline-cached">
                <CheckCircle size={14} color="#10B981" />
                <span>Available Offline in IndexedDB</span>
              </div>
            </div>

            <div className="grid-2col" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
              {/* Card 1: Emergency First Aid */}
              <div className="content-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h3 style={{ margin: 0, color: "#DC2626" }}>Emergency First Aid Protocols</h3>
                  <button
                    onClick={() =>
                      readAloud(
                        "Emergency First Aid: For bleeding, apply direct pressure with a clean cloth. For burns, use cool running water for 15 minutes. For snakebites, keep the victim still and immobilize the limb below the heart level. Do not cut or suck the wound. Rush immediately to the health center."
                      )
                    }
                    className="btn-icon-audio"
                    title="Listen to emergency first aid advice"
                  >
                    <Volume2 size={16} />
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ background: "#FEF2F2", padding: "10px 12px", borderRadius: "6px", borderLeft: "3px solid #DC2626" }}>
                    <strong>Severe Bleeding & Cuts</strong>
                    <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#475569" }}>
                      Press firmly with a clean cloth directly on the wound. Keep the injured limb elevated above heart level. Do not remove soaked cloths; place additional cloths on top.
                    </p>
                  </div>

                  <div style={{ background: "#FEF2F2", padding: "10px 12px", borderRadius: "6px", borderLeft: "3px solid #DC2626" }}>
                    <strong>Snakebite & Scorpion Stings</strong>
                    <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#475569" }}>
                      Keep patient calm and completely still. Immobilize the limb with a splint below heart level. <strong>NEVER cut the bite, apply tourniquet, or try to suck venom.</strong> Transport immediately to clinic with anti-venom.
                    </p>
                  </div>

                  <div style={{ background: "#FEF2F2", padding: "10px 12px", borderRadius: "6px", borderLeft: "3px solid #DC2626" }}>
                    <strong>Burns & Scalds</strong>
                    <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#475569" }}>
                      Hold burn under cool clean running water for 10-15 minutes. Cover loosely with clean cloth. Do not pop blisters or apply toothpaste, butter, or oils.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Safe Water & ORS Preparation */}
              <div className="content-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h3 style={{ margin: 0, color: "#0284C7" }}>Safe Drinking Water & ORS Solution</h3>
                  <button
                    onClick={() =>
                      readAloud(
                        "Safe Water and ORS: Always boil drinking water for at least three minutes. To make home Oral Rehydration Salts, mix one liter of boiled clean water with six level teaspoons of sugar and half a teaspoon of salt. Give frequent sips during diarrhea."
                      )
                    }
                    className="btn-icon-audio"
                    title="Listen to ORS preparation"
                  >
                    <Volume2 size={16} />
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ background: "#F0F9FF", padding: "12px", borderRadius: "6px", border: "1px solid #BAE6FD" }}>
                    <strong>Homemade ORS Formula (Diarrhea / Dehydration):</strong>
                    <ul style={{ margin: "6px 0 0 16px", padding: 0, fontSize: "13px", color: "#0369A1" }}>
                      <li>1 Liter of boiled and cooled drinking water</li>
                      <li>6 level teaspoons of sugar</li>
                      <li>1/2 level teaspoon of salt</li>
                      <li>Stir until completely dissolved. Sip continuously throughout illness.</li>
                    </ul>
                  </div>

                  <div style={{ background: "#F8FAFC", padding: "10px 12px", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
                    <strong>Water Disinfection in Villages</strong>
                    <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#475569" }}>
                      Bring water to a vigorous rolling boil for at least 3 minutes before drinking or infant food preparation. Store boiled water in covered, clean vessels.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 3: Maternal & Child Health */}
              <div className="content-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h3 style={{ margin: 0, color: "#166534" }}>Maternal Care & Warning Signs</h3>
                  <button
                    onClick={() =>
                      readAloud(
                        "Maternal Care: Warning signs during pregnancy include severe headache, sudden swelling of hands or face, high fever, or reduced baby movements. Seek immediate clinical medical care if any of these occur."
                      )
                    }
                    className="btn-icon-audio"
                    title="Listen to maternal health advice"
                  >
                    <Volume2 size={16} />
                  </button>
                </div>

                <div style={{ fontSize: "13px", color: "#334155" }}>
                  <p style={{ margin: "0 0 8px 0" }}>
                    Pregnant mothers should attend regular checkups and report any of the following emergency danger signs immediately:
                  </p>
                  <ul style={{ margin: "0 0 0 16px", padding: 0, lineHeight: "1.6" }}>
                    <li>Sudden severe headache or blurry vision</li>
                    <li>Swelling of hands, ankles, or face</li>
                    <li>Persistent vaginal bleeding or fluid leakage</li>
                    <li>Significant reduction in fetal movement</li>
                    <li>High fever accompanied by shivering</li>
                  </ul>
                </div>
              </div>

              {/* Card 4: Chronic Condition Monitoring */}
              <div className="content-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h3 style={{ margin: 0, color: "#854D0E" }}>Managing Hypertension & Diabetes</h3>
                  <button
                    onClick={() =>
                      readAloud(
                        "Hypertension and Diabetes care: Reduce daily salt intake, walk daily for 30 minutes, avoid smoking and alcohol, and take prescribed medicines consistently without skipping doses."
                      )
                    }
                    className="btn-icon-audio"
                    title="Listen to chronic care tips"
                  >
                    <Volume2 size={16} />
                  </button>
                </div>

                <div style={{ fontSize: "13px", color: "#334155" }}>
                  <ul style={{ margin: "0 0 0 16px", padding: 0, lineHeight: "1.6" }}>
                    <li><strong>Salt reduction:</strong> Keep dietary salt under 1 teaspoon per day for high blood pressure.</li>
                    <li><strong>Regular medication:</strong> Never pause blood pressure or diabetes medication without consulting your doctor.</li>
                    <li><strong>Foot inspection:</strong> People with diabetes must check feet daily for cuts or sores.</li>
                    <li><strong>Emergency hypoglycemia:</strong> If sudden shaking, sweating, or dizziness occurs, consume 3 teaspoons of sugar or a sweet beverage immediately.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: NOTIFICATIONS */}
        {activeTab === "notifications" && (
          <div className="dashboard-tab-content">
            <div className="tab-header-row">
              <div>
                <h2>Healthcare Alerts & Notifications</h2>
                <p>Status updates regarding your consultations, doctor approvals, and issued prescriptions</p>
              </div>
              {notifications.some((n) => !n.read_status) && (
                <button onClick={handleMarkAllNotificationsRead} className="btn btn-outline btn-sm">
                  Mark All Read
                </button>
              )}
            </div>

            <div className="content-card">
              {loadingNotifications ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading your notifications...</p>
                </div>
              ) : safeNotifications.length === 0 ? (
                <div className="empty-state">
                  <Bell size={48} color="#587493" />
                  <h3>No notifications yet</h3>
                  <p>When doctors confirm your appointments, issue prescriptions, or review your reports, you will be notified here.</p>
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
      </main>

      {/* Appointment Booking Modal */}
      {bookingDoctor && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>Book Appointment with {bookingDoctor?.full_name || "Doctor"}</h3>
              <button className="modal-close" onClick={() => setBookingDoctor(null)}>×</button>
            </div>
            {bookingSuccessMsg ? (
              <div className="modal-body text-center py-4">
                <CheckCircle size={52} color="#10B981" className="mx-auto mb-3" />
                <h3>{bookingSuccessMsg}</h3>
                <p>Redirecting to your appointments list...</p>
              </div>
            ) : (
              <form onSubmit={handleConfirmDashboardBooking} className="modal-body">
                <div className="form-group">
                  <label>Consultation Specialty</label>
                  <input type="text" readOnly value={bookingDoctor?.specialty || "General Medicine"} className="bg-light" />
                </div>

                <div className="form-row">
                  <div className="form-group flex-1">
                    <label>Preferred Date</label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split("T")[0]}
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                    />
                  </div>
                  <div className="form-group flex-1">
                    <label>Preferred Time Slot</label>
                    <select
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="custom-select"
                    >
                      <option value="09:00 AM">09:00 AM</option>
                      <option value="09:45 AM">09:45 AM</option>
                      <option value="10:30 AM">10:30 AM</option>
                      <option value="11:15 AM">11:15 AM</option>
                      <option value="01:00 PM">01:00 PM</option>
                      <option value="02:30 PM">02:30 PM</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Consultation Type</label>
                  <div className="radio-group-horizontal">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="ptConsultationType"
                        value="online"
                        checked={bookingConsultationType === "online"}
                        onChange={() => setBookingConsultationType("online")}
                      />
                      <span>Online / Low-Data Messaging</span>
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="ptConsultationType"
                        value="in-person"
                        checked={bookingConsultationType === "in-person"}
                        onChange={() => setBookingConsultationType("in-person")}
                      />
                      <span>In-Person Village Visit</span>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>Reason for Consultation / Health Symptoms</label>
                  <textarea
                    required
                    rows={3}
                    value={bookingReason}
                    onChange={(e) => setBookingReason(e.target.value)}
                    placeholder="Describe symptoms, duration, or reason for appointment..."
                  />
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setBookingDoctor(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="btn btn-primary"
                  >
                    {bookingLoading ? "Booking..." : "Confirm Booking"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

