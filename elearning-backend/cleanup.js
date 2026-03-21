require('dotenv').config();
const mongoose = require('mongoose');

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const Submission = require('./models/Submission');
    const Quiz = require('./models/Quiz');
    const Course = require('./models/Course');

    // Delete submissions for deleted quizzes
    const allSubmissions = await Submission.find({});
    let deletedSubs = 0;
    for (const sub of allSubmissions) {
      const quiz = await Quiz.findById(sub.quiz);
      if (!quiz) {
        await Submission.findByIdAndDelete(sub._id);
        deletedSubs++;
      }
    }
    console.log('Deleted orphan submissions:', deletedSubs);

    // Delete submissions for deleted courses
    const allSubs2 = await Submission.find({});
    let deletedSubs2 = 0;
    for (const sub of allSubs2) {
      const course = await Course.findById(sub.course);
      if (!course) {
        await Submission.findByIdAndDelete(sub._id);
        deletedSubs2++;
      }
    }
    console.log('Deleted course-orphan submissions:', deletedSubs2);

    const remaining = await Submission.find({});
    console.log('Remaining submissions:', remaining.length);
    console.log('Cleanup complete! Refresh dashboard now.');

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

cleanup();
