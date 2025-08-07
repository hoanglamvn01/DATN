// server/controllers/favoriteProductsController.js
import { db } from '../config/connectBD.js';

// ======================================
// CONTROLLER: Lấy danh sách sản phẩm yêu thích của người dùng hiện tại
// ======================================
export const getFavoriteProducts = async (req, res) => {
    try {
        // ✅ BỎ DÒNG userId = req.user.id; NẾU BẠN MUỐN LẤY TẤT CẢ MÀ KHÔNG DỰA VÀO USER HIỆN TẠI
        // Nếu bạn muốn lấy TẤT CẢ sản phẩm yêu thích (của mọi người dùng)
        // thì không cần userId ở đây.
        // NHƯNG CẨN THẬN: AI CÓ THỂ GỌI API NÀY? (Chỉ admin?)

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // ✅ SỬA favoritesQuery: BỎ ĐI WHERE fp.user_id = ?
        const favoritesQuery = `
            SELECT
                fp.favorite_id,
                fp.user_id,
                fp.product_id,
                p.name AS name,   
                p.price,           
                p.thumbnail AS thumbnail
            FROM favorites fp
            JOIN products p ON fp.product_id = p.product_id
            ORDER BY fp.favorite_id DESC
            LIMIT ? OFFSET ?;
        `;

        // ✅ SỬA countQuery: BỎ ĐI WHERE user_id = ?
        const countQuery = `
            SELECT COUNT(*) as total
            FROM favorites;
        `;

        // ✅ Cập nhật tham số cho query: KHÔNG TRUYỀN userId NỮA
        const [favorites] = await db.promise().query(favoritesQuery, [limit, offset]); // Chỉ limit và offset
        const [totalResult] = await db.promise().query(countQuery); // Không truyền tham số nào

        const total = totalResult[0].total;

        res.status(200).json({
            favoriteProducts: favorites,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });

    } catch (error) {
        console.error("❌ Lỗi khi lấy TẤT CẢ sản phẩm yêu thích:", error); // ✅ Đổi thông báo lỗi
        res.status(500).json({ message: "Lỗi server khi tải danh sách sản phẩm yêu thích." });
    }
};
export const getFavoriteProductsByUser = async (req, res) => {
  try {
    const userId = req.params.user_id;

    if (!userId) {
      return res.status(400).json({ message: 'Thiếu user_id' });
    }

    const query = `
      SELECT
        fp.favorite_id,
        p.product_id,
        p.name,
        p.price,
        p.thumbnail
      FROM favorites fp
      JOIN products p ON fp.product_id = p.product_id
      WHERE fp.user_id = ?
      ORDER BY fp.favorite_id DESC;
    `;

    const [rows] = await db.promise().query(query, [userId]);

    res.status(200).json(rows);
  } catch (error) {
    console.error('❌ Lỗi lấy sản phẩm yêu thích theo user_id:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy sản phẩm yêu thích' });
  }
};

// ======================================
// CONTROLLER: Thêm sản phẩm vào danh sách yêu thích
// ======================================
export const addFavoriteProduct = async (req, res) => {
    try {
        const userId = req.user.id; // Lấy user_id từ JWT token
        const { product_id } = req.body;

        if (!product_id) {
            return res.status(400).json({ message: "Vui lòng cung cấp ID sản phẩm." });
        }

        // Kiểm tra xem sản phẩm đã có trong danh sách yêu thích của người dùng này chưa
        const [existingFavorite] = await db.promise().query(
            "SELECT favorite_id FROM favorites WHERE user_id = ? AND product_id = ?",
            [userId, product_id]
        );

        if (existingFavorite.length > 0) {
            return res.status(409).json({ message: "Sản phẩm đã có trong danh sách yêu thích." });
        }

        // Thêm sản phẩm vào danh sách yêu thích
        const [result] = await db.promise().query(
            "INSERT INTO favorites (user_id, product_id) VALUES (?, ?)",
            [userId, product_id]
        );

        res.status(201).json({ 
            message: "Sản phẩm đã được thêm vào danh sách yêu thích.",
            favorite_id: result.insertId // favorite_id được tạo tự động bởi AUTO_INCREMENT
        });

    } catch (error) {
        console.error("❌ Lỗi khi thêm sản phẩm yêu thích:", error);
        // Xử lý lỗi UNIQUE constraint nếu có (mặc dù đã kiểm tra ở trên)
        if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage.includes('UQ_user_product')) { // UQ_user_product là tên constraint UNIQUE
            return res.status(409).json({ message: "Sản phẩm đã có trong danh sách yêu thích." });
        }
        res.status(500).json({ message: "Lỗi server khi thêm sản phẩm vào danh sách yêu thích." });
    }
};

// ======================================
// CONTROLLER: Xóa sản phẩm khỏi danh sách yêu thích
// ======================================
export const removeFavoriteProduct = async (req, res) => {
    try {
        // Đảm bảo req.user.id tồn tại (được xác thực bởi authMiddleware)
        if (!req.user || !req.user.id) {
            console.error("❌ removeFavoriteProduct: req.user hoặc req.user.id không tồn tại. Token invalid?");
            return res.status(401).json({ message: "Không có thông tin người dùng xác thực để xóa." });
        }
        const userId = req.user.id; // Lấy user_id từ JWT token

        const { product_id } = req.params; // ✅ Lấy product_id từ URL params

        if (!product_id) { 
            console.error("❌ removeFavoriteProduct: product_id bị thiếu trong request params.");
            return res.status(400).json({ message: "Vui lòng cung cấp ID sản phẩm để xóa." });
        }

        // Tùy chọn: Chuyển đổi product_id sang số nếu bạn chắc chắn DB là số (BIGINT)
        // const parsedProductId = parseInt(product_id, 10);
        // if (isNaN(parsedProductId)) { /* ... */ }

        // ✅ CÂU TRUY VẤN DELETE: Xóa theo user_id VÀ product_id
        const [result] = await db.promise().query(
            "DELETE FROM favorites WHERE user_id = ? AND product_id = ?",
            [userId, product_id] 
        );

        if (result.affectedRows === 0) {
            console.warn(`removeFavoriteProduct: Xóa 0 dòng cho user ${userId}, product ${product_id}. Có thể không tìm thấy.`);
            return res.status(404).json({ message: "Sản phẩm yêu thích không tìm thấy hoặc không thuộc về bạn." });
        }

        console.log(`✅ Đã xóa sản phẩm ${product_id} khỏi yêu thích của user ${userId}.`);
        res.status(200).json({ message: "Sản phẩm đã được xóa khỏi danh sách yêu thích." });

    } catch (error) {
        console.error("❌ Lỗi khi xóa sản phẩm yêu thích (Controller):", error);
        res.status(500).json({ message: "Lỗi server khi xóa sản phẩm khỏi danh sách yêu thích." });
    }
};