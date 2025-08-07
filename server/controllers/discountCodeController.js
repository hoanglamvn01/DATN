// controllers/discountCodeController.js
import { db } from '../config/connectBD.js';

// Lấy tất cả mã giảm giá
export const getAllDiscountCodes = (req, res) => {
    const sql = 'SELECT * FROM discount_codes';
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Lỗi truy vấn cơ sở dữ liệu.', details: err.message });
        }
        res.json(results);
    });
};

// Lấy mã giảm giá theo ID
export const getDiscountCodeById = (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM discount_codes WHERE code_id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Lỗi truy vấn cơ sở dữ liệu.', details: err.message });
        }
        if (result.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy mã giảm giá.' });
        }
        res.json(result[0]);
    });
};

// Tạo mã giảm giá mới
export const createDiscountCode = (req, res) => {
    const { code, description, discount_percent, discount_amount, start_date, end_date } = req.body;

    if (!code || !start_date || !end_date) {
        return res.status(400).json({ error: 'Thiếu thông tin bắt buộc (code, start_date, end_date).' });
    }

    const sql = 'INSERT INTO discount_codes (code, description, discount_percent, discount_amount, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)';
    const values = [code, description, discount_percent, discount_amount, start_date, end_date];

    db.query(sql, values, (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'Mã giảm giá đã tồn tại.' });
            }
            return res.status(500).json({ error: 'Không thể thêm mã giảm giá.', details: err.message });
        }
        res.status(201).json({ 
            message: 'Mã giảm giá đã được thêm thành công', 
            code_id: result.insertId 
        });
    });
};

// Cập nhật mã giảm giá
export const updateDiscountCode = (req, res) => {
    const { id } = req.params;
    const { code, description, discount_percent, discount_amount, start_date, end_date } = req.body;

    const sql = 'UPDATE discount_codes SET code = ?, description = ?, discount_percent = ?, discount_amount = ?, start_date = ?, end_date = ? WHERE code_id = ?';
    const values = [code, description, discount_percent, discount_amount, start_date, end_date, id];

    db.query(sql, values, (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Không thể cập nhật mã giảm giá.', details: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy mã giảm giá để cập nhật.' });
        }
        res.json({ message: 'Mã giảm giá đã được cập nhật thành công.' });
    });
};

// Xóa mã giảm giá
export const deleteDiscountCode = (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM discount_codes WHERE code_id = ?';

    db.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Không thể xóa mã giảm giá.', details: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy mã giảm giá để xóa.' });
        }
        res.json({ message: 'Mã giảm giá đã được xóa thành công.' });
    });
};
// Thêm hàm xử lý áp dụng mã giảm giá
export const applyDiscountCode = (req, res) => {
    const { code, order_value } = req.body; // order_value là tổng giá trị đơn hàng trước giảm giá
    const now = new Date();

    if (!code || order_value === undefined) {
        return res.status(400).json({ error: 'Thiếu mã giảm giá hoặc giá trị đơn hàng.' });
    }

    // Truy vấn cơ sở dữ liệu để tìm mã giảm giá
    const sql = 'SELECT * FROM discount_codes WHERE code = ?'; 
    db.query(sql, [code], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Lỗi truy vấn cơ sở dữ liệu.', details: err.message });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Mã giảm giá không tồn tại.' });
        }

        const discount = results[0];
        const startDate = new Date(discount.start_date);
        const endDate = new Date(discount.end_date);

        // 1. Kiểm tra ngày hết hạn
        if (now < startDate) {
            return res.status(400).json({ error: 'Mã giảm giá chưa đến ngày có hiệu lực.' });
        }
        if (now > endDate) {
            return res.status(400).json({ error: 'Mã giảm giá đã hết hạn.' });
        }

        // 2. Tính toán giá trị giảm giá
        let discountAmount = 0;
        let finalAmount = order_value;

        if (discount.discount_percent !== null) {
            // Giảm giá theo %
            discountAmount = order_value * (discount.discount_percent / 100);
            finalAmount = order_value - discountAmount;
        } else if (discount.discount_amount !== null) {
            // Giảm giá theo số tiền cố định (VND)
            discountAmount = discount.discount_amount;
            finalAmount = order_value - discountAmount;
        }

        // Đảm bảo tổng tiền không âm
        if (finalAmount < 0) {
            finalAmount = 0;
        }

        // 3. Trả về kết quả
        res.json({
            message: 'Áp dụng mã giảm giá thành công.',
            discounted_by: discountAmount,
            original_amount: order_value,
            final_amount: finalAmount,
            discount_info: discount // Trả về thông tin mã giảm giá đã áp dụng
        });
    });
};