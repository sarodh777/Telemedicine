import React, { useState, useEffect } from "react";
import { Search, Filter, Stethoscope, Calendar, Volume2, VolumeX, ShieldCheck, MapPin, CheckCircle } from "lucide-react";
import { api } from "../services/api";
import { cacheDoctors, getCachedDoctors } from "../services/offlineStorage";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export const DoctorDiscoveryPage = () => {
  const { t, readAloud, isSpeaking } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All");
  const [loading, setLoading] = useState(true);
  const [isOfflineData, setIsOfflineData] = useState(false);

  // Booking Modal State
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("10:30 AM");
  const [consultationType, setConsultationType] = useState("online");
  const [reason, setReason] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const specialties = [
    "All",
    "General Medicine",
    "Pediatrics & Child Health",
    "Cardiology",
    "Obstetrics & Maternal Health",
    "Dermatology"
  ];

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedSpecialty !== "All") params.specialty = selectedSpecialty;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await api.get("/api/doctors", { params });
      const docList = Array.isArray(res.data) ? res.data : [];
      setDoctors(docList);
      setIsOfflineData(false);
      // Cache doctors into IndexedDB for offline discovery
      cacheDoctors(docList);
    } catch (err) {
      console.warn("Falling back to IndexedDB cached doctors:", err);
      const cached = await getCachedDoctors();
      setDoctors(Array.isArray(cached) ? cached : []);
      setIsOfflineData(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [selectedSpecialty]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDoctors();
  };

  const handleReadDoctor = (doc) => {
    const text = `${doc?.full_name || "Doctor"}. Specialty: ${doc?.specialty || "General Medicine"}. Qualifications: ${doc?.qualifications || "MBBS"}. Experience: ${doc?.experience || "Experienced"}. Available hours: ${doc?.availability || "Regular hours"}. Consultation fee: ${doc?.consultation_fee || "Community Subsidized"}.`;
    readAloud(text);
  };

  const handleOpenBooking = (doc) => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (user.role !== "patient") {
      alert("Appointments can only be booked by patient accounts.");
      return;
    }
    if (doc.is_available === false) {
      alert("This doctor is currently unavailable for booking.");
      return;
    }
    setSelectedDoctor(doc);
    // Set default tomorrow date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setBookingDate(tomorrow.toISOString().split("T")[0]);
    setBookingSuccess(false);
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    const todayStr = new Date().toISOString().split("T")[0];
    if (bookingDate < todayStr) {
      alert("Please select a valid future date or today. Past dates are not allowed.");
      return;
    }

    setBookingLoading(true);
    try {
      await api.post("/api/patient/appointments", {
        doctor_id: selectedDoctor.id,
        appointment_date: bookingDate,
        appointment_time: bookingTime,
        consultation_type: consultationType,
        reason: reason.trim()
      });
      setBookingSuccess(true);
      setTimeout(() => {
        setSelectedDoctor(null);
        navigate("/patient/dashboard");
      }, 1800);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to book appointment slot.");
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="discovery-page">
      <div className="section-container">
        <div className="discovery-header">
          <h2>{t("doctorDirectory")}</h2>
          <p>Find and consult certified healthcare professionals serving rural communities</p>
          {isOfflineData && (
            <div className="offline-notice-banner">
              <span>Displaying cached doctor directory (Offline Mode)</span>
            </div>
          )}
        </div>

        {/* Search & Filter Bar */}
        <div className="search-filter-container">
          <form onSubmit={handleSearchSubmit} className="search-bar-form">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by doctor name or specialty..."
            />
            <button type="submit" className="btn btn-primary btn-sm">
              Search
            </button>
          </form>

          {/* Specialty Filter Chips */}
          <div className="specialty-chips">
            {specialties.map((spec) => (
              <button
                key={spec}
                className={`chip ${selectedSpecialty === spec ? "active" : ""}`}
                onClick={() => setSelectedSpecialty(spec)}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>

        {/* Doctors Grid */}
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading certified doctors...</p>
          </div>
        ) : (Array.isArray(doctors) ? doctors : []).length === 0 ? (
          <div className="empty-state">
            <Stethoscope size={48} color="#587493" />
            <h3>No doctors found</h3>
            <p>Try adjusting your search terms or clearing specialty filters.</p>
          </div>
        ) : (
          <div className="doctors-grid">
            {(Array.isArray(doctors) ? doctors : []).map((doc) => (
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
                    <span className="detail-value">{doc.qualifications}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Experience:</span>
                    <span className="detail-value">{doc.experience}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Clinic Hours:</span>
                    <span className="detail-value">{doc.availability}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Consultation Fee:</span>
                    <span className="detail-value fee">{doc.consultation_fee}</span>
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

                <div className="doc-card-footer">
                  {doc.is_available === false ? (
                    <button
                      disabled
                      className="btn btn-outline btn-block"
                      style={{ opacity: 0.6, cursor: "not-allowed" }}
                      title="This doctor is currently unavailable for booking."
                    >
                      <Calendar size={16} />
                      <span>Currently Unavailable</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenBooking(doc)}
                      className="btn btn-primary btn-block"
                    >
                      <Calendar size={16} />
                      <span>{t("bookAppointment")}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Appointment Booking Modal */}
      {selectedDoctor && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>Book Appointment with {selectedDoctor?.full_name || "Doctor"}</h3>
              <button className="modal-close" onClick={() => setSelectedDoctor(null)}>×</button>
            </div>
            {bookingSuccess ? (
              <div className="modal-body text-center py-4">
                <CheckCircle size={52} color="#10B981" className="mx-auto mb-3" />
                <h3>Appointment Request Submitted!</h3>
                <p>Redirecting to your patient dashboard...</p>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking} className="modal-body">
                <div className="form-group">
                  <label>Consultation Specialty</label>
                  <input type="text" readOnly value={selectedDoctor?.specialty || "General Medicine"} className="bg-light" />
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
                        name="consultationType"
                        value="online"
                        checked={consultationType === "online"}
                        onChange={() => setConsultationType("online")}
                      />
                      <span>Online / Low-Data Messaging</span>
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="consultationType"
                        value="in-person"
                        checked={consultationType === "in-person"}
                        onChange={() => setConsultationType("in-person")}
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
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Describe symptoms, duration, or reason for appointment..."
                  />
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setSelectedDoctor(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="btn btn-primary"
                  >
                    {bookingLoading ? "Submitting..." : "Confirm Booking"}
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

