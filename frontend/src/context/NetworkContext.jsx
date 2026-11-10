import React, { createContext, useContext, useState, useEffect } from "react";

const NetworkContext = createContext(null);

export const NetworkProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [latency, setLatency] = useState(null);
  const [dataSaverMode, setDataSaverMode] = useState(() => {
    return localStorage.getItem("telecare_data_saver") === "true";
  });
  const [effectiveType, setEffectiveType] = useState(() => {
    if (navigator.connection && navigator.connection.effectiveType) {
      return navigator.connection.effectiveType;
    }
    return "4g";
  });

  // Toggle Data Saver Mode
  const toggleDataSaverMode = () => {
    setDataSaverMode((prev) => {
      const next = !prev;
      localStorage.setItem("telecare_data_saver", String(next));
      return next;
    });
  };

  // Listen to browser online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Network Information API listener
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const handleConnChange = () => {
      if (conn && conn.effectiveType) {
        setEffectiveType(conn.effectiveType);
      }
    };

    if (conn) {
      conn.addEventListener("change", handleConnChange);
    }

    // Custom event listener for measured API latency from axios interceptor
    const handleLatencyReport = (e) => {
      if (e.detail && typeof e.detail.latency === "number") {
        setLatency(Math.round(e.detail.latency));
      }
    };
    window.addEventListener("telecare_network_latency", handleLatencyReport);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (conn) {
        conn.removeEventListener("change", handleConnChange);
      }
      window.removeEventListener("telecare_network_latency", handleLatencyReport);
    };
  }, []);

  // Compute adaptive network mode: 'offline' | 'weak' | 'medium' | 'strong'
  let networkMode = "strong";
  if (!isOnline) {
    networkMode = "offline";
  } else if (dataSaverMode) {
    networkMode = "weak"; // Data saver enforces conservative low-data mode
  } else if (effectiveType === "slow-2g" || effectiveType === "2g" || (latency && latency > 1200)) {
    networkMode = "weak";
  } else if (effectiveType === "3g" || (latency && latency >= 400 && latency <= 1200)) {
    networkMode = "medium";
  } else {
    networkMode = "strong";
  }

  return (
    <NetworkContext.Provider
      value={{
        isOnline,
        networkMode,
        effectiveType,
        latency,
        dataSaverMode,
        setDataSaverMode,
        toggleDataSaverMode
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
};

