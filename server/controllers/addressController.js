// 📁 controllers/addressController.js

import { db, queryDatabase } from '../config/connectBD.js';
import { v4 as uuidv4 } from 'uuid';

const ADDRESS_TABLE = 'user_addresses'; // Unified table name for addresses

// Lấy tất cả địa chỉ của một người dùng (GET /api/addresses/:userId)
export const getAddressesByUserId = async (req, res) => {
    const { userId } = req.params;
    try {
        const sql = `SELECT * FROM ${ADDRESS_TABLE} WHERE user_id = ? ORDER BY is_default DESC, created_at DESC`;
        const addresses = await queryDatabase(sql, [userId]);
        res.json(addresses);
    } catch (error) {
        console.error('Lỗi khi lấy địa chỉ:', error);
        res.status(500).json({ error: 'Không thể tải sổ địa chỉ.', details: error.message });
    }
};

// Thêm địa chỉ mới (POST /api/addresses)
export const addAddress = async (req, res) => {
    // Ensure these field names match the frontend (CartPage.tsx, CustomerForm.tsx)
    // and your DB columns (full_name, phone_number, address_line)
    const { user_id, full_name, phone_number, province, district, ward, address_line, is_default } = req.body;
    const address_id = uuidv4(); // Generate unique ID for new address (UUID string)

    // Basic input validation
    if (!user_id || !full_name || !phone_number || !province || !district || !ward || !address_line) {
        return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin địa chỉ (tên, SĐT, địa chỉ, tỉnh, huyện, xã).' });
    }

    try {
        // If the new address is set as default, unset default for all other addresses of this user
        if (is_default) {
            await queryDatabase(`UPDATE ${ADDRESS_TABLE} SET is_default = FALSE WHERE user_id = ?`, [user_id]);
        }

        // Insert the new address into the database
        // Column names MUST match your actual database table
    const sql = `
  INSERT INTO user_addresses (
    address_id, user_id, full_name, phone_number, province, district, ward, address_line, is_default
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

        const values = [address_id, user_id, full_name, phone_number, province, district, ward, address_line, is_default || false];

        await queryDatabase(sql, values);
        res.status(201).json({ message: "Thêm địa chỉ thành công", address_id: address_id }); // Return the generated address_id
    } catch (error) {
        console.error('Lỗi khi thêm địa chỉ:', error);
        res.status(500).json({ error: 'Không thể thêm địa chỉ.', details: error.message });
    }
};

// Đặt một địa chỉ làm mặc định (PUT /api/addresses/:addressId/set-default)
export const setDefaultAddress = async (req, res) => {
    const { addressId } = req.params;
    const userId = req.user.id; // Assuming req.user.id is set by authMiddleware

    db.beginTransaction(async (err) => {
        if (err) {
            console.error('Lỗi khi bắt đầu giao dịch:', err);
            return res.status(500).json({ error: 'Lỗi server khi đặt địa chỉ mặc định.' });
        }

        try {
            // Unset default for all other addresses of this user
            await queryDatabase(`UPDATE ${ADDRESS_TABLE} SET is_default = FALSE WHERE user_id = ?`, [userId]);

            // Set the selected address as default
            const updateResult = await queryDatabase(`UPDATE ${ADDRESS_TABLE} SET is_default = TRUE WHERE id = ? AND user_id = ?`, [addressId, userId]);

            if (updateResult.affectedRows === 0) {
                return db.rollback(() => res.status(404).json({ message: 'Không tìm thấy địa chỉ để đặt làm mặc định hoặc địa chỉ không thuộc về bạn.' }));
            }

            db.commit((err) => {
                if (err) {
                    console.error('Lỗi khi commit giao dịch:', err);
                    return db.rollback(() => res.status(500).json({ error: 'Lỗi commit transaction khi đặt địa chỉ mặc định.' }));
                }
                res.json({ message: "Đặt địa chỉ mặc định thành công." });
            });

        } catch (error) {
            console.error('Lỗi trong transaction đặt địa chỉ mặc định:', error);
            db.rollback(() => {
                res.status(500).json({ error: 'Lỗi khi đặt địa chỉ mặc định.', details: error.message });
            });
        }
    });
};


// Cập nhật địa chỉ (PUT /api/addresses/:addressId)
export const updateAddress = async (req, res) => {
    const { addressId } = req.params;
    const { full_name, phone_number, province, district, ward, address_line, is_default } = req.body;
    const userId = req.user.id; // Assuming req.user.id is set by authMiddleware

    if (!full_name || !phone_number || !province || !district || !ward || !address_line) {
        return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin địa chỉ.' });
    }

    db.beginTransaction(async (err) => {
        if (err) return res.status(500).json({ error: "Lỗi server khi cập nhật địa chỉ." });

        try {
            if (is_default) {
                await queryDatabase(`UPDATE ${ADDRESS_TABLE} SET is_default = FALSE WHERE user_id = ?`, [userId]);
            }

            const sql = `
                UPDATE ${ADDRESS_TABLE}
                SET full_name = ?, phone_number = ?, province = ?, district = ?, ward = ?, address_line = ?, is_default = ?
                WHERE id = ? AND user_id = ?
            `;
            const values = [full_name, phone_number, province, district, ward, address_line, is_default || false, addressId, userId];
            const result = await queryDatabase(sql, values);

            if (result.affectedRows === 0) {
                return db.rollback(() => res.status(404).json({ message: "Không tìm thấy địa chỉ để cập nhật hoặc địa chỉ không thuộc về bạn." }));
            }

            db.commit(err => {
                if (err) {
                    console.error('Lỗi khi commit giao dịch:', err);
                    return db.rollback(() => {
                        res.status(500).json({ error: "Lỗi commit transaction khi cập nhật địa chỉ." });
                    });
                }
                res.json({ message: "Cập nhật địa chỉ thành công!" });
            });

        } catch (error) {
            console.error('Lỗi khi cập nhật địa chỉ:', error);
            db.rollback(() => {
                res.status(500).json({ error: 'Không thể cập nhật địa chỉ.', details: error.message });
            });
        }
    });
};
export const deleteAddress = (req, res) => {
    // Lấy addressId từ URL params, ví dụ: /api/addresses/123
    const { addressId } = req.params;

    // Lấy user_id từ thông tin xác thực (nếu cần kiểm tra quyền)
    // const userId = req.user.id; // Ví dụ nếu có middleware xác thực

    const sql = "DELETE FROM user_addresses WHERE address_id = ?";
    
    db.query(sql, [addressId], (err, result) => {
        if (err) {
            console.error("Lỗi khi xóa địa chỉ:", err);
            return res.status(500).json({ error: "Lỗi server khi xóa địa chỉ." });
        }

        // Kiểm tra xem có dòng nào bị ảnh hưởng không
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Không tìm thấy địa chỉ để xóa." });
        }

        // Trả về thông báo thành công
        res.status(200).json({ message: "Xóa địa chỉ thành công." });
    });
};