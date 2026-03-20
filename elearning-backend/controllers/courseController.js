const Course     = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { asyncHandler } = require('../middleware/errorHandler');
let cloudinary = null;
try { if (process.env.CLOUDINARY_CLOUD_NAME) cloudinary = require('../config/cloudinary').cloudinary; } catch(e) {}

// ── Get All Approved Courses (public) ─────────────────────────────────────────
const getAllCourses = asyncHandler(async (req, res) => {
  const { category, level, search, page = 1, limit = 12 } = req.query;
  const filter = { status: 'approved', isPublished: true };

  if (category) filter.category = category;
  if (level)    filter.level    = level;
  if (search)   filter.title    = { $regex: search, $options: 'i' };

  const skip   = (Number(page) - 1) * Number(limit);
  const total  = await Course.countDocuments(filter);
  const courses = await Course.find(filter)
    .populate('instructor', 'name avatar')
    .select('-modules')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  res.json({
    success: true,
    data: courses,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
  });
});

// ── Get Single Course ─────────────────────────────────────────────────────────
const getCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate('instructor', 'name avatar bio');

  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found.' });
  }

  // Hide video URLs for non-enrolled users (preview only)
  let courseData = course.toObject();
  if (!req.user) {
    courseData.modules = courseData.modules.map(mod => ({
      ...mod,
      lectures: mod.lectures.map(lec => ({
        ...lec,
        videoUrl: lec.isFree ? lec.videoUrl : null,
      })),
    }));
  } else {
    const enrolled = await Enrollment.findOne({
      student: req.user._id,
      course: course._id,
      status: 'active',
    });
    if (!enrolled && req.user.role === 'student') {
      courseData.modules = courseData.modules.map(mod => ({
        ...mod,
        lectures: mod.lectures.map(lec => ({
          ...lec,
          videoUrl: lec.isFree ? lec.videoUrl : null,
        })),
      }));
    }
  }

  res.json({ success: true, data: courseData });
});

// ── Create Course (instructor) ────────────────────────────────────────────────
const createCourse = asyncHandler(async (req, res) => {
  const { title, description, category, level, language, price, requirements, outcomes, tags } = req.body;

  const course = await Course.create({
    title,
    description,
    category,
    level,
    language,
    price: price || 0,
    isFree: !price || price === 0,
    requirements: requirements ? JSON.parse(requirements) : [],
    outcomes:     outcomes     ? JSON.parse(outcomes)     : [],
    tags:         tags         ? JSON.parse(tags)         : [],
    instructor: req.user._id,
    thumbnail: req.file ? req.file.path : '',
    status: 'draft',
  });

  res.status(201).json({ success: true, message: 'Course created successfully.', data: course });
});

// ── Update Course ─────────────────────────────────────────────────────────────
const updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

  // Only instructor owner or admin can update
  if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to update this course.' });
  }

  const updates = { ...req.body };
  if (req.file) updates.thumbnail = req.file.path;
  if (updates.requirements) updates.requirements = JSON.parse(updates.requirements);
  if (updates.outcomes)     updates.outcomes     = JSON.parse(updates.outcomes);
  if (updates.tags)         updates.tags         = JSON.parse(updates.tags);

  // Reset to pending if re-submitted after rejection
  if (course.status === 'rejected') updates.status = 'draft';

  const updated = await Course.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  res.json({ success: true, message: 'Course updated.', data: updated });
});

// ── Delete Course ─────────────────────────────────────────────────────────────
const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

  if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }

  // Delete all Cloudinary videos
  for (const mod of course.modules) {
    for (const lec of mod.lectures) {
      if (lec.publicId) {
        await cloudinary.uploader.destroy(lec.publicId, { resource_type: 'video' }).catch(console.error);
      }
    }
  }

  await course.deleteOne();
  await Enrollment.deleteMany({ course: course._id });

  res.json({ success: true, message: 'Course deleted successfully.' });
});


// ── Submit Course for Approval ────────────────────────────────────────────────
const submitForApproval = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

  if (course.instructor.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }

  if (course.modules.length === 0) {
    return res.status(400).json({ success: false, message: 'Add at least one module before submitting.' });
  }

  course.status = 'pending';
  await course.save();

  res.json({ success: true, message: 'Course submitted for admin approval.' });
});

// ── Add Module to Course ──────────────────────────────────────────────────────
const addModule = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

  if (course.instructor.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }

  course.modules.push({ title: req.body.title, order: course.modules.length });
  await course.save();

  res.status(201).json({ success: true, message: 'Module added.', data: course.modules });
});

// ── Upload Lecture Video ──────────────────────────────────────────────────────
const uploadLecture = asyncHandler(async (req, res) => {
  console.log('=== LECTURE BODY ===', req.body);
  console.log('=== LECTURE FILE ===', req.file);

  const course = await Course.findOne({
    _id:        req.params.courseId,
    instructor: req.user._id,
  });
  if (!course) return res.status(404).json({
    success: false, message: 'Course not found.'
  });

  const mod = course.modules.id(req.params.moduleId);
  if (!mod) return res.status(404).json({
    success: false, message: 'Module not found.'
  });

  // Get title — handle all cases
  const title = String(req.body.title || '').trim();
  console.log('Title:', title);

  if (!title) {
    return res.status(400).json({
      success: false, message: 'Lecture title is required.'
    });
  }

  // Get video URL — from body or from uploaded file
  let videoUrl = '';
  if (req.body.videoUrl && String(req.body.videoUrl).trim()) {
    videoUrl = String(req.body.videoUrl).trim();
  } else if (req.file) {
    videoUrl = req.file.path || req.file.secure_url || '';
  }

  console.log('VideoUrl saved:', videoUrl);

  const newLecture = {
    title,
    description: String(req.body.description || ''),
    isFree:      req.body.isFree === true || req.body.isFree === 'true',
    order:       mod.lectures.length,
    videoUrl,
    publicId:    req.file ? (req.file.filename || '') : '',
    duration:    Number(req.body.duration) || 0,
    materials:   [],
  };

  mod.lectures.push(newLecture);

  const saved = await course.save();
  console.log('Course saved, lectures count:', mod.lectures.length);

  res.status(201).json({
    success: true,
    message: 'Lecture added successfully!',
    data:    mod.lectures,
  });
});

// ── Upload Study Material ─────────────────────────────────────────────────────
const uploadMaterial = asyncHandler(async (req, res) => {
  const { courseId, moduleId, lectureId } = req.params;

  const course = await Course.findById(courseId);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

  const module = course.modules.id(moduleId);
  if (!module) return res.status(404).json({ success: false, message: 'Module not found.' });

  const lecture = module.lectures.id(lectureId);
  if (!lecture) return res.status(404).json({ success: false, message: 'Lecture not found.' });

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.' });
  }

  lecture.materials.push({
    name: req.file.originalname,
    url:  req.file.path,
    type: req.file.mimetype,
  });

  await course.save();
  res.status(201).json({ success: true, message: 'Material uploaded.', data: lecture.materials });
});

// ── Get Instructor's Courses ──────────────────────────────────────────────────
const getInstructorCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find({ instructor: req.user._id })
    .select('title status enrollmentCount rating createdAt thumbnail')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: courses });
});

const deleteLecture = asyncHandler(async (req, res) => {
  const course = await Course.findOne({
    _id:        req.params.courseId,
    instructor: req.user._id,
  });
  if (!course) return res.status(404).json({ success:false, message:'Course not found.' });

  const mod = course.modules.id(req.params.moduleId);
  if (!mod) return res.status(404).json({ success:false, message:'Module not found.' });

  mod.lectures.pull({ _id: req.params.lectureId });
  await course.save();

  res.json({ success:true, message:'Lecture deleted!', data:mod.lectures });
});

const deleteModule = asyncHandler(async (req, res) => {
  const course = await Course.findOne({
    _id:        req.params.id,
    instructor: req.user._id,
  });
  if (!course) return res.status(404).json({ success:false, message:'Course not found.' });

  course.modules.pull({ _id: req.params.moduleId });
  await course.save();

  res.json({ success:true, message:'Module deleted!', data:course.modules });
});

module.exports = {
  getAllCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  submitForApproval,
  addModule,
  deleteModule,
  uploadLecture,
  deleteLecture,
  uploadMaterial,
  getInstructorCourses,
};
