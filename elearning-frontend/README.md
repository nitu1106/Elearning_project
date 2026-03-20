# EduSphere — Complete E-Learning Platform

Full-stack E-Learning Platform with Role-Based Access Control.

---

## Project Structure

```
elearning-platform/
├── elearning-backend/          ← Node.js + Express + MongoDB API
└── elearning-frontend/         ← React 18 SPA
```

---

## Tech Stack

| Layer        | Backend                    | Frontend              |
|--------------|----------------------------|-----------------------|
| Runtime      | Node.js 18+                | React 18              |
| Framework    | Express.js                 | React Router v6       |
| Database     | MongoDB + Mongoose         | —                     |
| Auth         | JWT (Access + Refresh)     | Context API           |
| File Storage | Cloudinary                 | —                     |
| Email        | Nodemailer                 | —                     |
| PDF          | PDFKit                     | —                     |
| Charts       | —                          | Recharts              |
| Icons        | —                          | Lucide React          |
| Notifications| —                          | React Hot Toast       |

---

## Quick Start

### 1. Backend Setup

```bash
cd elearning-backend
npm install

# Copy and fill environment variables
cp .env.example .env
```

Edit `.env` with your values:
```env
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/elearning
JWT_SECRET=some_long_random_secret_here
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=another_refresh_secret
JWT_REFRESH_EXPIRES_IN=30d
CLOUDINARY_CLOUD_NAME=your_cloudname
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=noreply@edusphere.com
FRONTEND_URL=http://localhost:3000
```

```bash
npm run dev     # Development (nodemon)
# or
npm start       # Production
```

Backend runs on: **http://localhost:5000**

---

### 2. Frontend Setup

```bash
cd elearning-frontend
npm install
npm start
```

Frontend runs on: **http://localhost:3000**

> The frontend proxies all `/api` calls to `http://localhost:5000` automatically (configured in `package.json`).

---

## Creating Your First Admin

Since admin accounts cannot self-register, create one directly in MongoDB:

```js
// In MongoDB Atlas > Collections > users, insert:
{
  "name": "Admin User",
  "email": "admin@edusphere.com",
  "password": "$2a$12...",  // bcrypt hash — see note below
  "role": "admin",
  "isActive": true,
  "isEmailVerified": true
}
```

Or use this Node.js script to generate the hash and insert:

```js
// scripts/createAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User     = require('../models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const password = await bcrypt.hash('Admin@123', 12);
  await User.create({
    name: 'Admin', email: 'admin@edusphere.com',
    password, role: 'admin', isActive: true,
  });
  console.log('Admin created!');
  process.exit(0);
});
```

```bash
cd elearning-backend
node scripts/createAdmin.js
```

---

## User Roles & Default Routes

| Role       | Login Redirect              | Can Do                                    |
|------------|-----------------------------|-------------------------------------------|
| Student    | `/student/dashboard`        | Browse, Enroll, Watch, Quiz, Certificate  |
| Instructor | `/instructor/dashboard`     | Create Course, Upload Videos, Make Quizzes, Grade |
| Admin      | `/admin/dashboard`          | Approve Courses, Manage Users, Reports    |

---

## Key Frontend Pages

### Student
| Route                    | Page                          |
|--------------------------|-------------------------------|
| `/student/dashboard`     | Stats, active courses, quizzes|
| `/student/courses`       | Browse & enroll in courses    |
| `/student/my-courses`    | Enrolled courses + progress   |
| `/student/course/:id`    | Video player + curriculum     |
| `/student/quiz/:id`      | Quiz attempt page             |
| `/student/progress`      | Overall progress tracker      |
| `/student/certificates`  | Certificate download          |

### Instructor
| Route                      | Page                          |
|----------------------------|-------------------------------|
| `/instructor/dashboard`    | Stats, submissions overview   |
| `/instructor/courses`      | Course list + submit for review|
| `/instructor/create`       | Create new course form        |
| `/instructor/course/:id`   | Add modules, lectures, videos |
| `/instructor/quizzes`      | Create & publish quizzes      |
| `/instructor/students`     | Student performance per course|

### Admin
| Route                 | Page                          |
|-----------------------|-------------------------------|
| `/admin/dashboard`    | Platform stats + trend chart  |
| `/admin/users`        | Manage all users              |
| `/admin/courses`      | Full course catalog           |
| `/admin/approvals`    | Approve/reject pending courses|
| `/admin/reports`      | Top courses, top students     |

---

## How RBAC Works

```
Login → Backend verifies email+password → Reads user.role from DB
     → Creates JWT with { id, role } → Returns { accessToken, role }
     
Frontend stores token → Sends as "Authorization: Bearer <token>" on every request
     → React PrivateRoute checks role → Redirects if wrong role

Backend protect middleware → Verifies JWT → Attaches req.user
Backend authorize middleware → Checks req.user.role → 403 if unauthorized
```

---

## API Base URL

All API routes: `http://localhost:5000/api`

| Module      | Base Route          |
|-------------|---------------------|
| Auth        | `/api/auth`         |
| Courses     | `/api/courses`      |
| Enrollment  | `/api/enroll`       |
| Quizzes     | `/api/quiz`         |
| Progress    | `/api/progress`     |
| Instructor  | `/api/instructor`   |
| Admin       | `/api/admin`        |

Health check: `GET /api/health`

---

## Environment Notes

- **Gmail App Password**: Go to Google Account → Security → 2-Step Verification → App Passwords → Generate
- **Cloudinary**: Free tier supports 25GB storage, enough for development
- **MongoDB Atlas**: Free M0 cluster (512MB) is sufficient for development
