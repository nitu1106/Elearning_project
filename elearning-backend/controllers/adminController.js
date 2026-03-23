const User        = require('../models/User');
const Course      = require('../models/Course');
const Enrollment  = require('../models/Enrollment');
const Submission  = require('../models/Submission');
const Certificate = require('../models/Certificate');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendEmail } = require('../utils/emailUtils');

// Platform stats
const getPlatformStats = asyncHandler(async (req, res) => {
  const [totalStudents, totalInstructors, totalCourses, approvedCourses,
         pendingCourses, totalEnrollments, totalCertificates] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'instructor' }),
    Course.countDocuments(),
    Course.countDocuments({ status: 'approved' }),
    Course.countDocuments({ status: 'pending' }),
    Enrollment.countDocuments(),
    Certificate.countDocuments(),
  ]);

  const revenueData = await Enrollment.aggregate([
    { $lookup: { from: 'courses', localField: 'course', foreignField: '_id', as: 'courseInfo' } },
    { $unwind: '$courseInfo' },
    { $group: { _id: null, totalRevenue: { $sum: '$courseInfo.price' } } },
  ]);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const monthlyTrend = await Enrollment.aggregate([
    { $match: { enrolledAt: { $gte: sixMonthsAgo } } },
    { $group: { _id: { year: { $year: '$enrolledAt' }, month: { $month: '$enrolledAt' } }, count: { $sum: 1 } } },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  res.json({ success: true, data: {
    totalStudents, totalInstructors, totalCourses,
    approvedCourses, pendingCourses, totalEnrollments, totalCertificates,
    totalRevenue: revenueData[0]?.totalRevenue || 0,
    monthlyTrend,
  }});
});

// Get all users
const getAllUsers = asyncHandler(async (req, res) => {
  const { role, isActive, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    User.countDocuments(filter),
  ]);
  res.json({ success: true, data: users, pagination: { page: Number(page), limit: Number(limit), total } });
});

// Create instructor account
const createInstructor = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ success: false, message: 'Email already exists.' });
  const instructor = await User.create({ name, email, password, role: 'instructor' });
  sendEmail({
    to: email, subject: 'Your Instructor Account – EduSphere',
    html: `<p>Hi ${name}, your instructor account has been created. Login with your email and the provided password.</p>`,
  }).catch(() => {});
  res.status(201).json({ success: true, message: 'Instructor account created.', data: instructor });
});

// Toggle user active status
const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot deactivate admin.' });
  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });
  res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}.`, data: { isActive: user.isActive } });
});

// Delete user
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot delete admin.' });
  await user.deleteOne();
  res.json({ success: true, message: 'User deleted.' });
});

// Get all courses (admin view)
const getAllCoursesAdmin = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  const skip = (Number(page) - 1) * Number(limit);
  const [courses, total] = await Promise.all([
    Course.find(filter)
      .populate('instructor', 'name email')
      .select('title status enrollmentCount instructor createdAt thumbnail')
      .sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Course.countDocuments(filter),
  ]);
  res.json({ success: true, data: courses, pagination: { page: Number(page), total } });
});

// Get pending courses
const getPendingCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find({ status: 'pending' })
    .populate('instructor', 'name email')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: courses });
});

// Approve or reject course
const reviewCourse = asyncHandler(async (req, res) => {
  const { action, feedback } = req.body;
  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ success: false, message: "Action must be 'approve' or 'reject'." });
  }
  const course = await Course.findById(req.params.courseId).populate('instructor', 'name email');
  if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
  course.status      = action === 'approve' ? 'approved' : 'rejected';
  course.isPublished = action === 'approve';
  if (feedback) course.adminFeedback = feedback;
  await course.save();
  sendEmail({
    to: course.instructor.email,
    subject: `Course ${course.status}: ${course.title}`,
    html: `<p>Hi ${course.instructor.name}, your course <strong>${course.title}</strong> has been ${course.status}. ${feedback ? `Feedback: ${feedback}` : ''}</p>`,
  }).catch(() => {});
  res.json({ success: true, message: `Course ${course.status}.`, data: course });
});

// Remove course
const removeCourse = asyncHandler(async (req, res) => {
  const course = await Course.findByIdAndDelete(req.params.courseId);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
  res.json({ success: true, message: 'Course removed.' });
});

// Learning report
const getLearningReport = asyncHandler(async (req, res) => {
  const topCourses = await Course.find({ status: 'approved' })
    .sort({ enrollmentCount: -1 }).limit(10).select('title enrollmentCount rating');

  const topStudents = await Enrollment.aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: '$student', completedCourses: { $sum: 1 } } }, 
    { $sort: { completedCourses: -1 } }, { $limit: 10 },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'student', pipeline: [{ $project: { name: 1, email: 1 } }] } }, //1 means ->include and o means ->exclude
    { $unwind: '$student' },
  ]);

  const quizStats = await Submission.aggregate([
    { $group: { _id: null, avgScore: { $avg: '$percentage' }, totalAttempts: { $sum: 1 }, passed: { $sum: { $cond: ['$passed', 1, 0] } } } },
  ]);

  res.json({ success: true, data: { topCourses, topStudents, quizStats: quizStats[0] || {} } });
});

// Revoke certificate
const revokeCertificate = asyncHandler(async (req, res) => {
  const cert = await Certificate.findById(req.params.certId);
  if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found.' });
  cert.isValid   = false;
  cert.revokedAt = new Date();
  cert.revokedBy = req.user._id;
  await cert.save();
  res.json({ success: true, message: 'Certificate revoked.' });
});

module.exports = {
  getPlatformStats,
  getAllUsers,
  createInstructor,
  toggleUserStatus,
  deleteUser,
  getAllCoursesAdmin,
  getPendingCourses,
  reviewCourse,
  removeCourse,
  getLearningReport,
  revokeCertificate,
};
