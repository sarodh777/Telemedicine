import React, { useState, useEffect, useRef } from "react";
import { Bell, Check, CheckCheck, Clock } from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

export const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get("/api/notifications");
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch (err) {
      // Graceful offline fallback
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 12000);
    return () => clearInterval(interval);
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (notifId, e) => {
    e.stopPropagation();
    try {
      await api.put(`/api/notifications/${notifId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, read_status: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.warn("Failed to mark notification as read", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put("/api/notifications/read-all/mark");
      setNotifications((prev) => prev.map((n) => ({ ...n, read_status: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn("Failed to mark all as read", err);
    }
  };

  if (!user) return null;

  return (
    <div className="notification-bell-wrapper" ref={dropdownRef} style={{ position: "relative" }}>
      <button
        type="button"
        className="nav-icon-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="View notifications"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "6px",
          color: "#102A4C"
        }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span
            className="notif-badge-pill"
            style={{
              position: "absolute",
              top: "-2px",
              right: "-2px",
              background: "#ef4444",
              color: "#ffffff",
              fontSize: "10px",
              fontWeight: "700",
              minWidth: "16px",
              height: "16px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 3px",
              boxShadow: "0 0 0 2px #ffffff"
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="notification-dropdown-menu"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            width: "320px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            boxShadow: "0 10px 25px -5px rgba(16, 42, 76, 0.15)",
            zIndex: 1050,
            overflow: "hidden"
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              background: "#F4F6F9",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <strong style={{ fontSize: "13px", color: "#102A4C" }}>
              Notifications ({unreadCount} new)
            </strong>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                style={{
                  background: "none",
                  border: "none",
                  color: "#2563eb",
                  fontSize: "11px",
                  cursor: "pointer",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "3px"
                }}
              >
                <CheckCheck size={13} />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div style={{ maxHeight: "300px", overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "24px 16px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
                No notifications right now.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: "12px 14px",
                    borderBottom: "1px solid #f1f5f9",
                    background: n.read_status ? "#ffffff" : "#f8fafc",
                    borderLeft: n.read_status ? "none" : "3px solid #2563eb",
                    cursor: "pointer"
                  }}
                  onClick={(e) => !n.read_status && handleMarkAsRead(n.id, e)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <strong style={{ fontSize: "12px", color: "#102A4C" }}>{n.title}</strong>
                    {!n.read_status && (
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: "#2563eb",
                          display: "inline-block",
                          marginTop: "4px"
                        }}
                      />
                    )}
                  </div>
                  <p style={{ margin: "4px 0 6px", fontSize: "11px", color: "#475569", lineHeight: "1.4" }}>
                    {n.message}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "#94a3b8" }}>
                    <Clock size={11} />
                    <span>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull; {new Date(n.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

