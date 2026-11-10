// TeleCare Offline Storage using IndexedDB

const DB_NAME = "telecare_offline_db";
const DB_VERSION = 2;

export const openDB = () => {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      return reject(new Error("IndexedDB not supported in this browser"));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("cachedReports")) {
        db.createObjectStore("cachedReports", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("cachedAppointments")) {
        db.createObjectStore("cachedAppointments", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("cachedDoctors")) {
        db.createObjectStore("cachedDoctors", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("cachedHistory")) {
        db.createObjectStore("cachedHistory", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("cachedPrescriptions")) {
        db.createObjectStore("cachedPrescriptions", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("pendingMessages")) {
        db.createObjectStore("pendingMessages", { keyPath: "client_msg_id" });
      }
      if (!db.objectStoreNames.contains("pendingAppointments")) {
        db.createObjectStore("pendingAppointments", { keyPath: "local_id", autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const performTransaction = async (storeName, mode, callback) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const req = callback(store);

    tx.oncomplete = () => resolve(req ? req.result : true);
    tx.onerror = () => reject(tx.error);
  });
};

// --- CACHING METHODS ---

export const cacheDoctors = async (doctors) => {
  if (!Array.isArray(doctors)) return;
  try {
    const db = await openDB();
    const tx = db.transaction("cachedDoctors", "readwrite");
    const store = tx.objectStore("cachedDoctors");
    store.clear();
    doctors.forEach((d) => store.put(d));
  } catch (err) {
    console.warn("Failed to cache doctors in IndexedDB:", err);
  }
};

export const getCachedDoctors = async () => {
  try {
    return await performTransaction("cachedDoctors", "readonly", (store) => store.getAll());
  } catch {
    return [];
  }
};

export const cacheAppointments = async (appointments) => {
  if (!Array.isArray(appointments)) return;
  try {
    const db = await openDB();
    const tx = db.transaction("cachedAppointments", "readwrite");
    const store = tx.objectStore("cachedAppointments");
    store.clear();
    appointments.forEach((a) => store.put(a));
  } catch (err) {
    console.warn("Failed to cache appointments in IndexedDB:", err);
  }
};

export const getCachedAppointments = async () => {
  try {
    return await performTransaction("cachedAppointments", "readonly", (store) => store.getAll());
  } catch {
    return [];
  }
};

export const cacheReports = async (reports) => {
  if (!Array.isArray(reports)) return;
  try {
    const db = await openDB();
    const tx = db.transaction("cachedReports", "readwrite");
    const store = tx.objectStore("cachedReports");
    store.clear();
    reports.forEach((r) => store.put(r));
  } catch (err) {
    console.warn("Failed to cache reports in IndexedDB:", err);
  }
};

export const getCachedReports = async () => {
  try {
    return await performTransaction("cachedReports", "readonly", (store) => store.getAll());
  } catch {
    return [];
  }
};

export const cacheHistory = async (records) => {
  if (!Array.isArray(records)) return;
  try {
    const db = await openDB();
    const tx = db.transaction("cachedHistory", "readwrite");
    const store = tx.objectStore("cachedHistory");
    store.clear();
    records.forEach((rec) => store.put(rec));
  } catch (err) {
    console.warn("Failed to cache medical history:", err);
  }
};

export const getCachedHistory = async () => {
  try {
    return await performTransaction("cachedHistory", "readonly", (store) => store.getAll());
  } catch {
    return [];
  }
};

export const cachePrescriptions = async (prescriptions) => {
  try {
    const db = await openDB();
    const tx = db.transaction("cachedPrescriptions", "readwrite");
    const store = tx.objectStore("cachedPrescriptions");
    store.clear();
    prescriptions.forEach((rx) => store.put(rx));
  } catch (err) {
    console.warn("Failed to cache prescriptions:", err);
  }
};

export const getCachedPrescriptions = async () => {
  try {
    return await performTransaction("cachedPrescriptions", "readonly", (store) => store.getAll());
  } catch {
    return [];
  }
};

// --- OFFLINE QUEUEING ---

export const queueOfflineMessage = async (msg) => {
  const item = {
    ...msg,
    client_msg_id: msg.client_msg_id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    created_at: new Date().toISOString(),
    is_pending_sync: true,
    delivery_status: "pending_sync"
  };
  await performTransaction("pendingMessages", "readwrite", (store) => store.put(item));
  return item;
};

export const getPendingMessages = async () => {
  try {
    return await performTransaction("pendingMessages", "readonly", (store) => store.getAll());
  } catch {
    return [];
  }
};

export const clearPendingMessage = async (clientMsgId) => {
  return performTransaction("pendingMessages", "readwrite", (store) => store.delete(clientMsgId));
};

export const queueOfflineAppointment = async (appt) => {
  const item = {
    ...appt,
    created_at: new Date().toISOString(),
    status: "pending_sync",
    is_pending_sync: true
  };
  await performTransaction("pendingAppointments", "readwrite", (store) => store.add(item));
  return item;
};

export const getPendingAppointments = async () => {
  try {
    return await performTransaction("pendingAppointments", "readonly", (store) => store.getAll());
  } catch {
    return [];
  }
};

export const clearPendingAppointment = async (localId) => {
  return performTransaction("pendingAppointments", "readwrite", (store) => store.delete(localId));
};

export const getPendingCount = async () => {
  try {
    const msgs = await getPendingMessages();
    const appts = await getPendingAppointments();
    return msgs.length + appts.length;
  } catch {
    return 0;
  }
};

// --- AUTOMATIC SYNCHRONIZATION ---

export const syncAllPendingData = async (apiClient) => {
  let syncedItemsCount = 0;

  // 1. Sync pending messages
  try {
    const pendingMsgs = await getPendingMessages();
    if (pendingMsgs.length > 0) {
      const payload = {
        messages: pendingMsgs.map((m) => ({
          receiver_id: m.receiver_id,
          message_content: m.message_content,
          client_msg_id: m.client_msg_id
        }))
      };
      await apiClient.post("/api/messages/sync", payload);
      for (const m of pendingMsgs) {
        await clearPendingMessage(m.client_msg_id);
      }
      syncedItemsCount += pendingMsgs.length;
    }
  } catch (err) {
    console.warn("Message sync paused or failed:", err);
  }

  // 2. Sync pending appointment bookings
  try {
    const pendingAppts = await getPendingAppointments();
    for (const appt of pendingAppts) {
      await apiClient.post("/api/patient/appointments", {
        doctor_id: appt.doctor_id,
        appointment_date: appt.appointment_date,
        appointment_time: appt.appointment_time,
        consultation_type: appt.consultation_type || "online",
        reason: appt.reason
      });
      await clearPendingAppointment(appt.local_id);
      syncedItemsCount++;
    }
  } catch (err) {
    console.warn("Appointment sync paused or failed:", err);
  }

  return syncedItemsCount;
};

