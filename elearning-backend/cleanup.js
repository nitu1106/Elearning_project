require('dotenv').config();
const mongoose = require('mongoose');

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const Submission  = require('./models/Submission');
    const Certificate = require('./models/Certificate');
    const Enrollment  = require('./models/Enrollment');
    const Quiz        = require('./models/Quiz');
    const Course      = require('./models/Course');

    // 1. Delete submissions for deleted quizzes
    const allSubs = await Submission.find({});
    let deletedSubs = 0;
    for (const sub of allSubs) {
      const quiz = await Quiz.findById(sub.quiz);
      if (!quiz) {
        await Submission.findByIdAndDelete(sub._id);
        deletedSubs++;
      }
    }
    console.log('Deleted orphan submissions:', deletedSubs);

    // 2. Delete certificates for deleted courses
    const allCerts = await Certificate.find({});
    let deletedCerts = 0;
    for (const cert of allCerts) {
      const course = await Course.findById(cert.course);
      if (!course) {
        await Certificate.findByIdAndDelete(cert._id);
        deletedCerts++;
      }
    }
    console.log('Deleted orphan certificates:', deletedCerts);

    // 3. Delete enrollments for deleted courses
    const allEnrolls = await Enrollment.find({});
    let deletedEnrolls = 0;
    for (const enroll of allEnrolls) {
      const course = await Course.findById(enroll.course);
      if (!course) {
        await Enrollment.findByIdAndDelete(enroll._id);
        deletedEnrolls++;
      }
    }
    console.log('Deleted orphan enrollments:', deletedEnrolls);

    console.log('');
    console.log('Cleanup complete!');
    console.log('Refresh student dashboard now.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

cleanup();
