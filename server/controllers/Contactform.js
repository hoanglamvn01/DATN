import { db } from '../config/connectBD.js';

export const createContact = (req, res) => {
  const { name, phone, email, message } = req.body;

  if (!name || !phone || !email || !message) {
    return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
  }

  const sql = `INSERT INTO contact_forms (name, phone, email, message) VALUES (?, ?, ?, ?)`;

  db.query(sql, [name, phone, email, message], (err, result) => {
    if (err) {
      console.error('❌ Lỗi khi lưu liên hệ:', err);
      return res.status(500).json({ error: 'Lỗi server' });
    }
    res.json({ message: 'Gửi thành công' });
  });
};
//lay danh sach
export const getAllContacts = (req, res) => {
  const sql = 'SELECT * FROM contact_forms ORDER BY id DESC';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Lỗi lấy danh sách liên hệ:', err);
      return res.status(500).json({ error: 'Lỗi server' });
    }
    res.json(results);
  });
};
export const deleteContact = (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM contact_forms WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Xoá thất bại' });
    res.json({ message: 'Đã xoá liên hệ' });
  });
};
//cap nhat
export const updateContactStatus = (req, res) => {
  const { id } = req.params;
  db.query('UPDATE contact_forms SET status = "Đã xử lý" WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: 'Cập nhật thất bại' });
    res.json({ message: 'Cập nhật trạng thái thành công' });
  });
};
