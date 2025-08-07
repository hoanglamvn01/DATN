// 📁 server/controllers/vnpayController.js (v2.1 hoàn chỉnh)
import crypto from 'crypto';
import querystring from 'qs';
import dayjs from 'dayjs';
import { db, queryDatabase } from "../config/connectBD.js";

const beginTransaction = () => new Promise((res, rej) => db.beginTransaction(err => err ? rej(err) : res()));
const commit = () => new Promise((res, rej) => db.commit(err => err ? rej(err) : res()));
const rollback = () => new Promise((res, rej) => db.rollback(() => res()));

// ✅ Hàm build ký tên chuẩn VNPay
// Dùng để ký (không encode)
function buildSignedQuery(params, secretKey) {
  const signData = querystring.stringify(params, {
    sort: (a, b) => a.localeCompare(b),
    encode: false, // ❌ không encode
  });
  const signed = crypto.createHmac("sha512", secretKey).update(signData).digest("hex");
  return { signData, signed };
}

// Dùng để tạo URL (có encode)
function buildVnpayUrl(baseUrl, params) {
  return baseUrl + '?' + querystring.stringify(params, { encode: true }); // ✅
}


// ✅ 1. Tạo đơn hàng và URL thanh toán
export const createVnpayOrderAndUrl = async (req, res) => {
    const ipAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket?.remoteAddress || null;

    const tmnCode = process.env.VNP_TMNCODE;
    const secretKey = process.env.VNP_HASHSECRET;
    const returnUrl = process.env.VNP_RETURN_URL;
    let vnpUrl = process.env.VNP_URL;

    const { totalAmount, userId, addressId, items, shippingFee, discount, couponCode, recipientName, recipientPhone } = req.body;

    try {
        await beginTransaction();

        // Insert đơn hàng
        const orderSql = `INSERT INTO orders (user_id, address_id, total_amount, shipping_fee, discount_amount, coupon_code, order_status, payment_method, recipient_name, recipient_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const orderParams = [userId, addressId, totalAmount, shippingFee, discount, couponCode, 'pending', 'vnpay', recipientName, recipientPhone];
        const orderResult = await queryDatabase(orderSql, orderParams);
        const orderId = orderResult.insertId;

        // Tạo mã đơn hàng
        const finalOrderCode = `ORD-${dayjs().format('YYYYMMDDHHmmss')}-${orderId}`;
        await queryDatabase('UPDATE orders SET order_code = ? WHERE order_id = ?', [finalOrderCode, orderId]);

        // Thêm order items
        const orderItemsSql = `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?`;
        const orderItemsParams = items.map(item => [orderId, item.productId, item.quantity, item.price]);
        await queryDatabase(orderItemsSql, [orderItemsParams]);

        // Tạo tham số VNPay
        const createDate = dayjs().format('YYYYMMDDHHmmss');
        const amount = totalAmount * 100;
        let vnp_Params = {
            vnp_Version: '2.1.0',
            vnp_Command: 'pay',
            vnp_TmnCode: tmnCode,
            vnp_Locale: 'vn',
            vnp_CurrCode: 'VND',
            vnp_TxnRef: finalOrderCode,
            vnp_OrderInfo: `Thanh toan don hang ${finalOrderCode}`,
            vnp_OrderType: 'other',
            vnp_Amount: amount,
            vnp_ReturnUrl: returnUrl,
            vnp_IpAddr: ipAddr,
            vnp_CreateDate: createDate,
        };

        const { signData, signed } = buildSignedQuery(vnp_Params, secretKey);
        console.log("Chuỗi dữ liệu để tạo chữ ký:", signData);

        vnp_Params['vnp_SecureHash'] = signed;
        vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: true });

        await commit();
        res.status(200).json({ vnpayUrl: vnpUrl });
    } catch (error) {
        await rollback();
        console.error("Lỗi khi tạo URL VNPay:", error);
        res.status(500).json({ message: "Lỗi server khi tạo URL thanh toán VNPay." });
        console.log("🔥 VNPay Params trước khi ký:", vnp_Params);
console.log("🔐 Dữ liệu được ký:", signData);
console.log("✅ Chữ ký tạo ra:", signed);

    }
};

// ✅ 2. VNPay IPN (xác thực callback server)
export const vnpayIpn = async (req, res) => {
    let vnp_Params = req.query;
    const secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    const { signed } = buildSignedQuery(vnp_Params, process.env.VNP_HASHSECRET);

    if (secureHash === signed) {
        res.status(200).json({ RspCode: '00', Message: 'Success' });
    } else {
        res.status(200).json({ RspCode: '97', Message: 'Invalid signature' });
    }
};

// ✅ 3. VNPay Return (người dùng quay lại sau khi thanh toán)
export const vnpayReturn = (req, res) => {
    let vnp_Params = req.query;
    const secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    const { signed } = buildSignedQuery(vnp_Params, process.env.VNP_HASHSECRET);

    if (secureHash === signed) {
        res.redirect(`http://localhost:5173/checkout-success`);
    } else {
        res.redirect(`http://localhost:5173/checkout-failure?message=invalid-signature`);
    }
};
