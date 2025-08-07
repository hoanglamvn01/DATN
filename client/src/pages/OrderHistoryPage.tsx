// 📁 src/pages/OrderHistoryPage.tsx (Phiên bản nâng cấp giao diện)

import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Box, Typography, Paper, CircularProgress, Chip, Button, Container, Divider } from '@mui/material';
import { toast } from 'sonner';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'; // Icon cho tiêu đề

interface Order {
  order_id: string; // Sửa thành string để khớp với UUID từ backend
  order_code: string;
  total_amount: number;
  order_status: 'pending' | 'confirmed' | 'shipping' | 'completed' | 'cancelled';
  created_at: string;
}

// Component nhỏ để hiển thị trạng thái bằng màu sắc
const OrderStatusChip: React.FC<{ status: Order['order_status'] }> = ({ status }) => {
  const statusInfo = {
    pending: { label: 'Chờ xác nhận', color: 'warning' },
    confirmed: { label: 'Đã xác nhận', color: 'info' },
    shipping: { label: 'Đang giao', color: 'primary' },
    completed: { label: 'Hoàn thành', color: 'success' },
    cancelled: { label: 'Đã hủy', color: 'error' },
  };

  const { label, color } = statusInfo[status] || { label: status.toUpperCase(), color: 'default' };
  return <Chip label={label} color={color as any} size="small" />;
};

export const OrderHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser?.user_id) {
      axios.get(`http://localhost:3000/api/orders/user/${currentUser.user_id}`)
        .then(res => setOrders(res.data))
        .catch(() => toast.error("Không thể tải lịch sử đơn hàng."))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>;
  }

  return (
    <Container sx={{ py: 4, minHeight: '80vh', mt:15 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <ReceiptLongIcon color="primary" sx={{ fontSize: 40 }}/>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Lịch sử đơn hàng
        </Typography>
      </Box>
      
      {orders.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6">Bạn chưa có đơn hàng nào.</Typography>
          <Button component={RouterLink} to="/products" variant="contained" sx={{ mt: 2 }}>
            Mua sắm ngay
          </Button>
        </Paper>
      ) : (
        <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {/* Header của bảng */}
          <Box 
            sx={{ 
              display: { xs: 'none', md: 'flex' }, // Ẩn trên mobile, hiện trên desktop
              p: 2, 
              bgcolor: 'grey.100', 
              fontWeight: 'bold',
            }}
          >
            <Typography sx={{ width: '25%' }}>Mã Đơn Hàng</Typography>
            <Typography sx={{ width: '20%' }}>Ngày Đặt</Typography>
            <Typography sx={{ width: '20%', textAlign: 'right' }}>Tổng Tiền</Typography>
            <Typography sx={{ width: '20%', textAlign: 'center' }}>Trạng Thái</Typography>
            <Typography sx={{ width: '15%', textAlign: 'right' }}>Thao Tác</Typography>
          </Box>
          <Divider sx={{ display: { xs: 'none', md: 'block' } }}/>

          {/* Danh sách đơn hàng */}
          <Box>
            {orders.map(order => (
              <Box 
                key={order.order_id} 
                sx={{ 
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  alignItems: { xs: 'flex-start', md: 'center' },
                  p: 2, 
                  borderBottom: '1px solid #eee',
                  transition: 'background-color 0.2s',
                  '&:hover': {
                    bgcolor: 'action.hover'
                  },
                  cursor: 'pointer'
                }}
                onClick={() => navigate(`/orders/${order.order_id}`)}
              >
                {/* Dữ liệu cho từng cột */}
                <Box sx={{ width: { xs: '100%', md: '25%' }, mb: { xs: 1, md: 0 } }}>
                  <Typography fontWeight="bold" color="primary">#{order.order_code}</Typography>
                </Box>
                <Box sx={{ width: { xs: '100%', md: '20%' }, mb: { xs: 1, md: 0 } }}>
                   <Typography variant="body2" color="text.secondary">
                    {new Date(order.created_at).toLocaleDateString('vi-VN')}
                  </Typography>
                </Box>
                <Box sx={{ width: { xs: '100%', md: '20%' }, textAlign: { xs: 'left', md: 'right' }, mb: { xs: 1, md: 0 } }}>
                   <Typography fontWeight="medium">
                    {Number(order.total_amount).toLocaleString('vi-VN')}₫
                  </Typography>
                </Box>
                <Box sx={{ width: { xs: '100%', md: '20%' }, textAlign: { xs: 'left', md: 'center' }, mb: { xs: 2, md: 0 } }}>
                  <OrderStatusChip status={order.order_status} />
                </Box>
                <Box sx={{ width: { xs: '100%', md: '15%' }, textAlign: 'right' }}>
                  <Button 
                    size="small"
                    variant="outlined" 
                    component={RouterLink} 
                    to={`/order-management/${order.order_id}`}
                    onClick={(e) => e.stopPropagation()} // Ngăn việc click vào nút kích hoạt onClick của cả dòng
                  >
                    Chi tiết
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>
      )}
    </Container>
  );
};

export default OrderHistoryPage;