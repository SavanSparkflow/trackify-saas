# Trackify SaaS ⚡️
### AI-Powered Biometric Attendance & Staff Management System

Trackify is a high-performance, multi-tenant SaaS application designed to revolutionize attendance tracking for businesses. Using cutting-edge biometric facial recognition and a seamless user experience, Trackify eliminates "buddy punching" and simplifies payroll management.

---

## 🚀 Key Features

### 🏢 SaaS Multi-Tenancy
- **Organization Onboarding**: Each company (tenant) has its own isolated workspace, settings, and employee database.
- **Role-Based Access**: Granular permissions for Super Amins, Admins, and Employees.

### 🤖 Biometric AI Security
- **Smart Facial Recognition**: High-accuracy face matching using `face-api.js` for Kiosk and Dashboard modes.
- **Kiosk Station**: A dedicated "Attendance Station" interface for physical locations (tablets/laptops) that supports rapid, one-click biometric scanning.

### ⏱️ Real-time Tracking
- **Smart Punch Logic**: Intelligently toggles between Punch In, Break Start/End, and Punch Out.
- **Geofencing & Geolocation**: Verification of employee location during every punch event.

### 📊 Admin Control Center
- **Insightful Analytics**: Real-time dashboards for daily attendance, late-comers, and work hours.
- **Automated Salary Calculation**: Dynamic calculation based on work hours, penalties, and bonuses.
- **Reports Export**: Generate and download attendance reports in Excel format.

### 📱 Employee Dashboard
- **Individual Insights**: Personal work summary, salary progress, and attendance history.
- **Self-Service Punching**: Easy-to-use manual and biometric punch actions.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, TailwindCSS, Lucide Icons, Framer Motion |
| **Backend** | Node.js, Express, MongoDB (Mongoose) |
| **Biometrics** | Face-API.js (TensorFlow.js) |
| **Storage** | Cloudinary (Image Uploads) |
| **Real-time** | Socket.io (Notifications & Status Updates) |
| **Security** | JWT, bcryptjs, Geolocation API |

---

## 📁 Project Structure

```bash
trackify-saas/
├── backend/            # Express.js REST API server
├── admin-panel/        # React-based Management Dashboard (Vite)
└── employee-panel/     # React-based Staff Dashboard (Vite)
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (Atlas or Local)
- Cloudinary Account (for facial data storage)

### 1. Backend Setup
```bash
cd backend
npm install
# Create a .env file (see .env.example)
npm run dev
```

### 2. Admin Panel Setup
```bash
cd admin-panel
npm install
# Update VITE_API_URL in .env
npm run dev
```

### 3. Employee Panel Setup
```bash
cd employee-panel
npm install
# Update VITE_API_URL in .env
npm run dev
```

---

## 📄 Environment Configuration

Each submodule requires its own configuration. Ensure the following keys are set:

**Backend (`backend/.env`):**
- `PORT`: Server port (e.g., 5000)
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secret for token signing
- `CLOUDINARY_CLOUD_NAME`: Cloudinary identification
- `CLOUDINARY_API_KEY`: Cloudinary key
- `CLOUDINARY_API_SECRET`: Cloudinary secret

**Frontends (`.env`):**
- `VITE_API_URL`: Path to the backend server (e.g., http://localhost:5000/api)

---

## ⚡️ Quick Run (Development)
For rapid development, run the following in separate terminals:
- `backend`: `npm run dev`
- `admin-panel`: `npm run dev`
- `employee-panel`: `npm run dev`

---

Built with ❤️ for Modern Businesses.
