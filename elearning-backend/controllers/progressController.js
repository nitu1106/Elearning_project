const Enrollment  = require('../models/Enrollment');
const Submission  = require('../models/Submission');
const Certificate = require('../models/Certificate');
const Course      = require('../models/Course');
const { asyncHandler } = require('../middleware/errorHandler');

// ── Student Dashboard ─────────────────────────────────────────────────────────
const getStudentDashboard = asyncHandler(async (req, res) => {
  const studentId = req.user._id;

  const [enrollments, submissions, certificates] = await Promise.all([
    Enrollment.find({ student: studentId })
      .populate('course', 'title thumbnail category totalLectures')
      .sort({ enrolledAt: -1 }),
    Submission.find({ student: studentId })
      .populate('quiz', 'title totalMarks')
      .sort({ submittedAt: -1 })
      .limit(10),
    Certificate.find({ student: studentId })
      .populate('course', 'title'),
  ]);

  // ── Filter out submissions where quiz was deleted ──────────────────────────
  const validSubmissions = submissions.filter(s => s.quiz !== null);

  const stats = {
    totalEnrolled: enrollments.length,
    completed:     enrollments.filter(e => e.status === 'completed').length,
    inProgress:    enrollments.filter(e => e.status === 'active').length,
    certificates:  certificates.length,
    avgQuizScore:  validSubmissions.length
      ? Math.round(validSubmissions.reduce((s, x) => s + x.percentage, 0) / validSubmissions.length)
      : 0,
  };

  res.json({
    success: true,
    data: {
      stats,
      enrollments,
      recentQuizzes: validSubmissions,  // ← only valid quizzes
      certificates,
    }
  });
});

// ── Per-course Progress ───────────────────────────────────────────────────────
const getCourseProgress = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    course:  req.params.courseId,
  }).populate('course');

  if (!enrollment) return res.status(404).json({ success: false, message: 'Enrollment not found.' });

  const submissions = await Submission.find({
    student: req.user._id,
    course:  req.params.courseId,
  }).populate('quiz', 'title totalMarks passingMarks');

  res.json({
    success: true,
    data: {
      enrollment,
      progressPercent:  enrollment.progressPercent,
      lectureProgress:  enrollment.lectureProgress,
      quizResults:      submissions.filter(s => s.quiz !== null),
    }
  });
});

// ── Instructor: Student Performance ──────────────────────────────────────────
const getCoursePerformance = asyncHandler(async (req, res) => {
  const course = await Course.findOne({ _id: req.params.courseId, instructor: req.user._id });
  if (!course) return res.status(403).json({ success: false, message: 'Not authorized.' });

  const enrollments = await Enrollment.find({ course: req.params.courseId })
    .populate('student', 'name email avatar')
    .select('student progressPercent status enrolledAt completedAt rating');

  const submissions = await Submission.find({ course: req.params.courseId })
    .populate('student', 'name')
    .populate('quiz', 'title totalMarks');

  res.json({
    success: true,
    data: {
      enrollments,
      quizSubmissions: submissions.filter(s => s.quiz !== null),
    }
  });
});

// ── Provide Feedback (instructor) ─────────────────────────────────────────────
const provideFeedback = asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.submissionId);
  if (!submission) return res.status(404).json({ success: false, message: 'Submission not found.' });

  submission.instructorFeedback = req.body.feedback;
  await submission.save();
  res.json({ success: true, message: 'Feedback saved.', data: submission });
});

// ── Get Certificate (student) ─────────────────────────────────────────────────
const getCertificate = asyncHandler(async (req, res) => {
  const cert = await Certificate.findOne({
    _id:     req.params.certId,
    student: req.user._id,
  }).populate('course', 'title').populate('student', 'name');

  if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found.' });
  res.json({ success: true, data: cert });
});

// ── Verify Certificate (public) ───────────────────────────────────────────────
const verifyCertificate = asyncHandler(async (req, res) => {
  const cert = await Certificate.findOne({ certificateId: req.params.certId })
    .populate('student', 'name')
    .populate('course', 'title');

  if (!cert) return res.status(404).json({ success: false, message: 'Invalid certificate.' });

  res.json({
    success: true,
    data: {
      isValid:       cert.isValid,
      studentName:   cert.student.name,
      courseName:    cert.course.title,
      issuedAt:      cert.issuedAt,
      certificateId: cert.certificateId,
    }
  });
});

module.exports = {
  getStudentDashboard,
  getCourseProgress,
  getCoursePerformance,
  provideFeedback,
  getCertificate,
  verifyCertificate,
};
