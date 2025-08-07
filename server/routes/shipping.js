// 📁 routes/shipping.js

import express from 'express';
import { calculateShippingFee } from '../controllers/shippingController.js';

const shippingRoutes = express.Router();

// Định nghĩa route để tính phí ship
// POST /api/shipping/calculate-fee
shippingRoutes.post('/calculate-fee', calculateShippingFee);

export default shippingRoutes;