# Trackify Backend 🚀
### Core SaaS Engine & Biometric API Gateway

The Trackify Backend is a robust, performant API server built on the Node.js / Express.js ecosystem, serving as the central nervous system for the Trackify SaaS biometric attendance system.

## 🌟 Core Services

### 🔒 Enterprise Security
- **RBAC Engine**: Role-Based Access Control for Super Admins, Admins, and Employees.
- **JWT Protection**: Stateless authentication for all panel requests.
- **Tenant Isolation**: Secure separation of data, business hours, and staff records.

### ⏱️ Attendance State Machine
- **Smart Punch Logic**: Dynamically manages Punch-In, Punch-Out, and Break cycles.
- **Penalty & Earnings**: Automatic calculation of work hours with adjustments for late arrivals or overtime.

### 📸 Biometric Infrastructure
- **Secure Image Vault**: Cloud-stored enrollment data via Cloudinary.
- **Biometric Signature Matching**: Backend support for attendance verification.

### 📊 Data Intelligence
- **Excel Synthesis**: Modular generation of complex attendance reports in XLSX format.
- **Operational Exports**: Deep insights into late-arrivals, daily patterns, and payroll readiness.

---

## 🏗️ Technical Architecture

| Component | Technology |
| :--- | :--- |
| **Runtime** | Node.js |
| **Framework** | Express.js |
| **Database** | MongoDB (Mongoose) |
| **Authentication** | JSON Web Tokens |
| **Time Mgmt** | Moment.js |
| **Imaging** | Cloudinary SDK |

---

## 🛠️ Development Setup

1. **Environment Config**: Create a `.env` file from `.env.example`.
2. **Installation**: `npm install`
3. **Execution**: `npm run dev` (Starts for development with Nodemon).

---

Built for Scalability.
