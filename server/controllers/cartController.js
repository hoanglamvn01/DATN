// 📁 controllers/cartController.js
import { db } from "../config/connectBD.js";

// ✅ Lấy tất cả sản phẩm trong giỏ hàng của người dùng
export const getCartItems = (req, res) => {
  const { user_id } = req.params;

  const sql = `
    SELECT
      c.quantity,
      p.product_id,
      p.name,
      CAST(p.price AS DECIMAL(10, 2)) AS price,
      p.thumbnail -- Lấy tên file ảnh
    FROM cart c -- Đảm bảo tên bảng là 'cart' hoặc sửa thành 'cart_items' nếu khác
    JOIN products p ON c.product_id = p.product_id
    WHERE c.user_id = ?
  `;

  db.query(sql, [user_id], (err, result) => {
    if (err) {
      console.error("Lỗi khi lấy giỏ hàng:", err);
      return res
        .status(500)
        .json({ error: "Lỗi server", details: err.message });
    }
    const cartItems = result.map((item) => ({
      ...item,
      quantity: parseInt(item.quantity, 10), // Chuyển đổi quantity thành số nguyên
      price: parseFloat(item.price), // Chuyển đổi price thành số thực
      thumbnail: item.thumbnail || "", // ✅ Đảm bảo thumbnail là chuỗi rỗng nếu null/undefined
    }));
    res.json(cartItems);
  });
};

// ✅ Cập nhật số lượng sản phẩm trong giỏ
export const updateCartItemQuantity = (req, res) => {
  const { user_id, product_id } = req.params;
  const { quantity } = req.body;

  if (isNaN(quantity) || quantity < 0) {
    return res.status(400).json({ error: "Số lượng không hợp lệ" });
  }

  const sql =
    "UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?"; // Đảm bảo tên bảng là 'cart'
  db.query(sql, [quantity, user_id, product_id], (err) => {
    if (err) {
      console.error("Lỗi khi cập nhật số lượng:", err);
      return res
        .status(500)
        .json({ error: "Lỗi server", details: err.message });
    }
    res.json({ message: "✅ Cập nhật số lượng thành công" });
  });
};

// ✅ Xoá sản phẩm khỏi giỏ hàng
export const removeCartItem = (req, res) => {
  const { user_id, product_id } = req.params;

  const sql = "DELETE FROM cart WHERE user_id = ? AND product_id = ?"; // Đảm bảo tên bảng là 'cart'
  db.query(sql, [user_id, product_id], (err) => {
    if (err) {
      console.error("Lỗi khi xoá sản phẩm:", err);
      return res
        .status(500)
        .json({ error: "Lỗi server", details: err.message });
    }
    res.json({ message: "✅ Xoá sản phẩm khỏi giỏ hàng thành công" });
  });
};

// ✅ Thêm sản phẩm vào giỏ hàng
export const addToCart = (req, res) => {
  const { user_id, product_id, quantity } = req.body;
  if (!user_id || !product_id || isNaN(quantity) || quantity < 1) {
    return res.status(400).json({
      error: "Vui lòng cung cấp đầy đủ thông tin hoặc số lượng hợp lệ",
    });
  }

  const checkSql = "SELECT * FROM cart WHERE user_id = ? AND product_id = ?"; // Đảm bảo tên bảng là 'cart'
  db.query(checkSql, [user_id, product_id], (err, result) => {
    if (err) {
      console.error("Lỗi khi kiểm tra giỏ hàng:", err);
      return res
        .status(500)
        .json({ error: "Lỗi server", details: err.message });
    }
    if (result.length > 0) {
      const updateSql =
        "UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?"; // Đảm bảo tên bảng là 'cart'
      db.query(updateSql, [quantity, user_id, product_id], (err) => {
        if (err) {
          console.error(
            "Lỗi khi cập nhật số lượng sản phẩm trong giỏ hàng:",
            err
          );
          return res
            .status(500)
            .json({ error: "Lỗi server", details: err.message });
        }
        return res.json({
          message: "✅ Cập nhật số lượng sản phẩm trong giỏ hàng thành công",
        });
      });
    } else {
      const insertSql =
        "INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)"; // Đảm bảo tên bảng là 'cart'
      db.query(insertSql, [user_id, product_id, quantity], (err) => {
        if (err) {
          console.error("Lỗi khi thêm sản phẩm vào giỏ hàng:", err);
          return res
            .status(500)
            .json({ error: "Lỗi server", details: err.message });
        }
        return res.json({
          message: "✅ Thêm sản phẩm vào giỏ hàng thành công",
        });
      });
    }
  });
};