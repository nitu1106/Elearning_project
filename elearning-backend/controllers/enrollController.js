const Enrollment  = require('../models/Enrollment');
const Course      = require('../models/Course');
const Certificate = require('../models/Certificate');
const User        = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendEmail, emailTemplates } = require('../utils/emailUtils');

let generateCertificatePDF = null;
try { generateCertificatePDF = require('../utils/certificateGenerator').generateCertificatePDF; } catch(e) {}

// Enroll in a course
const enrollCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId).populate('instructor', 'name');
  if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
  if (course.status !== 'approved' || !course.isPublished)
    return res.status(400).json({ success: false, message: 'Course not available for enrollment.' });

  const existing = await Enrollment.findOne({ student: req.user._id, course: course._id });
  if (existing) return res.status(400).json({ success: false, message: 'Already enrolled.' });

  const enrollment = await Enrollment.create({ student: req.user._id, course: course._id });
  await Course.findByIdAndUpdate(course._id, { $inc: { enrollmentCount: 1 } });

  const tmpl = emailTemplates.enrollmentConfirm(req.user.name, course.title);
  sendEmail({ to: req.user.email, ...tmpl }).catch(() => {});

  res.status(201).json({ success: true, message: 'Enrolled successfully.', data: enrollment });
});

// Get my enrollments
const getMyEnrollments = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({ student: req.user._id })
    .populate('course', 'title thumbnail instructor category totalLectures totalDuration')
    .sort({ enrolledAt: -1 });
  res.json({ success: true, data: enrollments });
});

// Get single enrollment
const getEnrollmentDetail = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findOne({ _id: req.params.id, student: req.user._id })
    .populate('course');
  if (!enrollment) return res.status(404).json({ success: false, message: 'Enrollment not found.' });
  res.json({ success: true, data: enrollment });
});

// Update lecture progress
const updateLectureProgress = asyncHandler(async (req, res) => {
  const { lectureId, watchedTime, completed } = req.body;
  const enrollment = await Enrollment.findOne({
    student: req.user._id, course: req.params.courseId, status: 'active',
  });
  if (!enrollment) return res.status(404).json({ success: false, message: 'Enrollment not found.' });

  const existing = enrollment.lectureProgress.find(lp => lp.lectureId.toString() === lectureId);
  if (existing) {
    if (watchedTime !== undefined) existing.watchedTime = watchedTime;
    if (completed !== undefined) { existing.completed = completed; existing.completedAt = completed ? new Date() : null; }
  } else {
    enrollment.lectureProgress.push({ lectureId, watchedTime: watchedTime || 0, completed: completed || false, completedAt: completed ? new Date() : null });
  }

  const course = await Course.findById(req.params.courseId);
  const total = course.totalLectures || 1;
  const done  = enrollment.lectureProgress.filter(lp => lp.completed).length;
  enrollment.progressPercent = Math.round((done / total) * 100);

  if (enrollment.progressPercent === 100 && enrollment.status === 'active') {
    enrollment.status = 'completed';
    enrollment.completedAt = new Date();
    await enrollment.save();
    issueCert(enrollment, course, req.user);
  } else {
    await enrollment.save();
  }

  res.json({ success: true, message: 'Progress updated.', data: { progressPercent: enrollment.progressPercent } });
});

async function issueCert(enrollment, course, user) {
  try {
    if (enrollment.certificateIssued) return;
    const instructor = await User.findById(course.instructor).select('name');
    let certUrl = '';
    if (generateCertificatePDF) {
      certUrl = await generateCertificatePDF({
        studentName: user.name, courseName: course.title,
        instructorName: instructor?.name || 'Instructor',
        certificateId: enrollment._id.toString(), issuedAt: new Date(),
      });
    }
    const cert = await Certificate.create({ student: user._id, course: course._id, enrollment: enrollment._id, certificateUrl: certUrl });
    enrollment.certificateIssued   = true;
    enrollment.certificateIssuedAt = new Date();
    await enrollment.save();
    const tmpl = emailTemplates.certificateIssued(user.name, course.title, cert.certificateId);
    sendEmail({ to: user.email, ...tmpl }).catch(() => {});
  } catch(e) { console.error('Cert error:', e.message); }
}

// Rate a course
const rateCourse = asyncHandler(async (req, res) => {
  const { score, review } = req.body;
  const enrollment = await Enrollment.findOne({ student: req.user._id, course: req.params.courseId });
  if (!enrollment) return res.status(404).json({ success: false, message: 'Not enrolled.' });
  enrollment.rating = { score, review, ratedAt: new Date() };
  await enrollment.save();
  const all = await Enrollment.find({ course: req.params.courseId, 'rating.score': { $exists: true } });
  const avg = all.reduce((s, e) => s + e.rating.score, 0) / all.length;
  await Course.findByIdAndUpdate(req.params.courseId, { 'rating.average': Math.round(avg * 10) / 10, 'rating.count': all.length });
  res.json({ success: true, message: 'Rating submitted.' });
});

module.exports = { enrollCourse, getMyEnrollments, getEnrollmentDetail, updateLectureProgress, rateCourse };
