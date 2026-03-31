# HRMS - Human Resource Management System

A production-grade HRMS built with the **MERN stack** (MongoDB, Express.js, React.js, Node.js).

## Features

- **JWT Authentication** with role-based access (HR / Employee)
- **Employee Management** - Add, edit, activate/deactivate employees
- **Attendance Tracking** - Check-in/out, HR manual marking, monthly summaries
- **Leave Management** - Apply, approve/reject, balance tracking
- **Payroll System** - Auto salary calculation, deductions, payslip PDF download
- **Employee Self-Service** - Profile, attendance, leaves, salary view
- **Dark Theme** professional dashboard, fully **mobile responsive**

## Tech Stack

| Layer    | Technology                     |
|----------|--------------------------------|
| Frontend | React 18, TypeScript, Tailwind CSS, Vite |
| Backend  | Node.js, Express.js            |
| Database | MongoDB + Mongoose             |
| Auth     | JWT (jsonwebtoken, bcryptjs)    |
| PDF      | PDFKit                         |

## Project Structure

```
hrmstool/
├── admin/          # React frontend (Vite + TypeScript + Tailwind)
│   └── src/
│       ├── components/   # Layout, ProtectedRoute
│       ├── context/      # AuthContext
│       ├── pages/        # All page components
│       ├── services/     # Axios API client
│       └── types/        # TypeScript interfaces
├── server/         # Express.js backend
│   ├── config/     # DB connection
│   ├── controllers/# Business logic
│   ├── middleware/  # Auth, validation
│   ├── models/     # Mongoose schemas
│   ├── routes/     # API routes
│   └── utils/      # PDF generation, seed data
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB running locally or Atlas URI

### 1. Setup Server

```bash
cd server
npm install
# Edit .env with your MongoDB URI and JWT secret
npm run seed    # Seeds demo data
npm run dev     # Starts on :5000
```

### 2. Setup Frontend

```bash
cd admin
npm install
npm run dev     # Starts on :5173
```

### Demo Credentials

| Role     | Email            | Password      |
|----------|------------------|---------------|
| HR Admin | admin@hrms.com   | admin123      |
| Employee | rahul@hrms.com   | employee123   |

## API Endpoints

| Module     | Endpoints                                    |
|------------|----------------------------------------------|
| Auth       | POST /api/auth/login, GET /api/auth/me       |
| Employees  | GET/POST/PUT /api/employees, PATCH toggle     |
| Attendance | POST check-in/out, GET /all, POST /mark      |
| Leaves     | POST /apply, GET /my, PATCH /:id/status      |
| Payroll    | POST /generate, GET /list, GET /payslip/:id  |
| Dashboard  | GET /api/dashboard/hr, GET /api/dashboard/employee |