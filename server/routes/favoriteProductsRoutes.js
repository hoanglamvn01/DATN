import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import {
    getFavoriteProducts,
    addFavoriteProduct,
    removeFavoriteProduct,
    getFavoriteProductsByUser
} from '../controllers/favoriteProductsController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const favoriteProductsRoutes = express.Router();

// GET: Lấy danh sách sản phẩm yêu thích
// favoriteProductsRoutes.get('/', getFavoriteProducts);
favoriteProductsRoutes.get('/', getFavoriteProducts);
favoriteProductsRoutes.get('/:user_id', getFavoriteProductsByUser); // ✅ User: lấy theo user_id
// POST: Thêm sản phẩm yêu thích
favoriteProductsRoutes.post('/', verifyToken, addFavoriteProduct);

// DELETE: Xóa sản phẩm yêu thích
favoriteProductsRoutes.delete('/:product_id', verifyToken, removeFavoriteProduct);

export default favoriteProductsRoutes;
