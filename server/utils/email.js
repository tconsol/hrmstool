const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: process.env.MAIL_SMTP_SSL === 'true',
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
  connectionTimeout: parseInt(process.env.MAIL_SMTP_CONNECTION_TIMEOUT, 10),
  socketTimeout: parseInt(process.env.MAIL_SMTP_TIMEOUT, 10),
});

/**
 * Send OTP email for organization registration verification
 */
const sendOTPEmail = async (to, otp, orgName) => {
  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
    to,
    subject: 'Verify Your Email - HRMS Registration',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">HRMS Platform</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Email Verification</p>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
          <h2 style="color: #333; margin-top: 0;">Verify Your Email Address</h2>
          <p style="color: #555; line-height: 1.6;">
            Thank you for registering <strong>${orgName}</strong> on our HRMS Platform. 
            Please use the following OTP to verify your email address:
          </p>
          <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #667eea;">${otp}</span>
          </div>
          <p style="color: #888; font-size: 13px;">
            This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Send organization activation confirmation email
 */
const sendActivationEmail = async (to, orgName) => {
  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
    to,
    subject: 'Organization Verified & Activated - HRMS Platform',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">HRMS Platform</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Account Activation</p>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
          <div style="text-align: center; margin-bottom: 20px;">
            <span style="display: inline-block; background: #d1fae5; border-radius: 50%; padding: 15px;">
              <span style="font-size: 40px;">✅</span>
            </span>
          </div>
          <h2 style="color: #333; margin-top: 0; text-align: center;">Congratulations!</h2>
          <p style="color: #555; line-height: 1.6; text-align: center;">
            Your organization <strong>${orgName}</strong> has been verified and activated by our admin team.
          </p>
          <p style="color: #555; line-height: 1.6; text-align: center;">
            You can now log in to your HRMS account and start managing your organization.
          </p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',')[0] : 'http://localhost:5173'}/login" 
               style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Login Now
            </a>
          </div>
          <p style="color: #888; font-size: 13px; text-align: center;">
            If you have any questions, please contact our support team.
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (to, resetToken, name) => {
  const clientUrl = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',')[0] : 'http://localhost:5173';
  const resetLink = `${clientUrl}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
    to,
    subject: 'Password Reset Request - HRMS Platform',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">HRMS Platform</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Password Reset</p>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
          <h2 style="color: #333; margin-top: 0;">Hi ${name},</h2>
          <p style="color: #555; line-height: 1.6;">
            We received a request to reset your password. Click the button below to set a new password:
          </p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${resetLink}" 
               style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p style="color: #888; font-size: 13px;">
            This link is valid for <strong>1 hour</strong>. If you didn't request a password reset, please ignore this email.
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Send username reminder email
 */
const sendUsernameReminderEmail = async (to, name, email) => {
  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
    to,
    subject: 'Username Reminder - HRMS Platform',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">HRMS Platform</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Username Reminder</p>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
          <h2 style="color: #333; margin-top: 0;">Hi ${name},</h2>
          <p style="color: #555; line-height: 1.6;">
            You requested a reminder of your login email. Here it is:
          </p>
          <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0;">
            <span style="font-size: 18px; font-weight: bold; color: #667eea;">${email}</span>
          </div>
          <p style="color: #888; font-size: 13px;">
            If you didn't request this, please ignore this email.
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendOTPEmail,
  sendActivationEmail,
  sendPasswordResetEmail,
  sendUsernameReminderEmail,
};
