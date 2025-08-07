// 📁 server/test_vnpay_signature.js

import crypto from 'crypto';

// ----- DỮ LIỆU CẦN KIỂM TRA -----
// 1. Copy chính xác HashSecret mới nhất của bạn vào đây
const vnp_HashSecret = 'R0779YFXOBVSZODF6NBCKVQ9WRD2DG33'; 

// 2. Copy chính xác chuỗi signData từ log bạn vừa gửi vào đây
const signData = 'vnp_Amount=38400000&vnp_Command=pay&vnp_CreateDate=20250805150119&vnp_CurrCode=VND&vnp_IpAddr=::1&vnp_Locale=vn&vnp_OrderInfo=Thanh toan don hang ORD-20250805150119-69&vnp_OrderType=other&vnp_ReturnUrl=http://localhost:3000/api/payments/vnpay_return&vnp_TmnCode=YRCTZWKT&vnp_TxnRef=ORD-20250805150119-69&vnp_Version=2.1.0';
// ---------------------------------


// Thuật toán tạo chữ ký (copy từ controller)
const hmac = crypto.createHmac("sha512", vnp_HashSecret);
const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

console.log("===============================");
console.log("CHƯƠNG TRÌNH TEST CHỮ KÝ VNPAY");
console.log("===============================");
console.log("Dữ liệu gốc (signData):", signData);
console.log("Hash Secret được sử dụng:", vnp_HashSecret);
console.log("--> Chữ ký được tạo ra (vnp_SecureHash):", signed);
console.log("===============================");