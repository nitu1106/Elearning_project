const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');
const rateLimit = require('express-rate-limit');
const multer    = require('multer');
const path      = require('path');
const fs        = require('fs');
require('dotenv').config();

const authRoutes       = require('./routes/authRoutes');
const courseRoutes     = require('./routes/courseRoutes');
const enrollRoutes     = require('./routes/enrollRoutes');
const quizRoutes       = require('./routes/quizRoutes');
const progressRoutes   = require('./routes/progressRoutes');
const adminRoutes      = require('./routes/adminRoutes');
const instructorRoutes = require('./routes/instructorRoutes');
const { errorHandler } = require('./middleware/errorHandler');
const { protect }      = require('./middleware/authMiddleware');

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: function(origin, callback) {
    const allowed = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      process.env.FRONTEND_URL,
    ].filter(Boolean);
    if (!origin || allowed.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ── Body Parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ── Rate Limiter ──────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// ── File Upload Setup (disk storage) ─────────────────────────────────────────
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const fileUpload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, Word, PowerPoint, Excel and text files allowed'), false);
    }
  },
});

// ── Serve uploaded files ──────────────────────────────────────────────────────
app.use('/uploads', express.static(uploadsDir));

// ── Upload endpoint ───────────────────────────────────────────────────────────
app.post('/api/upload', protect, fileUpload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.' });
  }
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({
    success:  true,
    url:      fileUrl,
    name:     req.file.originalname,
    filename: req.file.filename,
    size:     req.file.size,
  });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/courses',    courseRoutes);
app.use('/api/enroll',     enrollRoutes);
app.use('/api/quiz',       quizRoutes);
app.use('/api/progress',   progressRoutes);
app.use('/api/admin',      adminRoutes);
app.use('/api/instructor', instructorRoutes);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'E-Learning API is running', version: '1.0.0' });
});

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Error Handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ── MongoDB + Server Start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
