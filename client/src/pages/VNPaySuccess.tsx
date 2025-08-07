import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress } from '@mui/material';
import axios from 'axios';
import { toast } from 'sonner';

export default function VNPaySuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processVNPaySuccess = async () => {
      try {
        const tempOrderId = searchParams.get('temp_order_id');
        const paymentStatus = searchParams.get('payment_status');
        const amount = searchParams.get('amount');

        console.log('=== VNPay Success Processing ===');
        console.log('Temp Order ID:', tempOrderId);
        console.log('Payment Status:', paymentStatus);
        console.log('Amount:', amount);

        if (!tempOrderId || paymentStatus !== 'success') {
          toast.error('Thông tin thanh toán không hợp lệ');
          navigate('/payment-failed');
          return;
        }

        // Lấy orderData từ localStorage
        const orderDataKey = `vnpay_order_${tempOrderId}`;
        const storedOrderData = localStorage.getItem(orderDataKey);
        
        console.log('Stored order data key:', orderDataKey);
        console.log('Stored order data:', storedOrderData);

        if (!storedOrderData) {
          console.error('Không tìm thấy dữ liệu đơn hàng trong localStorage');
          toast.error('Không tìm thấy thông tin đơn hàng');
          navigate('/payment-failed');
          return;
        }

        const orderData = JSON.parse(storedOrderData);
        console.log('Parsed order data:', orderData);

        // Tạo đơn hàng trong database
        console.log('Tạo đơn hàng trong database...');
        const response = await axios.post('http://localhost:3000/api/orders', orderData);
        const realOrderCode = response.data.data.order_code;
        
        console.log('Đơn hàng được tạo thành công:', realOrderCode);

        // Xóa dữ liệu tạm từ localStorage
        localStorage.removeItem(orderDataKey);
        
        // Thông báo thành công và chuyển hướng
        toast.success(`Thanh toán VNPay thành công! Mã đơn hàng: ${realOrderCode}`);
        navigate(`/checkout-success?order_code=${realOrderCode}&payment_method=vnpay`);

      } catch (error: any) {
        console.error('Lỗi khi xử lý VNPay success:', error);
        toast.error(error.response?.data?.message || 'Có lỗi khi tạo đơn hàng');
        navigate('/payment-failed');
      } finally {
        setIsProcessing(false);
      }
    };

    processVNPaySuccess();
  }, [searchParams, navigate]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        p: 3,
      }}
    >
      {isProcessing ? (
        <>
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h5" sx={{ mb: 2 }}>
            Đang xử lý thanh toán VNPay...
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Vui lòng không tắt trang này trong quá trình xử lý
          </Typography>
        </>
      ) : (
        <Typography variant="h5">
          Xử lý hoàn tất
        </Typography>
      )}
    </Box>
  );
}