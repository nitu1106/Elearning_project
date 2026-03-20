const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const certificateSchema = new mongoose.Schema({
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
  enrollment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment',
    required: true,
  },
  certificateId: {
    type: String,
    unique: true,
    default: () => uuidv4(),
  },
  certificateUrl: { type: String },    // Cloudinary URL of generated PDF
  issuedAt:   { type: Date, default: Date.now },
  isValid:    { type: Boolean, default: true },
  revokedAt:  { type: Date },
  revokedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Certificate', certificateSchema);
