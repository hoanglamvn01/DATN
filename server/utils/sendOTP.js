import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export const sendOTP = async (toEmail, otp) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Xác thực Cocoon" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Mã xác thực OTP',
    html: `<p>Mã OTP của bạn là: <strong>${otp}</strong></p><p>Mã này có hiệu lực trong 5 phút.</p>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.response);
  } catch (error) {
    console.error("❌ Lỗi gửi email:", error);  // THÊM DÒNG NÀY
    throw error; // Ném lỗi để controller xử lý
  }
};
