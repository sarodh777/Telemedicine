import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Lock, Mail, Eye, EyeOff, AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

export const AdminLoginPage = () => {
  const { login, logout } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login(email, password);

      // Verify that the authenticated account has administrator privileges
      if (data.role !== "admin") {
        // Clear token immediately if a non-admin logs in through admin portal
        logout();
        setError("Access denied. Administrator privileges are required.");
        return;
      }

      // Successful verified administrator login
      navigate("/admin/dashboard");
    } catch (err) {
      const msg = err.response?.data?.detail || "Invalid administrative credentials. Please verify your email and password.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMessage("");
    try {
      const res = await api.post("/api/auth/reset-password", {
        email: forgotEmail,
        new_password: newPassword
      });
      setResetMessage(res.data.message);
      setTimeout(() => {
        setShowForgotModal(false);
        setPassword(newPassword);
        setEmail(forgotEmail);
      }, 1800);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to reset password.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="auth-page admin-auth-page">
      <div className="auth-card admin-card">
        {/* Back to TeleCare link */}
        <div className="admin-back-link">
          <Link to="/" className="back-link">
            <ArrowLeft size={16} />
            <span>Back to TeleCare</span>
          </Link>
        </div>

        <div className="auth-header admin-header">
          <div className="admin-shield-badge">
            <ShieldCheck size={32} color="#FFFFFF" />
          </div>
          <h2>TeleCare Administration</h2>
          <p className="admin-subtitle">Secure administrative access</p>

          <div className="admin-security-indicator">
            <span className="security-pulse"></span>
            <span>Restricted Access • Authorized System Administrators Only</span>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAdminSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="adminEmail">Admin Email</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                id="adminEmail"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@telecare.org"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <div className="label-with-link">
              <label htmlFor="adminPassword">Password</label>
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  setForgotEmail(email);
                  setShowForgotModal(true);
                }}
              >
                Forgot Password?
              </button>
            </div>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="adminPassword"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
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

          <button type="submit" disabled={loading} className="btn btn-admin-panel btn-block btn-lg mt-3">
            <ShieldCheck size={18} />
            <span>{loading ? "Authenticating Admin..." : "Admin Login"}</span>
          </button>
        </form>

        <div className="admin-auth-footer">
          <p className="footer-warning">
            All administrative actions, verification decisions, and access attempts are logged under security audit protocols.
          </p>
          <div className="patient-doctor-hint">
            <span>Are you a patient or doctor? </span>
            <Link to="/login">Go to Standard Portal</Link>
          </div>
        </div>
      </div>

      {/* Development Mode Password Reset Modal */}
      {showForgotModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>Admin Password Recovery (Development Mode)</h3>
              <button className="modal-close" onClick={() => setShowForgotModal(false)}>×</button>
            </div>
            <form onSubmit={handleResetPassword} className="modal-body">
              <p className="modal-sub">
                Enter your registered administrator email and set your new password directly:
              </p>
              {resetMessage && (
                <div className="alert alert-success">
                  <CheckCircle2 size={16} />
                  <span>{resetMessage}</span>
                </div>
              )}
              <div className="form-group">
                <label>Admin Email</label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="admin@telecare.org"
                />
              </div>
              <div className="form-group">
                <label>New Password (min 6 characters)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new admin password"
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowForgotModal(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={resetLoading} className="btn btn-admin-panel">
                  {resetLoading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

