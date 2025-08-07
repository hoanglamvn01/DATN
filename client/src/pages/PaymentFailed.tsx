import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';

export default function PaymentFailed() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const error = searchParams.get('error') || 'unknown';
  
  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case '01': return 'Giao dịch chưa hoàn tất';
      case '02': return 'Giao dịch bị lỗi';
      case '04': return 'Giao dịch đảo (Khách hàng đã bị trừ tiền tại Ngân hàng nhưng GD chưa thành công ở VNPAY)';
      case '05': return 'VNPAY đang xử lý giao dịch này (GD hoàn tiền)';
      case '06': return 'VNPAY đã gửi yêu cầu hoàn tiền sang Ngân hàng (GD hoàn tiền)';
      case '07': return 'Giao dịch bị nghi ngờ gian lận';
      case '09': return 'GD Hoàn trả bị từ chối';
      case '10': return 'Đã giao hàng';
      case '11': return 'Giao dịch không thành công do: Tài khoản của khách hàng không đủ số dư';
      case '12': return 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa';
      case '13': return 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP)';
      case '24': return 'Giao dịch không thành công do: Khách hàng hủy giao dịch';
      case '51': return 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch';
      case '65': return 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày';
      case '75': return 'Ngân hàng thanh toán đang bảo trì';
      case '79': return 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định';
      case '99': return 'Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)';
      case 'signature': return 'Lỗi xác thực chữ ký điện tử';
      default: return 'Đã xảy ra lỗi không xác định trong quá trình thanh toán';
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper
        elevation={3}
        sx={{
          p: 6,
          textAlign: 'center',
          borderRadius: 3,
        }}
      >
        <ErrorOutline
          sx={{
            fontSize: 80,
            color: 'error.main',
            mb: 3,
          }}
        />
        
        <Typography variant="h4" gutterBottom color="error.main" fontWeight="bold">
          Thanh toán thất bại
        </Typography>
        
        <Typography variant="h6" sx={{ mb: 3, color: 'text.secondary' }}>
          {getErrorMessage(error)}
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
          Mã lỗi: {error}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => navigate('/cart')}
            sx={{ minWidth: 150 }}
          >
            Thử lại
          </Button>
          
          <Button
            variant="outlined"
            color="primary"
            size="large"
            onClick={() => navigate('/')}
            sx={{ minWidth: 150 }}
          >
            Về trang chủ
          </Button>
        </Box>
        
        <Typography variant="body2" sx={{ mt: 4, color: 'text.secondary' }}>
          Nếu bạn cần hỗ trợ, vui lòng liên hệ với chúng tôi qua hotline hoặc email.
        </Typography>
      </Paper>
    </Container>
  );
}