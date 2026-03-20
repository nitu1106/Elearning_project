import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute } from './components/common';

// Auth
import { LoginPage, RegisterPage } from './pages/auth';

// Student
import {
  StudentDashboard, BrowseCoursesPage, MyCoursesPage,
  CourseDetailPage, QuizPage, CertificatesPage, ProgressPage
} from './pages/student';

// Instructor
import {
  InstructorDashboard, InstructorCoursesPage, CreateCoursePage,
  ManageCoursePage, InstructorQuizzesPage, InstructorStudentsPage
} from './pages/instructor';

// Admin
import {
  AdminDashboard, AdminUsersPage, AdminCoursesPage,
  AdminApprovalsPage, AdminReportsPage, AdminEnrollmentsPage
} from './pages/admin';

// Profile
import ProfilePage from './pages/ProfilePage';

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg3)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            fontSize: 14,
          },
          success: { iconTheme: { primary: 'var(--green)', secondary: 'var(--bg3)' } },
          error:   { iconTheme: { primary: 'var(--red)',   secondary: 'var(--bg3)' } },
        }}
      />
      <Routes>
        {/* Public */}
        <Route path="/"         element={<Navigate to="/login" replace />} />
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/unauthorized" element={
          <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
            <div style={{ fontSize:56 }}>🚫</div>
            <h2 style={{ fontFamily:'var(--font-serif)', fontSize:24 }}>Access Denied</h2>
            <p style={{ color:'var(--text2)' }}>You don't have permission to view this page.</p>
            <a href="/login" style={{ color:'var(--accent)' }}>Go to Login</a>
          </div>
        }/>

        {/* ── Student Routes ── */}
        <Route path="/student/dashboard"   element={<PrivateRoute roles={['student']}><StudentDashboard /></PrivateRoute>} />
        <Route path="/student/courses"     element={<PrivateRoute roles={['student']}><BrowseCoursesPage /></PrivateRoute>} />
        <Route path="/student/my-courses"  element={<PrivateRoute roles={['student']}><MyCoursesPage /></PrivateRoute>} />
        <Route path="/student/progress"    element={<PrivateRoute roles={['student']}><ProgressPage /></PrivateRoute>} />
        <Route path="/student/certificates"element={<PrivateRoute roles={['student']}><CertificatesPage /></PrivateRoute>} />
        <Route path="/student/course/:id"  element={<PrivateRoute roles={['student']}><CourseDetailPage /></PrivateRoute>} />
        <Route path="/student/quiz/:id"    element={<PrivateRoute roles={['student']}><QuizPage /></PrivateRoute>} />

        {/* ── Instructor Routes ── */}
        <Route path="/instructor/dashboard" element={<PrivateRoute roles={['instructor']}><InstructorDashboard /></PrivateRoute>} />
        <Route path="/instructor/courses"   element={<PrivateRoute roles={['instructor']}><InstructorCoursesPage /></PrivateRoute>} />
        <Route path="/instructor/create"    element={<PrivateRoute roles={['instructor']}><CreateCoursePage /></PrivateRoute>} />
        <Route path="/instructor/course/:id"element={<PrivateRoute roles={['instructor']}><ManageCoursePage /></PrivateRoute>} />
        <Route path="/instructor/quizzes"   element={<PrivateRoute roles={['instructor']}><InstructorQuizzesPage /></PrivateRoute>} />
        <Route path="/instructor/students"  element={<PrivateRoute roles={['instructor']}><InstructorStudentsPage /></PrivateRoute>} />

        {/* ── Admin Routes ── */}
        <Route path="/admin/dashboard"   element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />
        <Route path="/admin/users"        element={<PrivateRoute roles={['admin']}><AdminUsersPage /></PrivateRoute>} />
        <Route path="/admin/courses"      element={<PrivateRoute roles={['admin']}><AdminCoursesPage /></PrivateRoute>} />
        <Route path="/admin/approvals"    element={<PrivateRoute roles={['admin']}><AdminApprovalsPage /></PrivateRoute>} />
        <Route path="/admin/enrollments"  element={<PrivateRoute roles={['admin']}><AdminEnrollmentsPage /></PrivateRoute>} />
        <Route path="/admin/reports"      element={<PrivateRoute roles={['admin']}><AdminReportsPage /></PrivateRoute>} />

        {/* ── Shared ── */}
        <Route path="/profile" element={<PrivateRoute roles={['student','instructor','admin']}><ProfilePage /></PrivateRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;
