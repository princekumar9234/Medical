# CareConnect — Healthcare Web Application (MERN Stack)

A production-style, human-designed Doctor–Patient Healthcare Platform engineered with **React, Node.js, Express.js, MongoDB, Tailwind CSS, and Socket.IO**.

---

## 🌟 Key Features

### 1. 🩺 Doctor Features
- **Practitioner Dashboard**: Real-time consultation queue, upcoming patient schedule, daily stats, and earnings counter.
- **Appointment Management**: View patient medical complaints, update consultation statuses (`CONFIRMED`, `COMPLETED`, `CANCELLED`).
- **Digital Prescription Generator**: Built-in prescription builder with diagnosis, multi-medicine dosage table, instructions, and instant **cryptographically signed PDF download** (`jspdf`).
- **Availability & Slot Scheduler**: Configure weekly working days, working hours, and slot intervals (15, 30, 45, 60 minutes).
- **Public Profile & Credentials**: Specialization, hospital affiliations, years of clinical experience, consultation fees, and patient reviews.

### 2. 👤 Patient Features
- **Specialist Discovery & Search**: Filter verified practitioners by medical specialty, consultation fees, experience, and patient ratings.
- **Seamless Booking**: Select date and real-time slot interval, choose consultation mode (**Video Consultation** vs. **In-Clinic Visit**), describe symptoms, and receive instant confirmation.
- **Patient Dashboard**: Track upcoming appointments, downloaded PDF prescriptions, and health summaries.
- **Electronic Health Record (EHR)**: Manage blood group, emergency contact details, known drug allergies, and chronic medical conditions.

### 3. 💬 Real-Time Messaging & Chat
- Encrypted Doctor-Patient direct messaging via **Socket.IO** with fallback REST synchronization.
- Quick action buttons to launch virtual video consultations.

### 4. 💊 Drug Guide & Barcode Search
- Search comprehensive pharmacology database by brand name or active generic ingredients.
- **Barcode Lookup**: Instant lookup by drug barcode number.
- Verified medical indications, standard dosages, contraindications, and side-effects.

### 5. 🔔 Notification System
- Real-time in-app alerts for appointment bookings, status updates, and digital prescription availability.

### 6. 🛡️ Enterprise Security & Design Aesthetics
- **JWT (JSON Web Tokens)** authentication with HTTP interceptors.
- **Helmet.js** security headers and **CORS** configurations.
- **Express-Rate-Limit** protection on authentication and API routes.
- **Clean Human Design**: Inspired by authentic healthcare institutions (clean white background, dark navy headings, subtle borders, soft shadows, and emerald green primary actions).

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or newer)
- MongoDB running locally on `mongodb://127.0.0.1:27017/careconnect` (or MongoDB Atlas URI)

### 1. Backend Setup
```bash
cd Backend
npm install
# Optional: Seed sample verified doctors, patients, and medicines
npm run seed
# Start development server (Port 5000)
npm run dev
```

### 2. Frontend Setup
```bash
cd Frontend
npm install
# Start Vite development server (Port 5173)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔑 Demo Accounts

Use these pre-configured credentials or use the **Quick Demo Fill** buttons on the Login page:

| Role | Email | Password |
|---|---|---|
| **Doctor** | `dr.sarah@careconnect.health` | `Password123!` |
| **Patient** | `patient.john@example.com` | `Password123!` |

---

## 📁 Repository Structure

```
Medical/
├── Backend/
│   ├── server.js                  # HTTP server & Socket.IO initialization
│   ├── package.json
│   ├── .env                       # Environment configuration
│   └── src/
│       ├── app.js                 # Express application & middleware stack
│       ├── config/database.js     # MongoDB Mongoose connection
│       ├── models/                # User, DoctorProfile, PatientProfile, Appointment, Chat, Medicine
│       ├── controllers/           # Business logic & request handlers
│       ├── routes/                # API route definitions
│       ├── services/              # Notification, appointment & medicine services
│       ├── middleware/            # JWT auth, role validation, error handling
│       └── seed.js                # Database seeder
│
└── Frontend/
    ├── index.html                 # App root with Plus Jakarta Sans & Inter fonts
    ├── vite.config.js             # Vite + Tailwind CSS configuration
    ├── package.json
    ├── .env                       # API Base URL & Socket URL
    └── src/
        ├── main.jsx               # Application entrypoint
        ├── App.jsx                # Router & protected route guards
        ├── index.css              # Design tokens & modern healthcare utilities
        ├── services/              # Axios apiClient & Socket.IO client
        ├── components/
        │   ├── Navbar.jsx         # Sticky navigation with notifications preview & mobile drawer
        │   ├── Footer.jsx         # Healthcare footer with emergency hotlines
        │   ├── ProtectedRoute.jsx # Authentication & role route guards
        │   └── ui/                # Button, Input, Modal, Badge, Card, RatingStars, LoadingSpinner
        └── features/
            ├── auth/              # LoginPage, RegisterPage, ForgotPasswordPage, AuthContext
            ├── doctor/            # DoctorSearchPage, DoctorPublicProfilePage, DoctorDashboard, Availability, Profile
            ├── patient/           # PatientDashboard, PatientProfilePage
            ├── appointments/      # AppointmentsPage (with jsPDF Prescription Generator)
            ├── chat/              # Real-time ChatPage
            ├── medicine/          # MedicineSearchPage with Barcode lookups
            └── notifications/     # NotificationsPage & service
```
