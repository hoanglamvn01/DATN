import express from 'express';
import { createMomoOrderAndUrl } from '../controllers/momoController.js';
import { createVnpayOrderAndUrl, vnpayIpn, vnpayReturn } from '../controllers/vnpayController.js';
const paymentRoutes = express.Router();

// ✅ ĐÂY LÀ DÒNG BẠN ĐANG BỊ THIẾU HOẶC SAI
paymentRoutes.post('/create-momo-order', createMomoOrderAndUrl);
// --- VNPay Routes ---
paymentRoutes.post('/create-vnpay-order', createVnpayOrderAndUrl);
paymentRoutes.get('/vnpay_ipn', vnpayIpn);
paymentRoutes.get('/vnpay_return', vnpayReturn);


export default paymentRoutes;