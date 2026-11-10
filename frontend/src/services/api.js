import axios from "axios";

// Automatically use the host IP so mobile phones connected via Wi-Fi can reach the backend
const backendHost = window.location.hostname || "localhost";
export const API_BASE_URL = `http://${backendHost}:8000`;

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15s timeout for low rural bandwidth
});

// Request interceptor to attach JWT bearer token & start timestamp
api.interceptors.request.use(
  (config) => {
    config.metadata = { startTime: new Date().getTime() };
    const token = localStorage.getItem("telecare_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to record latency and handle errors
api.interceptors.response.use(
  (response) => {
    if (response.config && response.config.metadata) {
      const latency = new Date().getTime() - response.config.metadata.startTime;
      window.dispatchEvent(
        new CustomEvent("telecare_network_latency", {
          detail: { latency, url: response.config.url }
        })
      );
    }
    return response;
  },
  (error) => {
    if (error.config && error.config.metadata) {
      const latency = new Date().getTime() - error.config.metadata.startTime;
      window.dispatchEvent(
        new CustomEvent("telecare_network_latency", {
          detail: { latency, url: error.config.url, error: true }
        })
      );
    }
    if (error.response && error.response.status === 401) {
      // Clear token if expired
      localStorage.removeItem("telecare_token");
      localStorage.removeItem("telecare_user");
    }
    return Promise.reject(error);
  }
);

export const getFileUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
};
