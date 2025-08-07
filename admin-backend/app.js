require('dotenv').config(); // Tải biến môi trường từ .env
const express = require('express');
const mysql = require('mysql2/promise'); // Sử dụng promise-based driver
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000; // Cổng của backend, có thể cấu hình trong .env

// Cấu hình CORS
// Để cho phép frontend (ví dụ: http://localhost:3000) truy cập
app.use(cors({
  origin: 'http://localhost:3000', // Đảm bảo thay thế bằng cổng frontend của bạn
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json()); // Cho phép Express đọc JSON từ request body

// Cấu hình kết nối CSDL
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'datn2025',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig); // Sử dụng connection pool để quản lý kết nối

// Middleware kiểm tra kết nối CSDL (tùy chọn, hữu ích để debug)
app.use(async (req, res, next) => {
  try {
    await pool.getConnection();
    // console.log('Database connected!'); // Bỏ comment nếu muốn thấy mỗi lần request
    next();
  } catch (err) {
    console.error('Database connection failed:', err);
    res.status(500).json({ message: 'Internal Server Error: Database connection failed.' });
  }
});

// --- Định nghĩa các API Routes cho Dashboard ---
const dashboardRoutes = require('./routes/dashboard');
app.use('/api/dashboard', dashboardRoutes); // Tất cả các route dashboard sẽ bắt đầu với /api/dashboard

// Route mặc định (có thể bỏ hoặc thêm trang chủ API)
app.get('/', (req, res) => {
  res.send('API Server is running!');
});

// Xử lý lỗi 404 (route không tìm thấy)
app.use((req, res, next) => {
  res.status(404).json({ message: 'API Not Found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong on the server!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access dashboard APIs at http://localhost:${PORT}/api/dashboard/...`);
});