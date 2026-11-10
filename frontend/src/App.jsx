import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { NetworkProvider } from "./context/NetworkContext";
import { NetworkStatusBar } from "./components/NetworkStatusBar";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { ProtectedRoute } from "./components/ProtectedRoute";

import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { SignupPage } from "./pages/SignupPage";
import { DoctorDiscoveryPage } from "./pages/DoctorDiscoveryPage";
import { PatientDashboard } from "./pages/PatientDashboard";
import { DoctorDashboard } from "./pages/DoctorDashboard";
import { AdminDashboard } from "./pages/AdminDashboard";

function App() {
  return (
    <NetworkProvider>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <div className="app-root">
              {/* Top Network Connectivity & Low-Data Sync Status Bar */}
              <NetworkStatusBar />

              {/* Main Navigation Header */}
              <Navbar />

              {/* Application Routes */}
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/doctors" element={<DoctorDiscoveryPage />} />

                {/* Protected Role-Based Dashboards */}
                <Route
                  path="/patient/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={["patient"]}>
                      <PatientDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/doctor/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={["doctor"]}>
                      <DoctorDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>

              {/* Main Footer */}
              <Footer />
            </div>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </NetworkProvider>
  );
}

export default App;
