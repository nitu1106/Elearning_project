const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const progressController = require('../controllers/progressController');

// Public certificate verification
router.get('/verify-certificate/:certId', progressController.verifyCertificate);

router.use(protect);
router.get('/dashboard',                   authorize('student'),             progressController.getStudentDashboard);
router.get('/course/:courseId',            authorize('student'),             progressController.getCourseProgress);
router.get('/certificates/:certId',        authorize('student'),             progressController.getCertificate);
router.get('/instructor/course/:courseId', authorize('instructor', 'admin'), progressController.getCoursePerformance);

module.exports = router;
