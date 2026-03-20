const crypto = require('crypto');
const User   = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwtUtils');
const { sendEmail, emailTemplates } = require('../utils/emailUtils');
const { asyncHandler } = require('../middleware/errorHandler');

// ── Register ──────────────────────────────────────────────────────────────────
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Only allow student self-registration; instructor/admin created by admin
  const allowedRoles = ['student'];
  if (role && !allowedRoles.includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role for self-registration.' });
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ success: false, message: 'Email already registered.' });
  }

  const user = await User.create({ name, email, password, role: role || 'student' });

  // Send welcome email (non-blocking)
  const tmpl = emailTemplates.welcome(user.name);
  sendEmail({ to: user.email, ...tmpl }).catch(() => {});

  const accessToken  = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  res.status(201).json({
    success: true,
    message: 'Registration successful.',
    data: {
      _id:   user._id,
      name:  user.name,
      email: user.email,
      role:  user.role,
      accessToken,
      refreshToken,
    },
  });
});

// ── Login ─────────────────────────────────────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  if (!user.isActive) {
    return res.status(403).json({ success: false, message: 'Account is deactivated. Contact admin.' });
  }

  const accessToken  = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  res.json({
    success: true,
    message: 'Login successful.',
    data: {
      _id:    user._id,
      name:   user.name,
      email:  user.email,
      role:   user.role,
      avatar: user.avatar,
      accessToken,
      refreshToken,
    },
  });
});

// ── Refresh Token ─────────────────────────────────────────────────────────────
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;
  if (!token) {
    return res.status(400).json({ success: false, message: 'Refresh token required.' });
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
  }

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== token) {
    return res.status(401).json({ success: false, message: 'Refresh token mismatch.' });
  }

  const newAccessToken  = generateAccessToken(user._id);
  const newRefreshToken = generateRefreshToken(user._id);

  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  res.json({
    success: true,
    data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
  });
});

// ── Logout ────────────────────────────────────────────────────────────────────
const logout = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+refreshToken');
  if (user) {
    user.refreshToken = null;
    await user.save({ validateBeforeSave: false });
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

// ── Get My Profile ────────────────────────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, data: user });
});

// ── Update Profile ────────────────────────────────────────────────────────────
const updateProfile = asyncHandler(async (req, res) => {
  const { name, bio } = req.body;
  const updateData = { name, bio };

  if (req.file) {
    updateData.avatar = req.file.path; // Cloudinary URL
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updateData,
    { new: true, runValidators: true }
  );

  res.json({ success: true, message: 'Profile updated.', data: user });
});

// ── Change Password ───────────────────────────────────────────────────────────
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
  }

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: 'Password changed successfully.' });
});

// ── Forgot Password ───────────────────────────────────────────────────────────
const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(404).json({ success: false, message: 'No user found with that email.' });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken   = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save({ validateBeforeSave: false });

  const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  const tmpl = emailTemplates.passwordReset(user.name, resetLink);
  await sendEmail({ to: user.email, ...tmpl });

  res.json({ success: true, message: 'Password reset email sent.' });
});

// ── Reset Password ────────────────────────────────────────────────────────────
const resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken:   hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  }).select('+resetPasswordToken +resetPasswordExpires');

  if (!user) {
    return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
  }

  user.password             = req.body.password;
  user.resetPasswordToken   = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ success: true, message: 'Password reset successful. Please login.' });
});

module.exports = {
  register, login, refreshToken, logout,
  getMe, updateProfile, changePassword,
  forgotPassword, resetPassword,
};
