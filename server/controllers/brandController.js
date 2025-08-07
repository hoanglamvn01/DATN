// 📁 server/controllers/brandController.js
import { db } from "../config/connectBD.js";

// ✅ Lấy danh sách brands
export const getAllBrands = (req, res) => {
  db.query("SELECT * FROM brands", (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json(result);
  });
};

// ✅ Thêm brand mới
export const createBrand = (req, res) => {
  const { brand_name, description, slug } = req.body; // Lấy cả slug
  const logo = req.file?.filename;

  if (!brand_name || !slug || !logo) { // Slug và logo là bắt buộc khi thêm mới
    return res.status(400).json({ error: 'Vui lòng điền đầy đủ Tên Thương hiệu, Slug và Logo.' });
  }

  const sql = `
    INSERT INTO brands (brand_name, description, slug, logo)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [brand_name, description, slug, logo], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "✅ Thêm thương hiệu thành công", id: result.insertId });
  });
};

// ✅ Cập nhật Brand (Sửa)
export const updateBrand = (req, res) => {
  const { id } = req.params;
  const { brand_name, description, slug } = req.body; // Lấy cả slug
  const newLogo = req.file?.filename; // Logo mới nếu có

  // Lấy logo hiện tại từ DB để xử lý (nếu người dùng không tải lên ảnh mới)
  const getOldLogoQuery = "SELECT logo FROM brands WHERE brand_id = ?";
  db.query(getOldLogoQuery, [id], (err, results) => {
    if (err) return res.status(500).json({ error: err });

    const oldLogo = results[0]?.logo;
    let finalLogo = oldLogo; // Mặc định giữ logo cũ

    if (newLogo) { // Nếu có ảnh mới được tải lên
      finalLogo = newLogo;
    } else if (req.body.logo === 'null_to_delete') { // ✅ Nếu frontend gửi tín hiệu xóa ảnh
      finalLogo = null; // Đặt logo thành NULL trong DB
      // TODO: Xóa file ảnh cũ khỏi thư mục uploads tại đây nếu cần
    } 
    // Nếu không có newLogo và cũng không có tín hiệu xóa, finalLogo vẫn là oldLogo

    const sql = `
      UPDATE brands 
      SET brand_name = ?, description = ?, slug = ?, logo = ? 
      WHERE brand_id = ?
    `;
    const params = [brand_name, description, slug, finalLogo, id];

    db.query(sql, params, (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "✅ Cập nhật thương hiệu thành công" });
    });
  });
};

// ✅ Xóa Brand
export const deleteBrand = (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM brands WHERE brand_id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "🗑️ Xoá thương hiệu thành công" });
  });
};