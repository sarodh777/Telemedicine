import React, { useState, useEffect } from "react";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Volume2,
  VolumeX,
  CheckCircle2,
  Smartphone,
  Check,
  Zap,
  Activity,
  Gauge
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useNetwork } from "../context/NetworkContext";
import { getPendingCount, syncAllPendingData } from "../services/offlineStorage";
import { api } from "../services/api";

export const NetworkStatusBar = () => {
  const { t, lang, setLanguage, readAloud, isSpeaking } = useLanguage();
  const {
    isOnline,
    networkMode,
    effectiveType,
    latency,
    dataSaverMode,
    toggleDataSaverMode
  } = useNetwork();

  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState("");

  // PWA Prompt state
  const [installPrompt, setInstallPrompt] = useState(() => {
    return typeof window !== "undefined" ? window.deferredPWAInstallPrompt : null;
  });
  const [isStandalone, setIsStandalone] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    }
    return false;
  });

  const checkPending = async () => {
    const count = await getPendingCount();
    setPendingCount(count);
  };

  useEffect(() => {
    checkPending();
    const interval = setInterval(checkPending, 5000);

    // Initial check for globally captured prompt
    if (window.deferredPWAInstallPrompt && !installPrompt) {
      setInstallPrompt(window.deferredPWAInstallPrompt);
    }

    const handleOnline = async () => {
      setIsSyncing(true);
      const synced = await syncAllPendingData(api);
      setIsSyncing(false);
      await checkPending();
      if (synced > 0) {
        setSyncToast(t("syncSuccess"));
        setTimeout(() => setSyncToast(""), 4000);
      }
    };

    const handleOffline = () => {
      checkPending();
    };

    // Handler when native browser triggers beforeinstallprompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      window.deferredPWAInstallPrompt = e;
      setInstallPrompt(e);
      console.log("[PWA Component] Received native installation prompt event");
    };

    // Handler when custom HTML script dispatched pwa-prompt-available
    const handlePromptAvailable = () => {
      if (window.deferredPWAInstallPrompt) {
        setInstallPrompt(window.deferredPWAInstallPrompt);
      }
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setInstallPrompt(null);
      window.deferredPWAInstallPrompt = null;
      console.log("[PWA Component] App installed event triggered");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("pwa-prompt-available", handlePromptAvailable);
    window.addEventListener("pwa-app-installed", handleAppInstalled);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("pwa-prompt-available", handlePromptAvailable);
      window.removeEventListener("pwa-app-installed", handleAppInstalled);
    };
  }, [t, installPrompt]);

  const handleInstallPWA = async () => {
    const promptEvent = installPrompt || window.deferredPWAInstallPrompt;

    if (promptEvent) {
      console.log("[PWA] Prompting native installation dialog...");
      promptEvent.prompt();
      const choiceResult = await promptEvent.userChoice;
      console.log("[PWA] User choice outcome:", choiceResult.outcome);
      if (choiceResult.outcome === "accepted") {
        setInstallPrompt(null);
        window.deferredPWAInstallPrompt = null;
      }
    } else {
      alert(
        "📲 MICROSOFT EDGE INSTALLATION INSTRUCTIONS:\n\n" +
        "1. In Microsoft Edge, look at the right edge of the address bar at localhost:5173.\n" +
        "2. Click the 'App available. Install TeleCare' icon.\n" +
        "3. Alternatively, click Edge's 3-dot menu (⋮) -> 'Apps' -> 'Install this site as an app'."
      );
    }
  };

  const handleManualSync = async () => {
    if (!isOnline) {
      alert("Cannot synchronize while offline. Please connect to Wi-Fi or mobile data.");
      return;
    }
    setIsSyncing(true);
    const synced = await syncAllPendingData(api);
    setIsSyncing(false);
    await checkPending();
    setSyncToast(synced > 0 ? t("syncSuccess") : "All records are up to date.");
    setTimeout(() => setSyncToast(""), 4000);
  };

  const handleReadStatus = () => {
    const statusText = isOnline
      ? `${t("brandName")}. Network: ${networkMode} connectivity. Latency: ${latency || "optimal"} milliseconds. Data saver mode is ${dataSaverMode ? "Active" : "Off"}.`
      : `${t("brandName")}. Status: ${t("offlineStatus")}. You have ${pendingCount} ${t("syncPending")}.`;
    readAloud(statusText);
  };

  // Helper for network badge style and label
  const renderNetworkBadge = () => {
    if (!isOnline) {
      return (
        <span className="badge badge-offline" title="Offline Mode: Browsing local cached records">
          <WifiOff size={13} />
          <span>Offline (Cache Active)</span>
        </span>
      );
    }

    if (networkMode === "weak" || dataSaverMode) {
      return (
        <span
          className="badge"
          style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }}
          title="Weak connectivity or Data Saver active: Low-res previews & text prioritized"
        >
          <Activity size={13} />
          <span>
            {dataSaverMode ? "Data Saver" : "Low Bandwidth"} • {latency ? `${latency}ms` : effectiveType.toUpperCase()}
          </span>
        </span>
      );
    }

    if (networkMode === "medium") {
      return (
        <span
          className="badge"
          style={{ background: "#e0f2fe", color: "#0369a1", border: "1px solid #bae6fd" }}
          title="Medium connectivity: Adaptive compression enabled"
        >
          <Gauge size={13} />
          <span>3G / Moderate • {latency ? `${latency}ms` : "Balanced"}</span>
        </span>
      );
    }

    return (
      <span className="badge badge-online" title="Strong connectivity: High-speed full bandwidth">
        <Wifi size={13} className="icon-pulse" />
        <span>4G / Stable {latency ? `• ${latency}ms` : ""}</span>
      </span>
    );
  };

  return (
    <>
      <div className="network-status-bar">
        <div className="status-indicator-group">
          {renderNetworkBadge()}

          {/* Data Saver Mode Toggle Button */}
          <button
            onClick={toggleDataSaverMode}
            className={`btn-data-saver ${dataSaverMode ? "active" : ""}`}
            title="Toggle rural Data Saver Mode to minimize payload and preserve bandwidth"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "3px 8px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: "600",
              cursor: "pointer",
              border: dataSaverMode ? "1px solid #059669" : "1px solid #cbd5e1",
              background: dataSaverMode ? "#ecfdf5" : "#ffffff",
              color: dataSaverMode ? "#065f46" : "#475569"
            }}
          >
            <Zap size={12} color={dataSaverMode ? "#059669" : "#64748b"} />
            <span>Data Saver: {dataSaverMode ? "ON" : "OFF"}</span>
          </button>

          {pendingCount > 0 && (
            <span className="badge badge-pending">
              <RefreshCw size={12} className={isSyncing ? "spin" : ""} />
              <span>{pendingCount} {t("syncPending")}</span>
            </span>
          )}
        </div>

        <div className="status-actions-group">
          {/* Functional PWA Install Button */}
          {isStandalone ? (
            <span className="badge badge-online" title="TeleCare is running in standalone PWA app mode">
              <Check size={13} />
              <span>PWA Installed</span>
            </span>
          ) : (
            <button
              onClick={handleInstallPWA}
              className="btn-pwa-install"
              title="Install TeleCare as a native Desktop/Mobile App (PWA)"
            >
              <Smartphone size={13} />
              <span>Install App (PWA)</span>
            </button>
          )}

          {pendingCount > 0 && (
            <button
              onClick={handleManualSync}
              disabled={isSyncing || !isOnline}
              className="btn-sync-mini"
              title="Synchronize pending offline records"
            >
              <RefreshCw size={13} className={isSyncing ? "spin" : ""} />
              <span>{isSyncing ? "Syncing..." : t("syncNow")}</span>
            </button>
          )}

          {/* Voice Narration Button for Rural Accessibility */}
          <button
            onClick={handleReadStatus}
            className={`btn-audio-mini ${isSpeaking ? "active" : ""}`}
            title="Read out page information in audio"
          >
            {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
            <span>{isSpeaking ? t("stopAudio") : t("listenAudio")}</span>
          </button>

          {/* Language Selector Dropdown */}
          <div className="lang-switcher">
            <button
              className={`lang-btn ${lang === "en" ? "active" : ""}`}
              onClick={() => setLanguage("en")}
            >
              EN
            </button>
            <span className="lang-divider">|</span>
            <button
              className={`lang-btn ${lang === "hi" ? "active" : ""}`}
              onClick={() => setLanguage("hi")}
            >
              हिंदी
            </button>
          </div>
        </div>
      </div>

      {syncToast && (
        <div className="sync-toast-notification">
          <CheckCircle2 size={18} />
          <span>{syncToast}</span>
        </div>
      )}
    </>
  );
};
