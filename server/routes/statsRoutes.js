// 📁 server/routes/statsRoutes.js
import express from 'express';
import { 
    getOverallStats, 
    getTopSellingProducts, 
    getTimeSeriesRevenue,
    getNewReviews // ✅ Import hàm mới
} from '../controllers/statsController.js';

const statsRoutes = express.Router();

statsRoutes.get('/overall', getOverallStats);
statsRoutes.get('/top-selling', getTopSellingProducts);
statsRoutes.get('/time-series-revenue', getTimeSeriesRevenue);
statsRoutes.get('/new-reviews', getNewReviews); // ✅ Thêm route mới

// ❌ (TÙY CHỌN) Nếu bạn không còn cần endpoint doanh thu theo tháng, hãy xóa dòng này.
// statsRoutes.get('/monthly-revenue', getMonthlyRevenue); 

export default statsRoutes;