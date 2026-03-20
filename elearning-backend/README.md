# E-Learning Platform — Backend API

## Tech Stack
- **Runtime**: Node.js + Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Auth**: JWT (Access + Refresh tokens)
- **File Storage**: Cloudinary (videos, PDFs, images)
- **Email**: Nodemailer (SMTP)
- **PDF**: PDFKit (certificate generation)

---

## Project Structure

```
elearning-backend/
├── server.js                   # Entry point
├── .env.example                # Environment variables template
├── config/
│   ├── db.js                   # MongoDB connection
│   └── cloudinary.js           # Cloudinary + Multer upload config
├── models/
│   ├── User.js                 # Student / Instructor / Admin
│   ├── Course.js               # Course with modules & lectures
│   ├── Enrollment.js           # Student enrollment + progress
│   ├── Quiz.js                 # Quiz with questions
│   ├── Submission.js           # Quiz attempt results
│   └── Certificate.js          # Issued certificates
├── controllers/
│   ├── authController.js       # Register, Login, Refresh, Profile
│   ├── courseController.js     # Course CRUD, upload, modules
│   ├── enrollController.js     # Enroll, Progress, Certificate
│   ├── quizController.js       # Quiz CRUD, Submit, Grade
│   ├── progressController.js   # Dashboard, Performance, Feedback
│   └── adminController.js      # Admin panel all operations
├── routes/
│   ├── authRoutes.js
│   ├── courseRoutes.js
│   ├── enrollRoutes.js
│   ├── quizRoutes.js
│   ├── progressRoutes.js
│   ├── adminRoutes.js
│   └── instructorRoutes.js
├── middleware/
│   ├── authMiddleware.js       # JWT protect + role authorize
│   └── errorHandler.js        # Global error + asyncHandler
└── utils/
    ├── jwtUtils.js             # Token generation helpers
    ├── emailUtils.js           # Nodemailer + email templates
    └── certificateGenerator.js # PDFKit certificate + Cloudinary upload
```

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file and fill in values
cp .env.example .env

# 3. Start development server
npm run dev

# 4. Start production server
npm start
```

---

## API Endpoints

### Auth  `/api/auth`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/register` | Public | Register (student/instructor) |
| POST | `/login` | Public | Login, returns JWT tokens |
| POST | `/refresh-token` | Public | Refresh access token |
| POST | `/logout` | Protected | Invalidate refresh token |
| GET  | `/me` | Protected | Get logged-in user profile |
| PUT  | `/me` | Protected | Update profile (name, bio, avatar) |
| PUT  | `/change-password` | Protected | Change password |
| POST | `/forgot-password` | Public | Send reset email |
| POST | `/reset-password/:token` | Public | Reset password via token |

### Courses  `/api/courses`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET  | `/` | Public | Browse approved courses (filter, paginate) |
| GET  | `/:id` | Public | Get course detail (videos hidden if not enrolled) |
| POST | `/` | Instructor | Create course |
| PUT  | `/:id` | Instructor/Admin | Update course |
| DELETE | `/:id` | Instructor/Admin | Delete course |
| PUT  | `/:id/submit` | Instructor | Submit for admin approval |
| POST | `/:id/modules` | Instructor | Add module |
| POST | `/:courseId/modules/:moduleId/lectures` | Instructor | Upload lecture video |
| POST | `.../lectures/:lectureId/materials` | Instructor | Upload study material |
| GET  | `/instructor/my-courses` | Instructor | Get own courses |

### Enrollment  `/api/enroll`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/:courseId` | Student | Enroll in course |
| GET  | `/my` | Student | All enrolled courses |
| GET  | `/:courseId` | Student | Single enrollment detail |
| PUT  | `/:courseId/lectures/:lectureId/complete` | Student | Mark lecture complete |
| POST | `/:courseId/certificate` | Student | Request completion certificate |
| POST | `/:courseId/rate` | Student | Rate a completed course |
| GET  | `/verify-certificate/:certId` | Public | Verify certificate validity |

### Quizzes  `/api/quiz`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/courses/:courseId` | Instructor | Create quiz |
| GET  | `/courses/:courseId` | All | Get quizzes for course |
| GET  | `/:quizId` | All | Get quiz (answers hidden for students) |
| PUT  | `/:quizId` | Instructor | Update quiz |
| PUT  | `/:quizId/toggle-publish` | Instructor | Publish/unpublish quiz |
| POST | `/:quizId/submit` | Student | Submit quiz attempt (auto-graded) |
| GET  | `/courses/:courseId/my-submissions` | Student | My quiz history |
| PUT  | `/submissions/:submissionId/grade` | Instructor | Grade short answers |

### Progress  `/api/progress`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET  | `/dashboard` | Student | Full learning dashboard |
| GET  | `/course/:courseId` | Student | Progress in one course |
| GET  | `/course/:courseId/performance` | Instructor | All students performance |
| POST | `/feedback/:submissionId` | Instructor | Give feedback on submission |

### Admin  `/api/admin`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET  | `/stats` | Admin | Platform-wide statistics |
| GET  | `/reports` | Admin | Learning completion report |
| GET  | `/users` | Admin | List all users |
| PUT  | `/users/:id/toggle-status` | Admin | Activate/deactivate user |
| PUT  | `/users/:id/role` | Admin | Change user role |
| DELETE | `/users/:id` | Admin | Delete user |
| GET  | `/courses/pending` | Admin | Courses awaiting approval |
| PUT  | `/courses/:id/approve` | Admin | Approve course |
| PUT  | `/courses/:id/reject` | Admin | Reject with feedback |
| DELETE | `/courses/:id` | Admin | Remove course |
| PUT  | `/certificates/:id/revoke` | Admin | Revoke certificate |

---

## Role Permissions Summary

| Feature | Student | Instructor | Admin |
|---------|---------|------------|-------|
| Browse courses | ✅ | ✅ | ✅ |
| Enroll | ✅ | ❌ | ❌ |
| Watch lectures | ✅ (enrolled) | ✅ (own) | ✅ |
| Take quizzes | ✅ | ❌ | ❌ |
| Create courses | ❌ | ✅ | ✅ |
| Upload videos | ❌ | ✅ | ✅ |
| Create quizzes | ❌ | ✅ | ✅ |
| Grade students | ❌ | ✅ | ✅ |
| Approve courses | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |
| View reports | ❌ | ❌ | ✅ |
| Revoke certificates | ❌ | ❌ | ✅ |

---

## Auth Flow

```
Register → POST /api/auth/register
         ← { accessToken, refreshToken, user }

Login    → POST /api/auth/login
         ← { accessToken, refreshToken, user }

Use API  → Authorization: Bearer <accessToken>

Refresh  → POST /api/auth/refresh-token { refreshToken }
         ← { accessToken, refreshToken }
```

---

## Key Design Decisions

1. **Role-based access** enforced by `authorize()` middleware — clean, composable.
2. **Refresh token rotation** — old token invalidated on each refresh for security.
3. **Video access control** — video URLs hidden for non-enrolled students; free preview lectures always visible.
4. **Auto-grading** — MCQ and true/false graded instantly; short answers queued for instructor review.
5. **Progress tracking** — per-lecture completion stored; overall `progressPercent` recalculated on each update.
6. **Certificate workflow** — PDF generated via PDFKit, uploaded to Cloudinary, emailed to student, verifiable via public endpoint.
7. **Course approval workflow** — draft → pending (instructor submits) → approved/rejected (admin reviews).
