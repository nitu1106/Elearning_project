const express = require('express');
const multer  = require('multer');
const router  = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const courseController = require('../controllers/courseController');

//Safe Cloudinary upload — fallback to multer memory
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

// specific routes BEFORE /:id
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

// Edit module title
router.patch('/:id/modules/:moduleId',
  authorize('instructor', 'admin'),
  async (req, res) => {
    try {
      const Course = require('../models/Course');
      const course = await Course.findOne({ _id: req.params.id, instructor: req.user._id });
      if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
      const mod = course.modules.id(req.params.moduleId);
      if (!mod) return res.status(404).json({ success: false, message: 'Module not found.' });
      if (req.body.title) mod.title = req.body.title;
      await course.save();
      res.json({ success: true, message: 'Module updated!', data: course.modules });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  }
);

router.delete('/:id/modules/:moduleId',
  authorize('instructor', 'admin'),
  courseController.deleteModule
);

// ── Lecture routes ─────────────────────────────────────────────────────────────
router.post('/:courseId/modules/:moduleId/lectures',
  authorize('instructor', 'admin'),
  (req, res, next) => {
    const ct = req.headers['content-type'] || '';
    if (ct.includes('application/json')) return next();
    videoUpload.single('video')(req, res, next);
  },
  courseController.uploadLecture
);

// Edit lecture
router.patch('/:courseId/modules/:moduleId/lectures/:lectureId',
  authorize('instructor', 'admin'),
  async (req, res) => {
    try {
      const Course = require('../models/Course');
      const course = await Course.findOne({ _id: req.params.courseId, instructor: req.user._id });
      if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
      const mod = course.modules.id(req.params.moduleId);
      if (!mod) return res.status(404).json({ success: false, message: 'Module not found.' });
      const lec = mod.lectures.id(req.params.lectureId);
      if (!lec) return res.status(404).json({ success: false, message: 'Lecture not found.' });
      if (req.body.title)       lec.title       = req.body.title;
      if (req.body.description !== undefined) lec.description = req.body.description;
      if (req.body.videoUrl !== undefined)    lec.videoUrl    = req.body.videoUrl;
      if (req.body.isFree !== undefined)      lec.isFree      = req.body.isFree;
      await course.save();
      res.json({ success: true, message: 'Lecture updated!', data: mod.lectures });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  }
);

router.delete('/:courseId/modules/:moduleId/lectures/:lectureId',
  authorize('instructor', 'admin'),
  courseController.deleteLecture
);

// ── Material routes ───────────────────────────────────────────────────────────
// ✅ For the materials route, just skip multer entirely
router.post('/:courseId/modules/:moduleId/lectures/:lectureId/materials',
  authorize('instructor', 'admin'),
  express.json(),               // ← just parse JSON
  courseController.uploadMaterial
);

module.exports = router;
