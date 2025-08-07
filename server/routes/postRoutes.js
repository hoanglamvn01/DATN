import express from 'express';
import {
  createPost,
  getAllPosts,
  getPostById,
  getPostBySlug,
  updatePost,
  deletePost
} from '../controllers/postController.js';
import upload from '../middlewares/upload.js'; // Import middleware upload
// import { authenticateToken } from '../middleware/authMiddleware.js'; // Nếu bạn muốn bảo vệ các route này

const router = express.Router();

// Route lấy tất cả bài viết (có thể có tìm kiếm và phân trang)
router.get('/', getAllPosts);

// Route lấy chi tiết bài viết theo Slug (quan trọng: đặt trước :id)
router.get('/slug/:slug', getPostBySlug);

// Route lấy chi tiết bài viết theo ID
router.get('/:id', getPostById);

// Route tạo bài viết mới (yêu cầu upload thumbnail)
// router.post('/', authenticateToken, upload.single('thumbnail'), createPost); // Nếu có bảo vệ API
router.post('/', upload.single('thumbnail'), createPost);

// Route cập nhật bài viết (yêu cầu upload thumbnail, thumbnail có thể không đổi)
// router.put('/:id', authenticateToken, upload.single('thumbnail'), updatePost); // Nếu có bảo vệ API
router.put('/:id', upload.single('thumbnail'), updatePost);

// Route xóa bài viết
// router.delete('/:id', authenticateToken, deletePost); // Nếu có bảo vệ API
router.delete('/:id', deletePost);

export default router;