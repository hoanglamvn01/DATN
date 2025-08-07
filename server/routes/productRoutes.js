// 📁 server/routes/productRoutes.js
import express from 'express';
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategorySlug,
  getProductsByBrandSlug,
  getProductById
} from '../controllers/productController.js'; 
import upload from '../middlewares/upload.js'; // Đảm bảo đường dẫn đúng tới file upload.js

const router = express.Router();

// Định nghĩa các route GET trước (ít gây xung đột hơn)
router.get('/category/:slug', getProductsByCategorySlug);
router.get('/brand/:slug', getProductsByBrandSlug);
router.get('/', getAllProducts);
router.get('/:id', getProductById); // Route để lấy chi tiết sản phẩm theo ID

// ✅ ROUTE THÊM SẢN PHẨM: Chỉ dùng upload.fields để chấp nhận thumbnail và nhiều ảnh phụ
router.post(
  '/',
  upload.fields([
    { name: 'thumbnail', maxCount: 1 }, // Tên trường cho ảnh thumbnail
    { name: 'other_images', maxCount: 5 } // Tên trường cho các ảnh phụ
  ]),
  createProduct
);

// ✅ ROUTE CẬP NHẬT SẢN PHẨM: Chỉ dùng upload.fields để chấp nhận thumbnail và nhiều ảnh phụ
router.put(
  '/:id',
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'other_images', maxCount: 5 }
  ]),
  updateProduct
);

// ✅ ROUTE XÓA SẢN PHẨM
router.delete('/:id', deleteProduct);


export default router;