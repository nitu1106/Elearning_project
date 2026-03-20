const express  = require('express');
const router   = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const Course      = require('../models/Course');
const Enrollment  = require('../models/Enrollment');
const Submission  = require('../models/Submission');
const { asyncHandler } = require('../middleware/errorHandler');

router.use(protect, authorize('instructor', 'admin'));

// Instructor dashboard
router.get('/dashboard', asyncHandler(async (req, res) => {
  const instructorId = req.user._id;
  const courseIds = await Course.find({ instructor: instructorId }).distinct('_id');

  const [courses, totalEnrollments, recentSubmissions] = await Promise.all([
    Course.find({ instructor: instructorId })
      .select('title status enrollmentCount rating'),
    Enrollment.countDocuments({ course: { $in: courseIds } }),
    Submission.find({ course: { $in: courseIds } })
      .populate('student', 'name email')
      .populate('quiz', 'title')
      .sort({ submittedAt: -1 })
      .limit(10),
  ]);

  const stats = {
    totalCourses:     courses.length,
    publishedCourses: courses.filter(c => c.status === 'approved').length,
    draftCourses:     courses.filter(c => c.status === 'draft').length,
    pendingCourses:   courses.filter(c => c.status === 'pending').length,
    totalEnrollments,
    avgRating: courses.length
      ? (courses.reduce((s, c) => s + (c.rating?.average || 0), 0) / courses.length).toFixed(1)
      : 0,
  };

  res.json({ success: true, data: { stats, courses, recentSubmissions } });
}));

// Students enrolled in a course
router.get('/courses/:courseId/students', asyncHandler(async (req, res) => {
  const course = await Course.findOne({ _id: req.params.courseId, instructor: req.user._id });
  if (!course) return res.status(403).json({ success: false, message: 'Not authorized.' });

  const enrollments = await Enrollment.find({ course: course._id })
    .populate('student', 'name email avatar createdAt')
    .select('progressPercent status enrolledAt completedAt rating');

  res.json({ success: true, data: enrollments });
}));

module.exports = router;
