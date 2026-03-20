const mongoose = require('mongoose');

const lectureSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String },
  videoUrl:    { type: String },         // Cloudinary URL
  publicId:    { type: String },         // Cloudinary public_id for deletion
  duration:    { type: Number, default: 0 }, // seconds
  materials: [{
    name:  String,
    url:   String,
    type:  String,
  }],
  order:       { type: Number, default: 0 },
  isFree:      { type: Boolean, default: false },
}, { timestamps: true });

const moduleSchema = new mongoose.Schema({
  title:    { type: String, required: true },
  order:    { type: Number, default: 0 },
  lectures: [lectureSchema],
});

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    maxlength: [150, 'Title cannot exceed 150 characters'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [3000, 'Description cannot exceed 3000 characters'],
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  thumbnail:   { type: String, default: '' },
  category:    { type: String, required: true },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner',
  },
  language:    { type: String, default: 'English' },
  price:       { type: Number, default: 0 },
  isFree:      { type: Boolean, default: false },
  modules:     [moduleSchema],
  tags:        [String],
  requirements:[String],
  outcomes:    [String],
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected'],
    default: 'draft',
  },
  adminFeedback: { type: String },
  totalDuration: { type: Number, default: 0 }, // total seconds
  totalLectures: { type: Number, default: 0 },
  enrollmentCount:{ type: Number, default: 0 },
  rating: {
    average: { type: Number, default: 0 },
    count:   { type: Number, default: 0 },
  },
  isPublished: { type: Boolean, default: false },
}, { timestamps: true });

// Auto-calc totals before save
courseSchema.pre('save', function (next) {
  let totalLectures = 0;
  let totalDuration  = 0;
  this.modules.forEach(mod => {
    mod.lectures.forEach(lec => {
      totalLectures++;
      totalDuration += lec.duration || 0;
    });
  });
  this.totalLectures = totalLectures;
  this.totalDuration = totalDuration;
  next();
});

module.exports = mongoose.model('Course', courseSchema);
