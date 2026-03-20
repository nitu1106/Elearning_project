const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const authController = require('../controllers/authController');

// Safe optional avatar upload
let avatarUpload = (req, res, next) => next();
try {
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    const { uploadImage } = require('../config/cloudinary');
    avatarUpload = uploadImage.single('avatar');
  }
} catch (e) {}

// Public routes
router.post('/register',              authController.register);
router.post('/login',                 authController.login);
router.post('/refresh-token',         authController.refreshToken);
router.post('/forgot-password',       authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

// Protected routes
router.use(protect);
router.post('/logout',         authController.logout);
router.get('/me',              authController.getMe);
router.put('/me',              avatarUpload, authController.updateProfile);
router.put('/change-password', authController.changePassword);

module.exports = router;
