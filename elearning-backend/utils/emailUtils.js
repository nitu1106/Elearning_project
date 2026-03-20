const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: `"E-Learning Platform" <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    html,
  };
  return transporter.sendMail(mailOptions);
};

// Pre-built email templates
const emailTemplates = {
  welcome: (name) => ({
    subject: 'Welcome to E-Learning Platform!',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
        <h2 style="color:#2563eb">Welcome, ${name}!</h2>
        <p>Your account has been created successfully. Start exploring courses today.</p>
        <p>Happy learning! 🎓</p>
      </div>
    `,
  }),

  enrollmentConfirm: (name, courseName) => ({
    subject: `Enrolled in: ${courseName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
        <h2 style="color:#2563eb">Enrollment Confirmed</h2>
        <p>Hi ${name},</p>
        <p>You have successfully enrolled in <strong>${courseName}</strong>.</p>
        <p>Start learning now!</p>
      </div>
    `,
  }),

  certificateIssued: (name, courseName, certificateId) => ({
    subject: `Certificate Issued: ${courseName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
        <h2 style="color:#16a34a">Congratulations, ${name}!</h2>
        <p>You have successfully completed <strong>${courseName}</strong>.</p>
        <p>Your certificate ID: <code>${certificateId}</code></p>
        <p>Download your certificate from your dashboard.</p>
      </div>
    `,
  }),

  passwordReset: (name, resetLink) => ({
    subject: 'Reset Your Password',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
        <h2 style="color:#dc2626">Password Reset Request</h2>
        <p>Hi ${name},</p>
        <p>Click the button below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetLink}" style="background:#2563eb;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin:16px 0">Reset Password</a>
        <p style="color:#6b7280;font-size:12px">If you did not request this, please ignore this email.</p>
      </div>
    `,
  }),
};

module.exports = { sendEmail, emailTemplates };
