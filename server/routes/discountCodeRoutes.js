// routes/discountCodeRoutes.js
import express from 'express';
import { 
    getAllDiscountCodes, 
    getDiscountCodeById, 
    createDiscountCode, 
    updateDiscountCode, 
    deleteDiscountCode, 
    applyDiscountCode
} from '../controllers/discountCodeController.js'; // Cần thêm .js

const discountCodeRoutes = express.Router();

// Định nghĩa các route
discountCodeRoutes.get('/', getAllDiscountCodes);
discountCodeRoutes.get('/:id', getDiscountCodeById);
discountCodeRoutes.post('/', createDiscountCode);
discountCodeRoutes.put('/:id', updateDiscountCode);
discountCodeRoutes.delete('/:id', deleteDiscountCode);
discountCodeRoutes.post('/apply', applyDiscountCode);
export default discountCodeRoutes; // Sử dụng export default cho router