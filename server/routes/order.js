// routes/orderRoutes.js
import express from 'express';
import { 
    getAllOrders, 
    getOrderDetails, 
    updateOrderStatus, 
    deleteOrder,
    createOrder,
    getOrdersByUserId 
} from '../controllers/orderController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const orderRoutes = express.Router();

// Lấy tất cả đơn hàng (admin)
orderRoutes.get('/', getAllOrders);
// Lấy chi tiết đơn hàng (nếu cần)
orderRoutes.get('/:id', getOrderDetails);
// Cập nhật trạng thái đơn hàng (admin)
orderRoutes.put('/:id', updateOrderStatus);
// Xóa đơn hàng (admin)
orderRoutes.delete('/:id', deleteOrder);
// Tạo đơn hàng (cần authentication)
orderRoutes.post('/', verifyToken, createOrder); 
// Lấy đơn hàng của user (cần authentication)
orderRoutes.get('/user/:userId', verifyToken, getOrdersByUserId);

export default orderRoutes;