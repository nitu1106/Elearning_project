const express    = require('express');
const router     = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');
const Enrollment = require('../models/Enrollment');

router.use(protect, authorize('admin'));

// ── Stats & Reports ───────────────────────────────────────────────────────────
router.get('/stats',                adminController.getPlatformStats);
router.get('/reports/learning',     adminController.getLearningReport);

// ── User Management ───────────────────────────────────────────────────────────
router.get('/users',                adminController.getAllUsers);
router.post('/users/instructor',    adminController.createInstructor);
router.patch('/users/:userId/toggle', adminController.toggleUserStatus);
router.delete('/users/:userId',     adminController.deleteUser);

// ── Course Management ─────────────────────────────────────────────────────────
// IMPORTANT: specific routes BEFORE /:courseId routes
router.get('/courses/pending',      adminController.getPendingCourses);
router.get('/courses',              adminController.getAllCoursesAdmin);

// Enrollment monitoring for a specific course
router.get('/courses/:courseId/enrollments', async (req, res) => {
  try {
    console.log('Fetching enrollments for course:', req.params.courseId);
    const enrollments = await Enrollment.find({
      course: req.params.courseId
    }).populate('student', 'name email').sort({ enrolledAt: -1 });
    console.log('Found enrollments:', enrollments.length);
    res.json({ success: true, data: enrollments });
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/courses/:courseId/review',  adminController.reviewCourse);
router.delete('/courses/:courseId',        adminController.removeCourse);

// ── Certificate Management ────────────────────────────────────────────────────
router.patch('/certificates/:certId/revoke', adminController.revokeCertificate);

module.exports = router;