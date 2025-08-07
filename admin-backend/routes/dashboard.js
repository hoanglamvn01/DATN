const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise'); // Sử dụng pool đã tạo ở server.js
const moment = require('moment'); // Để dễ dàng xử lý ngày tháng

// Cấu hình kết nối CSDL (lấy pool từ request nếu bạn muốn hoặc import trực tiếp pool từ server.js)
// Để đơn giản, chúng ta sẽ import pool trực tiếp ở đây.
// Trong một ứng dụng lớn hơn, bạn có thể truyền pool vào router hoặc dùng dependency injection.
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'datn2025',
};
const pool = mysql.createPool(dbConfig); // Tạo lại pool hoặc export từ server.js

// Helper function để lấy kết nối và thực hiện query
async function executeQuery(sql, params = []) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(sql, params);
    return rows;
  } finally {
    connection.release(); // Luôn giải phóng kết nối
  }
}

// --- API Endpoint 1: Lấy Stats Dashboard ---
router.get('/stats', async (req, res) => {
  try {
    const today = moment().format('YYYY-MM-DD');
    const firstDayOfMonth = moment().startOf('month').format('YYYY-MM-DD');

    // Tổng Người dùng
    const [totalUsersResult] = await executeQuery('SELECT COUNT(user_id) AS totalUsers FROM users');
    const totalUsers = totalUsersResult.totalUsers;

    // Đăng ký mới (tháng này)
    const [newRegistrationsResult] = await executeQuery('SELECT COUNT(user_id) AS newRegistrationsThisMonth FROM users WHERE created_at >= ?', [firstDayOfMonth]);
    const newRegistrationsThisMonth = newRegistrationsResult.newRegistrationsThisMonth;

    // Người dùng hoạt động (hôm nay) - Giả định có order hôm nay
    const [activeUsersResult] = await executeQuery('SELECT COUNT(DISTINCT user_id) AS activeUsersToday FROM orders WHERE DATE(created_at) = ?', [today]);
    const activeUsersToday = activeUsersResult.activeUsersToday;

    // Đơn hàng mới (hôm nay)
    const [newOrdersTodayResult] = await executeQuery('SELECT COUNT(order_id) AS newOrdersToday FROM orders WHERE DATE(created_at) = ?', [today]);
    const newOrdersToday = newOrdersTodayResult.newOrdersToday;

    // Doanh thu hôm nay
    const [revenueTodayResult] = await executeQuery('SELECT SUM(total_amount) AS revenueToday FROM orders WHERE DATE(created_at) = ?', [today]);
    const revenueToday = revenueTodayResult.revenueToday || 0; // Đảm bảo trả về 0 nếu NULL

    // Sản phẩm tồn kho
    const [stockProductsResult] = await executeQuery('SELECT SUM(quantity) AS stockProducts FROM products');
    const stockProducts = stockProductsResult.stockProducts || 0; // Đảm bảo trả về 0 nếu NULL

    res.json({
      totalUsers,
      newRegistrationsThisMonth,
      activeUsersToday,
      newOrdersToday,
      revenueToday: parseFloat(revenueToday), // Chuyển đổi về số thập phân
      stockProducts: parseInt(stockProducts) // Chuyển đổi về số nguyên
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
});

// --- API Endpoint 2: Lấy Doanh thu 6 tháng gần nhất ---
router.get('/revenue-by-month', async (req, res) => {
  try {
    const sql = `
      SELECT
          DATE_FORMAT(created_at, '%Y-%m') AS sales_month,
          SUM(total_amount) AS monthly_revenue
      FROM
          orders
      WHERE
          created_at >= CURDATE() - INTERVAL 6 MONTH
      GROUP BY
          sales_month
      ORDER BY
          sales_month ASC;
    `;
    const results = await executeQuery(sql);

    const labels = [];
    const data = [];
    // Tạo một map để dễ dàng điền các tháng bị thiếu
    const revenueMap = new Map();
    results.forEach(row => {
      revenueMap.set(row.sales_month, parseFloat(row.monthly_revenue));
    });

    // Tạo 6 tháng gần nhất (bao gồm cả tháng hiện tại)
    for (let i = 5; i >= 0; i--) {
      const month = moment().subtract(i, 'months');
      const monthKey = month.format('YYYY-MM');
      labels.push(month.format('MM/YYYY')); // Format cho frontend
      data.push(revenueMap.get(monthKey) || 0); // Đặt 0 nếu không có dữ liệu cho tháng đó
    }

    res.json({ labels, data });

  } catch (error) {
    console.error('Error fetching revenue by month:', error);
    res.status(500).json({ message: 'Failed to fetch revenue by month' });
  }
});

// --- API Endpoint 3: Lấy Doanh thu theo Danh mục Sản phẩm ---
router.get('/sales-by-category', async (req, res) => {
  try {
    // LƯU Ý: Đây là doanh thu ƯỚC TÍNH dựa trên `products.sold` và `products.price`
    // KHÔNG phải doanh thu thực tế từ đơn hàng chi tiết.
    const sql = `
      SELECT
          c.category_name AS category,
          SUM(p.sold * p.price) AS estimated_revenue
      FROM
          products p
      JOIN
          categories c ON p.category_id = c.category_id
      GROUP BY
          c.category_name
      ORDER BY
          estimated_revenue DESC;
    `;
    const results = await executeQuery(sql);

    const labels = results.map(row => row.category);
    const data = results.map(row => parseFloat(row.estimated_revenue));

    res.json({ labels, data });

  } catch (error) {
    console.error('Error fetching sales by category:', error);
    res.status(500).json({ message: 'Failed to fetch sales by category' });
  }
});

// --- API Endpoint 4: Lấy Hoạt động Người dùng ---
router.get('/user-activity', async (req, res) => {
  try {
    // LƯU Ý: Chỉ lấy dữ liệu đăng ký mới do thiếu thông tin đăng nhập.
    const sqlRegistrations = `
      SELECT
          YEARWEEK(created_at) AS registration_week,
          COUNT(user_id) AS newRegistrations
      FROM
          users
      WHERE
          created_at >= CURDATE() - INTERVAL 8 WEEK
      GROUP BY
          registration_week
      ORDER BY
          registration_week ASC;
    `;
    const registrationsResults = await executeQuery(sqlRegistrations);

    const labels = [];
    const newRegistrations = [];
    const logins = []; // Placeholder cho logins, sẽ luôn là 0

    // Tạo một map để dễ dàng điền các tuần bị thiếu
    const registrationMap = new Map();
    registrationsResults.forEach(row => {
      registrationMap.set(row.registration_week, row.newRegistrations);
    });

    // Tạo 8 tuần gần nhất
    for (let i = 7; i >= 0; i--) {
      const weekStart = moment().subtract(i, 'weeks').startOf('isoWeek'); // Bắt đầu tuần từ thứ 2
      const weekKey = moment(weekStart).format('YYYYMM'); // Format YEARWEEK
      labels.push(`Tuần ${moment(weekStart).week()}`); // Labels như "Tuần 25"
      newRegistrations.push(registrationMap.get(parseInt(weekKey)) || 0); // Lấy data, chuyển key về số nguyên
      logins.push(0); // Luôn là 0 vì không có dữ liệu
    }

    res.json({ labels, newRegistrations, logins });

  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ message: 'Failed to fetch user activity' });
  }
});

// --- API Endpoint 5: Lấy Đơn hàng mới nhất ---
router.get('/recent-orders', async (req, res) => {
  try {
    // LƯU Ý: Không thể hiển thị tên sản phẩm cụ thể trong đơn hàng
    // do thiếu bảng `order_items`.
    const sql = `
      SELECT
          o.order_id,
          o.order_code,
          o.recipient_name AS customer,
          o.total_amount AS total,
          o.status,
          o.created_at AS time
      FROM
          orders o
      ORDER BY
          o.created_at DESC
      LIMIT 10;
    `;
    const results = await executeQuery(sql);

    // Định dạng lại dữ liệu cho frontend
    const formattedOrders = results.map(order => ({
      id: order.order_id,
      orderId: order.order_code,
      customer: order.customer,
      // Placeholder vì không có thông tin sản phẩm cụ thể
      product: 'Nhiều sản phẩm',
      total: parseFloat(order.total),
      status: order.status,
      time: moment(order.time).fromNow(), // Ví dụ: "5 phút trước"
    }));

    res.json(formattedOrders);

  } catch (error) {
    console.error('Error fetching recent orders:', error);
    res.status(500).json({ message: 'Failed to fetch recent orders' });
  }
});

module.exports = router;