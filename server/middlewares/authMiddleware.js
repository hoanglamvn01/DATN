import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { db, queryDatabase } from '../config/connectBD.js';

dotenv.config();
// const SECRET_KEY = process.env.JWT_SECRET || "a-string-secret-at-least-256-bits-long";
const SECRET_KEY = process.env.JWT_SECRET || 'fallback_secret_if_env_fails'; // ✅ Đảm bảo đọc từ process.env
console.log('authController SECRET_KEY (tạo token - FROM ENV):', SECRET_KEY);
export const protect = async (req, res, next) => {
  let token;

  // Kiểm tra xem header Authorization có tồn tại và bắt đầu bằng 'Bearer' không
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Lấy token từ header (ví dụ: "Bearer YOUR_TOKEN_HERE")
      token = req.headers.authorization.split(' ')[1];

      // Giải mã token bằng JWT_SECRET của bạn
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Tìm người dùng trong database bằng ID từ token
      // Gán thông tin người dùng vào req.user để các middleware và controller sau có thể sử dụng
      const users = await queryDatabase(
        'SELECT user_id, full_name, email, role FROM users WHERE user_id = ?',
        [decoded.id]
      );
      req.user = users[0]; // Gán thông tin người dùng vào req.user

      next(); // Chuyển sang middleware hoặc controller tiếp theo
    } catch (error) {
      console.error('Lỗi xác thực token:', error);
      // Nếu token không hợp lệ (hết hạn, sai chữ ký,...)
      return res
        .status(401)
        .json({ error: 'Không được phép, token không hợp lệ hoặc đã hết hạn.' });
    }
  }

  // Nếu không có token nào được gửi
  if (!token) {
    return res.status(401).json({ error: 'Không được phép, không có token xác thực.' });
  }
};
export const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Không có token, vui lòng đăng nhập!' }); // 401 Unauthorized
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Lỗi xác thực JWT:', error);
    if (error.name === 'TokenExpiredError') {
      return res
        .status(401)
        .json({ message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.' }); // 401 Unauthorized
    }
    // Đối với các lỗi khác (JsonWebTokenError - token invalid/malformed)
    return res.status(403).json({ message: 'Token không hợp lệ!' }); // 403 Forbidden
  }
};

export const checkRole = roles => async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Không tìm thấy token!' });
    }

    const decoded = jwt.verify(token, SECRET_KEY);

    const [users] = await db
      .promise()
      .query('SELECT role FROM users WHERE user_id = ?', [decoded.id]);

    if (users.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    }

    if (!roles.includes(users[0].role)) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập vào tài nguyên này!' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Lỗi kiểm tra vai trò:', error);
    if (error.name === 'TokenExpiredError') {
      return res
        .status(401)
        .json({ message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.' });
    }
    return res.status(403).json({ message: 'Token không hợp lệ hoặc không có quyền!' });
  }
};

export const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Lấy token từ header: "Bearer TOKEN"
  if (!token) {
    return res.status(401).json({ message: 'Không tìm thấy token.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // ✅ GIỐNG secret khi tạo token
    req.user = decoded; // ✅ GÁN USER VÀO REQ để controller đọc được
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
};
