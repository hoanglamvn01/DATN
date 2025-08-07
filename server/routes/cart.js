// 📁 routes/cart.js
import express from "express";
import {
  addToCart,
  getCartItems,
  updateCartItemQuantity,
  removeCartItem,
} from "../controllers/cartController.js"; // ✅ Import các hàm mới

const cartRouter = express.Router();

// ✅ Route POST để thêm sản phẩm (đã có)
cartRouter.post("/add", addToCart);

// ✅ Route GET để lấy giỏ hàng của người dùng
cartRouter.get("/:user_id", getCartItems);

// ✅ Route PUT để cập nhật số lượng
cartRouter.put("/:user_id/:product_id", updateCartItemQuantity);

// ✅ Route DELETE để xoá sản phẩm
cartRouter.delete("/:user_id/:product_id", removeCartItem);

export default cartRouter;