// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import các component và context
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CategoryManager from './pages/CategoryManager'; 
import BrandManager from './pages/BrandManager';
import VoucherManager from './pages/VoucherManager';
import UserManager from './pages/UserManager'; 
import ProductManager from './pages/ProductManager';
import FavoriteProductsManager from './pages/FavoriteProductsManager';
import SettingsPage from './pages/SettingsPage';
import ContactList from './pages/ContactList';
import PostManager from './pages/PostManager';

// Import các thành phần xác thực
import { AuthProvider } from './context/AuthContext'; 
import PrivateRoute from './components/PrivateRoute';
import LoginPage from './pages/Login'; 

// Import các component từ Material-UI mà bạn sử dụng trực tiếp trong App.tsx
import { Box, Typography, Button } from '@mui/material';
import ReviewManager from './pages/ReviewManager';
import OrderManager from './pages/OrderManager';

function App() {
  return (
    // ✅ Đặt Router ở ngoài cùng, BỌC lấy AuthProvider
    <Router>
      <AuthProvider> {/* ✅ AuthProvider giờ là CON của Router */}
        <Routes>
          {/* Tuyến đăng nhập cho Admin App */}
          <Route path="/login" element={<LoginPage />} />
          {/* Tuyến chính cho toàn bộ phần Admin, được bảo vệ bởi PrivateRoute */}
          <Route path="/*" element={
            <PrivateRoute roles={['admin']}>
              <Layout> 
                <Routes>
                  <Route index element={<Navigate to="dashboard" replace />} /> 
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="categories" element={<CategoryManager />} />
                  <Route path="brands" element={<BrandManager />} />
                  <Route path="vouchers" element={<VoucherManager />} />
                  <Route path="orders" element={<OrderManager />} />
                  <Route path="users" element={<UserManager />} /> 
                  <Route path="reviews" element={<ReviewManager />} /> 
                  <Route path="products" element={<ProductManager />} />
                  <Route path="favorites" element={<FavoriteProductsManager />} />
                  <Route path="settings" element={<SettingsPage />} />

                  <Route path="posts" element={<PostManager />} />
                  <Route path="contact" element={<ContactList />} />
                  
                  {/* Xử lý 404 cho các tuyến trong Admin App không khớp */}
                  <Route path="*" element={
                      <Box sx={{ p: 4, textAlign: 'center' }}>
                          <Typography variant="h4" color="error">404 - Trang Admin không tìm thấy</Typography>
                          <Typography variant="body1" sx={{ mt: 2 }}>Đường dẫn bạn yêu cầu không tồn tại trong phần quản trị.</Typography>
                          <Button variant="contained" sx={{ mt: 3 }} onClick={() => window.history.back()}>Quay lại</Button>
                      </Box>
                  } />
                </Routes>
              </Layout>
            </PrivateRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;