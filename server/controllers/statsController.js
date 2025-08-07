// 📁 server/controllers/statsController.js

import { queryDatabase } from "../config/connectBD.js";
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore.js';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter.js';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);


// Hàm hỗ trợ để lấy tham số ngày tháng và chuyển đổi thành đối tượng Day.js
const getDateRangeParams = (req) => {
    const { startDate, endDate } = req.query;
    
    const startDayjs = startDate ? dayjs(startDate) : null;
    const endDayjs = endDate ? dayjs(endDate).endOf('day') : null; 

    const sqlStartDate = startDayjs ? startDayjs.format('YYYY-MM-DD HH:mm:ss') : null;
    const sqlEndDate = endDayjs ? endDayjs.format('YYYY-MM-DD HH:mm:ss') : null;

    return { 
        sqlStartDate, 
        sqlEndDate, 
        startDayjs, 
        endDayjs    
    };
};

// --- 1. Thống kê tổng quan (không đổi) ---
export const getOverallStats = async (req, res) => {
    const { sqlStartDate, sqlEndDate } = getDateRangeParams(req);
    console.log('Overall Stats - Received startDate:', sqlStartDate, 'endDate:', sqlEndDate);

    let dateFilterCondition = ''; // Điều kiện lọc ngày chung
    let dateFilterParams = []; // Tham số lọc ngày chung

    if (sqlStartDate && sqlEndDate) {
        dateFilterCondition = ` AND created_at BETWEEN ? AND ?`;
        dateFilterParams = [sqlStartDate, sqlEndDate];
    }

    try {
        const totalRevenueRows = await queryDatabase(
            `SELECT COALESCE(SUM(total_amount), 0) AS total_revenue 
             FROM orders 
             WHERE order_status = 'completed' ${dateFilterCondition}`,
             dateFilterParams
        );
        const totalRevenue = totalRevenueRows[0].total_revenue;

        const totalOrdersRows = await queryDatabase(
            `SELECT COUNT(*) AS total_orders 
             FROM orders 
             WHERE 1=1 ${dateFilterCondition}`, 
             dateFilterParams
        );
        const totalOrders = totalOrdersRows[0].total_orders;

        const totalProductsRows = await queryDatabase(
            `SELECT COUNT(*) AS total_products FROM products WHERE 1=1 ${dateFilterCondition}`,
            dateFilterParams
        );
        const totalProducts = totalProductsRows[0].total_products;

        const totalUsersRows = await queryDatabase(
            `SELECT COUNT(*) AS total_users FROM users WHERE role = 'customer' ${dateFilterCondition}`,
            dateFilterParams
        );
        const totalUsers = totalUsersRows[0].total_users;

        res.status(200).json({
            total_revenue: parseFloat(totalRevenue) || 0,
            total_orders: parseInt(totalOrders) || 0,
            total_products: parseInt(totalProducts) || 0,
            total_users: parseInt(totalUsers) || 0,
        });

    } catch (err) {
        console.error('Lỗi khi lấy thống kê tổng quan:', err);
        res.status(500).json({ message: 'Lỗi server khi lấy thống kê tổng quan.' });
    }
};

// --- 2. Top sản phẩm bán chạy (không đổi) ---
export const getTopSellingProducts = async (req, res) => {
    const limit = parseInt(req.query.limit) || 5;
    const { sqlStartDate, sqlEndDate } = getDateRangeParams(req);
    console.log('Top Selling Products - Received startDate:', sqlStartDate, 'endDate:', sqlEndDate);

    let dateFilterForOrders = '';
    let queryParams = [limit]; 

    if (sqlStartDate && sqlEndDate) {
        dateFilterForOrders = `AND o.created_at BETWEEN ? AND ?`;
        queryParams.unshift(sqlEndDate); 
        queryParams.unshift(sqlStartDate); 
    }

    try {
        const rows = await queryDatabase(
            `SELECT
                oi.product_id,
                p.name AS product_name,
                p.thumbnail,
                SUM(oi.quantity) AS total_sold_quantity
            FROM
                order_items oi
            JOIN
                products p ON oi.product_id = p.product_id
            JOIN
                orders o ON oi.order_id = o.order_id
            WHERE
                o.order_status = 'completed'
                ${dateFilterForOrders}
            GROUP BY
                oi.product_id, p.name, p.thumbnail
            ORDER BY
                total_sold_quantity DESC
            LIMIT ?`,
            queryParams
        );

        res.status(200).json(rows.map(row => ({
            ...row,
            total_sold_quantity: parseInt(row.total_sold_quantity) || 0
        })));

    } catch (err) {
        console.error('Lỗi khi lấy top sản phẩm bán chạy:', err);
        res.status(500).json({ message: 'Lỗi server khi lấy top sản phẩm bán chạy.' });
    }
};

// --- 3. Doanh thu theo ngày (Time Series Revenue - không đổi) ---
export const getTimeSeriesRevenue = async (req, res) => {
    const { sqlStartDate, sqlEndDate, startDayjs, endDayjs } = getDateRangeParams(req);
    console.log('Time Series Revenue - Received startDate:', sqlStartDate, 'endDate:', sqlEndDate);

    let baseConditions = `WHERE order_status = 'completed'`;
    let queryParams = [];

    let loopStartDateActual = null;
    let loopEndDateActual = null;

    if (sqlStartDate && sqlEndDate && startDayjs && endDayjs) {
        baseConditions += ` AND created_at BETWEEN ? AND ?`;
        queryParams = [sqlStartDate, sqlEndDate];
        loopStartDateActual = startDayjs;
        loopEndDateActual = endDayjs;
    } else {
        loopEndDateActual = dayjs().endOf('day');
        loopStartDateActual = dayjs().subtract(5, 'month').startOf('month');
        
        baseConditions += ` AND created_at BETWEEN ? AND ?`;
        queryParams = [
            loopStartDateActual.format('YYYY-MM-DD HH:mm:ss'),
            loopEndDateActual.format('YYYY-MM-DD HH:mm:ss')
        ];
    }

    if (!loopStartDateActual || !loopEndDateActual || loopStartDateActual.isAfter(loopEndDateActual)) {
        console.error("getTimeSeriesRevenue: Invalid or undefined date range for loop generation.");
        return res.status(200).json([]); 
    }

    try {
        const rows = await queryDatabase(
            `SELECT
                DATE_FORMAT(created_at, '%Y-%m-%d') AS date,
                COALESCE(SUM(total_amount), 0) AS revenue
            FROM
                orders
            ${baseConditions}  
            GROUP BY
                date
            ORDER BY
                date ASC`,
            queryParams
        );

        const revenueMap = new Map();
        rows.forEach(row => {
            revenueMap.set(row.date, parseFloat(row.revenue) || 0);
        });

        const allDates = [];
        let currentDate = loopStartDateActual.startOf('day'); 
        
        while (currentDate.isSameOrBefore(loopEndDateActual.endOf('day'), 'day')) {
            const formattedDate = currentDate.format('YYYY-MM-DD');
            allDates.push({
                date: formattedDate,
                revenue: revenueMap.has(formattedDate) ? revenueMap.get(formattedDate) : 0
            });
            currentDate = currentDate.add(1, 'day');
        }
        
        res.status(200).json(allDates);

    } catch (err) {
        console.error('Lỗi khi lấy doanh thu theo ngày:', err);
        res.status(500).json({ message: 'Lỗi server khi lấy doanh thu theo ngày.' });
    }
};


// ✅ --- 4. Đánh giá mới nhất (New Reviews) ---
export const getNewReviews = async (req, res) => {
    const { sqlStartDate, sqlEndDate } = getDateRangeParams(req);
    const limit = parseInt(req.query.limit) || 5; // Mặc định lấy 5 đánh giá mới nhất
    console.log('New Reviews - Received startDate:', sqlStartDate, 'endDate:', sqlEndDate, 'limit:', limit);

    let dateFilterCondition = '';
    let queryParams = [limit]; // limit là tham số cuối cùng

    if (sqlStartDate && sqlEndDate) {
        dateFilterCondition = `AND r.created_at BETWEEN ? AND ?`;
        queryParams.unshift(sqlEndDate); // Thêm endDate vào đầu
        queryParams.unshift(sqlStartDate); // Thêm startDate vào đầu
    }

    try {
        const query = `
            SELECT
                r.review_id,
                u.full_name AS user_name,
                p.name AS product_name,
                r.rating,
                r.comment,
                r.created_at,
                p.thumbnail AS product_thumbnail
            FROM
                reviews r
            JOIN
                users u ON r.user_id = u.user_id
            JOIN
                products p ON r.product_id = p.product_id
            WHERE 1=1 -- Điều kiện cơ bản để có thể dễ dàng nối với AND
            ${dateFilterCondition}
            ORDER BY
                r.created_at DESC
            LIMIT ?;
        `;
        const rows = await queryDatabase(query, queryParams);
        res.status(200).json(rows);
    } catch (err) {
        console.error('Lỗi khi lấy đánh giá mới:', err);
        res.status(500).json({ message: 'Lỗi server khi lấy đánh giá mới.' });
    }
};

// ❌ (TÙY CHỌN) Bạn có thể xóa hoặc comment hàm getMonthlyRevenue nếu không còn dùng
/*
export const getMonthlyRevenue = async (req, res) => { ... };
*/