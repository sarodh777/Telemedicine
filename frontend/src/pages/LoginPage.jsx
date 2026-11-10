import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, AlertCircle, CheckCircle2, ShieldCheck, Activity } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { api } from "../services/api";

export const LoginPage = () => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login(email, password);
      // Redirect securely according to user role from backend
      if (data.role === "admin") {
        navigate("/admin/dashboard");
      } else if (data.role === "doctor") {
        navigate("/doctor/dashboard");
      } else {
        navigate("/patient/dashboard");
      }
    } catch (err) {
      const msg = err.response?.data?.detail || "Invalid login credentials. Please check your email and password.";
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
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-badge">
            <Activity size={28} color="#102A4C" />
          </div>
          <h2>Log In to TeleCare</h2>
          <p>Access your healthcare services, consultations, and medical records</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <div className="label-with-link">
              <label htmlFor="password">Password</label>
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
                id="password"
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

          <button type="submit" disabled={loading} className="btn btn-primary btn-block btn-lg">
            {loading ? "Authenticating..." : "Log In"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account yet? <Link to="/signup">Register Here</Link>
          </p>
          <div className="admin-redirect-hint">
            <small>
              Are you an administrator? <Link to="/admin/login">Access Admin Panel</Link>
            </small>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>Reset Password (Development Mode)</h3>
              <button className="modal-close" onClick={() => setShowForgotModal(false)}>×</button>
            </div>
            <form onSubmit={handleResetPassword} className="modal-body">
              <p className="modal-sub">
                Enter your registered account email and set your new password directly:
              </p>
              {resetMessage && (
                <div className="alert alert-success">
                  <CheckCircle2 size={16} />
                  <span>{resetMessage}</span>
                </div>
              )}
              <div className="form-group">
                <label>Registered Email</label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@example.com"
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
                  placeholder="Enter new password"
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowForgotModal(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={resetLoading} className="btn btn-primary">
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
