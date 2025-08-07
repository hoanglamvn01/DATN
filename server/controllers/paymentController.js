// controllers/paymentController.js
import crypto from 'crypto';
import qs from 'qs';
import dayjs from 'dayjs';
import { db } from '../config/connectBD.js';

const VNP_TMNCODE = process.env.VNP_TMNCODE;
const VNP_HASHSECRET = process.env.VNP_HASHSECRET;
const VNP_URL = process.env.VNP_URL;
const VNP_RETURN_URL = process.env.VNP_RETURN_URL;
const VNP_IPN_URL = process.env.VNP_IPN_URL;

// Helper hàm tạo chuỗi query và hash
const sortObject = (obj) => {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    for (let key of keys) {
        sorted[key] = obj[key];
    }
    return sorted;
};

// ✅ API: Tạo URL thanh toán VNPay
export const createVnpayPayment = async (req, res) => {
    try {
        const { orderId } = req.body;

        const sql = 'SELECT * FROM orders WHERE order_id = ?';
        const orders = await new Promise((resolve, reject) => {
            db.query(sql, [orderId], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });

        if (orders.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy đơn hàng.' });
        }

        const order = orders[0];
        const amount = order.total_amount * 100;

        const createDate = dayjs().format('YYYYMMDDHHmmss');
        const ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        let vnp_Params = {
            vnp_Version: '2.1.0',
            vnp_Command: 'pay',
            vnp_TmnCode: VNP_TMNCODE,
            vnp_Locale: 'vn',
            vnp_CurrCode: 'VND',
            vnp_TxnRef: order.order_code,
            vnp_OrderInfo: `Thanh toan don hang ${order.order_code}`,
            vnp_OrderType: 'other',
            vnp_Amount: amount,
            vnp_ReturnUrl: VNP_RETURN_URL,
            vnp_IpAddr: ipAddr,
            vnp_CreateDate: createDate,
            vnp_IpnUrl: VNP_IPN_URL,
        };

        vnp_Params = sortObject(vnp_Params);
        const signData = qs.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac('sha512', VNP_HASHSECRET);
        const secureHash = hmac.update(signData).digest('hex');

        vnp_Params.vnp_SecureHash = secureHash;

        const paymentUrl = `${VNP_URL}?${qs.stringify(vnp_Params, { encode: true })}`;
        res.json({ paymentUrl });

    } catch (error) {
        console.error('Lỗi tạo URL thanh toán VNPay:', error);
        res.status(500).json({ error: 'Không tạo được URL thanh toán.' });
    }
};

// ✅ API: VNPay redirect về đây (xác minh và cập nhật đơn hàng)
export const vnpayReturn = async (req, res) => {
    const vnp_Params = req.query;
    const secureHash = vnp_Params.vnp_SecureHash;

    delete vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHashType;

    const sortedParams = sortObject(vnp_Params);
    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', VNP_HASHSECRET);
    const checkSum = hmac.update(signData).digest('hex');

    if (secureHash === checkSum) {
        const orderCode = vnp_Params.vnp_TxnRef;
        const sql = `UPDATE orders SET payment_status = 'paid' WHERE order_code = ?`;
        db.query(sql, [orderCode], (err, result) => {
            if (err) {
                return res.status(500).send('Lỗi khi cập nhật đơn hàng.');
            }
            // Redirect về FE hoặc trả kết quả
            return res.redirect(`http://localhost:3001/payment-success?orderCode=${orderCode}`);
        });
    } else {
        return res.status(400).send('Chữ ký không hợp lệ!');
    }
};

// ✅ API: Xử lý IPN từ VNPay (nếu muốn dùng)
export const vnpayIpn = async (req, res) => {
    const vnp_Params = req.query;
    const secureHash = vnp_Params.vnp_SecureHash;

    delete vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHashType;

    const sortedParams = sortObject(vnp_Params);
    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', VNP_HASHSECRET);
    const checkSum = hmac.update(signData).digest('hex');

    if (secureHash !== checkSum) {
        return res.status(400).json({ RspCode: '97', Message: 'Invalid signature' });
    }

    const orderCode = vnp_Params.vnp_TxnRef;
    const responseCode = vnp_Params.vnp_ResponseCode;

    if (responseCode === '00') {
        const sql = `UPDATE orders SET payment_status = 'paid' WHERE order_code = ?`;
        db.query(sql, [orderCode], (err, result) => {
            if (err) {
                return res.status(500).json({ RspCode: '99', Message: 'DB error' });
            }
            return res.status(200).json({ RspCode: '00', Message: 'Success' });
        });
    } else {
        return res.status(200).json({ RspCode: '00', Message: 'Payment failed or canceled' });
    }
};
