import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendOTPEmail(email: string, otp: string) {
  const mailOptions = {
    from: `"Safe Entry" <${process.env.EMAIL_USER}>`,
    replyTo: process.env.EMAIL_USER,
    to: email,
    subject: "Your Login Verification Code",
    text: `Your verification code is: ${otp}\n\nThis code expires in 5 minutes.\n\nIf you didn't request this code, please ignore this email.\n\n- Safe Entry Security System`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%); border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #ffffff; font-size: 24px; margin: 0;">Safe Entry</h1>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 8px;">Two-Factor Authentication</p>
        </div>
        <div style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; padding: 24px; text-align: center;">
          <p style="color: #e2e8f0; font-size: 15px; margin: 0 0 16px;">Your verification code is:</p>
          <div style="background: rgba(59,130,246,0.15); border: 2px dashed #3b82f6; border-radius: 10px; padding: 16px; margin: 0 auto; max-width: 200px;">
            <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #60a5fa;">${otp}</span>
          </div>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 16px;">This code expires in <strong style="color: #f59e0b;">5 minutes</strong></p>
        </div>
        <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 20px;">
          If you didn't request this code, please ignore this email.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}
