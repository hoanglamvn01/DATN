// 📁 server/controllers/momoController.js

// Import cả db và hàm queryDatabase từ file config của bạn
import { db, queryDatabase } from "../config/connectBD.js";
import dayjs from 'dayjs';
import crypto from 'crypto';
import querystring from 'qs';
import axios from 'axios';
// Các import khác nếu có...

// =========================================================================
// ✅ BƯỚC 1: ĐẢM BẢO BẠN CÓ KHỐI CODE NÀY Ở ĐẦU FILE
// --- TẠO CÁC HÀM HELPER CHO TRANSACTION ---
const beginTransaction = () => {
    return new Promise((resolve, reject) => {
        db.beginTransaction(err => {
            if (err) return reject(err);
            resolve();
        });
    });
};

const commit = () => {
    return new Promise((resolve, reject) => {
        db.commit(err => {
            if (err) return reject(err);
            resolve();
        });
    });
};

const rollback = () => {
    return new Promise((resolve, reject) => {
        // rollback() không trả về lỗi, nó chỉ thực thi
        db.rollback(() => { 
            resolve();
        });
    });
};
// =========================================================================


// =========================================================================
// ✅ BƯỚC 2: HÀM CHÍNH SỬ DỤNG CÁC HELPER TRÊN
// HÀM CHÍNH: TẠO ORDER VÀ URL THANH TOÁN MOMO
export const createMomoOrderAndUrl = async (req, res) => {
    const { totalAmount, userId, addressId, items, shippingFee, discount, couponCode, recipientName, recipientPhone, newAddress } = req.body;
    
    try {
        await beginTransaction();

        let addressIdToUse = addressId;
        if (newAddress) {
            const addressSql = `INSERT INTO user_addresses (user_id, full_name, phone_number, province, district, ward, address_line) VALUES (?, ?, ?, ?, ?, ?, ?)`;
            const addressParams = [ userId, recipientName, recipientPhone, newAddress.province, newAddress.district, newAddress.ward, newAddress.address ];
            const addressResult = await queryDatabase(addressSql, addressParams);
            addressIdToUse = addressResult.insertId;
        }

        const orderSql = `INSERT INTO orders (user_id, address_id, total_amount, shipping_fee, discount_amount, coupon_code, order_status, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        const orderParams = [ userId, addressIdToUse, totalAmount, shippingFee, discount, couponCode, 'pending', 'momo' ];
        const orderResult = await queryDatabase(orderSql, orderParams);
        const orderId = orderResult.insertId;
        const orderCode = `ORD-${dayjs().format('YYYYMMDDHHmmss')}-${orderId}`;

        const orderItemsSql = `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?`;
        const orderItemsParams = items.map(item => [orderId, item.productId, item.quantity, item.price]);
        await queryDatabase(orderItemsSql, [orderItemsParams]);

        await queryDatabase(`UPDATE orders SET order_code = ?, recipient_name = ?, recipient_phone = ? WHERE order_id = ?`, [orderCode, recipientName, recipientPhone, orderId]);
        
        // --- Phần gọi MoMo API (giữ nguyên, bạn cần đảm bảo có các hàm và config này) ---
        const momoConfig = {
            partnerCode: process.env.MOMO_PARTNER_CODE,
            accessKey: process.env.MOMO_ACCESS_KEY,
            secretKey: process.env.MOMO_SECRET_KEY,
            url: process.env.MOMO_ENDPOINT,
            returnUrl: process.env.MOMO_RETURN_URL,
            ipnUrl: process.env.MOMO_IPN_URL,
        };

        const orderInfo = `Thanh toan don hang ${orderCode}`;
        const requestBody = {
            partnerCode: momoConfig.partnerCode,
            accessKey: momoConfig.accessKey,
            requestId: orderCode,
            amount: totalAmount,
            orderId: orderCode,
            orderInfo: orderInfo,
            returnUrl: momoConfig.returnUrl,
            ipnUrl: momoConfig.ipnUrl,
            requestType: 'captureWallet',
            extraData: "",
        };

        const signature = createMomoSignature(requestBody, momoConfig.secretKey);
        requestBody.signature = signature;
        
        const momoResponse = await axios.post(momoConfig.url, requestBody);
        
        if (momoResponse.data && momoResponse.data.resultCode === 0) {
            await commit();
            res.status(200).json({ payUrl: momoResponse.data.payUrl });
        } else {
            await rollback();
            res.status(400).json({ message: `Lỗi từ MoMo: ${momoResponse.data.message}` });
        }

    } catch (error) {
        // Gọi await rollback() để đảm bảo nó chạy xong trước khi gửi response
        await rollback();
        console.error("Lỗi khi tạo URL MoMo:", error);
        res.status(500).json({ message: "Lỗi server khi tạo URL thanh toán MoMo." });
    }
};

// --- Các hàm hỗ trợ cho MoMo (giữ nguyên) ---
function createMomoSignature(data, secretKey) {
    const rawSignature = querystring.stringify(sortObject(data));
    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(rawSignature);
    return hmac.digest('hex');
}

function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(key);
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = obj[str[key]];
    }
    return sorted;
}
// =========================================================================