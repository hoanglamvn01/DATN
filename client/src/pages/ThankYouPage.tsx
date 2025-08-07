// 📁 src/pages/ThankYouPage.tsx

import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Box, Typography, Button, Paper } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

export default function ThankYouPage() {
  const location = useLocation();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderCode, setOrderCode] = useState<string | null>(null);

  useEffect(() => {
    // Lấy thông tin orderId và orderCode từ state của location (được truyền từ CartPage)
    if (location.state && location.state.orderId) {
      setOrderId(location.state.orderId);
      setOrderCode(location.state.orderCode);
    }
  }, [location.state]);

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '80vh', 
        bgcolor: '#f5f5f5', 
        p: 3 
      }}
    >
      <Paper elevation={3} sx={{ p: { xs: 3, md: 5 }, borderRadius: 2, textAlign: 'center', maxWidth: 600, width: '100%' }}>
        <CheckCircleOutlineIcon sx={{ fontSize: 80, color: 'success.main', mb: 3 }} />
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Cảm ơn bạn đã đặt hàng!
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Đơn hàng của bạn đã được tiếp nhận và đang chờ xử lý.
        </Typography>
        {orderCode && (
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
            Mã đơn hàng của bạn: <Typography component="span" fontWeight="bold" color="primary.main">{orderCode}</Typography>
          </Typography>
        )}
        {orderId && (
          <Button 
            variant="contained" 
            color="primary" 
            size="large" 
            component={Link} 
            to={`/order-management/${orderId}`} 
            sx={{ mr: 2, mb: { xs: 2, sm: 0 } }}
          >
            Xem chi tiết đơn hàng
          </Button>
        )}
        <Button 
          variant="outlined" 
          color="secondary" 
          size="large" 
          component={Link} 
          to="/"
        >
          Tiếp tục mua sắm
        </Button>
      </Paper>
    </Box>
  );
}