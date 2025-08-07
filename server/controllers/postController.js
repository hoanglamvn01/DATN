//quanli bai viet. Hương
// 📁 server/controllers/postController.js
import { db } from "../config/connectBD.js";
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// __dirname tương đương trong modules ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_DIR = path.join(__dirname, '../uploads');

// ✅ 1. Tạo bài viết mới
export const createPost = (req, res) => {
  const { title, content, author_id, slug } = req.body;
  const thumbnail = req.file ? req.file.filename : null; // Lấy tên file thumbnail nếu có

  if (!title || !content || !author_id || !slug) {
    // Nếu thiếu các trường bắt buộc, xóa thumbnail đã upload (nếu có)
    if (thumbnail) {
      fs.unlink(path.join(UPLOADS_DIR, thumbnail), (err) => {
        if (err) console.error('Lỗi khi xóa thumbnail không sử dụng:', err);
      });
    }
    return res.status(400).json({ message: "Vui lòng cung cấp đầy đủ tiêu đề, nội dung, tác giả và đường dẫn." });
  }

  // Kiểm tra slug có trùng không
  db.query("SELECT COUNT(*) AS count FROM posts WHERE slug = ?", [slug], (err, result) => {
    if (err) {
      console.error('Lỗi khi kiểm tra slug:', err);
      return res.status(500).json({ message: "Lỗi máy chủ khi kiểm tra đường dẫn." });
    }
    if (result[0].count > 0) {
      // Nếu trùng, xóa thumbnail đã upload
      if (thumbnail) {
        fs.unlink(path.join(UPLOADS_DIR, thumbnail), (err) => {
          if (err) console.error('Lỗi khi xóa thumbnail trùng slug:', err);
        });
      }
      return res.status(409).json({ message: "Đường dẫn (slug) này đã tồn tại. Vui lòng chọn đường dẫn khác." });
    }

    const sql = `
      INSERT INTO posts (title, content, thumbnail, author_id, slug)
      VALUES (?, ?, ?, ?, ?)
    `;
    db.query(sql, [title, content, thumbnail, author_id, slug], (err, dbResult) => {
      if (err) {
        console.error('Lỗi khi tạo bài viết:', err);
        // Nếu có lỗi, xóa thumbnail đã upload
        if (thumbnail) {
          fs.unlink(path.join(UPLOADS_DIR, thumbnail), (err) => {
            if (err) console.error('Lỗi khi xóa thumbnail sau khi lỗi DB:', err);
          });
        }
        return res.status(500).json({ message: "Lỗi máy chủ khi tạo bài viết." });
      }
      res.status(201).json({ message: "✅ Tạo bài viết thành công!", post_id: dbResult.insertId });
    });
  });
};

// ✅ 2. Lấy tất cả bài viết
export const getAllPosts = (req, res) => {
  const { search, limit, offset } = req.query; // Thêm tìm kiếm, phân trang

  let sql = "SELECT * FROM posts";
  const params = [];

  if (search) {
    sql += " WHERE title LIKE ? OR content LIKE ?";
    params.push(`%${search}%`, `%${search}%`);
  }

  sql += " ORDER BY created_at DESC"; // Mặc định sắp xếp theo thời gian tạo mới nhất

  if (limit) {
    sql += " LIMIT ?";
    params.push(parseInt(limit));
  }
  if (offset) {
    sql += " OFFSET ?";
    params.push(parseInt(offset));
  }

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('Lỗi khi lấy tất cả bài viết:', err);
      return res.status(500).json({ message: "Lỗi máy chủ khi lấy bài viết." });
    }
    res.json(result);
  });
};

// ✅ 3. Lấy chi tiết bài viết theo ID
export const getPostById = (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM posts WHERE post_id = ?", [id], (err, result) => {
    if (err) {
      console.error('Lỗi khi lấy bài viết theo ID:', err);
      return res.status(500).json({ message: "Lỗi máy chủ khi lấy bài viết." });
    }
    if (result.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy bài viết." });
    }
    res.json(result[0]);
  });
};

// ✅ 4. Lấy chi tiết bài viết theo Slug
export const getPostBySlug = (req, res) => {
  const { slug } = req.params;
  db.query("SELECT * FROM posts WHERE slug = ?", [slug], (err, result) => {
    if (err) {
      console.error('Lỗi khi lấy bài viết theo Slug:', err);
      return res.status(500).json({ message: "Lỗi máy chủ khi lấy bài viết." });
    }
    if (result.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy bài viết với đường dẫn này." });
    }
    res.json(result[0]);
  });
};

// ✅ 5. Cập nhật bài viết
export const updatePost = (req, res) => {
  const { id } = req.params;
  const { title, content, author_id, slug } = req.body;
  const newThumbnail = req.file ? req.file.filename : undefined; // undefined nếu không có file mới

  // 1. Lấy thông tin bài viết hiện có để kiểm tra slug và thumbnail cũ
  db.query("SELECT thumbnail, slug FROM posts WHERE post_id = ?", [id], (err, results) => {
    if (err) {
      console.error('Lỗi khi lấy thông tin bài viết cũ để cập nhật:', err);
      return res.status(500).json({ message: "Lỗi máy chủ khi cập nhật bài viết." });
    }
    if (results.length === 0) {
      // Nếu không tìm thấy bài viết, xóa thumbnail mới nếu có
      if (newThumbnail) {
        fs.unlink(path.join(UPLOADS_DIR, newThumbnail), (unlinkErr) => {
          if (unlinkErr) console.error('Lỗi khi xóa thumbnail không sử dụng:', unlinkErr);
        });
      }
      return res.status(404).json({ message: "Không tìm thấy bài viết để cập nhật." });
    }

    const oldThumbnail = results[0].thumbnail;
    const oldSlug = results[0].slug;
    const finalThumbnail = newThumbnail !== undefined ? newThumbnail : oldThumbnail; // Giữ thumbnail cũ nếu không có thumbnail mới

    // 2. Kiểm tra slug mới (nếu có thay đổi và trùng với slug khác)
    if (slug && slug !== oldSlug) {
      db.query("SELECT COUNT(*) AS count FROM posts WHERE slug = ? AND post_id != ?", [slug, id], (err, slugCheckResult) => {
        if (err) {
          console.error('Lỗi khi kiểm tra slug trùng lặp khi cập nhật:', err);
          return res.status(500).json({ message: "Lỗi máy chủ khi kiểm tra đường dẫn." });
        }
        if (slugCheckResult[0].count > 0) {
          if (newThumbnail) {
            fs.unlink(path.join(UPLOADS_DIR, newThumbnail), (unlinkErr) => {
              if (unlinkErr) console.error('Lỗi khi xóa thumbnail trùng slug:', unlinkErr);
            });
          }
          return res.status(409).json({ message: "Đường dẫn (slug) này đã tồn tại cho bài viết khác. Vui lòng chọn đường dẫn khác." });
        }
        // Tiếp tục cập nhật sau khi kiểm tra slug
        executePostUpdate(title, content, finalThumbnail, author_id, slug, id, oldThumbnail, res);
      });
    } else {
      // Không có slug mới hoặc slug không thay đổi, tiến hành cập nhật luôn
      executePostUpdate(title, content, finalThumbnail, author_id, slug, id, oldThumbnail, res);
    }
  });
};

// Hàm nội bộ để thực hiện việc cập nhật thực tế
const executePostUpdate = (title, content, finalThumbnail, author_id, slug, id, oldThumbnail, res) => {
  const sql = `
    UPDATE posts
    SET title = ?, content = ?, thumbnail = ?, author_id = ?, slug = ?, updated_at = CURRENT_TIMESTAMP
    WHERE post_id = ?
  `;
  // Sử dụng slug mới nếu có, nếu không thì dùng slug cũ (đã được kiểm tra)
  const params = [title, content, finalThumbnail, author_id, slug || oldThumbnail, id]; // Fix: slug || oldThumbnail là sai, phải là slug || oldSlug

  // Lấy slug cũ từ kết quả query ban đầu nếu slug mới là null/undefined
  db.query("SELECT slug FROM posts WHERE post_id = ?", [id], (err, oldSlugResult) => {
    if (err) {
        console.error('Lỗi khi lấy slug cũ để cập nhật:', err);
        return res.status(500).json({ message: "Lỗi máy chủ khi cập nhật bài viết." });
    }
    const actualSlug = slug || oldSlugResult[0].slug; // Sử dụng slug mới hoặc slug cũ từ DB
    const finalParams = [title, content, finalThumbnail, author_id, actualSlug, id];


    db.query(sql, finalParams, (err) => {
      if (err) {
        console.error('Lỗi khi cập nhật bài viết:', err);
        return res.status(500).json({ message: "Lỗi máy chủ khi cập nhật bài viết." });
      }
      // Nếu có thumbnail mới, xóa thumbnail cũ (nếu có và khác với thumbnail mới)
      if (finalThumbnail && finalThumbnail !== oldThumbnail && oldThumbnail) {
        fs.unlink(path.join(UPLOADS_DIR, oldThumbnail), (unlinkErr) => {
          if (unlinkErr) console.error('Lỗi khi xóa thumbnail cũ:', unlinkErr);
        });
      }
      res.json({ message: "✅ Cập nhật bài viết thành công!" });
    });
  });
};


// ✅ 6. Xóa bài viết
export const deletePost = (req, res) => {
  const { id } = req.params;

  // Lấy tên thumbnail trước khi xóa bài viết để xóa file
  db.query("SELECT thumbnail FROM posts WHERE post_id = ?", [id], (err, results) => {
    if (err) {
      console.error('Lỗi khi lấy thumbnail bài viết để xóa:', err);
      return res.status(500).json({ message: "Lỗi máy chủ khi xóa bài viết." });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy bài viết để xóa." });
    }

    const thumbnailToDelete = results[0].thumbnail;

    db.query("DELETE FROM posts WHERE post_id = ?", [id], (err, dbResult) => {
      if (err) {
        console.error('Lỗi khi xóa bài viết từ DB:', err);
        return res.status(500).json({ message: "Lỗi máy chủ khi xóa bài viết." });
      }
      if (dbResult.affectedRows === 0) {
        return res.status(404).json({ message: "Không tìm thấy bài viết để xóa." });
      }
      // Xóa file thumbnail sau khi xóa thành công trong DB
      if (thumbnailToDelete) {
        fs.unlink(path.join(UPLOADS_DIR, thumbnailToDelete), (unlinkErr) => {
          if (unlinkErr) console.error('Lỗi khi xóa file thumbnail:', unlinkErr);
        });
      }
      res.json({ message: "🗑️ Xóa bài viết thành công!" });
    });
  });
};