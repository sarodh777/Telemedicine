# TeleCare — Lightweight Telemedicine Platform for Rural Communities

> **AIORA HACKATHON 2026**  
> **KARAVALI INSTITUTE OF TECHNOLOGY**  
> Department of Computer Science and Engineering • Neerumarga, Mangaluru, Karnataka  
> 
> *“Healthcare Access, Wherever You Are.”*  
> A full-stack, offline-first, database-connected telemedicine web platform designed specifically for rural villages and remote regions facing weak, intermittent, or unstable internet connectivity.

---

## ⚡ QUICK START: HOW TO RUN THE PROJECT

Both servers are currently **RUNNING LIVE**:
- 🌐 **Patient & Doctor Portal**: [http://localhost:5173/login](http://localhost:5173/login)
- 🛡️ **Dedicated Admin Panel**: [http://localhost:5173/admin/login](http://localhost:5173/admin/login)
- 🔌 **Backend REST API**: [http://localhost:8000](http://localhost:8000)
- 📖 **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Option A: One-Click Startup (Windows)
Double-click `run_all.bat` in the project root folder. It will launch both the backend and frontend in separate command windows automatically:
```cmd
run_all.bat
```

---

### Option B: Terminal Commands

#### 1. Start the Backend Server (Terminal 1)
Make sure you are in the project root directory (`Hackthon1`):
```bash
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
*Backend URL:* `http://localhost:8000` (API Docs at `http://localhost:8000/docs`)

#### 2. Start the Frontend Server (Terminal 2)
Open a second terminal window, navigate to the `frontend` folder, and run:
```bash
cd frontend
npm run dev -- --host 0.0.0.0 --port 5173
```
*Frontend URL:* `http://localhost:5173`

---

## 🔑 Demonstration Accounts (Pre-Seeded)

The database comes pre-seeded with sample accounts for all three user roles with real bcrypt hashing and JWT authentication:

| Role | Portal URL | Email | Password | Access Details |
| :--- | :--- | :--- | :--- | :--- |
| **System Admin** | `/admin/login` | `admin@telecare.org` | `Admin@123` | Platform analytics, doctor verification, user management & audit logs |
| **Doctor** | `/login` | `dr.rajesh@telecare.org` | `Doctor@123` | Dr. Rajesh Sharma (General Medicine) — Manage & confirm consultations, add advice, patient chat |
| **Doctor** | `/login` | `dr.ananya@telecare.org` | `Doctor@123` | Dr. Ananya Sen (Pediatrics & Child Health) |
| **Patient** | `/login` | `patient@telecare.org` | `Patient@123` | Ramesh Kumar (Rampur Village) — Book appointments, upload reports, offline chat |

---

## 🌟 Key Features

1. **Adaptive Network Connectivity & Intelligent Data Saver Mode:**
   - **Multi-Factor Network Detection**: Combines `navigator.onLine`, `navigator.connection` (`effectiveType`, `downlink`, `rtt`), and live measured Axios API request-response round-trip latency.
   - **Dynamic Network Modes**:
     - 🟢 **Strong (4G / Wi-Fi)**: Full-speed requests, complete metadata.
     - 🟡 **Medium (3G)**: Adaptive compression, prioritizes essential data payloads.
     - 🟠 **Weak (2G / High Latency > 1200ms)**: Conservative bandwidth mode, low-resolution previews, text-prioritized.
     - 🔴 **Offline**: Seamless fallback to local IndexedDB caching and offline queues.
   - **Manual Data Saver Toggle**: Sticky switch in the top status bar allowing patients to force low-bandwidth mode even on fast connections to conserve mobile data balances.

2. **Progressive Web App (PWA) & Offline-First Operation:**
   - **Service Worker (`sw.js`)**: Precaches the application shell, icons, and dedicated offline fallback page (`offline.html`).
   - **One-Click Native App Installation**: Functional PWA install prompt button integrated with Microsoft Edge & Chrome `beforeinstallprompt`.
   - **IndexedDB Local Storage**: Caches medical prescriptions, appointment records, medical history, reports, and doctor directories directly on the device.
   - **Automatic Offline Synchronization**: Automatically queues messages and consultations offline with unique client IDs and synchronizes seamlessly upon reconnecting.

3. **Dual-Storage Medical Document Engine (Images & PDFs):**
   - **Zero Diagnostic Data Loss**: High-resolution original diagnostic scans and lab PDFs are preserved 100% intact on the secure server for specialist referrals and hospital audits.
   - **Automated Lightweight Web Previews**: Generates fast WebP previews (Pillow Lanczos resampling) and compressed PDF streams (PyPDF) reducing payloads by up to 70%.
   - **Dual Action Controls**: Patients and doctors can choose between instantaneous "Low-Data Fast Preview" or "Download Original High-Res Document".

4. **Interactive Timeline-Based Medical Records Dashboard:**
   - **Unified Chronological View**: Integrates appointments, doctor consultations, digital prescriptions, diagnostic lab reports, and chronic conditions into an interactive vertical timeline.
   - **Live Search & Category Filtering**: Filter by prescriptions, consultations, reports, or allergies with search query filtering across doctors, diagnosis, and medicine names.
   - **Voice Narration**: Audio playback button on each event for low-literacy rural patients.

5. **Doctor-Issued Digital Prescriptions & Printable Slip:**
   - **Comprehensive Prescription Creator**: Doctors can specify clinical diagnoses, dynamic medication items (name, dosage, frequency, duration, instructions), and scheduled follow-up dates.
   - **Draft vs Finalized Lifecycle**: Save as draft or issue immediately with revision versioning.
   - **Printable Medical Slip**: Dedicated printable HTML view (`/api/prescriptions/{id}/print`) featuring official Karavali Institute of Technology & TeleCare branding, Rx header, and digital verification.

3. **Multilingual Support & Voice Narration (Audio Accessibility):**
   - **Instant Language Switching**: Toggle between **English** and **Hindi (हिंदी)** seamlessly across all landing and dashboard features.
   - **Read Aloud (Voice Narration)**: Free, zero-latency text-to-speech using the browser's native **Web Speech API** (`window.speechSynthesis`) tailored for rural patients with low literacy to listen to doctors' names, prescriptions, and health advice.

4. **Three Dedicated Role-Based Modules:**
   - **Patient Module**: Health record summary, appointment booking with doctor selection, medical reports management with compression metrics, offline-capable consultation messaging, medical history timeline, and village profile settings.
   - **Doctor Module**: Separate doctor dashboard to review consultations, confirm/reject slots (with reason), log diagnostic assessment & prescription notes, chat with patients, and update clinic hours.
   - **Admin Module**: Real-time platform analytics (users, doctors, appointments, pending requests), doctor credential verification workflow (approve/revoke), user account suspension/activation, and immutable security audit logs.

5. **Instant Authentication (No Email Verification):**
   - Secure bcrypt password hashing.
   - Stateless JWT tokens (24-hour expiration).
   - Role-based route protection on both React frontend and FastAPI backend.
   - Immediate login upon registration (no email OTP or verification links required).
   - Configurable development password reset mechanism.

---

## 🛠️ Technology Stack

- **Frontend:**
  - React 18 / Vite 6
  - React Router DOM 6
  - Axios (with JWT interceptors)
  - Lucide React (vector icons)
  - Custom CSS3 Design System adhering to the specified healthcare palette
  - Web App Manifest & Service Worker
  - IndexedDB API & Web Speech API

- **Backend:**
  - Python 3
  - FastAPI
  - SQLAlchemy ORM
  - Pydantic v2
  - PyJWT & bcrypt
  - Pillow (PIL) for image compression
  - python-multipart & python-dotenv

- **Database:**
  - MySQL (`telecare_db`)
  - PyMySQL driver

---

## 🎨 Healthcare Color Palette

- **Primary Navy Blue**: `#102A4C`
- **Secondary Blue**: `#587493`
- **Background**: `#F4F6F9`
- **Card Surface**: `#FFFFFF`
- **Light Blue Accent**: `#E8F0F7`
- **Primary Text**: `#202B3C`
- **Muted Text**: `#6B7280`
- **Success Green**: `#10B981`
- **Alert Red**: `#EF4444`

---

## 📦 Full Installation & Environment Setup

### Prerequisites
- Node.js (v18+) & npm
- Python (v3.10+)
- MySQL Server (Port 3306)

---

### Step 1: Database Setup
Make sure your MySQL server is running. Create the database:
```sql
CREATE DATABASE IF NOT EXISTS telecare_db;
```

---

### Step 2: Backend Setup
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Configure environment variables in `.env` (a `.env.example` is provided):
   ```env
   DATABASE_URL=mysql+pymysql://root:SQL123@127.0.0.1:3306/telecare_db
   JWT_SECRET=super_secret_telecare_jwt_key_2026_change_in_production
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   UPLOAD_DIR=uploads
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Initialize tables and seed sample accounts:
   ```bash
   python -m backend.app.seed
   ```
5. Start the FastAPI backend server:
   ```bash
   python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

---

### Step 3: Frontend Setup
1. In a second terminal, navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev -- --host 0.0.0.0 --port 5173
   ```
4. Open the application:
   - **Local Browser:** [http://localhost:5173](http://localhost:5173)
   - **Mobile Phone / Rural Tablet (on the same Wi-Fi):** `http://<your-ip>:5173`

---

## 📡 Testing Offline & Low-Connectivity Behavior

To test offline behavior in Chrome or Edge:
1. Open [http://localhost:5173](http://localhost:5173) and log in as `patient@telecare.org`.
2. Open **DevTools (F12)** → Go to **Network** tab → Set throttling to **Offline**.
3. Notice:
   - Top status bar immediately switches to **"Offline Mode (Cached Data Active)"**.
   - Your previous medical reports and consultations remain accessible via **IndexedDB**.
   - Send a message to the doctor: it displays a **"⏳ Pending Sync"** status.
4. Set Network back to **Online** (or **Slow 3G**):
   - The status bar automatically detects connectivity, flushes the queue via `/api/messages/sync`, and marks the messages as sent!

---

## 📁 Project Structure

```text
Hackthon1/
├── README.md                      # Complete installation & run commands
├── run_all.bat                    # One-click startup for both servers
├── run_backend.bat                # One-click startup for backend
├── run_frontend.bat               # One-click startup for frontend
├── backend/
│   ├── .env                       # Database URL (mysql+pymysql://root:SQL123@127.0.0.1:3306/telecare_db)
│   ├── .env.example
│   ├── requirements.txt
│   ├── uploads/                   # Compressed prescriptions and lab reports
│   └── app/
│       ├── config.py              # Environment configuration & upload paths
│       ├── database.py            # SQLAlchemy engine, session maker, get_db
│       ├── main.py                # FastAPI app, CORS, routes & static mounts
│       ├── seed.py                # Auto-creates MySQL tables & seeds demo accounts
│       ├── models/                # User, PatientProfile, DoctorProfile, Appointment,
│       │                          # MedicalReport, Message, Notification, AuditLog
│       ├── schemas/               # Pydantic v2 validation models
│       ├── services/              # bcrypt, PyJWT, Pillow image compression, Audit
│       └── routers/               # auth, patient, doctors, doctor_dashboard, messages, admin
└── frontend/
    ├── index.html                 # PWA meta tags & service worker registration
    ├── vite.config.js
    ├── package.json
    ├── public/
    │   ├── manifest.json          # PWA manifest
    │   └── sw.js                  # Service worker caching app shell
    └── src/
        ├── App.jsx                # Application routing & protected routes
        ├── index.css              # Custom healthcare CSS design system
        ├── components/            # NetworkStatusBar, Navbar, Footer, ProtectedRoute
        ├── context/               # AuthContext, LanguageContext
        ├── pages/                 # LandingPage, LoginPage, SignupPage, DoctorDiscoveryPage,
        │                          # PatientDashboard, DoctorDashboard, AdminDashboard
        ├── services/              # api.js (Axios), offlineStorage.js (IndexedDB)
        └── translations/          # English & Hindi dictionaries + Web Speech API voice synthesis
```
