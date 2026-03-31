import axios from 'axios';
import toast from 'react-hot-toast';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 30000,
});

// Attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Handle responses globally
API.interceptors.response.use(
  (res) => res,
  async (error) => {
    const msg = error.response?.data?.message || 'Something went wrong';
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    } else if (error.response?.status !== 404) {
      toast.error(msg);
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register:       (data) => API.post('/auth/register', data),
  login:          (data) => API.post('/auth/login', data),
  logout:         ()     => API.post('/auth/logout'),
  getMe:          ()     => API.get('/auth/me'),
  updateProfile:  (data) => API.put('/auth/me', data),
  changePassword: (data) => API.put('/auth/change-password', data),
  forgotPassword: (data) => API.post('/auth/forgot-password', data),
};

// ── Courses ───────────────────────────────────────────────────────────────────
export const courseAPI = {
  getAll:         (params) => API.get('/courses', { params }),
  getOne:         (id)     => API.get(`/courses/${id}`),
  getMyCourses:   ()       => API.get('/courses/instructor/my-courses'),
  create:         (data)   => API.post('/courses', data, {
    headers: { 'Content-Type': 'application/json' }
  }),
  update:         (id, d)  => API.put(`/courses/${id}`, d),
  delete:         (id)     => API.delete(`/courses/${id}`),
  submit:         (id)     => API.post(`/courses/${id}/submit`),
  addModule:      (id, d)  => API.post(`/courses/${id}/modules`, d),
  deleteModule: (id, mid)     => API.delete(`/courses/${id}/modules/${mid}`),


  // JSON version — no file upload
  addLectureJSON: (cid, mid, data) => API.post(
    `/courses/${cid}/modules/${mid}/lectures`,
    data,
    { headers: { 'Content-Type': 'application/json' } }
  ),

  // FormData version — with file upload
 addLecture: (cid, mid, data) => {
  // If FormData — let browser set content type
  if (data instanceof FormData) {
    return API.post(`/courses/${cid}/modules/${mid}/lectures`, data);
  }
  // If JSON — explicitly set header
  return API.post(
    `/courses/${cid}/modules/${mid}/lectures`,
    data,
    { headers: { 'Content-Type': 'application/json' } }
  );
},

deleteLecture: (cid, mid, lid) => API.delete(
  `/courses/${cid}/modules/${mid}/lectures/${lid}`
),
  uploadMaterial: (cid, mid, lid, data) => {
    // If data has url (from disk upload) — send as JSON
    if (data && data.url && !(data instanceof FormData)) {
      return API.post(
        `/courses/${cid}/modules/${mid}/lectures/${lid}/materials`,
        data,
        { headers: { 'Content-Type': 'application/json' } }
      );
    }
    // FormData (Cloudinary) — send as multipart
    return API.post(`/courses/${cid}/modules/${mid}/lectures/${lid}/materials`, data);
  },
};

// ── Enrollment ────────────────────────────────────────────────────────────────
export const enrollAPI = {
  enroll:           (courseId) => API.post(`/enroll/${courseId}`),
  getMyEnrollments: ()         => API.get('/enroll'),
  updateProgress:   (cid, d)   => API.put(`/enroll/${cid}/progress`, d),
  rateCourse:       (cid, d)   => API.post(`/enroll/${cid}/rate`, d),
};

// ── Quiz ──────────────────────────────────────────────────────────────────────
export const quizAPI = {
  create:           (data)   => API.post('/quiz', data),
  getCourseQuizzes: (cid)    => API.get(`/quiz/course/${cid}`),
  getOne:           (id)     => API.get(`/quiz/${id}`),
  update:           (id, d)  => API.put(`/quiz/${id}`, d),
  delete:           (id)     => API.delete(`/quiz/${id}`),
  togglePublish:    (id)     => API.patch(`/quiz/${id}/toggle-publish`),
  submit:           (id, d)  => API.post(`/quiz/${id}/submit`, d),
  getMySubmissions: (qid)    => API.get(`/quiz/${qid}/my-submissions`),
  getAllSubmissions: (qid)    => API.get(`/quiz/${qid}/submissions`),
  provideFeedback:  (sid, d) => API.put(`/quiz/submissions/${sid}/feedback`, d),
};

// ── Progress ──────────────────────────────────────────────────────────────────
export const progressAPI = {
  getDashboard:      ()    => API.get('/progress/dashboard'),
  getCourseProgress: (cid) => API.get(`/progress/course/${cid}`),
  getCertificate:    (id)  => API.get(`/progress/certificates/${id}`),
  verifyCertificate: (id)  => API.get(`/progress/verify-certificate/${id}`),
  getStudentPerf:    (cid) => API.get(`/progress/instructor/course/${cid}`),
};

// ── Instructor ────────────────────────────────────────────────────────────────
export const instructorAPI = {
  getDashboard:     ()     => API.get('/instructor/dashboard'),
  getCourseStudents:(cid)  => API.get(`/instructor/courses/${cid}/students`),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminAPI = {
  getStats:          ()         => API.get('/admin/stats'),
  getReport:         ()         => API.get('/admin/reports/learning'),
  getUsers:          (params)   => API.get('/admin/users', { params }),
  createInstructor:  (data)     => API.post('/admin/users/instructor', data),
  toggleUser:        (id)       => API.patch(`/admin/users/${id}/toggle`),
  deleteUser:        (id)       => API.delete(`/admin/users/${id}`),
  getAllCourses:      (params)   => API.get('/admin/courses', { params }),
  getPendingCourses: ()         => API.get('/admin/courses/pending'),
  reviewCourse:      (id, data) => API.patch(`/admin/courses/${id}/review`, data),
  removeCourse:      (id)       => API.delete(`/admin/courses/${id}`),
  revokeCert:        (id)       => API.patch(`/admin/certificates/${id}/revoke`),
  getCourseEnrollments: (courseId) => API.get(`/admin/courses/${courseId}/enrollments`),
};

export default API;