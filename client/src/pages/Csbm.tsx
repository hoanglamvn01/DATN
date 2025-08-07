// 📁 src/pages/PrivacyPolicy.jsx
import React from 'react';
import { Container, Box, Paper, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Button, Typography } from '@mui/material';
const PrivacyPolicy = () => {
  return (
    <Container maxWidth="md" sx={{ my: 4, mt: 16 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, bgcolor: '#fffdfc' }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Chính Sách Bảo Mật
        </Typography>
        <Typography sx={{ mt: 1 }}>
            Chúng tôi cam kết bảo mật thông tin cá nhân của khách hàng. Chính sách này nhằm giúp khách hàng hiểu rõ cách chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ thông tin cá nhân khi khách hàng sử dụng website của chúng tôi.
          </Typography>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" fontWeight={600}>
            1. MỤC ĐÍCH VÀ PHẠM VI THU THẬP
          </Typography>
         <Typography sx={{ mt: 1, whiteSpace: 'pre-line' }}>
  {`Chúng tôi thu thập thông tin cá nhân của khách hàng khi:

- Đăng ký tài khoản mua hàng
- Đặt hàng, thanh toán hoặc nhận hàng
- Gửi yêu cầu tư vấn, phản hồi, hoặc các hình thức tương tác khác

Các thông tin có thể bao gồm:

- Họ tên
- Số điện thoại
- Email
- Địa chỉ giao hàng
- Thông tin thanh toán (không lưu trữ số thẻ tín dụng)
- Lịch sử mua hàng, phản hồi sản phẩm`}
</Typography>


          <Typography variant="h6" fontWeight={600} sx={{ mt: 3 }}>
            2. PHẠM VI SỬ DỤNG THÔNG TIN
          </Typography>
                   <Typography sx={{ mt: 1, whiteSpace: 'pre-line' }}>
  {`Thông tin thu thập được sử dụng để:

- Xử lý đơn hàng, giao hàng đến đúng địa chỉ
- Liên hệ xác nhận đơn hàng khi cần
- Cung cấp thông tin về sản phẩm, chương trình khuyến mãi
- Cải thiện dịch vụ chăm sóc khách hàng
- Hỗ trợ khi khách hàng có khiếu nại, phản ánh

Chúng tôi cam kết không chia sẻ, buôn bán hay trao đổi thông tin cá nhân cho bên thứ ba nếu không có sự đồng ý từ khách hàng, trừ các trường hợp được pháp luật yêu cầu.

`}
</Typography>

          <Typography variant="h6" fontWeight={600} sx={{ mt: 3 }}>
            3. THỜI GIAN LƯU TRỮ THÔNG TIN
          </Typography>
                   <Typography sx={{ mt: 1, whiteSpace: 'pre-line' }}>
  {`Thông tin cá nhân sẽ được lưu trữ:

- Cho đến khi khách hàng có yêu cầu hủy bỏ
- Hoặc khi công ty không còn cần thiết để cung cấp dịch vụ
- Thông tin sẽ được bảo mật trong hệ thống cơ sở dữ liệu nội bộ, với các biện pháp bảo vệ nghiêm ngặt.

`}
          </Typography>

          <Typography variant="h6" fontWeight={600} sx={{ mt: 3 }}>
            4. CAM KẾT BẢO MẬT THÔNG TIN
          </Typography>
                   <Typography sx={{ mt: 1, whiteSpace: 'pre-line' }}>
  {`Chúng tôi áp dụng các biện pháp bảo mật để bảo vệ thông tin:

- Bảo mật hệ thống server và dữ liệu
- Hạn chế truy cập thông tin bởi nhân viên
- Sử dụng các công cụ chống tấn công, đánh cắp thông tin

Trong trường hợp máy chủ bị tấn công, đánh cắp dữ liệu, chúng tôi sẽ:

- Thông báo kịp thời cho cơ quan chức năng
- Thông báo cho khách hàng để có biện pháp bảo vệ quyền lợi



`}
          </Typography>

          <Typography variant="h6" fontWeight={600} sx={{ mt: 3 }}>
            5. QUYỀN LỢI CỦA KHÁCH HÀNG
          </Typography>
                   <Typography sx={{ mt: 1, whiteSpace: 'pre-line' }}>
  {`Khách hàng có quyền:

- Yêu cầu truy cập, chỉnh sửa hoặc xóa thông tin cá nhân
- Từ chối nhận email quảng cáo, tin nhắn khuyến mãi
- Khiếu nại về việc thông tin bị lạm dụng hoặc không đúng mục đích

Mọi yêu cầu, phản ánh xin gửi về:

Email:  Thuhapd10684@gmail.com

Hotline: 0775413664

Địa chỉ: 764a Trần Cao Vân

`}
          </Typography>

          <Typography variant="h6" fontWeight={600} sx={{ mt: 3 }}>
            6. LIÊN HỆ VỚI CHÚNG TÔI
          </Typography>
            <Button
        variant="contained"
        component={RouterLink}
        to="/contact"
        sx={{ mt: 1 }}
      >
        Đi đến trang liên hệ
      </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default PrivacyPolicy;
