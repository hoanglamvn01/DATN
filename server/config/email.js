const nodemailer = require('nodemailer');
const dotenv = require('dotenv'); // <-- Dòng này quan trọng để load .env

dotenv.config(); // <-- Dòng này quan trọng để load .env

const transporter = nodemailer.createTransport({
    service: 'outlook',
    auth: {
        user: process.env.EMAIL_USER, // Đảm bảo đúng tên biến EMAIL_USER
        pass: process.env.EMAIL_PASS  // Đảm bảo đúng tên biến EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

module.exports = transporter;