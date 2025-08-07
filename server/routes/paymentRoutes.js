import express from 'express';
import { createMomoOrderAndUrl } from '../controllers/momoController.js';
import { createVnpayOrderAndUrl, vnpayIpn, vnpayReturn } from '../controllers/vnpayController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
const paymentRoutes = express.Router();

// ✅ ĐÂY LÀ DÒNG BẠN ĐANG BỊ THIẾU HOẶC SAI
paymentRoutes.post('/create-momo-order', verifyToken, createMomoOrderAndUrl);
// --- VNPay Routes ---
paymentRoutes.post('/create-vnpay-order', verifyToken, createVnpayOrderAndUrl);
paymentRoutes.get('/vnpay_ipn', vnpayIpn);
paymentRoutes.get('/vnpay_return', vnpayReturn);

// Test routes không cần authentication
paymentRoutes.post('/test-vnpay', createVnpayOrderAndUrl);
paymentRoutes.post('/test-momo', createMomoOrderAndUrl);


export default paymentRoutes;