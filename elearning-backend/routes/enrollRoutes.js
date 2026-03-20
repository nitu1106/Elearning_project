const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const enrollController = require('../controllers/enrollController');

router.use(protect);
router.get('/',                     authorize('student'), enrollController.getMyEnrollments);
router.post('/:courseId',           authorize('student'), enrollController.enrollCourse);
router.get('/:id',                  enrollController.getEnrollmentDetail);
router.put('/:courseId/progress',   authorize('student'), enrollController.updateLectureProgress);
router.post('/:courseId/rate',      authorize('student'), enrollController.rateCourse);

module.exports = router;
