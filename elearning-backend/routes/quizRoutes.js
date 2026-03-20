const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const quizController = require('../controllers/quizController');

router.use(protect);

// Student & Instructor
router.get('/course/:courseId',    quizController.getCourseQuizzes);
router.get('/:id',                 quizController.getQuiz);

// Student only
router.post('/:id/submit',                              authorize('student'),             quizController.submitQuiz);
router.get('/:quizId/my-submissions',                   authorize('student'),             quizController.getMySubmissions);

// Instructor only
router.post('/',                                        authorize('instructor', 'admin'), quizController.createQuiz);
router.put('/:id',                                      authorize('instructor', 'admin'), quizController.updateQuiz);
router.delete('/:id',                                   authorize('instructor', 'admin'), quizController.deleteQuiz);
router.patch('/:id/toggle-publish',                     authorize('instructor', 'admin'), quizController.togglePublish);
router.get('/:quizId/submissions',                      authorize('instructor', 'admin'), quizController.getAllSubmissions);
router.put('/submissions/:submissionId/feedback',        authorize('instructor', 'admin'), quizController.provideFeedback);

module.exports = router;
