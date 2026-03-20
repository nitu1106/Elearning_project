const mongoose = require('mongoose');

const lectureProgressSchema = new mongoose.Schema({
  lectureId:   { type: mongoose.Schema.Types.ObjectId, required: true },
  completed:   { type: Boolean, default: false },
  watchedTime: { type: Number, default: 0 }, // seconds watched
  completedAt: { type: Date },
}, { _id: false });

const enrollmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  enrolledAt:      { type: Date, default: Date.now },
  completedAt:     { type: Date },
  progressPercent: { type: Number, default: 0 },
  lectureProgress: [lectureProgressSchema],
  status: {
    type: String,
    enum: ['active', 'completed', 'dropped'],
    default: 'active',
  },
  certificateIssued:   { type: Boolean, default: false },
  certificateIssuedAt: { type: Date },
  rating: {
    score:  { type: Number, min: 1, max: 5 },
    review: { type: String },
    ratedAt:{ type: Date },
  },
}, { timestamps: true });

// Prevent duplicate enrollments
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
