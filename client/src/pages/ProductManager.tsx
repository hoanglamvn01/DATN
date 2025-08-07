// src/pages/ProductManager.tsx 

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Grid,
  Typography,
  CircularProgress,
  Button,
  Alert,
  Snackbar,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ProductCard from './ProductCard'; // Đảm bảo đường dẫn đúng
import { useNavigate } from 'react-router-dom'; // Để điều hướng

// Định nghĩa kiểu dữ liệu cho một sản phẩm (phải khớp với dữ liệu từ API của bạn)
interface Product {
  product_id: string;
  name: string;
  thumbnail: string;
  price: number;
  discount_price?: number;
  // Thêm các trường khác từ database nếu cần hiển thị trên card
}

const ProductManager: React.FC = () => {
  const navigate = useNavigate(); // Hook để điều hướng
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set()); // State để lưu ID sản phẩm yêu thích
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');

  // Hàm để fetch dữ liệu sản phẩm
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null); // Reset lỗi trước khi fetch mới
      const response = await fetch('http://localhost:3000/api/products'); // Thay thế bằng API của bạn
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.statusText}`);
      }
      const data: Product[] = await response.json();
      setProducts(data);
    } catch (err: any) {
      console.error("Error fetching products:", err);
      setError(err.message || "Không thể tải danh sách sản phẩm.");
      setSnackbarMessage("Không thể tải danh sách sản phẩm.");
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    // Giả định bạn có thể tải danh sách sản phẩm yêu thích từ localStorage hoặc API
    const storedFavorites = localStorage.getItem('favorites');
    if (storedFavorites) {
        try {
            setFavorites(new Set(JSON.parse(storedFavorites)));
        } catch (e) {
            console.error("Failed to parse favorites from localStorage", e);
            localStorage.removeItem('favorites'); // Xóa dữ liệu lỗi
        }
    }
  }, [fetchProducts]);

  // Hàm xử lý khi thêm sản phẩm vào giỏ hàng
  const handleAddToCart = useCallback((productId: string) => {
    console.log(`Đã thêm sản phẩm ${productId} vào giỏ hàng!`);
    // Ở đây bạn sẽ gọi API để thêm vào giỏ hàng hoặc cập nhật context/global state
    setSnackbarMessage(`Đã thêm sản phẩm ${productId} vào giỏ hàng.`);
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  }, []);

  // Hàm xử lý khi bật/tắt yêu thích
  const handleToggleFavorite = useCallback((productId: string) => {
    setFavorites(prevFavorites => {
      const newFavorites = new Set(prevFavorites);
      let message = '';
      let severity: 'success' | 'error' | 'info' | 'warning' = 'info';

      if (newFavorites.has(productId)) {
        newFavorites.delete(productId);
        message = `Đã xóa sản phẩm ${productId} khỏi danh sách yêu thích.`;
        severity = 'info';
      } else {
        newFavorites.add(productId);
        message = `Đã thêm sản phẩm ${productId} vào danh sách yêu thích!`;
        severity = 'success';
      }
      localStorage.setItem('favorites', JSON.stringify(Array.from(newFavorites)));
      setSnackbarMessage(message);
      setSnackbarSeverity(severity);
      setSnackbarOpen(true);
      return newFavorites;
    });
  }, []);

  const handleCloseSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const handleCreateProduct = () => {
    navigate('/products/create'); // Điều hướng đến trang tạo sản phẩm mới
  };

  // --- Trạng thái tải dữ liệu ---
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Đang tải danh sách sản phẩm...</Typography>
      </Box>
    );
  }

  // --- Trạng thái lỗi khi tải dữ liệu ---
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <Typography variant="h6">Lỗi tải dữ liệu!</Typography>
          <Typography>{error}</Typography>
          <Button onClick={fetchProducts} sx={{ mt: 1 }} variant="outlined">
            Thử lại
          </Button>
        </Alert>
      </Box>
    );
  }

  // --- Trạng thái không có sản phẩm nào ---
  if (products.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Chưa có sản phẩm nào.
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={3}>
          Hãy tạo sản phẩm đầu tiên của bạn!
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddCircleOutlineIcon />}
          onClick={handleCreateProduct}
        >
          Thêm sản phẩm mới
        </Button>
      </Box>
    );
  }

  // --- Hiển thị danh sách sản phẩm ---
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Quản lý Sản phẩm
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddCircleOutlineIcon />}
          onClick={handleCreateProduct}
        >
          Thêm sản phẩm mới
        </Button>
      </Box>

      <Grid container spacing={3}>
        {products.map((product) => (
          <Grid item key={product.product_id} xs={12} sm={6} md={4} lg={3} display="flex" justifyContent="center">
            <ProductCard
              product={product}
              onAddToCart={handleAddToCart}
              onToggleFavorite={handleToggleFavorite}
              isFavorite={favorites.has(product.product_id)} // Kiểm tra trạng thái yêu thích
            />
          </Grid>
        ))}
      </Grid>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProductManager;