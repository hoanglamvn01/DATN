import { useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Footer from './components/Footer';
import NavBar from './components/Navbar';
import Account from './pages/Account';
import ContactForm from './pages/ContactForm';
// import HeroSection from './pages/HeroSection'
import CartSidebar from './components/CartSidebar';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './context/AuthContext';
import BlogPostDetail from './pages/BlogPostDetail';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import FavoriteProductsPage from './pages/FavoriteProductsPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import Home from './pages/Home';
import LoginPage from './pages/Login';
import NotFound from './pages/NotFound';
import ProductByBrand from './pages/ProductByBrand';
import ProductByCategory from './pages/ProductByCategory';
import ProductDetailPage from './pages/ProductDetailPage';
import ProductListWithFilters from './pages/ProductListWithFilters';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ThankYouPage from './pages/ThankYouPage';
import VoucherListPage from './pages/VoucherListPage';
import ScrollToTop from './components/ScrollToTop';
import { CartProvider } from './context/CartContext';
import OrderDetailPage from './pages/OrderDetailPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import PrivacyPolicy from './pages/Csbm';
import SalesPolicy from './pages/Csbh';
import PostListPage from './pages/PostListPage';
import VNPaySuccess from './pages/VNPaySuccess';

import CheckoutSuccessPage from './pages/CheckoutSuccess';
import PaymentFailed from './pages/PaymentFailed';
import PaymentTest from './pages/PaymentTest';

function App() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  return (
    <>
      <AuthProvider>
       <CartProvider>
        <BrowserRouter>
          <ScrollToTop /> {/* 👉 thêm dòng này ở đây */}
          <NavBar onCartIconClick={() => setIsCartOpen(true)} />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<ProductListWithFilters />} />
            <Route path="/km" element={<VoucherListPage />} />
            <Route path="/danh-muc/:slug" element={<ProductByCategory />} />
            <Route path="/products/danh-muc/:categorySlug" element={<ProductListWithFilters />} />
            <Route path="/thuong-hieu/:slug" element={<ProductByBrand />} />
            <Route path="/products/:productId" element={<ProductDetailPage />} />
             <Route path="/checkout-success" element={<ThankYouPage />} />
             <Route path="/chinh-sach-bao-mat" element={<PrivacyPolicy />} />
             <Route path="/chinh-sach-ban-hang" element= {<SalesPolicy />} />
            <Route path="/bai-viet" element={<PostListPage />} />
            <Route path="/my-orders" element={<PrivateRoute><OrderHistoryPage /></PrivateRoute>} />
            <Route path="/order-management/:orderId" element={<PrivateRoute><OrderDetailPage /></PrivateRoute>} />
            <Route
              path="/favorites"
              element={
                <PrivateRoute>
                  <FavoriteProductsPage />
                </PrivateRoute>
              }
            />
            <Route path="/contact" element={<ContactForm />} />
            <Route
              path="/cart"
              element={
                <PrivateRoute>
                  <CartPage />
                </PrivateRoute>
              }
            />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/thank-you" element={<ThankYouPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            {/* <Route path="/order-management/:orderId" element={<OrderDetailPage />} />  */}
            <Route
              path="/account"
              element={
                <PrivateRoute>
                  <Account />
                </PrivateRoute>
              }
            />
           {/* <Route path="/checkout-success" element={<CheckoutSuccessPage />} /> */}
            <Route path="/vnpay-success" element={<VNPaySuccess />} />
            <Route path="/payment-failed" element={<PaymentFailed />} />
                   <Route path="/payment-test" element={<PaymentTest/>} />
            <Route path="/posts/:slug" element={<BlogPostDetail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
          <Footer />
        </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </>
  );
}

export default App;