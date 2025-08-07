import express from "express";
import { db } from "../config/connectBD.js";

const router = express.Router();
// Lấy danh sách danh mục
router.get('/', (req, res) => {
  db.query('SELECT * FROM categories', (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json(result);
  });
});

// Thêm danh mục
router.post('/add', (req, res) => {
  const { category_name, slug, description } = req.body;
  const sql = 'INSERT INTO categories (category_name, slug, description) VALUES (?, ?, ?)';
  db.query(sql, [category_name, slug, description], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'Thêm danh mục thành công', id: result.insertId });
  });
});

// Sửa danh mục
router.put('/update/:id', (req, res) => {
  const { category_name, slug, description } = req.body;
  const { id } = req.params;
  const sql = 'UPDATE categories SET category_name = ?, slug = ?, description = ? WHERE category_id = ?';
  db.query(sql, [category_name, slug, description, id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'Cập nhật danh mục thành công' });
  });
});

// Xoá danh mục
router.delete('/delete/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM categories WHERE category_id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'Xoá danh mục thành công' });
  });
});


export default router;
