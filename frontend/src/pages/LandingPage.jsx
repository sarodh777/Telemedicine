import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  WifiOff,
  FileText,
  MessageSquare,
  Calendar,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  PhoneCall,
  Volume2,
  VolumeX,
  Search,
  Sparkles,
  Award,
  GraduationCap,
  MapPin
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { api } from "../services/api";

export const LandingPage = () => {
  const { t, readAloud, isSpeaking } = useLanguage();
  const [featuredDoctors, setFeaturedDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await api.get("/api/doctors");
        setFeaturedDoctors(Array.isArray(res.data) ? res.data.slice(0, 3) : []);
      } catch (err) {
        console.warn("Could not fetch featured doctors:", err);
        setFeaturedDoctors([]);
      } finally {
        setLoadingDoctors(false);
      }
    };
    fetchDoctors();
  }, []);

  const handleReadHero = () => {
    const speech = `TeleCare Rural Healthcare Platform. Developed for AIORA Hackathon 2026 by Karavali Institute of Technology, Department of Computer Science and Engineering, Mangaluru. Healthcare Access, Wherever You Are. TeleCare is a lightweight telemedicine platform designed to connect rural communities with healthcare professionals, even in areas with limited internet connectivity.`;
    readAloud(speech);
  };

  return (
    <div className="landing-page">
      {/* College & Hackathon Banner Strip */}
      <div className="institution-strip">
        <div className="section-container institution-strip-inner">
          <div className="strip-item">
            <Award size={15} className="strip-icon" />
            <span>AIORA HACKATHON 2026</span>
          </div>
          <span className="strip-sep">•</span>
          <div className="strip-item">
            <GraduationCap size={15} className="strip-icon" />
            <strong className="college-highlight">KARAVALI INSTITUTE OF TECHNOLOGY</strong>
          </div>
          <span className="strip-sep">•</span>
          <div className="strip-item">
            <span>Department of Computer Science and Engineering</span>
          </div>
          <span className="strip-sep">•</span>
          <div className="strip-item">
            <MapPin size={14} className="strip-icon" />
            <span>Neerumarga, Mangaluru, Karnataka</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            {/* Hackathon Event & College Badge */}
            <div className="hero-event-badge">
              <span className="badge-pill-event">AIORA HACKATHON 2026</span>
              <span className="badge-pill-college">KARAVALI INSTITUTE OF TECHNOLOGY</span>
            </div>

            <div className="dept-tagline">
              <span>Department of Computer Science and Engineering • Mangaluru, Karnataka</span>
            </div>

            <h1 className="hero-title">Healthcare Access, Wherever You Are.</h1>

            <p className="hero-description">
              TeleCare is a lightweight telemedicine platform designed to connect rural communities with healthcare professionals, even in areas with limited internet connectivity.
            </p>

            <div className="hero-actions">
              <Link to="/signup" className="btn btn-primary btn-lg">
                <span>Get Started</span>
                <ArrowRight size={18} />
              </Link>
              <Link to="/doctors" className="btn btn-outline btn-lg">
                <Search size={18} />
                <span>Find Doctors</span>
              </Link>

              {/* Voice Accessibility Trigger */}
              <button
                onClick={handleReadHero}
                className={`btn btn-secondary-pill ${isSpeaking ? "speaking" : ""}`}
                title="Listen to this introduction"
              >
                {isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
                <span>{isSpeaking ? t("stopAudio") : t("listenAudio")}</span>
              </button>
            </div>

            {/* Small event note */}
            <div className="event-meta-badge">
              <Sparkles size={14} color="#10B981" />
              <span>Developed for AIORA Hackathon • Project: TeleCare</span>
            </div>

            <div className="hero-trust-metrics">
              <div className="trust-item">
                <strong>100%</strong>
                <span>Offline Capable PWA</span>
              </div>
              <div className="trust-divider"></div>
              <div className="trust-item">
                <strong>70%</strong>
                <span>Data Reduction (Pillow Compression)</span>
              </div>
              <div className="trust-divider"></div>
              <div className="trust-item">
                <strong>Verified</strong>
                <span>Certified Doctors</span>
              </div>
            </div>
          </div>
        
        

          <div className="hero-card-preview">
            <div className="rural-preview-card">
              <div className="preview-header">
                <div className="status-dot online"></div>
                <span>TeleCare Low-Data Protocol</span>
                <span className="preview-institution-tag">KIT CSE</span>
              </div>
              <div className="preview-body">
                <div className="preview-doctor-banner">
                  <div className="doc-avatar">RS</div>
                  <div>
                    <h4>Dr. Rajesh Sharma</h4>
                    <p>General Medicine (MBBS, MD)</p>
                  </div>
                </div>
                <div className="preview-offline-badge">
                  <WifiOff size={14} />
                  <span>Prescription & Lab Reports saved for Offline View</span>
                </div>
                <div className="preview-chat-bubble">
                  <p>"Take Amlodipine 5mg once daily after breakfast. Rest well."</p>
                  <small>Delivered & Cached Locally</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">{t("featuresTitle")}</h2>
            <p className="section-subtitle">{t("featuresSub")}</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon icon-navy">
                <WifiOff size={24} />
              </div>
              <h3 className="feature-card-title">{t("f1Title")}</h3>
              <p className="feature-card-desc">{t("f1Desc")}</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon icon-blue">
                <FileText size={24} />
              </div>
              <h3 className="feature-card-title">{t("f2Title")}</h3>
              <p className="feature-card-desc">{t("f2Desc")}</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon icon-navy">
                <Calendar size={24} />
              </div>
              <h3 className="feature-card-title">{t("f3Title")}</h3>
              <p className="feature-card-desc">{t("f3Desc")}</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon icon-blue">
                <MessageSquare size={24} />
              </div>
              <h3 className="feature-card-title">{t("f4Title")}</h3>
              <p className="feature-card-desc">{t("f4Desc")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="how-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">{t("howTitle")}</h2>
            <p className="section-subtitle">A simple 4-step healthcare process for rural patients and families</p>
          </div>

          <div className="how-steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h4>{t("howStep1")}</h4>
              <p>{t("howStep1Desc")}</p>
            </div>

            <div className="step-card">
              <div className="step-number">2</div>
              <h4>{t("howStep2")}</h4>
              <p>{t("howStep2Desc")}</p>
            </div>

            <div className="step-card">
              <div className="step-number">3</div>
              <h4>{t("howStep3")}</h4>
              <p>{t("howStep3Desc")}</p>
            </div>

            <div className="step-card">
              <div className="step-number">4</div>
              <h4>{t("howStep4")}</h4>
              <p>{t("howStep4Desc")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Doctors Preview */}
      <section className="doctors-preview-section">
        <div className="section-container">
          <div className="section-header-inline">
            <div>
              <h2 className="section-title">{t("doctorDirectory")}</h2>
              <p className="section-subtitle">Certified medical professionals ready for remote consultation</p>
            </div>
            <Link to="/doctors" className="btn btn-outline btn-sm">
              <span>View All Doctors</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {loadingDoctors ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading certified doctors...</p>
            </div>
          ) : (
            <div className="doctors-grid">
              {(Array.isArray(featuredDoctors) ? featuredDoctors : []).map((doc) => (
                <div key={doc.id} className="doctor-card">
                  <div className="doc-card-header">
                    <div className="doc-avatar large">
                      {(doc?.full_name || "Doctor").replace("Dr. ", "").substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="doc-name">{doc?.full_name || "Doctor"}</h4>
                      <span className="doc-specialty-badge">{doc?.specialty || "General Medicine"}</span>
                    </div>
                  </div>
                  <div className="doc-card-details">
                    <p><strong>Qualifications:</strong> {doc?.qualifications || "MBBS"}</p>
                    <p><strong>Experience:</strong> {doc?.experience || "Experienced"}</p>
                    <p><strong>Availability:</strong> {doc?.availability || "Available"}</p>
                  </div>
                  <div className="doc-card-footer">
                    <Link to="/login" className="btn btn-primary btn-block btn-sm">
                      {t("bookAppointment")}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Rural Helpline Callout */}
      <section className="helpline-callout">
        <div className="section-container">
          <div className="callout-card">
            <div className="callout-icon">
              <PhoneCall size={32} color="#FFFFFF" />
            </div>
            <div className="callout-text">
              <h3>Need urgent medical assistance or have no internet?</h3>
              <p>Call our 24/7 Rural Telemedicine Toll-Free Helpline: <strong>1800-419-CARE</strong></p>
            </div>
            <div className="callout-action">
              <Link to="/signup" className="btn btn-light btn-lg">
                Create Free Account
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
