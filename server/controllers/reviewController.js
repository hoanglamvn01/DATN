// controllers/reviewController.js
import { db } from "../config/connectBD.js"; 

// Tên bảng Review trong DB của bạn (dựa trên ảnh Screenshot)
const REVIEW_TABLE_NAME = 'reviews'; 
const USERS_TABLE_NAME = 'users';
const PRODUCTS_TABLE_NAME = 'products';

// TÊN CỘT ĐÃ CẬP NHẬT DỰA TRÊN THÔNG TIN PHỔ BIẾN:
// Giả sử tên người dùng là 'full_name' hoặc 'username' trong bảng users
// Giả sử tên sản phẩm là 'name' trong bảng products

// 1. Lấy tất cả đánh giá (có JOIN để lấy tên người dùng và tên sản phẩm)
export const getAllReviews = (req, res) => {
    const sql = `
        SELECT 
            r.review_id, 
            r.user_id, 
            u.full_name AS username,  -- ✅ Sửa thành tên cột đúng trong bảng users (ví dụ: full_name)
            r.product_id, 
            p.name AS product_name,   -- ✅ Sửa thành tên cột đúng trong bảng products (ví dụ: name hoặc product_name)
            r.rating, 
            r.comment, 
            r.created_at
        FROM 
            ${REVIEW_TABLE_NAME} r
        JOIN 
            ${USERS_TABLE_NAME} u ON r.user_id = u.user_id
        JOIN 
            ${PRODUCTS_TABLE_NAME} p ON r.product_id = p.product_id
        ORDER BY r.created_at DESC
    `;
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Lỗi truy vấn đánh giá:', err);
            return res.status(500).json({ error: 'Lỗi truy vấn cơ sở dữ liệu.', details: err.message });
        }
        res.json(results);
    });
};

// 2. Lấy đánh giá theo ID
export const getReviewById = (req, res) => {
    const { id } = req.params;
    const sql = `SELECT * FROM ${REVIEW_TABLE_NAME} WHERE review_id = ?`;
    db.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Lỗi truy vấn cơ sở dữ liệu.', details: err.message });
        }
        if (result.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy đánh giá.' });
        }
        res.json(result[0]);
    });
};
export const getReviewsByProductId = (req, res) => {
    const { productId } = req.params;
    
    // Câu truy vấn đã join để lấy tên người dùng và tên sản phẩm
    const sql = `
        SELECT 
            r.review_id, 
            r.user_id, 
            u.full_name AS username,  
            r.product_id, 
            p.name AS product_name,   
            r.rating, 
            r.comment, 
            r.created_at
        FROM 
            reviews r
        JOIN 
            users u ON r.user_id = u.user_id
        JOIN 
            products p ON r.product_id = p.product_id
        WHERE 
            r.product_id = ?
        ORDER BY r.created_at DESC
    `;
    
    db.query(sql, [productId], (err, results) => {
        if (err) {
            console.error('Lỗi truy vấn đánh giá theo sản phẩm:', err);
            return res.status(500).json({ error: 'Lỗi truy vấn cơ sở dữ liệu.', details: err.message });
        }
        res.json(results);
    });
};

// 3. Tạo đánh giá (Dành cho API người dùng hoặc admin)
export const createReview = (req, res) => {
    const { user_id, product_id, rating, comment } = req.body;

    if (!user_id || !product_id || rating === undefined || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Thiếu thông tin đánh giá bắt buộc (user_id, product_id, rating từ 1-5).' });
    }

    const sql = `INSERT INTO ${REVIEW_TABLE_NAME} (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)`;
    const values = [user_id, product_id, rating, comment];

    db.query(sql, values, (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Không thể thêm đánh giá.', details: err.message });
        }
        res.status(201).json({ 
            message: 'Đánh giá đã được thêm thành công', 
            review_id: result.insertId 
        });
    });
};

// 4. Cập nhật đánh giá (Thường dùng bởi Admin để sửa bình luận/rating)
export const updateReview = (req, res) => {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const sql = `UPDATE ${REVIEW_TABLE_NAME} SET rating = ?, comment = ? WHERE review_id = ?`;
    const values = [rating, comment, id];

    db.query(sql, values, (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Không thể cập nhật đánh giá.', details: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy đánh giá để cập nhật.' });
        }
        res.json({ message: 'Đánh giá đã được cập nhật thành công.' });
    });
};

// 5. Xóa đánh giá
export const deleteReview = (req, res) => {
    const { id } = req.params;
    const sql = `DELETE FROM ${REVIEW_TABLE_NAME} WHERE review_id = ?`;

    db.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Không thể xóa đánh giá.', details: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy đánh giá để xóa.' });
        }
        res.json({ message: 'Đánh giá đã được xóa thành công.' });
    });
};
// 6. Kiểm tra người dùng đã mua sản phẩm hay chưa
export const checkUserPurchasedProduct = (req, res) => {
  const { userId, productId } = req.params;

  // ✅ THÊM ĐIỀU KIỆN KIỂM TRA TRẠNG THÁI ĐƠN HÀNG
  const sql = `
    SELECT o.order_id FROM orders o
    JOIN order_items oi ON o.order_id = oi.order_id
    WHERE o.user_id = ? AND oi.product_id = ? AND o.order_status = 'completed'
  `;

  db.query(sql, [userId, productId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Lỗi kiểm tra đơn hàng.', details: err.message });
    }
    res.json({ hasPurchased: results.length > 0 });
  });
};
export const getReviewStatsByProductId = async (req, res) => {
  const { productId } = req.params;

  try {
    const [rows] = await pool.execute(`
      SELECT 
        COUNT(*) AS total_reviews,
        ROUND(AVG(rating), 1) AS average_rating
      FROM product_reviews
      WHERE product_id = ?
    `, [productId]);

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi lấy đánh giá' });
  }
};