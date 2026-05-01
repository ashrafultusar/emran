import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendSecurityAlertEmail(email: string, userAgent: string) {
  const loginTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" });

  const mailOptions = {
    from: `"Safe Entry" <${process.env.EMAIL_USER}>`,
    replyTo: process.env.EMAIL_USER,
    to: email,
    subject: "Security Alert - New Device Login Detected",
    text: `A new device has logged into your account.\n\nDevice: ${userAgent}\nTime: ${loginTime}\n\nIf this wasn't you, please change your password immediately.\n\n- Safe Entry Security System`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%); border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #ffffff; font-size: 24px; margin: 0;">Security Alert</h1>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 8px;">New device login detected</p>
        </div>
        <div style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; padding: 24px;">
          <p style="color: #e2e8f0; font-size: 15px; margin: 0 0 12px;">A new device has logged into your account:</p>
          <div style="background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); border-radius: 8px; padding: 12px;">
            <p style="color: #fbbf24; font-size: 13px; margin: 0; word-break: break-all;">
              <strong>Device:</strong> ${userAgent}
            </p>
            <p style="color: #fbbf24; font-size: 13px; margin: 8px 0 0;">
              <strong>Time:</strong> ${loginTime}
            </p>
          </div>
          <p style="color: #f87171; font-size: 13px; margin-top: 16px;">
            If this wasn't you, please change your password immediately.
          </p>
        </div>
        <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 20px;">
          Safe Entry Security System
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"Safe Entry" <${process.env.EMAIL_USER}>`,
    replyTo: process.env.EMAIL_USER,
    to: email,
    subject: "Password Reset Request",
    text: `You requested a password reset.\n\nClick this link to reset your password: ${resetUrl}\n\nThis link will expire in 15 minutes.\n\nIf you didn't request this, please ignore this email.\n\n- Safe Entry Security System`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%); border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #ffffff; font-size: 24px; margin: 0;">Password Reset</h1>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 8px;">You requested a password reset</p>
        </div>
        <div style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; padding: 24px;">
          <p style="color: #e2e8f0; font-size: 15px; margin: 0 0 16px;">Click the button below to reset your password. This link will expire in <strong>15 minutes</strong>.</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${resetUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; font-weight: 600; font-size: 15px; padding: 14px 32px; border-radius: 10px; text-decoration: none;">Reset Password</a>
          </div>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 16px; word-break: break-all;">Or copy this link: ${resetUrl}</p>
        </div>
        <p style="color: #f87171; font-size: 12px; text-align: center; margin-top: 16px;">If you didn't request this, please ignore this email.</p>
        <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 8px;">Safe Entry Security System</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}
