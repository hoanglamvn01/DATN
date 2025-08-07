import React from 'react';
import { Container, Typography, Box, Paper, Link } from '@mui/material';

const SalesPolicy = () => {
  return (
    <Container maxWidth="md" sx={{ my: 4, mt: 16 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, bgcolor: '#fffdfc' }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Chính Sách Bán Hàng
        </Typography>

        <Typography sx={{ mt: 1 }}>
         Night Owls có dịch vụ giao hàng tận nơi trên toàn quốc, áp dụng cho khách mua hàng trên Website. Đơn hàng sẽ được chuyển phát đến địa chỉ khách hàng cung cấp thông qua đơn vị vận chuyển trung gian là GIAO HÀNG TIẾT KIỆM hoặc 247EXPRESS. Đặc biệt, thông tin hóa đơn dán bên ngoài kiện hàng luôn luôn có logo cô gái của thương hiệu để nhận biết các sản phẩm là chính hãng.
        </Typography>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" fontWeight={600}>1. CHÍNH SÁCH GIÁ </Typography>
          <Typography sx={{ mt: 1 }}>
            Giá sản phẩm niêm yết tại Website là giá đã bao gồm thuế theo quy định pháp luật hiện hành, phí đóng gói và các chi phí khác liên quan đến việc mua hàng trừ các chi phí phát sinh khác được xác nhận qua Hotline hoặc Email của Cocoon và được sự chấp thuận của khách hàng trong quá trình xác nhận đơn đặt hàng, giao nhận hàng hoá.
          </Typography>

          <Typography variant="h6" fontWeight={600} sx={{ mt: 3 }}>2. PHÍ VẬN CHUYỂN</Typography>
          <Typography sx={{ mt: 1 }}>
           Thành phố Hồ Chí Minh, Hà Nội, Đà Nẵng: phí vận chuyển là 30.000đ <br />
           Các tỉnh khác phí vận chuyển là 35.000đ
          </Typography>

          <Typography variant="h6" fontWeight={600} sx={{ mt: 3 }}>3. THỜI GIAN GIAO HÀNG</Typography>
          <Typography sx={{ mt: 1, whiteSpace: 'pre-line' }}>
            Đơn hàng nội thành TP.HCM: Thời gian giao hàng là 2-3 ngày sau khi đặt hàng.<br />
            Đơn hàng ở ngoại thành TP.HCM và các tỉnh thành khác: Thời gian là 2-5 ngày đối với khu vực trung tâm tỉnh thành phố và 5-6 ngày đối với khu vực huyện, xã, thị trấn.<br />
            Một số nguyên nhân khách quan có thể làm chậm trễ việc giao hàng. Night Owls mong quý khách thông cảm.<br />
            Trường hợp giao hàng chậm trễ, Night Owls sẽ thông báo và hỗ trợ huỷ đơn nếu khách yêu cầu.<br />
          </Typography>

          <Typography variant="h6" fontWeight={600} sx={{ mt: 3 }}>4. GIAO NHẬN, ĐỔI TRẢ, BẢO HÀNH </Typography>
          <Typography sx={{ mt: 1, whiteSpace: 'pre-line' }}>
            - Nếu khách không có mặt khi giao hàng, đơn vị vận chuyển sẽ hẹn giao lại tối đa 2 lần. <br />
            - Không liên lạc được trong 3 ngày: hàng sẽ trả lại Night Owls và đơn hàng bị huỷ.<br />
            - Vui lòng kiểm tra kỹ sản phẩm trước khi nhận. Ký nhận là xác nhận hàng đúng.<br />
            - Đơn vị vận chuyển thu thập chữ ký hoặc ảnh giao hàng làm bằng chứng.<br />
            - Quay video khi mở hàng để hỗ trợ đổi/trả nếu có lỗi.<br />
            - Night Owls chỉ nhận đổi trả sản phẩm lỗi do nhà sản xuất hoặc vận chuyển. <br />     
            - Thời gian hỗ trợ tối đa 3 ngày kể từ khi nhận hàng.<br />
            - Hỗ trợ đóng gói theo yêu cầu riêng (có phí).<br />
            - Thanh toán: COD, Ví Momo.<br />
            - Mọi yêu cầu thay đổi/hủy đơn nên báo sớm để hỗ trợ kịp thời.<br />
            - Tra cứu đơn hàng qua Fanpage, Email hoặc Hotline.<br />
          </Typography>

          <Typography variant="h6" fontWeight={600} sx={{ mt: 3 }}>5. Thông tin liên hệ</Typography>
          <Typography sx={{ mt: 1 }}>

           • Email: thuhapd10684@gmail.com<br />
            • Số điện thoại: 0775143664
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default SalesPolicy;
