import React, { useState, useEffect } from "react";
import {
  Users,
  Stethoscope,
  Calendar,
  ShieldCheck,
  Activity,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Clock,
  Filter,
  Eye,
  Download,
  X,
  ExternalLink
} from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview"); // 'overview', 'users', 'doctors', 'appointments', 'audit'

  // Dashboard Stats
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Users Management
  const [users, setUsers] = useState([]);
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userSearch, setUserSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Doctors Verification
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null); // { url, filename, type, doctorName }
  const [loadingCert, setLoadingCert] = useState(false);
  const [rejectModalDoc, setRejectModalDoc] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submittingReject, setSubmittingReject] = useState(false);

  // Appointments
  const [appointments, setAppointments] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(false);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await api.get("/api/admin/dashboard");
      setStats(res.data);
    } catch (err) {
      console.warn("Could not fetch admin dashboard stats:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const params = {};
      if (userRoleFilter !== "all") params.role = userRoleFilter;
      if (userSearch.trim()) params.search = userSearch.trim();
      const res = await api.get("/api/admin/users", { params });
      setUsers(res.data);
    } catch (err) {
      console.warn("Could not fetch users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchDoctors = async () => {
    setLoadingDoctors(true);
    try {
      const res = await api.get("/api/admin/doctors");
      setDoctors(res.data);
    } catch (err) {
      console.warn("Could not fetch doctors:", err);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const fetchAppointments = async () => {
    setLoadingAppts(true);
    try {
      const res = await api.get("/api/admin/appointments");
      setAppointments(res.data);
    } catch (err) {
      console.warn("Could not fetch appointments:", err);
    } finally {
      setLoadingAppts(false);
    }
  };

  const fetchAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const res = await api.get("/api/admin/audit-logs");
      setAuditLogs(res.data);
    } catch (err) {
      console.warn("Could not fetch audit logs:", err);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === "users") fetchUsers();
    if (activeTab === "doctors") fetchDoctors();
    if (activeTab === "appointments") fetchAppointments();
    if (activeTab === "audit") fetchAuditLogs();
  }, [activeTab, userRoleFilter]);

  const handleToggleUserStatus = async (targetUser) => {
    const nextStatus = targetUser.account_status === "active" ? "suspended" : "active";
    if (!confirm(`Are you sure you want to change status to '${nextStatus}' for ${targetUser.full_name}?`)) {
      return;
    }
    try {
      await api.put(`/api/admin/users/${targetUser.id}/status`, { account_status: nextStatus });
      fetchUsers();
      fetchStats();
    } catch (err) {
      alert("Failed to change user status.");
    }
  };

  const handleDoctorVerification = async (doctorId, newStatus, reason = null) => {
    try {
      const payload = { verification_status: newStatus };
      if (reason) payload.rejection_reason = reason;
      await api.put(`/api/admin/doctors/${doctorId}/verification`, payload);
      fetchDoctors();
      fetchStats();
      if (rejectModalDoc) {
        setRejectModalDoc(null);
        setRejectionReason("");
      }
    } catch (err) {
      alert("Failed to update doctor verification status.");
    }
  };

  const handleViewCertificate = async (doc) => {
    if (!doc.certificate_filename && !doc.certificate_file_path) {
      alert("No certificate uploaded for this doctor.");
      return;
    }
    setLoadingCert(true);
    try {
      const res = await api.get(`/api/admin/doctors/${doc.id}/certificate`, {
        responseType: "blob"
      });
      const contentType = res.headers["content-type"] || "application/pdf";
      const blob = new Blob([res.data], { type: contentType });
      const blobUrl = URL.createObjectURL(blob);
      setSelectedCert({
        url: blobUrl,
        filename: doc.certificate_filename || "medical_certificate.pdf",
        type: contentType,
        doctorName: doc.full_name
      });
    } catch (err) {
      alert(err.response?.data?.detail || "Could not load certificate file.");
    } finally {
      setLoadingCert(false);
    }
  };

  const handleOpenRejectModal = (doc) => {
    setRejectModalDoc(doc);
    setRejectionReason(doc.rejection_reason || "");
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejecting the credentials.");
      return;
    }
    setSubmittingReject(true);
    try {
      await handleDoctorVerification(rejectModalDoc.id, "rejected", rejectionReason.trim());
    } finally {
      setSubmittingReject(false);
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-patient-badge">
          <div className="avatar-circle admin">AD</div>
          <div>
            <h4 className="user-name">Administrator</h4>
            <span className="user-village">System Governance</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`sidebar-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <Activity size={17} />
            <span>Platform Overview</span>
          </button>
          <button
            className={`sidebar-btn ${activeTab === "doctors" ? "active" : ""}`}
            onClick={() => setActiveTab("doctors")}
          >
            <Stethoscope size={17} />
            <span>Doctor Verifications ({stats?.pending_doctor_verifications || 0})</span>
          </button>
          <button
            className={`sidebar-btn ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            <Users size={17} />
            <span>User Management</span>
          </button>
          <button
            className={`sidebar-btn ${activeTab === "appointments" ? "active" : ""}`}
            onClick={() => setActiveTab("appointments")}
          >
            <Calendar size={17} />
            <span>Appointments ({stats?.total_appointments || 0})</span>
          </button>
          <button
            className={`sidebar-btn ${activeTab === "audit" ? "active" : ""}`}
            onClick={() => setActiveTab("audit")}
          >
            <ShieldCheck size={17} />
            <span>Security Audit Logs</span>
          </button>
        </nav>
      </aside>

      {/* Main Area */}
      <main className="dashboard-main">
        {/* TAB 1: PLATFORM OVERVIEW */}
        {activeTab === "overview" && (
          <div className="dashboard-tab-content">
            <div className="tab-header-row">
              <div>
                <h2>TeleCare Platform Operations & Statistics</h2>
                <p>System metrics, healthcare delivery stats, and synchronization health</p>
              </div>
            </div>

            {loadingStats ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Aggregating platform metrics...</p>
              </div>
            ) : (
              <>
                <div className="metrics-grid">
                  <div className="metric-card">
                    <div className="metric-icon navy">
                      <Users size={22} />
                    </div>
                    <div className="metric-data">
                      <span className="metric-value">{stats?.total_users || 0}</span>
                      <span className="metric-label">Total Registered Users</span>
                    </div>
                  </div>

                  <div className="metric-card">
                    <div className="metric-icon blue">
                      <Stethoscope size={22} />
                    </div>
                    <div className="metric-data">
                      <span className="metric-value">{stats?.total_doctors || 0}</span>
                      <span className="metric-label">Registered Doctors</span>
                    </div>
                  </div>

                  <div className="metric-card">
                    <div className="metric-icon green">
                      <Calendar size={22} />
                    </div>
                    <div className="metric-data">
                      <span className="metric-value">{stats?.total_appointments || 0}</span>
                      <span className="metric-label">Total Appointments</span>
                    </div>
                  </div>

                  <div className="metric-card">
                    <div className="metric-icon warning">
                      <Clock size={22} />
                    </div>
                    <div className="metric-data">
                      <span className="metric-value">{stats?.pending_appointments || 0}</span>
                      <span className="metric-label">Pending Appointments</span>
                    </div>
                  </div>
                </div>

                {/* Recent Platform Activity */}
                <div className="content-card mt-4">
                  <h3>Recent Administrative & Security Events</h3>
                  {stats?.recent_activity?.length === 0 ? (
                    <p className="text-muted py-3">No recent events logged.</p>
                  ) : (
                    <div className="timeline-container mt-3">
                      {stats?.recent_activity.map((act) => (
                        <div key={act.id} className="timeline-item">
                          <div className="timeline-marker"></div>
                          <div className="timeline-content">
                            <div className="timeline-header">
                              <span className="record-type-pill condition">{act.target_type}</span>
                              <span className="timeline-date">{act.timestamp}</span>
                            </div>
                            <h4>{act.action}</h4>
                            <p>{act.details}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 2: DOCTOR VERIFICATIONS */}
        {activeTab === "doctors" && (
          <div className="dashboard-tab-content">
            <div className="tab-header-row">
              <div>
                <h2>Doctor Verification & Credential Management</h2>
                <p>Only verified medical doctors are permitted to offer consultations on the platform</p>
              </div>
            </div>

            <div className="content-card">
              {loadingDoctors ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading doctors list...</p>
                </div>
              ) : doctors.length === 0 ? (
                <p className="text-muted py-3">No registered doctors found.</p>
              ) : (
                <div className="reports-table-wrap">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Doctor Name</th>
                        <th>Email</th>
                        <th>Specialty</th>
                        <th>Qualifications</th>
                        <th>Reg. Number</th>
                        <th>Registered Date</th>
                        <th>Certificate</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doctors.map((doc) => (
                        <tr key={doc.id}>
                          <td><strong>{doc.full_name}</strong></td>
                          <td>{doc.email || "-"}</td>
                          <td>{doc.specialty}</td>
                          <td>{doc.qualifications}</td>
                          <td><code>{doc.registration_number || "N/A"}</code></td>
                          <td>{doc.registered_at ? new Date(doc.registered_at).toLocaleDateString() : "-"}</td>
                          <td>
                            {doc.certificate_filename ? (
                              <button
                                onClick={() => handleViewCertificate(doc)}
                                className="btn btn-outline btn-sm"
                                title="View uploaded medical certificate"
                                style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                              >
                                <Eye size={13} />
                                <span style={{ maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {doc.certificate_filename}
                                </span>
                              </button>
                            ) : (
                              <span className="text-muted text-sm">No file</span>
                            )}
                          </td>
                          <td>
                            <span className={`status-pill ${doc.verification_status}`}>
                              {doc.verification_status}
                            </span>
                            {doc.rejection_reason && (
                              <div style={{ fontSize: "11px", color: "#DC2626", marginTop: "3px", maxWidth: "140px" }} title={doc.rejection_reason}>
                                Reason: {doc.rejection_reason}
                              </div>
                            )}
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                              {doc.certificate_filename && (
                                <button
                                  onClick={() => handleViewCertificate(doc)}
                                  className="btn btn-outline btn-sm"
                                  title="View Certificate"
                                >
                                  <Eye size={13} />
                                  <span>View Cert</span>
                                </button>
                              )}
                              {doc.verification_status !== "approved" && doc.verification_status !== "verified" ? (
                                <button
                                  onClick={() => handleDoctorVerification(doc.id, "approved")}
                                  className="btn btn-success btn-sm"
                                >
                                  <CheckCircle size={13} />
                                  <span>Approve</span>
                                </button>
                              ) : null}
                              {doc.verification_status !== "rejected" ? (
                                <button
                                  onClick={() => handleOpenRejectModal(doc)}
                                  className="btn btn-outline btn-sm"
                                  style={{ borderColor: "#DC2626", color: "#DC2626" }}
                                >
                                  <XCircle size={13} />
                                  <span>Reject</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleDoctorVerification(doc.id, "approved")}
                                  className="btn btn-outline btn-sm"
                                >
                                  <CheckCircle size={13} />
                                  <span>Re-Approve</span>
                                </button>
                              )}
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

        {/* TAB 3: USER MANAGEMENT */}
        {activeTab === "users" && (
          <div className="dashboard-tab-content">
            <div className="tab-header-row">
              <div>
                <h2>User Management & Access Control</h2>
                <p>Manage patient, doctor, and staff access securely. Passwords are never displayed.</p>
              </div>
            </div>

            <div className="search-filter-container mb-3">
              <div className="search-bar-form flex-1">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search user by name, email, or phone..."
                />
                <button onClick={fetchUsers} className="btn btn-primary btn-sm">Search</button>
              </div>

              <div className="filter-pill-group">
                {["all", "patient", "doctor", "admin"].map((r) => (
                  <button
                    key={r}
                    className={`filter-pill ${userRoleFilter === r ? "active" : ""}`}
                    onClick={() => setUserRoleFilter(r)}
                  >
                    {r.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="content-card">
              {loadingUsers ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading users...</p>
                </div>
              ) : (
                <div className="reports-table-wrap">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>User Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Role</th>
                        <th>Account Status</th>
                        <th>Registered Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td><strong>{u.full_name}</strong></td>
                          <td>{u.email}</td>
                          <td>{u.phone}</td>
                          <td><span className="role-badge">{u.role}</span></td>
                          <td>
                            <span className={`status-pill ${u.account_status}`}>
                              {u.account_status}
                            </span>
                          </td>
                          <td>{new Date(u.created_at).toLocaleDateString()}</td>
                          <td>
                            {u.id !== user?.id && (
                              <button
                                onClick={() => handleToggleUserStatus(u)}
                                className={`btn btn-sm ${u.account_status === "active" ? "btn-outline" : "btn-success"}`}
                              >
                                {u.account_status === "active" ? "Suspend" : "Activate"}
                              </button>
                            )}
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

        {/* TAB 4: APPOINTMENTS MONITORING */}
        {activeTab === "appointments" && (
          <div className="dashboard-tab-content">
            <div className="tab-header-row">
              <div>
                <h2>Platform Appointments & Telemedicine Volume</h2>
                <p>Complete record of community consultations across all doctors</p>
              </div>
            </div>

            <div className="content-card">
              {loadingAppts ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading appointments list...</p>
                </div>
              ) : (
                <div className="reports-table-wrap">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Doctor</th>
                        <th>Specialty</th>
                        <th>Date & Time</th>
                        <th>Type</th>
                        <th>Reason</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map((a) => (
                        <tr key={a.id}>
                          <td><strong>{a.patient_name}</strong></td>
                          <td>{a.doctor_name}</td>
                          <td>{a.specialty}</td>
                          <td>{a.appointment_date} ({a.appointment_time})</td>
                          <td><span className="capitalize">{a.consultation_type}</span></td>
                          <td>{a.reason}</td>
                          <td><span className={`status-pill ${a.status}`}>{a.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: AUDIT LOGS */}
        {activeTab === "audit" && (
          <div className="dashboard-tab-content">
            <div className="tab-header-row">
              <div>
                <h2>Security & Administrative Audit Logs</h2>
                <p>Immutable record of access changes, verification approvals, and account activities</p>
              </div>
            </div>

            <div className="content-card">
              {loadingAudit ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading audit logs...</p>
                </div>
              ) : (
                <div className="reports-table-wrap">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Admin / Initiator</th>
                        <th>Action</th>
                        <th>Target Entity</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <tr key={log.id}>
                          <td>{new Date(log.created_at).toLocaleString()}</td>
                          <td><strong>{log.admin_name || "System"}</strong></td>
                          <td>{log.action}</td>
                          <td><span className="category-pill">{log.target_type}</span></td>
                          <td>{log.details || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Certificate Preview Modal */}
      {selectedCert && (
        <div className="modal-backdrop" onClick={() => setSelectedCert(null)}>
          <div
            className="modal-dialog"
            style={{ maxWidth: "800px", width: "92%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>Medical Certificate Preview</h3>
                <span className="text-muted text-sm">
                  {selectedCert.doctorName} • {selectedCert.filename}
                </span>
              </div>
              <button
                className="modal-close"
                onClick={() => setSelectedCert(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: "16px", maxHeight: "75vh", overflowY: "auto" }}>
              {selectedCert.type.includes("pdf") || selectedCert.filename.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={selectedCert.url}
                  title="Medical Certificate PDF"
                  style={{ width: "100%", height: "520px", border: "1px solid #CBD5E1", borderRadius: "8px" }}
                />
              ) : (
                <div style={{ textAlign: "center" }}>
                  <img
                    src={selectedCert.url}
                    alt="Doctor Medical Certificate"
                    style={{ maxWidth: "100%", maxHeight: "520px", objectFit: "contain", borderRadius: "8px", border: "1px solid #CBD5E1" }}
                  />
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <a
                  href={selectedCert.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-sm"
                  style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                >
                  <ExternalLink size={14} />
                  <span>Open in New Tab</span>
                </a>
                <a
                  href={selectedCert.url}
                  download={selectedCert.filename}
                  className="btn btn-primary btn-sm"
                  style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                >
                  <Download size={14} />
                  <span>Download Document</span>
                </a>
              </div>
              <button
                onClick={() => setSelectedCert(null)}
                className="btn btn-outline btn-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Verification Modal */}
      {rejectModalDoc && (
        <div className="modal-backdrop" onClick={() => setRejectModalDoc(null)}>
          <div
            className="modal-dialog"
            style={{ maxWidth: "520px", width: "90%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 style={{ margin: 0, color: "#DC2626" }}>Reject Doctor Verification</h3>
              <button
                className="modal-close"
                onClick={() => setRejectModalDoc(null)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleConfirmReject}>
              <div className="modal-body" style={{ padding: "16px" }}>
                <p style={{ marginTop: 0 }}>
                  You are rejecting the medical credentials for <strong>{rejectModalDoc.full_name}</strong> ({rejectModalDoc.specialty}).
                </p>
                <div className="form-group">
                  <label htmlFor="rejectionReason">
                    <strong>Specify Rejection Reason:</strong>
                  </label>
                  <textarea
                    id="rejectionReason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="E.g. Medical registration number not found on state council records, or certificate document is illegible."
                    rows={4}
                    required
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid #CBD5E1",
                      marginTop: "6px",
                      fontFamily: "inherit"
                    }}
                  />
                  <small className="text-muted" style={{ display: "block", marginTop: "4px" }}>
                    The doctor will be notified with this message and instructed to re-upload valid credentials.
                  </small>
                </div>
              </div>
              <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setRejectModalDoc(null)}
                  className="btn btn-outline btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReject}
                  className="btn btn-sm"
                  style={{ backgroundColor: "#DC2626", color: "#FFF", borderColor: "#DC2626" }}
                >
                  {submittingReject ? "Submitting..." : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

