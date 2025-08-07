
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Rating,
  Snackbar,
  Typography,
  IconButton,
  Grid, // ✅ Giữ lại Grid cho phần cam kết
  Divider,
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';

import axios from 'axios';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';
import SpaIcon from '@mui/icons-material/Spa';

import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import ProductReview from './ProductReview';

interface Product {
  product_id: number;
  name: string;
  description: string;
  short_description: string;
  price: number;
  stock_quantity: number;
  thumbnail: string;
  category_id: number;
  brand_id: number;
  images?: string[];
  rating?: number;
  reviews?: number;
  brand_name?: string;
  discount_price?: number;
  category_name?: string;
  category_slug?: string;
  total_sold_quantity?: number;
  ingredients?: string;
  usage_instructions?: string;
}

const API_BASE_URL = 'http://localhost:3000/api';
const UPLOADS_BASE_URL = 'http://localhost:3000/uploads/';

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarOpenMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    'success' | 'error' | 'info' | 'warning'
  >('success');
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  
  const { currentUser } = useAuth();
  const user_id = currentUser?.user_id;
  const { addItem } = useCart();
  const navigate = useNavigate();

  const [quantity, setQuantity] = useState(1);

  const showSnackbar = useCallback(
    (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
      setSnackbarOpenMessage(message);
      setSnackbarSeverity(severity);
      setSnackbarOpen(true);
    },
    []
  );

  const handleSnackbarClose = useCallback(
    (_event?: React.SyntheticEvent | Event, reason?: string) => {
      if (reason === 'clickaway') return;
      setSnackbarOpen(false);
    },
    []
  );

  const checkFavoriteStatus = useCallback(async () => {
    if (user_id && product?.product_id) {
      try {
        const response = await axios.get(`${API_BASE_URL}/favorites/${user_id}`);
        const favoritesList = response.data as { product_id: number }[];
        setIsFavorite(favoritesList.some(fav => fav.product_id === product.product_id));
        setFavorites(new Set(favoritesList.map(fav => fav.product_id)));
      } catch (err) {
        console.error('Failed to check favorite status:', err);
      }
    } else {
      setIsFavorite(false);
      setFavorites(new Set());
    }
  }, [user_id, product?.product_id]);


  const fetchProductDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/products/${productId}`);
      const data = response.data;
      
      data.rating = data.rating || 0;
      data.reviews = data.reviews || 0;
      data.brand_name = data.brand_name || 'Không xác định';
      data.category_name = data.category_name || 'Không xác định';
      data.short_description = data.short_description || (data.description ? data.description.substring(0, 150) + '...' : 'Không có mô tả ngắn.');
      data.category_slug = data.category_slug;
      data.total_sold_quantity = data.total_sold_quantity || 0;
      data.ingredients = data.ingredients || 'Đang cập nhật...';
      data.usage_instructions = data.usage_instructions || 'Đang cập nhật...';

      data.images = Array.isArray(data.images) && data.images.length > 0 ? data.images : [data.thumbnail];
      data.price = data.price ?? 0;
      data.discount_price = data.discount_price ?? undefined;
      data.stock_quantity = data.stock_quantity ?? 0;

      setProduct(data);
      setSelectedImage(data.images[0]);
    } catch (err) {
      console.error('Failed to fetch product details:', err);
      const errorMessage = (err as any).response?.data?.message || 'Không thể tải chi tiết sản phẩm. Vui lòng thử lại.';
      setError(errorMessage);
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [productId, showSnackbar]);

  const fetchRelatedProducts = useCallback(async (categorySlug: string, currentProductId: number) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/products/category/${categorySlug}`);
      const filteredProducts = response.data.filter((p: Product) => p.product_id !== currentProductId);
      setRelatedProducts(filteredProducts.slice(0, 5));
    } catch (err) {
      console.error('Lỗi khi tải sản phẩm liên quan:', err);
      setRelatedProducts([]);
    }
  }, []);

  useEffect(() => {
    if (productId) {
      fetchProductDetails();
    }
  }, [productId, fetchProductDetails]);

  useEffect(() => {
    checkFavoriteStatus();
  }, [checkFavoriteStatus]);

  useEffect(() => {
    if (product && product.category_slug && product.product_id) {
      fetchRelatedProducts(product.category_slug, product.product_id);
    }
  }, [product, fetchRelatedProducts]);


  const handleAddToCart = async () => {
    if (!user_id) {
      showSnackbar('❌ Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!', 'error');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }
    if (!product) {
      showSnackbar('Sản phẩm không hợp lệ để thêm vào giỏ hàng.', 'error');
      return;
    }
    if (quantity > (product.stock_quantity || 0)) {
        showSnackbar(`❌ Không đủ số lượng tồn kho. Chỉ còn ${product.stock_quantity} sản phẩm.`, 'warning');
        return;
    }
    try {
      await addItem(
        {
          product_id: product.product_id,
          name: product.name,
          price: product.price,
          discount_price: product.discount_price,
          thumbnail: product.thumbnail,
          brand: product.brand_name || '',
        },
        quantity
      );
      showSnackbar(`✅ Đã thêm '${product.name}' vào giỏ hàng!`, 'success');
    } catch (error) {
      console.error('Lỗi thêm vào giỏ hàng:', error);
      showSnackbar('❌ Thêm vào giỏ hàng thất bại.', 'error');
    }
  };
  
  const handleAddToCartRelated = async (e: React.MouseEvent, relatedProduct: Product) => {
    e.stopPropagation();
    if (!user_id) {
      showSnackbar('❌ Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!', 'error');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    if (1 > (relatedProduct.stock_quantity || 0)) {
        showSnackbar(`❌ Sản phẩm '${relatedProduct.name}' đã hết hàng!`, 'warning');
        return;
    }

    try {
      await addItem(
        {
          product_id: relatedProduct.product_id,
          name: relatedProduct.name,
          price: relatedProduct.price,
          discount_price: relatedProduct.discount_price,
          thumbnail: relatedProduct.thumbnail,
          brand: relatedProduct.brand_name || '',
        },
        1
      );
      showSnackbar(`✅ Đã thêm '${relatedProduct.name}' vào giỏ hàng!`, 'success');
    } catch (error) {
      console.error('Lỗi thêm vào giỏ hàng:', error);
      showSnackbar('❌ Thêm vào giỏ hàng thất bại.', 'error');
    }
  };

  const handleToggleFavorites = async () => {
    if (!user_id) {
      showSnackbar('❌ Vui lòng đăng nhập để thêm/xóa sản phẩm yêu thích!', 'error');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }
    if (!product) {
      showSnackbar('Sản phẩm không hợp lệ để cập nhật yêu thích.', 'error');
      return;
    }

    try {
      if (isFavorite) {
        await axios.delete(`${API_BASE_URL}/favorites/${user_id}/${product.product_id}`);
        setIsFavorite(false);
        showSnackbar(`🗑️ Đã xóa '${product.name}' khỏi danh sách yêu thích!`, 'info');
      } else {
        await axios.post(`${API_BASE_URL}/favorites`, {
          user_id,
          product_id: product.product_id,
        });
        setIsFavorite(true);
        showSnackbar(`💖 Đã thêm '${product.name}' vào danh sách yêu thích!`, 'success');
      }
    } catch (error) {
      const msg =
        (error as any).response?.data?.message || '❌ Cập nhật danh sách yêu thích thất bại.';
      showSnackbar(msg, (error as any).response?.status === 409 ? 'info' : 'error');
      console.error("Lỗi cập nhật yêu thích:", error);
    }
  };

  const handleToggleFavoritesRelated = async (e: React.MouseEvent, relatedProductId: number, isCurrentlyFavorite: boolean) => {
    e.stopPropagation();
    if (!user_id) {
      showSnackbar('❌ Vui lòng đăng nhập để thêm/xóa sản phẩm yêu thích!', 'error');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    const newFavorites = new Set(favorites);
    if (isCurrentlyFavorite) {
      newFavorites.delete(relatedProductId);
    } else {
      newFavorites.add(relatedProductId);
    }
    setFavorites(newFavorites);

    try {
        if (isCurrentlyFavorite) {
            await axios.delete(`${API_BASE_URL}/favorites/${user_id}/${relatedProductId}`);
            showSnackbar(`🗑️ Đã xóa sản phẩm khỏi yêu thích!`, 'info');
        } else {
            await axios.post(`${API_BASE_URL}/favorites`, {
                user_id: user_id,
                product_id: relatedProductId
            });
            showSnackbar(`💖 Đã thêm sản phẩm vào yêu thích!`, 'success');
        }
    } catch (error) {
        setFavorites(favorites); 
        showSnackbar("Đã có trong danh sách yêu thích của bạn", 'error');
        console.error("Lỗi cập nhật yêu thích:", error);
    }
  };


  const handleQuantityChange = (delta: number) => {
    setQuantity(prev => Math.max(1, Math.min(prev + delta, product?.stock_quantity || 0)));
  };

  const handleBuyNow = async () => {
    if (!user_id) {
        showSnackbar('❌ Vui lòng đăng nhập để mua hàng!', 'error');
        setTimeout(() => navigate('/login'), 1500);
        return;
    }

    if (!product) {
        showSnackbar('Sản phẩm không hợp lệ để mua ngay.', 'error');
        return;
    }
    if (quantity > (product.stock_quantity || 0)) {
        showSnackbar(`❌ Không đủ số lượng tồn kho. Chỉ còn ${product.stock_quantity} sản phẩm.`, 'warning');
        return;
    }

    try {
        await addItem(
            {
                product_id: product.product_id,
                name: product.name,
                price: product.price,
                discount_price: product.discount_price,
                thumbnail: product.thumbnail,
                brand: product.brand_name || '',
            },
            quantity
        );
        showSnackbar(`✅ Đã thêm '${product.name}' vào giỏ hàng và chuyển đến trang thanh toán!`, 'success');
        navigate('/cart', { state: { fromBuyNow: true, productId: product.product_id, quantity: quantity } });
    } catch (error) {
            console.error('Lỗi khi mua ngay:', error);
            showSnackbar('❌ Không thể mua ngay. Vui lòng thử lại.', 'error');
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
                <Typography variant="h6" sx={{ ml: 2 }}>
                    Đang tải chi tiết sản phẩm...
                </Typography>
            </Box>
        );
    }

    if (error || !product) {
        return (
            <Box sx={{ p: 4, textAlign: 'center', color: 'error.main' }}>
                <Typography variant="h6">{error || 'Không tìm thấy sản phẩm này.'}</Typography>
                <Button variant="outlined" sx={{ mt: 2 }} component={Link} to="/products">
                    Quay lại danh sách sản phẩm
                </Button>
            </Box>
        );
    }

    const displayPrice = product.discount_price !== undefined && product.discount_price !== null && product.discount_price < product.price
        ? product.discount_price
        : product.price;

    return (
        <Box sx={{ maxWidth: '1200px', mx: 'auto', p: { xs: 2, md: 3 }, mt: 14 }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary">
                    <Link to="/" style={{ color: '#888', textDecoration: 'none' }}>
                        Trang chủ
                    </Link>
                    {' / '}
                    <Link to="/products" style={{ color: '#888', textDecoration: 'none' }}>
                        Sản phẩm
                    </Link>
                    {' / '}
                    <span style={{ color: '#000', fontWeight: 600 }}>{product.name}</span>
                </Typography>
            </Box>

            <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={{ xs: 3, md: 5 }}>
                <Box flex={{ xs: '1 1 100%', md: '1 1 50%' }} sx={{ position: 'relative' }}>
                    <Box
                        sx={{
                            width: '100%',
                            pb: '100%',
                            position: 'relative',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            mb: 2,
                            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                            transition: 'opacity 0.3s ease-in-out',
                        }}
                    >
                        <img
                            src={`${UPLOADS_BASE_URL}${selectedImage}`}
                            alt={product.name}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                            }}
                            onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/600x600?text=No+Image'; }}
                        />
                    </Box>
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 1.5,
                            overflowX: 'auto',
                            pb: 1,
                            '&::-webkit-scrollbar': { height: '8px' },
                            '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '4px' },
                        }}
                    >
                        {product.images?.map((imageName, index) => (
                            <Box
                                key={index}
                                sx={{
                                    width: '80px',
                                    height: '80px',
                                    flexShrink: 0,
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    border: imageName === selectedImage ? '2px solid #d81b60' : '1px solid #e0e0e0',
                                    boxShadow: imageName === selectedImage ? '0 0 0 2px rgba(216, 27, 96, 0.5)' : 'none',
                                    transition: 'border 0.2s, box-shadow 0.2s',
                                    '&:hover': {
                                        borderColor: '#d81b60',
                                    }
                                }}
                                onClick={() => setSelectedImage(imageName)}
                            >
                                <img
                                    src={`${UPLOADS_BASE_URL}${imageName}`}
                                    alt={`${product.name} - ${index}`}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/80x80?text=No+Image'; }}
                                />
                            </Box>
                        ))}
                    </Box>
                </Box>

                <Box flex={{ xs: '1 1 100%', md: '1 1 50%' }}>
                    {product.brand_name && (
                        <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'uppercase', mb: 0.5 }}>
                            {product.brand_name}
                        </Typography>
                    )}

                    {product.category_name && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            Danh mục: {product.category_name}
                        </Typography>
                    )}

                    <Typography variant="h4" fontWeight={700} gutterBottom sx={{ lineHeight: 1.3 }}>
                        {product.name}
                    </Typography>

                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <Rating value={product.rating || 0} readOnly precision={0.1} size="small" />
                        <Typography variant="body2" color="text.secondary">
                            {product.rating?.toFixed(1) || 0} ({product.reviews || 0} đánh giá)
                        </Typography>
                    </Box>

                    <Box display="flex" alignItems="baseline" gap={2} mb={2}>
                        {product.discount_price !== undefined && product.discount_price !== null && product.discount_price < product.price && (
                            <Typography variant="h6" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                                {product.price.toLocaleString('vi-VN')}₫
                            </Typography>
                        )}
                        <Typography variant="h4" fontWeight={700} color="error">
                            {Number(displayPrice).toLocaleString('vi-VN')}₫
                        </Typography>
                    </Box>

                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        {product.short_description}
                    </Typography>

                    <Box display="flex" alignItems="center" mt={2} mb={3}>
                        <Typography variant="body1" sx={{ mr: 2, fontWeight: 500 }}>Số lượng:</Typography>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleQuantityChange(-1)}
                            disabled={quantity <= 1}
                            sx={{ minWidth: '30px', p: 0.5 }}
                        >
                            -
                        </Button>
                        <Typography variant="h6" mx={2} sx={{ minWidth: '30px', textAlign: 'center' }}>
                            {quantity}
                        </Typography>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleQuantityChange(1)}
                            disabled={quantity >= (product.stock_quantity || 0)}
                            sx={{ minWidth: '30px', p: 0.5 }}
                        >
                            +
                        </Button>
                        <Typography variant="body2" color="text.secondary" ml={2}>
                            Đã bán: {product.total_sold_quantity || 0} sản phẩm
                        </Typography>
                    </Box>

                    <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2} mb={3}>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddShoppingCartIcon />}
                            onClick={handleAddToCart}
                            disabled={product.stock_quantity === 0}
                            sx={{
                                flex: 1,
                                py: 1.5,
                                fontSize: '1rem',
                                fontWeight: 600,
                                bgcolor: '#d81b60',
                                '&:hover': { bgcolor: '#c2185b' }
                            }}
                        >
                            {product.stock_quantity === 0 ? 'Hết hàng' : 'Thêm vào giỏ hàng'}
                        </Button>
                        <Button
                            variant="outlined"
                            color="inherit"
                            startIcon={isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                            onClick={handleToggleFavorites}
                            sx={{
                                flex: { xs: 'none', sm: '0 0 auto' },
                                borderColor: '#d81b60',
                                color: '#d81b60',
                                py: 1.5,
                                fontSize: '1rem',
                                fontWeight: 600,
                                '&:hover': {
                                    bgcolor: 'rgba(216, 27, 96, 0.05)',
                                    borderColor: '#c2185b'
                                }
                            }}
                        >
                            Yêu thích
                        </Button>
                    </Box>

                    <Button
                        variant="contained"
                        color="secondary"
                        fullWidth
                        sx={{
                            mb: 3,
                            fontWeight: 600,
                            py: 1.5,
                            fontSize: '1rem',
                            bgcolor: '#000',
                            '&:hover': { bgcolor: '#333' }
                        }}
                        onClick={handleBuyNow}
                        disabled={product.stock_quantity === 0}
                    >
                        {product.stock_quantity === 0 ? 'Hết hàng' : 'Mua ngay'}
                    </Button>

                    <Divider sx={{ my: 3 }} />
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CheckCircleOutlineOutlinedIcon sx={{ color: '#d81b60' }} />
                                <Typography variant="body2" color="text.primary" fontWeight={600}>
                                    Sản phẩm chính hãng 100%
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AutorenewOutlinedIcon sx={{ color: '#d81b60' }} />
                                <Typography variant="body2" color="text.primary" fontWeight={600}>
                                    Đổi trả dễ dàng trong 7 ngày
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LocalShippingOutlinedIcon sx={{ color: '#d81b60' }} />
                                <Typography variant="body2" color="text.primary" fontWeight={600}>
                                    Giao hàng nhanh toàn quốc
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <SpaIcon sx={{ color: '#d81b60' }} />
                                <Typography variant="body2" color="text.primary" fontWeight={600}>
                                    Chiết xuất từ thiên nhiên
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                    <Divider sx={{ my: 3 }} />
                </Box>
            </Box>

            {/* ✅ BỐ CỤC MỚI VÀ ĐÃ SỬA LỖI: Mô tả sản phẩm, Thành phần, Hướng dẫn sử dụng */}
            <Box sx={{ mt: 8 }}>
                {/* Mục 1: Mô tả sản phẩm - Bố cục Chữ (trái) + Ảnh (phải) */}
                <Box sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    alignItems: 'center',
                    gap: { xs: 2, md: 4 },
                    bgcolor: '#fff8f7',
                    py: 4,
                    px: { xs: 2, md: 8 }
                }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h5" fontWeight={700} gutterBottom>
                            Sản phẩm này mang lại gì cho bạn?
                        </Typography>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>
                            {product.description}
                        </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <CardMedia
                            component="img"
                            image="/img/img4.png" // Placeholder image từ code của bạn
                            alt="Mô tả sản phẩm"
                            sx={{ width: '100%', borderRadius: '12px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}
                        />
                    </Box>
                </Box>
                <Divider />

                {/* Mục 2: Thành phần - Bố cục Ảnh (trái) + Chữ (phải) */}
                {product.ingredients && (
                    <>
                        <Box sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', md: 'row' },
                            alignItems: 'center',
                            gap: { xs: 2, md: 4 },
                            bgcolor: '#f7fbf8',
                            py: 4,
                            px: { xs: 2, md: 8 }
                        }}>
                            <Box sx={{ flex: 1, order: { xs: 2, md: 1 } }}>
                                <CardMedia
                                    component="img"
                                    image="/img/img5.png" // Placeholder image
                                    alt="Thành phần"
                                    sx={{ width: '100%', borderRadius: '12px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}
                                />
                            </Box>
                            <Box sx={{ flex: 1, order: { xs: 1, md: 2 } }}>
                                <Typography variant="h5" fontWeight={700} gutterBottom>
                                    Thành phần chính
                                </Typography>
                                <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>
                                    {product.ingredients}
                                </Typography>
                            </Box>
                        </Box>
                        <Divider />
                    </>
                )}

                {/* Mục 3: Hướng dẫn sử dụng - Bố cục Chữ (trái) + Ảnh (phải) */}
                {product.usage_instructions && (
                    <>
                        <Box sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', md: 'row' },
                            alignItems: 'center',
                            gap: { xs: 2, md: 4 },
                            bgcolor: '#fff8f7',
                            py: 4,
                            px: { xs: 2, md: 8 }
                        }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="h5" fontWeight={700} gutterBottom>
                                    Cách sử dụng
                                </Typography>
                                <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>
                                    {product.usage_instructions}
                                </Typography>
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <CardMedia
                                    component="img"
                                    image="/img/img6.png" // Placeholder image
                                    alt="Hướng dẫn sử dụng"
                                    sx={{ width: '100%', borderRadius: '12px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}
                                />
                            </Box>
                        </Box>
                        <Divider />
                    </>
                )}
            </Box>

            {/* Phần đánh giá */}
            <Box sx={{ maxWidth: '900px', mx: 'auto', mt: 8 }}>
                <Typography variant="h5" fontWeight={700} mb={3} textAlign="center" sx={{ color: '#333' }}>
                    Đánh giá sản phẩm
                </Typography>
                <ProductReview productId={product.product_id} />
            </Box>

      {/* ✅ Sửa đổi hoàn toàn phần này: Sản phẩm cùng danh mục */}
      {relatedProducts.length > 0 && (
        <Box sx={{ mt: 8 }}>
         
          <Box
            sx={{
              display: 'flex',
              overflowX: 'auto',
              gap: 2,
              pb: 2,
              '&::-webkit-scrollbar': { height: '8px' },
              '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '4px' },
              justifyContent: { xs: 'flex-start', md: 'center' }
            }}
          >
            {relatedProducts.map((relatedProduct) => {
              const isFavRelated = favorites.has(relatedProduct.product_id);
              const relatedDisplayPrice = relatedProduct.discount_price !== undefined && relatedProduct.discount_price !== null && relatedProduct.discount_price < relatedProduct.price
                ? relatedProduct.discount_price
                : relatedProduct.price;

              return (
                <Card
                  key={relatedProduct.product_id}
                  sx={{
                    minWidth: 260,
                    maxWidth: 260,
                    flexShrink: 0,
                    borderRadius: '10px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                    },
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate(`/products/${relatedProduct.product_id}`)}
                >
                  <Box sx={{ position: 'relative', width: '100%', height: 270, mb: 1 }}>
                    <CardMedia
                      component="img"
                      image={`${UPLOADS_BASE_URL}${relatedProduct.thumbnail}`}
                      alt={relatedProduct.name}
                      sx={{ width: '100%', height: '100%', objectFit: 'cover', p: 2 }}
                      onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/240x200?text=No+Image'; }}
                    />
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavoritesRelated(e, relatedProduct.product_id, isFavRelated);
                      }}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'white',
                        '&:hover': { bgcolor: 'grey.100' },
                      }}
                    >
                      {isFavRelated ? <FavoriteIcon sx={{ color: '#d81b60' }} /> : <FavoriteBorderIcon sx={{ color: '#aaa' }} />}
                    </IconButton>
                  </Box>

                  <CardContent sx={{ pt: 0, pb: 1, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ textTransform: 'uppercase' }}>
                      {relatedProduct.brand_name}
                    </Typography>
                    <Typography
                      gutterBottom
                      variant="subtitle2"
                      component="div"
                      noWrap
                      sx={{ fontWeight: 600, mt: 0.5 }}
                    >
                      {relatedProduct.name}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                      <Rating value={relatedProduct.rating || 0} precision={0.5} readOnly size="small" />
                      <Typography variant="caption" color="text.secondary">({relatedProduct.reviews || 0})</Typography>
                    </Box>
                  </CardContent>

                  <CardActions sx={{ px: 2, pb: 2, pt: 0, justifyContent: 'space-between' }}>
                    <Box display="flex" alignItems="baseline" gap={1}>
                      {relatedProduct.discount_price !== undefined && relatedProduct.discount_price !== null && relatedProduct.discount_price < relatedProduct.price && (
                        <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                          {relatedProduct.price.toLocaleString('vi-VN')}₫
                        </Typography>
                      )}
                      <Typography variant="body1" color="error" sx={{ fontWeight: 700 }}>
                        {Number(relatedDisplayPrice).toLocaleString('vi-VN')}₫
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      sx={{ color: '#d81b60' }}
                      onClick={(e) => handleAddToCartRelated(e, relatedProduct)}
                    >
                      <AddShoppingCartIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Snackbar */}
      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};
