// models/Otp.js
const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true, // Mỗi email chỉ có một mã OTP đang hoạt động tại một thời điểm
        trim: true,
        lowercase: true,
    },
    otp_code: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '5m', // **Mã OTP sẽ tự động hết hạn và bị xóa khỏi DB sau 5 phút**
                        // Thời gian này được điều khiển bởi OTP_EXPIRY_MINUTES trong .env
                        // Đảm bảo MongoDB của bạn có TTL index được bật.
                        // TTL index cần được tạo thủ công hoặc Mongoose sẽ cố gắng tạo nếu được hỗ trợ.
    },
});

const Otp = mongoose.model('Otp', otpSchema);
module.exports = Otp;