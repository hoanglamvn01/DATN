// 📁 server/controllers/vnpayController.js (v2.1 hoàn chỉnh)
import crypto from 'crypto';
import dayjs from 'dayjs';
import querystring from 'qs';
import { v4 as uuidv4 } from 'uuid';
import { db, queryDatabase } from '../config/connectBD.js';

const beginTransaction = () =>
  new Promise((res, rej) => db.beginTransaction(err => (err ? rej(err) : res())));
const commit = () => new Promise((res, rej) => db.commit(err => (err ? rej(err) : res())));
const rollback = () => new Promise((res, rej) => db.rollback(() => res()));

// ✅ Hàm build ký tên chuẩn VNPay - OFFICIAL METHOD
function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
  }
  return sorted;
}

function buildSignedQuery(params, secretKey) {
  // Remove undefined/null values first
  const cleanParams = {};
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      cleanParams[key] = params[key];
    }
  });

  // Use VNPay official sorting method
  const sortedParams = sortObject(cleanParams);
  const signData = querystring.stringify(sortedParams, { encode: false });
  const signed = crypto.createHmac('sha512', secretKey).update(signData).digest('hex');

  return { signData, signed };
}

// Dùng để tạo URL (có encode)
function buildVnpayUrl(baseUrl, params) {
  return baseUrl + '?' + querystring.stringify(params, { encode: true }); // ✅
}

// ✅ 1. Tạo đơn hàng và URL thanh toán
export const createVnpayOrderAndUrl = async (req, res) => {
  const ipAddr =
    req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket?.remoteAddress ||
    '127.0.0.1';

  const tmnCode = process.env.VNP_TMNCODE;
  const secretKey = process.env.VNP_HASHSECRET;
  const returnUrl = process.env.VNP_RETURN_URL;
  let vnpUrl = process.env.VNP_URL;

  console.log('✨ VNPay Environment Check:');
  console.log('TMN Code:', tmnCode);
  console.log('Secret Key:', secretKey ? '***' + secretKey.slice(-4) : 'NOT_SET');
  console.log('Expected Secret Key should end with: ***S0E5');
  console.log('Return URL:', returnUrl);
  console.log('VNP URL:', vnpUrl);

  const {
    totalAmount,
    userId,
    addressId,
    items,
    shippingFee,
    discount,
    couponCode,
    recipientName,
    recipientPhone,
    newAddress,
    paymentMethod,
  } = req.body;

  try {
    await beginTransaction();

    // Xử lý thông tin địa chỉ (tương tự orderController)
    let finalAddressId;
    let finalRecipientName = '';
    let finalRecipientPhone = '';
    let finalShippingAddressString = '';

    if (newAddress) {
      // Nếu có newAddress, tạo địa chỉ mới trong database
      const generatedAddressId = uuidv4();
      const insertAddressSql = `INSERT INTO user_addresses (address_id, user_id, full_name, phone_number, province, district, ward, address_line) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      await queryDatabase(insertAddressSql, [
        generatedAddressId,
        userId,
        recipientName,
        recipientPhone,
        newAddress.province,
        newAddress.district,
        newAddress.ward,
        newAddress.address,
      ]);
      finalAddressId = generatedAddressId;

      finalRecipientName = recipientName;
      finalRecipientPhone = recipientPhone;
      finalShippingAddressString = `${newAddress.address}, ${newAddress.ward}, ${newAddress.district}, ${newAddress.province}`;
    } else if (addressId) {
      // Sử dụng địa chỉ có sẵn
      finalAddressId = addressId;
      const addressQuery = `SELECT full_name, phone_number, address_line, ward, district, province FROM user_addresses WHERE address_id = ? AND user_id = ?`;
      const addressResult = await queryDatabase(addressQuery, [addressId, userId]);

      if (addressResult.length === 0) {
        throw new Error('Địa chỉ không hợp lệ hoặc không thuộc về người dùng này.');
      }
      const address = addressResult[0];
      finalRecipientName = address.full_name;
      finalRecipientPhone = address.phone_number;
      finalShippingAddressString = `${address.address_line}, ${address.ward}, ${address.district}, ${address.province}`;
    } else {
      throw new Error('Không có thông tin địa chỉ hợp lệ.');
    }

    // Insert đơn hàng
    const orderSql = `INSERT INTO orders (user_id, address_id, total_amount, shipping_fee, discount_amount, coupon_code, order_status, payment_method, recipient_name, recipient_phone, shipping_address_line) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const orderParams = [
      userId,
      finalAddressId,
      totalAmount,
      shippingFee,
      discount,
      couponCode,
      'pending',
      'vnpay',
      finalRecipientName,
      finalRecipientPhone,
      finalShippingAddressString,
    ];
    const orderResult = await queryDatabase(orderSql, orderParams);
    const orderId = orderResult.insertId;

    // Tạo mã đơn hàng
    const finalOrderCode = `ORD-${dayjs().format('YYYYMMDDHHmmss')}-${orderId}`;
    await queryDatabase('UPDATE orders SET order_code = ? WHERE order_id = ?', [
      finalOrderCode,
      orderId,
    ]);

    // Thêm order items và cập nhật kho
    for (const item of items) {
      const updateProductStockSql = `UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ? AND stock_quantity >= ?;`;
      const updateResult = await queryDatabase(updateProductStockSql, [
        item.quantity,
        item.productId,
        item.quantity,
      ]);

      if (updateResult.affectedRows === 0) {
        throw new Error(`Không đủ hàng trong kho cho sản phẩm ID: ${item.productId}.`);
      }

      const insertOrderItemSql = `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?);`;
      await queryDatabase(insertOrderItemSql, [orderId, item.productId, item.quantity, item.price]);
    }

    // Xóa các sản phẩm đã đặt khỏi giỏ hàng
    const productIdsInOrder = items.map(item => item.productId);
    if (productIdsInOrder.length > 0) {
      const placeholders = productIdsInOrder.map(() => '?').join(', ');
      const deleteCartItemsSql = `DELETE FROM cart WHERE user_id = ? AND product_id IN (${placeholders});`;
      await queryDatabase(deleteCartItemsSql, [userId, ...productIdsInOrder]);
    }

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
      vnp_OrderInfo: `Payment for order ${finalOrderCode}`,
      vnp_OrderType: 'other',
      vnp_Amount: amount,
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    const { signData, signed } = buildSignedQuery(vnp_Params, secretKey);
    console.log('🔥 VNPay Params trước khi ký:', vnp_Params);
    console.log('🔐 Dữ liệu được ký:', signData);
    console.log('✅ Chữ ký tạo ra:', signed);

    vnp_Params['vnp_SecureHash'] = signed;
    vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: true });

    await commit();
    res.status(200).json({ vnpayUrl: vnpUrl });
  } catch (error) {
    await rollback();
    console.error('Lỗi khi tạo URL VNPay:', error);
    res.status(500).json({ message: 'Lỗi server khi tạo URL thanh toán VNPay.' });
  }
};

// ✅ 2. VNPay IPN (xác thực callback server)
export const vnpayIpn = async (req, res) => {
  console.log('🔔 VNPay IPN received:', req.query);

  let vnp_Params = req.query;
  const secureHash = vnp_Params['vnp_SecureHash'];

  delete vnp_Params['vnp_SecureHash'];
  delete vnp_Params['vnp_SecureHashType'];

  const { signData, signed } = buildSignedQuery(vnp_Params, process.env.VNP_HASHSECRET);

  console.log('🔍 IPN Signature Verification:');
  console.log('- Received hash:', secureHash);
  console.log('- Calculated hash:', signed);
  console.log('- Sign data:', signData);
  console.log('- Match:', secureHash === signed);

  if (secureHash === signed) {
    // TODO: Cập nhật trạng thái đơn hàng ở đây
    const { vnp_TxnRef, vnp_ResponseCode } = vnp_Params;
    console.log(`✅ IPN Valid - Order: ${vnp_TxnRef}, Response: ${vnp_ResponseCode}`);

    res.status(200).json({ RspCode: '00', Message: 'Success' });
  } else {
    console.log('❌ IPN Invalid signature');
    res.status(200).json({ RspCode: '97', Message: 'Invalid signature' });
  }
};

// ✅ 3. VNPay Return (người dùng quay lại sau khi thanh toán)
export const vnpayReturn = async (req, res) => {
  console.log('🔙 VNPay Return received:', req.query);

  let vnp_Params = req.query;
  const secureHash = vnp_Params['vnp_SecureHash'];

  delete vnp_Params['vnp_SecureHash'];
  delete vnp_Params['vnp_SecureHashType'];

  const { signData, signed } = buildSignedQuery(vnp_Params, process.env.VNP_HASHSECRET);

  console.log('🔍 Return Signature Verification:');
  console.log('- Received hash:', secureHash);
  console.log('- Calculated hash:', signed);
  console.log('- Sign data:', signData);
  console.log('- Match:', secureHash === signed);

  if (secureHash === signed) {
    const { vnp_TxnRef, vnp_ResponseCode, vnp_Amount } = vnp_Params;
    console.log(
      `✅ Return Valid - Order: ${vnp_TxnRef}, Response: ${vnp_ResponseCode}, Amount: ${vnp_Amount}`
    );

    if (vnp_ResponseCode === '00') {
      // ✅ THANH TOÁN THÀNH CÔNG - CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG
      try {
        await queryDatabase(
          'UPDATE orders SET order_status = ?, payment_status = ?, updated_at = NOW() WHERE order_code = ?',
          ['paid', 'completed', vnp_TxnRef]
        );
        console.log(`🎉 Đã cập nhật trạng thái đơn hàng ${vnp_TxnRef} thành 'paid'`);
      } catch (error) {
        console.error('Lỗi khi cập nhật trạng thái đơn hàng:', error);
      }
      res.redirect(`http://localhost:5173/checkout-success?order_code=${vnp_TxnRef}&status=success`);
    } else {
      // ❌ THANH TOÁN THẤT BẠI
      res.redirect(
        `http://localhost:5173/checkout-failure?order=${vnp_TxnRef}&status=failed&code=${vnp_ResponseCode}`
      );
    }
  } else {
    console.log('❌ Return Invalid signature');
    res.redirect(`http://localhost:5173/checkout-failure?message=invalid-signature`);
  }
};
