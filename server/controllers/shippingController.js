// 📁 controllers/shippingController.js

// Đây là logic tính phí đơn giản.
// Trong thực tế, bạn có thể tích hợp với API của các bên vận chuyển (GHN, ViettelPost...)
// hoặc định nghĩa các quy tắc phức tạp hơn trong CSDL.
export const calculateShippingFee = (req, res) => {
    const { province_name } = req.body; // Nhận tên tỉnh/thành từ frontend

    if (!province_name) {
        return res.status(400).json({ error: 'Vui lòng cung cấp địa chỉ tỉnh/thành.' });
    }

    let shippingFee = 35000; // Phí mặc định cho các tỉnh xa

    // Ví dụ về các quy tắc tính phí
    if (['Thành phố Hà Nội', 'Thành phố Hồ Chí Minh'].includes(province_name)) {
        shippingFee = 30000; // Các thành phố lớn
    } else if (province_name === 'Thành phố Đà Nẵng') {
        shippingFee = 25000; // Nội thành (giả sử kho hàng ở Đà Nẵng)
    }

    res.json({ shippingFee });
};