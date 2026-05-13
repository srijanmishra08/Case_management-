import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  await transporter.sendMail({
    from: `"Legal Case Manager" <${process.env.SMTP_USER}>`,
    to,
    subject: "Your password reset OTP",
    html: `
      <div style="font-family:sans-serif;max-width:400px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#1e40af;margin-bottom:8px;">Password Reset</h2>
        <p style="color:#374151;margin-bottom:24px;">Use the OTP below to reset your password. It expires in <strong>10 minutes</strong>.</p>
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:20px;text-align:center;letter-spacing:8px;font-size:32px;font-weight:700;color:#1d4ed8;">
          ${otp}
        </div>
        <p style="color:#6b7280;font-size:13px;margin-top:24px;">If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}
