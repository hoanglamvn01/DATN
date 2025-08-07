// 📁 src/pages/OrderManagementPage.tsx

import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, CircularProgress, Alert, Paper, Grid, Button } from '@mui/material';
import { useParams, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

interface OrderItem {
  order_item_id: string;
  product_id: number;
  product_name: string;
  product_thumbnail: string;
  quantity: number;
  item_price: number;
}

interface OrderDetails {
  order_id: string;
  user_id: number;
  username: string;
  address_id: string;
  total_amount: number;
  shipping_fee: number;
  discount_amount: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  coupon_code: string | null;
  order_code: string;
  recipient_name: string;
  recipient_phone: string;
  shipping_address_line: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

const OrderManagementPage: React.FC = () => {
  const { orderId: paramOrderId } = useParams<{ orderId?: string }>();
  const location = useLocation();
  const { currentUser, token, isAuthenticated } = useAuth();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatusMessage, setPaymentStatusMessage] = useState<string | null>(null);
  const [momoResultCode, setMomoResultCode] = useState<string | null>(null);
  const formatCurrencyVND = (value: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const result_Code_from_momo = queryParams.get('resultCode');
    const momoMessage = queryParams.get('message');
    const momoOrderId = queryParams.get('orderId');

    if (result_Code_from_momo !== null) {
      setMomoResultCode(result_Code_from_momo);
      if (result_Code_from_momo === '0') {
        setPaymentStatusMessage(`Thanh toán MoMo thành công cho đơn hàng ${momoOrderId || paramOrderId || ''}!`);
        toast.success("Thanh toán MoMo thành công!");
      } else {
        setPaymentStatusMessage(`Thanh toán MoMo thất bại: ${momoMessage || 'Có lỗi xảy ra.'} (Mã lỗi: ${result_Code_from_momo})`);
        toast.error(`Thanh toán MoMo thất bại: ${momoMessage}`);
      }
    }

    const currentOrderId = momoOrderId || paramOrderId;

    if (!isAuthenticated || !currentUser || !token) {
      setError("Bạn cần đăng nhập để xem đơn hàng.");
      setLoading(false);
      return;
    }

    if (currentOrderId) {
      const fetchOrder = async () => {
        try {
          const response = await axios.get(`http://localhost:3000/api/orders/${currentOrderId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setOrder(response.data);
        } catch (err: any) {
          setError(err.response?.data?.error || "Không thể tải chi tiết đơn hàng.");
        } finally {
          setLoading(false);
        }
      };
      fetchOrder();
    } else {
      setError("Không có mã đơn hàng để hiển thị.");
      setLoading(false);
    }
  }, [paramOrderId, location.search, currentUser, token, isAuthenticated]);

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', flexDirection: 'column' }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography variant="h6">Đang tải đơn hàng...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <Alert severity="info">Không tìm thấy đơn hàng nào với ID này.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 17, mb: 8 }}>
      {paymentStatusMessage && (
        <Alert 
          severity={momoResultCode === '0' ? "success" : "error"} 
          icon={momoResultCode === '0' ? <CheckCircleOutlineIcon /> : <ErrorOutlineIcon />}
          sx={{ mb: 3 }}
        >
          {paymentStatusMessage}
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>Thông tin đơn hàng</Typography>
            <Typography>Mã đơn hàng: **{order.order_code}**</Typography>
            <Typography>Ngày đặt: {new Date(order.created_at).toLocaleDateString('vi-VN')}</Typography>
            <Typography>Trạng thái: **{order.order_status}**</Typography>
            <Typography>Phương thức thanh toán: {order.payment_method === 'cod' ? 'Thanh toán khi nhận hàng' : 'Ví MoMo'}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>Địa chỉ giao hàng</Typography>
            <Typography>Tên người nhận: {order.recipient_name}</Typography>
            <Typography>Số điện thoại: {order.recipient_phone}</Typography>
            <Typography>Địa chỉ: {order.shipping_address_line}</Typography>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>Sản phẩm đã mua</Typography>
          {order.items?.map((item) => (
            <Box key={item.order_item_id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2, borderBottom: '1px dashed #eee' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <img 
                  src={`http://localhost:3000/uploads/${item.product_thumbnail}`} 
                  alt={item.product_name} 
                  style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }} 
                />
                <Box>
                  <Typography>{item.product_name}</Typography>
                  <Typography variant="body2" color="text.secondary">Số lượng: {item.quantity}</Typography>
                </Box>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography fontWeight="medium">{(item.item_price * item.quantity).toLocaleString('vi-VN')} đ</Typography>
                
                {/* ✅ THÊM LINK ĐÁNH GIÁ TẠI ĐÂY */}
                {order.order_status === 'completed' && (
                  <Button
                    component={Link}
                    to={`/products/${item.product_id}`}
                    variant="outlined"
                    size="small"
                    sx={{ mt: 1 }}
                  >
                    Đánh giá
                  </Button>
                )}
              </Box>
            </Box>
          ))}
        </Box>

        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #ddd' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>Tạm tính:</Typography>
                  <Typography>
                    {order.items.reduce((acc, item) => acc + (item.item_price * item.quantity), 0).toLocaleString('vi-VN')} đ
                </Typography>
            </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography>Phí vận chuyển:</Typography>
          <Typography>{formatCurrencyVND(order.shipping_fee)}</Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography>Giảm giá:</Typography>
          <Typography color="error">- {formatCurrencyVND(order.discount_amount)}</Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="h6" fontWeight="bold">Tổng cộng:</Typography>
          <Typography variant="h6" fontWeight="bold" color="primary">
            {formatCurrencyVND(order.total_amount)}
          </Typography>
        </Box>

        </Box>
      </Paper>

       <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Button component={Link} to="/products" variant="contained" size="large">
          Tiếp tục mua sắm
        </Button>
      </Box>
    </Container>
  );
};

export default OrderManagementPage;