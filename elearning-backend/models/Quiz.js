const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  text:      { type: String, required: true },
  isCorrect: { type: Boolean, default: false },
}, { _id: false });

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  type: {
    type: String,
    enum: ['mcq', 'true_false', 'short_answer'],
    default: 'mcq',
  },
  options:       [optionSchema],      // for MCQ / true-false
  correctAnswer: { type: String },    // for short_answer
  marks:         { type: Number, default: 1 },
  explanation:   { type: String },
});

const quizSchema = new mongoose.Schema({
  title:      { type: String, required: true },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  description:    { type: String },
  questions:      [questionSchema],
  totalMarks:     { type: Number, default: 0 },
  passingMarks:   { type: Number, default: 0 },
  durationMins:   { type: Number, default: 30 },
  maxAttempts:    { type: Number, default: 3 },
  shuffleQuestions:{ type: Boolean, default: false },
  isPublished:    { type: Boolean, default: false },
}, { timestamps: true });

// Auto-calculate totalMarks
quizSchema.pre('save', function (next) {
  this.totalMarks = this.questions.reduce((sum, q) => sum + q.marks, 0);
  next();
});

module.exports = mongoose.model('Quiz', quizSchema);
