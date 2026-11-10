import React from "react";
import { Activity, ShieldCheck, Heart, MapPin, Phone, Mail } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="main-footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Brand Info */}
          <div className="footer-col">
            <div className="footer-brand">
              <div className="brand-icon small">
                <Activity size={18} color="#FFFFFF" />
              </div>
              <span className="brand-text">TeleCare</span>
            </div>
            <p className="footer-desc">
              Empowering rural communities with accessible, lightweight, and offline-capable digital healthcare services.
            </p>
            <div className="footer-badge">
              <ShieldCheck size={16} />
              <span>Low-Data & Offline Certified PWA</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4 className="footer-title">Platform</h4>
            <ul className="footer-links">
              <li><a href="#features">{t("navFeatures")}</a></li>
              <li><a href="#how-it-works">{t("navHowItWorks")}</a></li>
              <li><a href="/doctors">{t("navFindDoctor")}</a></li>
              <li><a href="/login">{t("navLogin")}</a></li>
            </ul>
          </div>

          {/* College & Event Attribution */}
          <div className="footer-col">
            <h4 className="footer-title">Academic & Event</h4>
            <ul className="footer-links">
              <li><strong>Karavali Institute of Technology</strong></li>
              <li>Dept. of Computer Science & Engineering</li>
              <li>Neerumarga, Mangaluru, Karnataka</li>
              <li><span className="badge badge-online">AIORA Hackathon 2026</span></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="footer-col">
            <h4 className="footer-title">Contact & Support</h4>
            <ul className="footer-contact-list">
              <li>
                <Phone size={15} />
                <span>Toll-Free Helpline: 1800-419-CARE</span>
              </li>
              <li>
                <Mail size={15} />
                <span>support@telecare.org</span>
              </li>
              <li>
                <MapPin size={15} />
                <span>Neerumarga, Mangaluru, Karnataka</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} TeleCare • Karavali Institute of Technology (Dept of CSE, Mangaluru) • AIORA Hackathon 2026</p>
          <p className="footer-heart">
            Designed for rural healthcare with <Heart size={14} color="#EF4444" fill="#EF4444" />
          </p>
        </div>
      </div>
    </footer>
  );
};

