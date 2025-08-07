import React from 'react';
import { Container, Grid, Box } from '@mui/material';
import { useCart } from '../context/CartContext'; // ✨ DÙNG CONTEXT
import CartSummary from '../components/CartSummary';
import CustomerForm from '../components/CustomerForm';
import CartPage from './CartPage';

// Chỉnh lại interface cho CartSummary để khớp với CartContext
interface DisplayItem {
  id: string; // CartSummary dùng 'id' là string, ta cần chuyển đổi
  name: string;
  price: number;
  quantity: number;
  image: string;
}

const UPLOADS_BASE_URL = 'http://localhost:3000/uploads/';

const CheckoutPage: React.FC = () => {
  const { state, updateQuantity, removeItem } = useCart();

  // Chuyển đổi dữ liệu từ CartContext sang định dạng mà CartSummary yêu cầu
  const displayItems: DisplayItem[] = state.items.map(item => ({
    id: String(item.product_id), // Chuyển product_id (number) thành id (string)
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    image: `${UPLOADS_BASE_URL}${item.thumbnail}` // Tạo URL đầy đủ
  }));

  const handleUpdate = (itemId: string, newQuantity: number) => {
    updateQuantity(Number(itemId), newQuantity); // Chuyển id (string) về lại number
  };
  const handleRemove = (itemId: string) => {
    removeItem(Number(itemId)); // Chuyển id (string) về lại number
  };

  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Grid container spacing={{ xs: 4, md: 6 }}>
        <Grid item xs={12} md={5}>
          <Box sx={{ position: 'sticky', top: '88px' }}>
            <CartPage/>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CheckoutPage;