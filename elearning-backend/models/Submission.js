const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId:     { type: mongoose.Schema.Types.ObjectId, required: true },
  selectedOption: { type: String },   // for MCQ / true-false
  textAnswer:     { type: String },   // for short_answer
  isCorrect:      { type: Boolean },
  marksObtained:  { type: Number, default: 0 },
}, { _id: false });

const submissionSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
  },
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
  answers:       [answerSchema],
  totalMarks:    { type: Number, default: 0 },
  obtainedMarks: { type: Number, default: 0 },
  percentage:    { type: Number, default: 0 },
  passed:        { type: Boolean, default: false },
  timeTakenSecs: { type: Number },
  attemptNumber: { type: Number, default: 1 },
  status: {
    type: String,
    enum: ['submitted', 'graded', 'pending_review'],
    default: 'submitted',
  },
  instructorFeedback: { type: String },
  submittedAt: { type: Date, default: Date.now },
  gradedAt:    { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Submission', submissionSchema);
