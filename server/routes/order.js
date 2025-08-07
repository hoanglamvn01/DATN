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

const orderRoutes = express.Router();

// Lấy tất cả đơn hàng
orderRoutes.get('/', getAllOrders);
// Lấy chi tiết đơn hàng (nếu cần)
orderRoutes.get('/:id', getOrderDetails);
// Cập nhật trạng thái đơn hàng
orderRoutes.put('/:id', updateOrderStatus);
// Xóa đơn hàng
orderRoutes.delete('/:id', deleteOrder);
orderRoutes.post('/', createOrder); 
orderRoutes.get('/user/:userId', getOrdersByUserId); 

export default orderRoutes;