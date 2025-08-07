import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Paper, useTheme, CircularProgress, IconButton, Snackbar, Alert // ✅ Import Snackbar và Alert
} from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

// --- INTERFACES ---
interface Product {
  product_id: number;
  name: string;
  price: number;
  thumbnail: string;
  description: string;
  brand_id?: number;
  brand?: string;
  discount_price?: number;
  rating?: number;
  reviews?: number;

  id: number;
  image: string;
}

// --- CONFIG ---
const API_BASE_URL = 'http://localhost:3000/api';
const UPLOADS_BASE_URL = 'http://localhost:3000/uploads/';

// --- COMPONENT ProductCard --- (Không thay đổi nhiều, chỉ nhận props)
interface ProductCardProps {
  product: Product;
  onAddToCart: (e: React.MouseEvent) => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
  isFavorite: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, onToggleFavorite, isFavorite }) => {
  return (
    <Paper
      sx={{
        p: 2, minHeight: '400px', display: 'flex', flexDirection: 'column',
        borderRadius: '8px', boxShadow: 'rgba(0, 0, 0, 0.05) 0px 1px 2px 0px',
        '&:hover': { boxShadow: 'rgba(0, 0, 0, 0.1) 0px 4px 12px' },
      }}
    >
      <Box sx={{ width: '100%', height: '250px', overflow: 'hidden', mb: 1.2}}>
        <img
          src={`${UPLOADS_BASE_URL}${product.thumbnail}`}
          alt={product.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', textAlign: 'start', mb: 2, minHeight: '2.6em' }}>
        {product.name}
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          {Number(product.price).toLocaleString('vi-VN')}₫
        </Typography>
        <Box>
          <IconButton onClick={onToggleFavorite}>
            {isFavorite ? <FavoriteIcon sx={{color: 'black'}}/> : <FavoriteBorderIcon />}
          </IconButton>
          <IconButton onClick={onAddToCart}>
            <ShoppingCartOutlinedIcon />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
};


// --- MAIN COMPONENT ---
export default function ProductDisplayPage() {
  const theme = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ THÊM STATE CHO SNACKBAR/ALERT
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' | 'warning' });

  const { currentUser } = useAuth();
  const { addItem } = useCart();
  const user_id = currentUser?.user_id;
  const navigate = useNavigate();

  const [userFavorites, setUserFavorites] = useState<Set<number>>(new Set());

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const productPromise = axios.get(`${API_BASE_URL}/products`);
      const favoritePromise = user_id ? axios.get(`${API_BASE_URL}/favorites/${user_id}`) : Promise.resolve({ data: [] });

      const [productResponse, favoriteResponse] = await Promise.all([productPromise, favoritePromise]);

      const loadedProducts: Product[] = productResponse.data.map((p: any) => ({
        product_id: p.product_id,
        name: p.name,
        price: Number(p.price),
        thumbnail: p.thumbnail || '',
        description: p.description || '',
        brand_id: p.brand_id,
        brand: p.brand_name || '',
        rating: p.rating ?? 0,
        reviews: p.reviews ?? 0,
        discount_price: p.discount_price ? Number(p.discount_price) : undefined,
        id: p.product_id,
        image: `${UPLOADS_BASE_URL}${p.thumbnail}`
      }));
      setProducts(loadedProducts);
      setUserFavorites(new Set(favoriteResponse.data.map((fav: { product_id: number }) => fav.product_id)));
    } catch (err) {
      setError('Không thể tải dữ liệu.');
      setAlert({ open: true, message: 'Không thể tải dữ liệu.', severity: 'error' }); // ✅ Thông báo lỗi tải dữ liệu
    } finally {
      setLoading(false);
    }
  }, [user_id]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // ✅ CẬP NHẬT: handleAddToCart để sử dụng setAlert
  const handleAddToCart = async (product: Product) => {
    if (!user_id) {
      setAlert({ open: true, message: 'Vui lòng đăng nhập để thêm vào giỏ hàng!', severity: 'warning' });
      setTimeout(() => navigate('/login'), 1000);
      return;
    }

    try {
      await addItem(product);
      setAlert({ open: true, message: `✅ Đã thêm '${product.name}' vào giỏ hàng!`, severity: 'success' });
    } catch (err) {
      console.error('Lỗi khi thêm giỏ hàng:', err);
      setAlert({ open: true, message: '❌ Thêm vào giỏ hàng thất bại.', severity: 'error' });
    }
  };

  // ✅ CẬP NHẬT: handleToggleFavorite để sử dụng setAlert
  const handleToggleFavorite = async (product: Product) => {
    if (!user_id) {
      setAlert({ open: true, message: 'Vui lòng đăng nhập!', severity: 'warning' });
      return;
    }
    const isCurrentlyFavorite = userFavorites.has(product.product_id);
    // Optimistic UI update
    setUserFavorites(prev => {
        const newSet = new Set(prev);
        if(isCurrentlyFavorite) newSet.delete(product.product_id);
        else newSet.add(product.product_id);
        return newSet;
    });

    try {
        if(isCurrentlyFavorite) {
            await axios.delete(`${API_BASE_URL}/favorites/${user_id}/${product.product_id}`);
            setAlert({ open: true, message: `Đã xóa '${product.name}' khỏi yêu thích.`, severity: 'info' });
        } else {
            await axios.post(`${API_BASE_URL}/favorites`, { user_id, product_id: product.product_id });
            setAlert({ open: true, message: `Đã thêm '${product.name}' vào yêu thích!`, severity: 'success' });
        }
    } catch(err) {
        setAlert({ open: true, message: "Đã có trong danh sách yêu thích của bạn", severity: 'error' });
        // Rollback UI
        setUserFavorites(prev => {
            const newSet = new Set(prev);
            if(isCurrentlyFavorite) newSet.add(product.product_id);
            else newSet.delete(product.product_id);
            return newSet;
        });
    }
  };

  // ✅ Hàm đóng alert
  const handleCloseAlert = () => {
    setAlert(prev => ({ ...prev, open: false }));
  };

  const displayedProducts = useMemo(() => products.slice(0, 20), [products]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ p: 4, textAlign: 'center', color: 'error.main' }}><Typography>{error}</Typography></Box>;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: theme.palette.background.default }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, textAlign: 'center' }}>
        SẢN PHẨM BÁN CHẠY
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3 }}>
        {displayedProducts.map((product) => (
          <Link
            key={product.product_id}
            to={`/products/${product.product_id}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <ProductCard
              product={product}
              onAddToCart={(e) => { e.preventDefault(); e.stopPropagation(); handleAddToCart(product); }}
              onToggleFavorite={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleFavorite(product); }}
              isFavorite={userFavorites.has(product.product_id)}
            />
          </Link>
        ))}
      </Box>

      {/* ✅ THÊM SNACKBAR VÀO ĐÂY */}
      <Snackbar open={alert.open} autoHideDuration={3000} onClose={handleCloseAlert}>
        <Alert onClose={handleCloseAlert} severity={alert.severity} sx={{ width: '100%' }}>
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}