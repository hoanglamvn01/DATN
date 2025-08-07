// controllers/orderController.js
import { db } from '../config/connectBD.js'
import { v4 as uuidv4 } from 'uuid'; // Import uuidv4
import dayjs from 'dayjs';
// Định nghĩa các hằng số tên bảng trong cơ sở dữ liệu của bạn
// THAY THẾ 'your_table_name' bằng tên bảng THỰC TẾ của bạn trong DB
const ORDERS_TABLE = 'orders';
const USERS_TABLE = 'users';
const ADDRESS_TABLE = 'user_addresses'; // Tên bảng địa chỉ người dùng của bạn
const PRODUCT_TABLE = 'products';       // <-- Cần định nghĩa
const CART_ITEMS_TABLE = 'cart';  // <-- Cần định nghĩa
const ORDER_ITEMS_TABLE = 'order_items';// <-- Cần định nghĩa

// Helper function to handle database queries (giữ nguyên)
const queryDatabase = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        // console.log("Executing SQL:", sql, params); // Có thể bật để debug
        db.query(sql, params, (err, results) => {
            if (err) {
                console.error("Database query error:", err); 
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};

// 1. Lấy tất cả đơn hàng (GET /api/orders) - ĐÃ CẬP NHẬT SELECT CÁC CỘT CHI TIẾT HƠN
export const getAllOrders = async (req, res) => {
    try {
        const sql = `
            SELECT 
                o.order_id,
                o.user_id,
                u.full_name AS username,
                o.order_code,            -- Thêm order_code
                o.recipient_name,        -- Thêm tên người nhận
                o.recipient_phone,       -- Thêm số điện thoại người nhận
                o.shipping_address_line, -- Thêm địa chỉ giao hàng đầy đủ
                o.total_amount,          -- Thêm tổng tiền
                o.shipping_fee,          -- Thêm phí vận chuyển
                o.discount_amount,       -- Thêm số tiền giảm giá
                o.payment_method,
                o.payment_status,
                o.order_status,
                o.coupon_code,           -- Thêm mã coupon
                o.created_at, 
                o.updated_at 
                -- o.note,             -- Nếu cột 'note' có tồn tại và bạn muốn dùng, hãy bỏ comment
            FROM 
                ${ORDERS_TABLE} o
            JOIN 
                ${USERS_TABLE} u ON o.user_id = u.user_id
            ORDER BY o.created_at DESC
        `;
        const orders = await queryDatabase(sql);
        res.json(orders);
    } catch (err) {
        console.error('Lỗi khi lấy tất cả đơn hàng:', err);
        res.status(500).json({ error: 'Không thể tải dữ liệu đơn hàng.', details: err.message });
    }
};
// 2. Lấy chi tiết đơn hàng (bao gồm Order Items) - ĐÃ CẢI THIỆN ĐỂ ÉP KIỂU SỐ VÀ TRẢ VỀ CẤU TRÚC PHÙ HỢP
export const getOrderDetails = async (req, res) => {
    const { id } = req.params; // order_id
    
    try {
        // Lấy thông tin đơn hàng chính
        const orderSql = `
            SELECT 
                o.order_id,
                o.user_id,
                u.full_name AS username,
                o.address_id,
                -- ÉP KIỂU SANG DECIMAL ĐỂ ĐẢM BẢO LÀ SỐ CHO CÁC TRƯỜNG TIỀN TỆ
                CAST(o.total_amount AS DECIMAL(10, 2)) AS total_amount,
                CAST(o.shipping_fee AS DECIMAL(10, 2)) AS shipping_fee,
                CAST(o.discount_amount AS DECIMAL(10, 2)) AS discount_amount,
                o.payment_method,
                o.payment_status,
                o.order_status,
                o.coupon_code,
                o.order_code,
                o.recipient_name,
                o.recipient_phone,
                o.shipping_address_line,
                o.created_at,
                o.updated_at
            FROM 
                ${ORDERS_TABLE} o
            JOIN 
                ${USERS_TABLE} u ON o.user_id = u.user_id
            WHERE 
                o.order_id = ?
        `;
        const orderResult = await queryDatabase(orderSql, [id]);

        if (orderResult.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
        }

        const order = orderResult[0];

        // Lấy chi tiết các mặt hàng trong đơn hàng
        const orderItemsSql = `
            SELECT 
                oi.order_item_id,
                oi.product_id,
                p.name AS product_name,
                p.thumbnail AS product_thumbnail,
                oi.quantity,
                CAST(oi.price AS DECIMAL(10, 2)) AS item_price -- ÉP KIỂU SANG DECIMAL CHO GIÁ SẢN PHẨM TRONG ITEM
            FROM 
                ${ORDER_ITEMS_TABLE} oi
            JOIN 
                ${PRODUCT_TABLE} p ON oi.product_id = p.product_id
            WHERE 
                oi.order_id = ?
        `;
        const items = await queryDatabase(orderItemsSql, [id]);

        // Gộp thông tin đơn hàng và các mặt hàng vào một đối tượng
        const fullOrderDetails = {
            ...order,
            items: items, // Đảm bảo đây là một mảng
        };

        res.json(fullOrderDetails);
    } catch (err) {
        console.error('Lỗi khi lấy chi tiết đơn hàng:', err);
        res.status(500).json({ error: 'Lỗi khi lấy chi tiết đơn hàng.', details: err.message });
    }
};

// 3. Cập nhật trạng thái đơn hàng (PUT /api/orders/:id) - GIỮ NGUYÊN
export const updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { order_status, payment_status, note } = req.body;

    try {
        // Kiểm tra lại cột 'note' trong bảng orders của bạn. Nếu không có, hãy loại bỏ nó khỏi đây.
        const sql = `
            UPDATE ${ORDERS_TABLE}
            SET order_status = ?, payment_status = ?, note = ?
            WHERE order_id = ?
        `;
        const result = await queryDatabase(sql, [order_status, payment_status, note, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng để cập nhật.' });
        }
        res.json({ message: 'Đơn hàng đã được cập nhật thành công.' });
    } catch (err) {
            console.error('Lỗi khi cập nhật trạng thái đơn hàng:', err);
        res.status(500).json({ error: 'Không thể cập nhật trạng thái đơn hàng.', details: err.message });
    }
};

// 4. Xóa đơn hàng (Admin chỉ nên xóa đơn hàng 'Đã hủy' hoặc test) - GIỮ NGUYÊN
export const deleteOrder = async (req, res) => {
    const { id } = req.params;
    try {
        const sql = `DELETE FROM ${ORDERS_TABLE} WHERE order_id = ?`;
        const result = await queryDatabase(sql, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng để xóa.' });
        }
        res.json({ message: 'Đơn hàng đã được xóa thành công.' });
    } catch (err) {
        res.status(500).json({ error: 'Lỗi khi xóa đơn hàng.', details: err.message });
    }
};

// Hàm tạo đơn hàng (createOrder) - ĐÃ ĐƯỢC HOÀN THIỆN logic ĐẦY ĐỦ NHẤT
export const createOrder = async (req, res) => {
    console.log("=== CREATE ORDER DEBUG ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    
    const {
        userId,
        addressId,
        items,
        shippingFee,
        discount,
        totalAmount,
        paymentMethod,
        couponCode,
        recipientName,
        recipientPhone,
        newAddress
    } = req.body;

    console.log("Extracted data:");
    console.log("- userId:", userId);
    console.log("- addressId:", addressId);
    console.log("- items:", items);
    console.log("- shippingFee:", shippingFee);
    console.log("- discount:", discount);
    console.log("- totalAmount:", totalAmount);
    console.log("- paymentMethod:", paymentMethod);
    console.log("- recipientName:", recipientName);
    console.log("- recipientPhone:", recipientPhone);
    console.log("- newAddress:", newAddress);

    // Validate dữ liệu cơ bản
    if (!userId || !items || items.length === 0) {
        console.log("❌ Validation failed: userId or items missing");
        return res.status(400).json({ error: 'Dữ liệu đơn hàng không hợp lệ.' });
    }
    
    // Validate address - cần có addressId HOẶC newAddress
    if (!addressId && !newAddress) {
        console.log("❌ Validation failed: no address information");
        return res.status(400).json({ error: 'Vui lòng cung cấp thông tin địa chỉ giao hàng.' });
    }

    const paymentStatus = paymentMethod === 'cod' ? 'paid' : 'pending';
    const orderStatus = 'pending';

    let finalRecipientName = '';
    let finalRecipientPhone = '';
    let finalShippingAddressString = '';

    // Bắt đầu giao dịch để đảm bảo toàn vẹn dữ liệu
    const beginTransaction = () => new Promise((res, rej) => db.beginTransaction(err => err ? rej(err) : res()));
    const commit = () => new Promise((res, rej) => db.commit(err => err ? rej(err) : res()));
    const rollback = () => new Promise((res, rej) => db.rollback(() => res()));

    try {
        await beginTransaction();

        // Bước 1: Xử lý thông tin địa chỉ
        let finalAddressId;
        
        if (newAddress) {
            // Nếu có newAddress, tạo địa chỉ mới trong database
            const generatedAddressId = uuidv4(); // Tạo UUID cho address_id
            const insertAddressSql = `INSERT INTO user_addresses (address_id, user_id, full_name, phone_number, province, district, ward, address_line) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
            const addressResult = await queryDatabase(insertAddressSql, [
                generatedAddressId, userId, recipientName, recipientPhone, newAddress.province, newAddress.district, newAddress.ward, newAddress.address
            ]);
            finalAddressId = generatedAddressId; // Sử dụng UUID thay vì insertId
            
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

        // Bước 2: Chèn bản ghi đơn hàng chính (KHÔNG có order_id, để DB tự tạo)
        const insertOrderSql = `
            INSERT INTO orders
            (user_id, address_id, total_amount, shipping_fee, discount_amount, payment_method, payment_status, order_status, coupon_code, recipient_name, recipient_phone, shipping_address_line)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const orderResult = await queryDatabase(insertOrderSql, [
            userId, finalAddressId, totalAmount, shippingFee, discount, paymentMethod,
            paymentStatus, orderStatus, couponCode || null, finalRecipientName,
            finalRecipientPhone, finalShippingAddressString
        ]);

        // Lấy order_id MÀ DATABASE VỪA TỰ TẠO RA
        const orderId = orderResult.insertId;

        // Tạo order_code dựa trên orderId thật
        const orderCode = `ORD-${dayjs().format('YYYYMMDDHHmmss')}-${orderId}`;
        await queryDatabase(`UPDATE orders SET order_code = ? WHERE order_id = ?`, [orderCode, orderId]);

        // Bước 3: Lặp qua các mặt hàng để xử lý
        for (const item of items) {
            const updateProductStockSql = `UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ? AND stock_quantity >= ?;`;
            const updateResult = await queryDatabase(updateProductStockSql, [item.quantity, item.productId, item.quantity]);

            if (updateResult.affectedRows === 0) {
                throw new Error(`Không đủ hàng trong kho cho sản phẩm ID: ${item.productId}.`);
            }

            // Chèn mặt hàng (KHÔNG có order_item_id, để DB tự tạo)
            const insertOrderItemSql = `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?);`;
            await queryDatabase(insertOrderItemSql, [orderId, item.productId, item.quantity, item.price]);
        }
        
        // Bước 4: Xóa các sản phẩm đã đặt khỏi giỏ hàng
        const productIdsInOrder = items.map(item => item.productId);
        if (productIdsInOrder.length > 0) {
            const placeholders = productIdsInOrder.map(() => '?').join(', ');
            const deleteCartItemsSql = `DELETE FROM cart WHERE user_id = ? AND product_id IN (${placeholders});`;
            await queryDatabase(deleteCartItemsSql, [userId, ...productIdsInOrder]);
        }

        await commit();
        res.status(201).json({ message: 'Đặt hàng thành công!', orderId: orderId, orderCode: orderCode });

    } catch (error) {
        await rollback();
        console.error('Lỗi trong giao dịch tạo đơn hàng:', error);
        if (error.message.includes('Không đủ hàng')) {
            return res.status(409).json({ error: error.message });
        }
        res.status(500).json({ error: 'Lỗi khi tạo đơn hàng. Vui lòng thử lại.', details: error.message });
    }
};

//lich su don hang
export const getOrdersByUserId = async (req, res) => {
    const { userId } = req.params;
    try {
        const sql = `
            SELECT 
                o.order_id, o.order_code, o.total_amount,
                o.order_status, o.created_at
            FROM ${ORDERS_TABLE} o
            WHERE o.user_id = ? ORDER BY o.created_at DESC
        `;
        const orders = await queryDatabase(sql, [userId]);
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: 'Không thể tải dữ liệu đơn hàng.' });
    }
};