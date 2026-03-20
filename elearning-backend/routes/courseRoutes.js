const express = require('express');
const multer  = require('multer');
const router  = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const courseController = require('../controllers/courseController');

// Safe Cloudinary upload — fallback to multer memory
const upload = multer({ storage: multer.memoryStorage() });
let thumbUpload    = upload;
let videoUpload    = upload;
let materialUpload = upload;

try {
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    const c = require('../config/cloudinary');
    thumbUpload    = c.uploadImage;
    videoUpload    = c.uploadVideo;
    materialUpload = c.uploadMaterial;
  }
} catch (e) {}

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/', courseController.getAllCourses);

// ── Protected ─────────────────────────────────────────────────────────────────
router.use(protect);

// IMPORTANT: specific routes BEFORE /:id
router.get('/instructor/my-courses',
  authorize('instructor', 'admin'),
  courseController.getInstructorCourses
);

router.post('/',
  authorize('instructor', 'admin'),
  thumbUpload.single('thumbnail'),
  courseController.createCourse
);

router.get('/:id', courseController.getCourse);

router.put('/:id',
  authorize('instructor', 'admin'),
  thumbUpload.single('thumbnail'),
  courseController.updateCourse
);

router.delete('/:id',
  authorize('instructor', 'admin'),
  courseController.deleteCourse
);

router.post('/:id/submit',
  authorize('instructor'),
  courseController.submitForApproval
);

// ── Module routes ─────────────────────────────────────────────────────────────
router.post('/:id/modules',
  authorize('instructor', 'admin'),
  courseController.addModule
);

router.delete('/:id/modules/:moduleId',
  authorize('instructor', 'admin'),
  courseController.deleteModule
);

// ── Lecture routes ────────────────────────────────────────────────────────────
router.post('/:courseId/modules/:moduleId/lectures',
  authorize('instructor', 'admin'),
  (req, res, next) => {
    const ct = req.headers['content-type'] || '';
    if (ct.includes('application/json')) return next();
    videoUpload.single('video')(req, res, next);
  },
  courseController.uploadLecture
);

router.delete('/:courseId/modules/:moduleId/lectures/:lectureId',
  authorize('instructor', 'admin'),
  courseController.deleteLecture
);

// ── Material routes ───────────────────────────────────────────────────────────
router.post('/:courseId/modules/:moduleId/lectures/:lectureId/materials',
  authorize('instructor', 'admin'),
  materialUpload.single('file'),
  courseController.uploadMaterial
);

module.exports = router;