import  { db }  from "../config/connectBD.js";
import bcrypt from "bcryptjs";

const getUserProfile = async (req, res) => {
  try {
    const [users] = await db
      .promise()
      .query(
        "SELECT user_id, full_name, email, phone_number, gender, date_of_birth, address, ward, district, province, role, status, created_at, updated_at FROM users WHERE user_id = ?",
        [req.user.id]
      );
    if (users.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy người dùng!" });
    }
    res.status(200).json(users[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const updateUserProfile = async (req, res) => {
  const {
    full_name,
    phone_number,
    gender,
    date_of_birth,
    address,
    ward,
    district,
    province,
    password_hash,
  } = req.body;
  try {
    if (!full_name || !phone_number) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập đầy đủ họ tên và số điện thoại!" });
    }
    let updateQuery =
      "UPDATE users SET full_name = ?, phone_number = ?, gender = ?, date_of_birth = ?, address = ?, ward = ?, district = ?, province = ?, updated_at = NOW()";
    let values = [
      full_name,
      phone_number,
      gender,
      date_of_birth,
      address,
      ward,
      district,
      province,
    ];

    if (password_hash) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(password_hash, salt);
      updateQuery += ", password_hash = ?";
      values.push(hash);
    }

    updateQuery += " WHERE user_id = ?";
    values.push(req.user.id);

    const [result] = await db.promise().query(updateQuery, values);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy người dùng!" });
    }
    const [updatedUser] = await db
      .promise()
      .query(
        "SELECT user_id, full_name, email, phone_number, gender, date_of_birth, address, ward, district, province, role, status, created_at, updated_at FROM users WHERE user_id = ?",
        [req.user.id]
      );
    res.status(200).json(updatedUser[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const offset = (page - 1) * limit;

    let whereClause = "";
    let queryParams = [];

    // Xây dựng điều kiện tìm kiếm đơn giản
    if (search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      whereClause = `WHERE (
        full_name LIKE ? OR
        email LIKE ? OR
        phone_number LIKE ? OR
        user_id LIKE ? OR
        role LIKE ? OR
        status LIKE ? OR
        COALESCE(address, '') LIKE ? OR
        COALESCE(ward, '') LIKE ? OR
        COALESCE(district, '') LIKE ? OR
        COALESCE(province, '') LIKE ?
      )`;
      queryParams = [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm];
    }

    // Đếm tổng số bản ghi với điều kiện tìm kiếm
    const [countResult] = await db
      .promise()
      .query(`SELECT COUNT(*) as total FROM users ${whereClause}`, queryParams);
    const total = countResult[0].total;

    // Lấy danh sách người dùng với điều kiện tìm kiếm và phân trang
    const [users] = await db
      .promise()
      .query(
        `SELECT user_id, full_name, email, phone_number, gender, date_of_birth, address, ward, district, province, role, status, created_at, updated_at
         FROM users
         ${whereClause}
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [...queryParams, limit, offset]
      );

    res.status(200).json({
      users,
      total,
      page,
      limit,
      search,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const getUserById = async (req, res) => {
  try {
    const [users] = await db
      .promise()
      .query(
        "SELECT user_id, full_name, email, phone_number, gender, date_of_birth, address, ward, district, province, role, status, created_at, updated_at FROM users WHERE user_id = ?",
        [req.params.id]
      );
    if (users.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy người dùng!" });
    }
    res.status(200).json(users[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const createUser = async (req, res) => {
  // ✅ PHẦN DESTRUCTURING req.body PHẢI CHUẨN XÁC
  const {
    full_name,
    email,
    password_hash,
    phone_number,
    gender,
    date_of_birth,
    address,
    ward,
    district,
    province,
    role,   // ✅ Lấy role và status mà không có giá trị mặc định ở đây
    status, // ✅
  } = req.body;

  try { // ✅ KHỐI TRY CỦA TOÀN BỘ HÀM CREATEUSER
    if (!full_name || !email || !password_hash || !phone_number) {
      return res.status(400).json({
        message:
          "Vui lòng nhập đầy đủ họ tên, email, mật khẩu và số điện thoại!",
      });
    }

    // ✅ Thêm validation email hợp lệ
    if (!/.+@.+\..+/.test(email)) {
        return res.status(400).json({ message: 'Email không đúng định dạng.' });
    }
    // ✅ Thêm validation mật khẩu hợp lệ (tối thiểu 6 ký tự)
    if (password_hash.length < 6) {
        return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự.' });
    }
    // ✅ Thêm validation role/status hợp lệ
    if (role && !['admin', 'customer'].includes(role)) {
        return res.status(400).json({ message: 'Vai trò không hợp lệ. Chỉ có thể là "admin" hoặc "customer".' });
    }
    if (status && !['active', 'inactive'].includes(status)) {
        return res.status(400).json({ message: 'Trạng thái không hợp lệ. Chỉ có thể là "active" hoặc "inactive".' });
    }


    const [existingUsers] = await db
      .promise()
      .query("SELECT * FROM users WHERE email = ? OR phone_number = ?", [
        email,
        phone_number,
      ]);
    if (existingUsers.length > 0) {
      if (existingUsers[0].email === email) {
        return res.status(409).json({ message: "Email đã tồn tại!" });
      }
      return res.status(409).json({ message: "Số điện thoại đã tồn tại!" });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password_hash, salt);

    const [result] = await db
      .promise()
      .query(
        // ✅ Cập nhật câu lệnh INSERT để bao gồm is_email_verified
        "INSERT INTO users (full_name, email, password_hash, phone_number, gender, date_of_birth, address, ward, district, province, role, status, is_email_verified, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
        [
          full_name,
          email,
          hash,
          phone_number,
          gender || null, // ✅ Gán null cho các trường tùy chọn nếu trống
          date_of_birth || null,
          address || null,
          ward || null,
          district || null,
          province || null,
          role || "customer",   // ✅ Giá trị mặc định cho role
          status || "active",   // ✅ Giá trị mặc định cho status
          true,                 // ✅ ĐẶT is_email_verified LÀ TRUE KHI ADMIN TẠO
        ]
      );

    // ✅ Cập nhật truy vấn SELECT để lấy tất cả các trường (bao gồm is_email_verified)
    const [newUser] = await db
      .promise()
      .query(
        "SELECT user_id, full_name, email, phone_number, gender, date_of_birth, address, ward, district, province, role, status, is_email_verified, created_at, updated_at FROM users WHERE user_id = ?",
        [result.insertId]
      );
    res.status(201).json(newUser[0]); // Trả về user vừa tạo
  } catch (error) { // ✅ KHỐI CATCH CỦA HÀM
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};


const updateUser = async (req, res) => {
  const {
    full_name,
    email,
    phone_number,
    gender,
    date_of_birth,
    address,
    ward,
    district,
    province,
    role,
    status,
    password_hash,
  } = req.body;
  try {
    if (!full_name || !email || !phone_number) {
      return res.status(400).json({
        message: "Vui lòng nhập đầy đủ họ tên, email và số điện thoại!",
      });
    }
    const [existingUsers] = await db
      .promise()
      .query(
        "SELECT * FROM users WHERE (email = ? OR phone_number = ?) AND user_id != ?",
        [email, phone_number, req.params.id]
      );
    if (existingUsers.length > 0) {
      if (existingUsers[0].email === email) {
        return res.status(409).json({ message: "Email đã tồn tại!" });
      }
      return res.status(409).json({ message: "Số điện thoại đã tồn tại!" });
    }

    let updateQuery =
      "UPDATE users SET full_name = ?, email = ?, phone_number = ?, gender = ?, date_of_birth = ?, address = ?, ward = ?, district = ?, province = ?, role = ?, status = ?, updated_at = NOW()";
    let values = [
      full_name,
      email,
      phone_number,
      gender,
      date_of_birth,
      address,
      ward,
      district,
      province,
      role,
      status,
    ];

    if (password_hash) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(password_hash, salt);
      updateQuery += ", password_hash = ?";
      values.push(hash);
    }

    updateQuery += " WHERE user_id = ?";
    values.push(req.params.id);

    const [result] = await db.promise().query(updateQuery, values);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy người dùng!" });
    }

    const [updatedUser] = await db
      .promise()
      .query(
        "SELECT user_id, full_name, email, phone_number, gender, date_of_birth, address, ward, district, province, role, status, created_at, updated_at FROM users WHERE user_id = ?",
        [req.params.id]
      );
    res.status(200).json(updatedUser[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const [result] = await db
      .promise()
      .query("DELETE FROM users WHERE user_id = ?", [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy người dùng!" });
    }
    res.status(204).json({
      message: "Xóa người dùng thành công",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

export {
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};

// server/controllers/userController.js
// server/controllers/userController.js
// server/controllers/userController.js
const saltRounds = 10; // Import bcrypt (nếu cần dùng ở đây, không trực tiếp dùng trong updateProfile)
const mapUserToFrontend = (dbUser) => {
  if (!dbUser) return null;
  const dateOfBirthFormatted = dbUser.date_of_birth
    ? new Date(dbUser.date_of_birth).toISOString().split('T')[0]
    : null;

  return {
    user_id: dbUser.user_id,
    full_name: dbUser.full_name,
    email: dbUser.email,
    phone_number: dbUser.phone_number,
    gender: dbUser.gender,
    date_of_birth: dateOfBirthFormatted,
    address: dbUser.address,
    ward: dbUser.ward,
    district: dbUser.district,
    province: dbUser.province,
    role: dbUser.role,
    status: dbUser.status,
  };
};
// ===== LẤY THÔNG TIN PROFILE CỦA NGƯỜI DÙNG HIỆN TẠI =====
export const getProfile = async (req, res) => {
    try {
        const userId = req.user.id; // Lấy userId từ JWT token đã xác thực

        const [users] = await db.promise().query(
            "SELECT user_id, full_name, email, phone_number, gender, DATE_FORMAT(date_of_birth, '%Y-%m-%d') as date_of_birth, address, ward, district, province, role FROM users WHERE user_id = ?",
            [userId]
        );

        if (users.length === 0) {
            console.log(`getProfile: Không tìm thấy người dùng với ID: ${userId}`);
            return res.status(404).json({ message: "Không tìm thấy thông tin người dùng." });
        }

        console.log(`getProfile: Đã lấy thông tin user ID ${userId}:`, users[0]);
        res.status(200).json({ user: users[0] });
    } catch (error) {
        console.error("❌ Lỗi khi lấy profile người dùng:", error);
        res.status(500).json({ message: "Lỗi server khi lấy thông tin người dùng." });
    }
};

// ===== CẬP NHẬT THÔNG TIN PROFILE CỦA NGƯỜI DÙNG HIỆN TẠI =====
export const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id; // Lấy ID người dùng từ token
        // Lấy tất cả các trường có thể cập nhật từ req.body
        const { full_name, phone_number, gender, date_of_birth, address, ward, district, province } = req.body;

        let query = "UPDATE users SET ";
        const queryParams = [];
        const updateFields = [];

        // Thêm trường vào danh sách cập nhật chỉ khi nó được gửi đến (không undefined)
        // và không phải là các trường không được phép update (như email, user_id)
        // Chuyển đổi chuỗi rỗng '' thành NULL nếu cột DB cho phép NULL, để tránh lỗi NOT NULL
        if (full_name !== undefined) { updateFields.push("full_name = ?"); queryParams.push(full_name); }
        if (phone_number !== undefined) { updateFields.push("phone_number = ?"); queryParams.push(phone_number === '' ? null : phone_number); }
        if (gender !== undefined) { updateFields.push("gender = ?"); queryParams.push(gender === '' ? null : gender); }
        
        // date_of_birth: DB DATE type. Empty string '' causes error if not handled, convert to NULL if allowed.
        if (date_of_birth !== undefined) { 
            updateFields.push("date_of_birth = ?"); 
            queryParams.push(date_of_birth === '' ? null : date_of_birth); 
        }
        
        if (address !== undefined) { updateFields.push("address = ?"); queryParams.push(address === '' ? null : address); }
        if (ward !== undefined) { updateFields.push("ward = ?"); queryParams.push(ward === '' ? null : ward); }
        if (district !== undefined) { updateFields.push("district = ?"); queryParams.push(district === '' ? null : district); }
        if (province !== undefined) { updateFields.push("province = ?"); queryParams.push(province === '' ? null : province); }
        
        if (updateFields.length === 0) {
            console.log("updateProfile: Không có trường nào để cập nhật (request rỗng)."); 
            return res.status(400).json({ message: "Không có thông tin nào để cập nhật." });
        }

        query += updateFields.join(", "); // Nối các trường cập nhật bằng dấu phẩy
        query += " WHERE user_id = ?";
        queryParams.push(userId); // Thêm userId vào cuối queryParams

        console.log("Executing Update Query:", query); // ✅ Log câu lệnh UPDATE
        console.log("With Params:", queryParams);      // ✅ Log các tham số

        let updateResult;
        try {
            [updateResult] = await db.promise().query(query, queryParams);
            console.log("Update Query Result (affectedRows):", updateResult.affectedRows); // ✅ Log kết quả UPDATE
        } catch (dbError) {
            console.error("❌ Lỗi Database khi thực hiện UPDATE:", dbError); // ✅ LOG LỖI DATABASE CỤ THỂ TỪ MYSQL
            if (dbError.code && dbError.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'Số điện thoại này đã được sử dụng bởi tài khoản khác.' });
            }
            // Bắt các lỗi SQL phổ biến khác có thể gây treo hoặc lỗi không mong muốn
            if (dbError.code && (dbError.code === 'ER_BAD_FIELD_ERROR' || dbError.code === 'ER_NO_DEFAULT_FOR_FIELD' || dbError.code === 'ER_DATA_TOO_LONG' || dbError.code.startsWith('ER_PARSE_ERROR') || dbError.code === 'ER_TRUNCATED_WRONG_VALUE')) {
                console.error("SQL Syntax/Constraint/Data Error:", dbError.sqlMessage || dbError.message);
                return res.status(400).json({ message: `Lỗi dữ liệu hoặc cú pháp SQL: ${dbError.sqlMessage || dbError.message}. Vui lòng kiểm tra lại thông tin nhập.` });
            }
            return res.status(500).json({ message: "Lỗi cơ sở dữ liệu khi cập nhật thông tin." });
        }

        if (updateResult.affectedRows === 0) {
            console.log(`Update affected 0 rows for userId: ${userId}. Có thể không tìm thấy user hoặc không có thay đổi dữ liệu.`); 
            // Trả về 200 OK nếu không có thay đổi (frontend không cần biết)
            // Lấy lại dữ liệu người dùng để đảm bảo frontend có bản mới nhất (không đổi)
            const [usersAfterNoChange] = await db.promise().query(
                "SELECT user_id, full_name, email, phone_number, gender, DATE_FORMAT(date_of_birth, '%Y-%m-%d') as date_of_birth, address, ward, district, province, role FROM users WHERE user_id = ?",
                [userId]
            );
            return res.status(200).json({ message: "Không có thay đổi nào được thực hiện.", user: usersAfterNoChange[0] }); 
        }

        let updatedUsers;
        try {
            [updatedUsers] = await db.promise().query(
                "SELECT user_id, full_name, email, phone_number, gender, DATE_FORMAT(date_of_birth, '%Y-%m-%d') as date_of_birth, address, ward, district, province, role FROM users WHERE user_id = ?",
                [userId]
            );
            console.log("Fetched Updated User Data:", updatedUsers[0]); 
        } catch (dbError) {
            console.error("❌ Lỗi Database khi fetch lại User:", dbError); 
            if (dbError.code && (dbError.code === 'ER_BAD_FIELD_ERROR' || dbError.code.startsWith('ER_PARSE_ERROR'))) {
                console.error("SQL Syntax Error (SELECT after UPDATE):", dbError.sqlMessage);
                return res.status(500).json({ message: `Lỗi cấu trúc dữ liệu người dùng sau cập nhật: ${dbError.sqlMessage || dbError.message}` });
            }
            return res.status(500).json({ message: "Lỗi cơ sở dữ liệu khi lấy lại thông tin người dùng." });
        }
        
        if (updatedUsers.length === 0) {
            console.log(`Fetched 0 rows after update for userId: ${userId}. User có thể đã bị xóa sau khi update?`);
            // Trường hợp này rất hiếm, có thể do vấn đề về transaction hoặc race condition
            return res.status(500).json({ message: "Không thể lấy lại thông tin người dùng sau khi cập nhật (dữ liệu không hợp lệ)." });
        }

        // ✅ Gửi phản hồi thành công và thông tin user đã cập nhật về frontend
        res.status(200).json({ message: "Cập nhật thông tin thành công!", user: updatedUsers[0] });
    } catch (error) {
        console.error("❌ Lỗi tổng quát trong updateProfile (ngoài database queries):", error); 
        res.status(500).json({ message: "Lỗi server không xác định khi cập nhật thông tin người dùng." });
    }
};

