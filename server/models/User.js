// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Thư viện để hash mật khẩu

const userSchema = new mongoose.Schema({
    full_name: {
        type: String,
        required: true, // Bắt buộc
        trim: true, // Xóa khoảng trắng thừa ở đầu/cuối
    },
    email: {
        type: String,
        required: true,
        unique: true, // Mỗi email là duy nhất
        trim: true,
        lowercase: true, // Lưu email dưới dạng chữ thường
        match: [/.+@.+\..+/, 'Vui lòng nhập một địa chỉ email hợp lệ'], // Regex kiểm tra định dạng email
    },
    password_hash: { // Lưu trữ mật khẩu đã được hash
        type: String,
        required: true,
    },
    phone_number: {
        type: String,
        trim: true,
        unique: true, // Số điện thoại cũng là duy nhất
        sparse: true, // Cho phép giá trị null/undefined không tạo lỗi unique nếu user không có sdt
    },
    is_email_verified: { // Trạng thái xác minh email (quan trọng cho luồng của chị)
        type: Boolean,
        default: false, // Mặc định là chưa xác minh
    },
    // Các trường khác như địa chỉ, vai trò (role) có thể thêm sau này
}, {
    timestamps: true, // Tự động thêm createdAt và updatedAt
});

// Middleware Mongoose: Hash mật khẩu trước khi lưu
userSchema.pre('save', async function(next) {
    // Chỉ hash lại mật khẩu nếu nó đã được thay đổi hoặc là người dùng mới (đang tạo)
    if (!this.isModified('password_hash')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10); // Tạo salt (độ khó)
    this.password_hash = await bcrypt.hash(this.password_hash, salt); // Hash mật khẩu
    next();
});

// Phương thức để so sánh mật khẩu (sử dụng khi đăng nhập)
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password_hash);
};

const User = mongoose.model('User', userSchema);
module.exports = User;