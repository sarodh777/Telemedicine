import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("telecare_token"));
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("telecare_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      if (token) {
        try {
          const res = await api.get("/api/auth/me");
          setUser(res.data);
          localStorage.setItem("telecare_user", JSON.stringify(res.data));
        } catch (err) {
          console.warn("Failed to fetch user session:", err);
          if (err.response && err.response.status === 401) {
            logout();
          }
        }
      }
      setLoading(false);
    };
    fetchMe();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post("/api/auth/login", { email, password });
    const { access_token, role, user_id, full_name, verification_status, rejection_reason, is_available } = res.data;
    localStorage.setItem("telecare_token", access_token);
    setToken(access_token);

    const userObj = {
      id: user_id,
      email,
      full_name,
      role,
      verification_status: verification_status || "approved",
      rejection_reason,
      is_available: is_available !== undefined ? is_available : true
    };
    setUser(userObj);
    localStorage.setItem("telecare_user", JSON.stringify(userObj));
    return res.data;
  };

  const signup = async (formData) => {
    const res = await api.post("/api/auth/signup", formData);
    const { access_token, role, user_id, full_name, verification_status } = res.data;
    localStorage.setItem("telecare_token", access_token);
    setToken(access_token);

    const userObj = {
      id: user_id,
      email: formData.email,
      full_name,
      role,
      verification_status: verification_status || (role === "doctor" ? "pending" : "approved")
    };
    setUser(userObj);
    localStorage.setItem("telecare_user", JSON.stringify(userObj));
    return res.data;
  };

  const registerDoctor = async (formData) => {
    const res = await api.post("/api/auth/register-doctor", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    const { access_token, role, user_id, full_name, verification_status } = res.data;
    localStorage.setItem("telecare_token", access_token);
    setToken(access_token);

    const userObj = {
      id: user_id,
      email: formData.get("email"),
      full_name,
      role: "doctor",
      verification_status: verification_status || "pending"
    };
    setUser(userObj);
    localStorage.setItem("telecare_user", JSON.stringify(userObj));
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("telecare_token");
    localStorage.removeItem("telecare_user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, role: user?.role, loading, login, signup, registerDoctor, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

