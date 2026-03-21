const Quiz       = require('../models/Quiz');
const Submission = require('../models/Submission');
const Enrollment = require('../models/Enrollment');
const { asyncHandler } = require('../middleware/errorHandler');

// Create quiz
const createQuiz = asyncHandler(async (req, res) => {
  const { title, courseId, description, questions, passingMarks, durationMins, maxAttempts, shuffleQuestions } = req.body;
  const quiz = await Quiz.create({ title, course: courseId, instructor: req.user._id, description, questions, passingMarks, durationMins, maxAttempts, shuffleQuestions });
  res.status(201).json({ success: true, message: 'Quiz created.', data: quiz });
});

// Get quizzes for a course
const getCourseQuizzes = asyncHandler(async (req, res) => {
  const filter = { course: req.params.courseId };
  if (req.user.role === 'student') filter.isPublished = true;
  const quizzes = await Quiz.find(filter).select('title durationMins totalMarks passingMarks maxAttempts isPublished');
  res.json({ success: true, data: quizzes });
});

// Get single quiz (strip answers for students)
const getQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id).populate('course', 'title');
  if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found.' });
  if (!quiz.isPublished && req.user.role === 'student')
    return res.status(403).json({ success: false, message: 'Quiz not published.' });
  let data = quiz.toObject();
  if (req.user.role === 'student') {
    data.questions = data.questions.map(q => ({ ...q, options: q.options.map(o => ({ text: o.text })), correctAnswer: undefined }));
  }
  res.json({ success: true, data });
});

// Update quiz
const updateQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findOne({ _id: req.params.id, instructor: req.user._id });
  if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found.' });
  Object.assign(quiz, req.body);
  await quiz.save();
  res.json({ success: true, message: 'Quiz updated.', data: quiz });
});

// Delete quiz
const deleteQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found.' });

  if (quiz.instructor.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }

  // Delete all submissions for this quiz too
  await Submission.deleteMany({ quiz: quiz._id });
  await quiz.deleteOne();

  res.json({ success: true, message: 'Quiz and all submissions deleted.' });
});

// Toggle publish
const togglePublish = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findOne({ _id: req.params.id, instructor: req.user._id });
  if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found.' });
  quiz.isPublished = !quiz.isPublished;
  await quiz.save();
  res.json({ success: true, message: `Quiz ${quiz.isPublished ? 'published' : 'unpublished'}.`, data: quiz });
});

// Submit quiz (student)
const submitQuiz = asyncHandler(async (req, res) => {
  const { answers, timeTakenSecs } = req.body;
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz || !quiz.isPublished) return res.status(404).json({ success: false, message: 'Quiz not found.' });

  const enrollment = await Enrollment.findOne({ student: req.user._id, course: quiz.course });
  if (!enrollment) return res.status(403).json({ success: false, message: 'Enroll in the course first.' });

  const attempts = await Submission.countDocuments({ quiz: quiz._id, student: req.user._id });
  if (attempts >= quiz.maxAttempts) return res.status(400).json({ success: false, message: `Max ${quiz.maxAttempts} attempts reached.` });

  let obtainedMarks = 0;
  const gradedAnswers = (answers || []).map(ans => {
    const question = quiz.questions.id(ans.questionId);
    if (!question) return { ...ans, isCorrect: false, marksObtained: 0 };
    let isCorrect = false;
    if (question.type === 'mcq' || question.type === 'true_false') {
      const correct = question.options.find(o => o.isCorrect);
      isCorrect = correct && correct.text.toLowerCase() === (ans.selectedOption || '').toLowerCase();
    } else {
      isCorrect = (question.correctAnswer || '').toLowerCase().trim() === (ans.textAnswer || '').toLowerCase().trim();
    }
    const marksObtained = isCorrect ? question.marks : 0;
    obtainedMarks += marksObtained;
    return { questionId: ans.questionId, selectedOption: ans.selectedOption, textAnswer: ans.textAnswer, isCorrect, marksObtained };
  });

  const percentage = quiz.totalMarks > 0 ? Math.round((obtainedMarks / quiz.totalMarks) * 100) : 0;
  const passed = obtainedMarks >= quiz.passingMarks;

  const submission = await Submission.create({
    quiz: quiz._id, student: req.user._id, course: quiz.course,
    answers: gradedAnswers, totalMarks: quiz.totalMarks, obtainedMarks,
    percentage, passed, timeTakenSecs, attemptNumber: attempts + 1,
    status: 'graded', gradedAt: new Date(),
  });

  res.status(201).json({ success: true, message: passed ? 'Congratulations! You passed.' : 'Quiz submitted.', data: { obtainedMarks, totalMarks: quiz.totalMarks, percentage, passed, attemptNumber: submission.attemptNumber, gradedAnswers } });
});

// My submissions
const getMySubmissions = asyncHandler(async (req, res) => {
  const submissions = await Submission.find({ quiz: req.params.quizId, student: req.user._id }).sort({ submittedAt: -1 });
  res.json({ success: true, data: submissions });
});

// All submissions (instructor)
const getAllSubmissions = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findOne({ _id: req.params.quizId, instructor: req.user._id });
  if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found.' });
  const submissions = await Submission.find({ quiz: quiz._id }).populate('student', 'name email').sort({ submittedAt: -1 });
  res.json({ success: true, data: submissions });
});

// Provide feedback
const provideFeedback = asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.submissionId);
  if (!submission) return res.status(404).json({ success: false, message: 'Submission not found.' });
  submission.instructorFeedback = req.body.feedback;
  submission.status = 'graded';
  await submission.save();
  res.json({ success: true, message: 'Feedback submitted.', data: submission });
});

module.exports = { createQuiz, getCourseQuizzes, getQuiz, updateQuiz, deleteQuiz, togglePublish, submitQuiz, getMySubmissions, getAllSubmissions, provideFeedback };
