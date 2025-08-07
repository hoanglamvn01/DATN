// 📁 src/components/CartSummary.tsx

import { Add, Close, LocalOffer, Remove } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import React from 'react';

// Interfaces
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartSummaryProps {
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onOpenCouponModal: () => void;
  appliedCouponCode?: string;
  paymentMethodName?: string;
}

const CartSummary: React.FC<CartSummaryProps> = ({
  items,
  subtotal,
  shippingFee,
  discount,
  total,
  onUpdateQuantity,
  onRemoveItem,
  onOpenCouponModal,
  appliedCouponCode,
  paymentMethodName,
}) => {

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity >= 0) {
      onUpdateQuantity(itemId, newQuantity);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };
  
  if (!items || items.length === 0) {
    return (
      <Card sx={{ borderRadius: 2, boxShadow: 3, p: 2 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom fontWeight="bold">
            Giỏ hàng của bạn
          </Typography>
          <Typography sx={{ mt: 4, textAlign: 'center', color: 'text.secondary' }}>
            Giỏ hàng của bạn đang trống.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mt: 0, borderRadius: 2, boxShadow: 3 }}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Giỏ hàng của bạn ({items.reduce((acc, item) => acc + item.quantity, 0)})
        </Typography>
        <Divider sx={{ my: 2 }} />

        {/* Danh sách sản phẩm */}
        <Box sx={{ mb: 3, maxHeight: '400px', overflowY: 'auto', pr: 1 }}>
          {items.map(item => (
            <Card key={item.id} variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
              <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <img
                  src={item.image}
                  alt={item.name}
                  style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }}
                />
                <Box sx={{ flexGrow: 1 }}>
                  {/* ✅ SỬA ĐỔI DÒNG NÀY ĐỂ CỐ ĐỊNH SỐ DÒNG */}
                  <Typography
                    variant="body2"
                    fontWeight="medium"
                    sx={{
                      mb: 1,
                      display: '-webkit-box',
                      WebkitLineClamp: 2, // Số dòng tối đa
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.name}
                  </Typography>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" border={1} borderColor="grey.300" borderRadius={1}>
                      <IconButton size="small" onClick={() => handleQuantityChange(item.id, item.quantity - 1)}>
                        <Remove fontSize="small" />
                      </IconButton>
                      <Typography sx={{ mx: 2, fontSize: '14px' }}>{item.quantity}</Typography>
                      <IconButton size="small" onClick={() => handleQuantityChange(item.id, item.quantity + 1)}>
                        <Add fontSize="small" />
                      </IconButton>
                    </Box>
                    <Typography color="#d81b60" fontWeight="bold" sx={{ ml: 3}}>
                      {formatPrice(item.price * item.quantity)}
                    </Typography>
                  </Box>
                </Box>
                 <IconButton size="small" onClick={() => onRemoveItem(item.id)} sx={{ alignSelf: 'flex-start' }}>
                    <Close />
                </IconButton>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Mã giảm giá */}
        <Box sx={{ mb: 3 }}>
          <Box
            onClick={onOpenCouponModal}
            sx={{
              display: 'flex', alignItems: 'center', gap: 1, p: 1.5,
              border: '1px dashed', borderColor: 'grey.400', borderRadius: 2,
              cursor: 'pointer', '&:hover': { bgcolor: 'grey.50' }
            }}
          >
            <LocalOffer color="success" />
            <Typography variant="body2" fontWeight="medium" sx={{ flexGrow: 1 }}>
              {appliedCouponCode ? `Đang áp dụng: ${appliedCouponCode}` : 'Chọn hoặc nhập mã giảm giá'}
            </Typography>
          </Box>
        </Box>

        {/* Tóm tắt đơn hàng */}
        <Box>
          <Divider sx={{ mb: 2 }} />
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2">Tạm tính:</Typography>
            <Typography variant="body2" fontWeight="medium">
              {formatPrice(subtotal)}
            </Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2">Phí giao hàng:</Typography>
            <Typography variant="body2" fontWeight="medium">
              {formatPrice(shippingFee)}
            </Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" mb={2}>
            <Typography variant="body2">Giảm giá:</Typography>
            <Typography variant="body2" fontWeight="medium" color="error">
              -{formatPrice(discount)}
            </Typography>
          </Box>
          
          {/* ✅ Thêm dòng hiển thị phương thức thanh toán tại đây */}
          {paymentMethodName && (
             <Box display="flex" justifyContent="space-between" mb={2}>
              <Typography variant="body2">Thanh toán:</Typography>
              <Typography variant="body2" fontWeight="medium">
                {paymentMethodName}
              </Typography>
            </Box>
          )}

          <Divider sx={{ mb: 2 }} />
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight="bold">
              Tổng cộng:
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="#d81b60">
              {formatPrice(total)}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CartSummary;