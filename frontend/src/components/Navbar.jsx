import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, Menu, X, LogOut, LayoutDashboard, ShieldCheck, User as UserIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { NotificationBell } from "./NotificationBell";

export const Navbar = () => {
  const { user, role, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getDashboardPath = () => {
    if (role === "admin") return "/admin/dashboard";
    if (role === "doctor") return "/doctor/dashboard";
    return "/patient/dashboard";
  };

  const getDashboardLabel = () => {
    if (role === "admin") return "Admin Dashboard";
    if (role === "doctor") return "Doctor Dashboard";
    return "Patient Dashboard";
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    setMobileMenuOpen(false);
  };

  return (
    <header className="main-header">
      <div className="nav-container">
        {/* Left: TeleCare logo + name + Rural Health badge + College Branding */}
        <div className="nav-brand-group">
          <Link to="/" className="nav-brand" onClick={() => setMobileMenuOpen(false)}>
            <div className="brand-icon">
              <Activity size={22} color="#FFFFFF" />
            </div>
            <div className="brand-text-col">
              <div className="brand-title-row">
                <span className="brand-text">TeleCare</span>
                <span className="brand-tag">Rural Health</span>
              </div>
              <span className="brand-college-tag">Karavali Institute of Technology</span>
            </div>
          </Link>
        </div>

        {/* Center: Navigation Links */}
        <nav className="nav-links desktop-only">
          {!user ? (
            // Public Navigation Links (Only shown when not logged in)
            <>
              <Link to="/" className="nav-link">{t("navHome")}</Link>
              <a href="/#features" className="nav-link">{t("navFeatures")}</a>
              <a href="/#how-it-works" className="nav-link">{t("navHowItWorks")}</a>
              <Link to="/doctors" className="nav-link">{t("navFindDoctor")}</Link>
            </>
          ) : (
            // Authenticated Role Navigation Links
            <>
              <Link to={getDashboardPath()} className="nav-link active" style={{ fontWeight: "700" }}>
                {getDashboardLabel()}
              </Link>
              {role === "patient" && (
                <Link to="/doctors" className="nav-link">
                  {t("navFindDoctor") || "Find Doctors"}
                </Link>
              )}
              <Link to={`${getDashboardPath()}?tab=profile`} className="nav-link">
                Profile
              </Link>
            </>
          )}
        </nav>

        {/* Right: Auth Buttons / Authenticated User Controls */}
        <div className="nav-auth desktop-only">
          {user ? (
            <div className="auth-user-menu" style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              {/* Notification Bell Component */}
              <NotificationBell />

              <Link to={getDashboardPath()} className="btn btn-primary btn-sm">
                <LayoutDashboard size={15} />
                <span>{getDashboardLabel()}</span>
              </Link>
              <button onClick={handleLogout} className="btn btn-outline btn-sm">
                <LogOut size={15} />
                <span>{t("navLogout")}</span>
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-text">
                {t("navLogin")}
              </Link>
              <Link to="/signup" className="btn btn-primary btn-sm">
                {t("navGetStarted")}
              </Link>
              <Link to="/admin/login" className="btn btn-admin-panel btn-sm" title="Dedicated Admin Portal">
                <ShieldCheck size={15} />
                <span>Admin Panel</span>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle Button */}
        <button
          className="mobile-toggle mobile-only"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer mobile-only">
          {!user ? (
            <>
              <Link to="/" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                {t("navHome")}
              </Link>
              <a href="/#features" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                {t("navFeatures")}
              </a>
              <a href="/#how-it-works" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                {t("navHowItWorks")}
              </a>
              <Link to="/doctors" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
                {t("navFindDoctor")}
              </Link>

              <div className="mobile-divider"></div>

              <div className="mobile-auth-stack">
                <Link to="/login" className="btn btn-outline btn-block mb-2" onClick={() => setMobileMenuOpen(false)}>
                  {t("navLogin")}
                </Link>
                <Link to="/signup" className="btn btn-primary btn-block mb-2" onClick={() => setMobileMenuOpen(false)}>
                  {t("navGetStarted")}
                </Link>
                <Link to="/admin/login" className="btn btn-admin-panel btn-block" onClick={() => setMobileMenuOpen(false)}>
                  <ShieldCheck size={16} />
                  <span>Admin Panel</span>
                </Link>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", padding: "0 8px" }}>
                <div>
                  <strong style={{ fontSize: "14px", color: "var(--primary-navy)" }}>{user.full_name}</strong>
                  <div style={{ fontSize: "12px", color: "var(--secondary-blue)", textTransform: "capitalize" }}>{user.role} Account</div>
                </div>
                <NotificationBell />
              </div>

              <Link to={getDashboardPath()} className="btn btn-primary btn-block mb-2" onClick={() => setMobileMenuOpen(false)}>
                <LayoutDashboard size={16} />
                <span>{getDashboardLabel()}</span>
              </Link>
              {role === "patient" && (
                <Link to="/doctors" className="btn btn-outline btn-block mb-2" onClick={() => setMobileMenuOpen(false)}>
                  <Activity size={16} />
                  <span>{t("navFindDoctor") || "Find Doctors"}</span>
                </Link>
              )}
              <Link to={`${getDashboardPath()}?tab=profile`} className="btn btn-outline btn-block mb-2" onClick={() => setMobileMenuOpen(false)}>
                <UserIcon size={16} />
                <span>Profile</span>
              </Link>
              <button onClick={handleLogout} className="btn btn-outline btn-block">
                <LogOut size={16} />
                <span>{t("navLogout")}</span>
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
};
