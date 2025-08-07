import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, CircularProgress, Alert, Snackbar, Paper, IconButton, Grid, Button
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined'; // Keep if used elsewhere, but won't be on the button
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

// --- INTERFACES ---
interface Product {
  product_id: number;
  favorite_id: number; // Keep this, as it's useful if the backend uses it for removal
  name: string;
  description: string;
  price: number;
  quantity: number;
  thumbnail: string;
  category_id: number;
  brand_id: number;
  brand_name: string; 
}

// --- CONFIG ---
const API_BASE_URL = 'http://localhost:3000/api';
const UPLOADS_BASE_URL = 'http://localhost:3000/uploads/';

// --- COMPONENT FavoriteProductsPage ---
const FavoriteProductsPage: React.FC = () => {
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
    const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
     const { addItem } = useCart(); 
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const user_id = currentUser?.user_id;

  const showSnackbar = useCallback((message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  const handleSnackbarClose = useCallback((_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  }, []);

  const fetchFavoriteProducts = useCallback(async () => {
    if (!user_id) {
      showSnackbar('Vui lòng đăng nhập để xem danh sách yêu thích.', 'warning');
      setLoading(false);
      navigate('/login');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/favorites/${user_id}`);
      setFavoriteProducts(response.data);
    } catch (err) {
      console.error('Lỗi khi tải danh sách yêu thích:', err);
      setError('Không thể tải danh sách sản phẩm yêu thích. Vui lòng thử lại.');
      showSnackbar('Lỗi khi tải danh sách yêu thích.', 'error');
    } finally {
      setLoading(false);
    }
  }, [user_id, showSnackbar, navigate]);

  useEffect(() => {
    fetchFavoriteProducts();
  }, [fetchFavoriteProducts]);

  const handleRemoveFavorite = async (product_id: number) => { // Removed favorite_id from here as it's not used by API
    if (!user_id) {
      showSnackbar('Bạn cần đăng nhập để thực hiện hành động này.', 'warning');
      navigate('/login');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      showSnackbar('Không có token xác thực.', 'error');
      return;
    }

    try {
      const response = await axios.delete(`${API_BASE_URL}/favorites/${product_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      showSnackbar(response.data.message || '🗑️ Đã xóa sản phẩm khỏi danh sách yêu thích!', 'success');

      setFavoriteProducts(prev =>
        prev.filter(product => product.product_id !== product_id)
      );

    } catch (error) {
      const msg =
        (error as any).response?.data?.message || '❌ Lỗi khi xóa sản phẩm khỏi danh sách yêu thích.';
      console.error('Lỗi xóa sản phẩm yêu thích:', error);
      showSnackbar(msg, 'error');

      if (
        (error as any).response &&
        ((error as any).response.status === 401 || (error as any).response.status === 403)
      ) {
        localStorage.removeItem('token');
        navigate('/login'); // Redirect to login if token is invalid/expired
      }
    }
  };


  const handleAddToCart = async (e: React.MouseEvent, product: Product) => {
  e.stopPropagation();
  e.preventDefault();

  if (!user_id) {
    setAlert({ open: true, message: 'Vui lòng đăng nhập để thêm vào giỏ hàng!', severity: 'warning' });
    setTimeout(() => navigate('/login'), 1000);
    return;
  }

  try {
    // Chuyển đổi product từ kiểu Product của component sang ProductForCart của context
    await addItem({
      product_id: product.product_id,
      name: product.name,
      price: product.price,
      thumbnail: product.thumbnail,
    });
    setAlert({ open: true, message: `✅ Đã thêm '${product.name}' vào giỏ hàng!`, severity: 'success' });
  } catch (err) {
    console.error('Lỗi khi thêm giỏ hàng:', err);
    setAlert({ open: true, message: '❌ Thêm vào giỏ hàng thất bại.', severity: 'error' });
  }
};

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Đang tải danh sách yêu thích...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', color: 'error.main' }}>
        <Typography variant="h6">{error}</Typography>
        <Button variant="outlined" sx={{ mt: 2 }} onClick={fetchFavoriteProducts}>Thử lại</Button>
      </Box>
    );
  }

  if (!user_id) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="warning.main">Bạn cần đăng nhập để xem danh sách yêu thích.</Typography>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/login')}>Đăng nhập ngay</Button>
      </Box>
    );
  }
  const handleCloseAlert = () => setAlert({ ...alert, open: false });
  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4}, mt: 15, maxWidth: '1200px', mx: 'auto' }}>
       <h3 className="text-center fw-bold text-uppercase mb-5" style={{ letterSpacing: '2px' }}>
        Sản phẩm yêu thích của bạn
      </h3>

      {favoriteProducts.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 5 }}>
          <Typography variant="h6" color="text.secondary">Bạn chưa có sản phẩm yêu thích nào.</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Hãy duyệt qua các sản phẩm của chúng tôi và thêm những thứ bạn thích vào đây!
          </Typography>
          <Button variant="contained" sx={{ mt: 3 }} component={Link} to="/">
            Khám phá sản phẩm ngay
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {favoriteProducts.map((product) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product.product_id}>
              <Paper
                sx={{
                  p: 1.5, // Reduced padding for a more compact look
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '8px',
                  boxShadow: 'rgba(0, 0, 0, 0.05) 0px 1px 2px 0px',
                  '&:hover': {
                    boxShadow: 'rgba(0, 0, 0, 0.1) 0px 4px 12px',
                  },
                  transition: 'box-shadow 0.2s ease-in-out',
                  backgroundColor: '#fff',
                  position: 'relative',
                  height: 'auto', // Let height be determined by content
                  width: '260px',
                  minHeight: '300px', // A reasonable min height to keep cards consistent
                  justifyContent: 'flex-start', // Align content to the start
                  overflow: 'hidden', // Hide overflow for rounded corners
                }}
              >
                {/* Product Brand / Category, as shown in the top left in the example */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, height: '20px' }}>
                    <Typography
                        variant="caption"
                        sx={{
                            backgroundColor: '#e0e0e0', // Light grey background for the label
                            borderRadius: '4px',
                            px: 0.8,
                            py: 0.3,
                            fontWeight: 'medium',
                            color: '#424242',
                            fontSize: '0.65rem',
                        }}
                    >
                            {product.brand_name}
                    </Typography>
                    {/* Favorite Icon - top right */}
                    <IconButton
                        aria-label="xóa khỏi yêu thích"
                        sx={{ p: 0 }} // Reduce padding to make icon smaller if needed
                        onClick={() => handleRemoveFavorite(product.product_id)}
                    >
                        <FavoriteIcon sx={{ color: '#ec407a', fontSize: '1rem' }} /> {/* Smaller, pink heart */}
                    </IconButton>
                </Box>


                <Link
                  to={`/products/${product.product_id}`}
                  style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', flexGrow: 1 }}
                >
                  <Box sx={{
                    width: '100%',
                    height: '230px', // Adjusted height for a more compact image
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 1, // Space between image and text
                  }}>
                    <img
                      src={`${UPLOADS_BASE_URL}${product.thumbnail}`}
                      alt={product.name}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                        display: 'block'
                      }}
                      onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/200x200?text=No+Image'; }}
                    />
                  </Box>

                  <Typography
                    variant="body2" // Smaller font size for product name
                    sx={{
                      fontWeight: 'normal', // Not bold as in original image
                      textAlign: 'start',
                      mb: 0.5,
                      fontSize: '0.9rem', // Adjusted font size
                      lineHeight: '1.4',
                      display: '-webkit-box',
                      WebkitLineClamp: 3, // Limit to 2 lines
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      minHeight: '2.8em', // Ensures consistent height for product names
                      maxHeight: '2.8em',
                      paddingLeft: '5px',
                      width: '230px',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {product.name}
                  </Typography>

               
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto', width: '100%' }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1rem', paddingLeft: '5px' }}>
                    {Number(product.price).toLocaleString('vi-VN')}₫
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <IconButton
                      size="small"
                      sx={{ color: '#333' }}
                      onClick={(e) => handleAddToCart(e, product)}
                    >
                      <ShoppingCartOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                </Link>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

       <Snackbar open={alert.open} autoHideDuration={3000} onClose={handleCloseAlert}>
        <Alert onClose={handleCloseAlert} severity={alert.severity as any} sx={{ width: '100%' }}>
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FavoriteProductsPage;