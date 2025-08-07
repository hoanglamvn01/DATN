import {
  Box,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Slider,
  Grid, // Đảm bảo Grid được import
  Card,
  CardMedia,
  IconButton,
  Select,
  MenuItem,
  Pagination,
  Snackbar,
  Alert,
  CircularProgress, // Đảm bảo CircularProgress được import
} from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import axios from 'axios';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Rating } from '@mui/material';
// Import các component cần thiết nếu chúng nằm trong các file riêng biệt
import ProductDisplayPage from "./ProductDisplayPage"
import FeaturedSection from "./FeaturedSection"

import { useAuth } from '../context/AuthContext'; // Import useAuth
import { type AlertColor } from '@mui/material/Alert'; // Import AlertColor
import { useCart } from '../context/CartContext';

const BASE_URL = 'http://localhost:3000/api';
const UPLOADS = 'http://localhost:3000/uploads/';
const PRODUCTS_PER_PAGE = 12;

interface Product {
  product_id: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  thumbnail: string;
  category_id: number;
  brand_id: number;
  brand_name?: string; 
  rating?: number;
  reviewCount?: number; 
}

interface Category {
  category_id: number;
  category_name: string;
  slug: string;
}

interface Brand {
  brand_id: number;
  brand_name: string;
  slug: string;
}

export default function ProductListWithFilters() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearchTerm = searchParams.get('search') || '';
  const urlCategorySlug = searchParams.get('category') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [favorites, setFavorites] = useState<Set<number>>(new Set()); 
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' as AlertColor }); 
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    brands: [] as string[],
    categories: [] as string[],
    ratings: [] as number[],
    price: [0, 2000000],
  });
  const [sortOption, setSortOption] = useState('mới nhất');
  const [currentPage, setCurrentPage] = useState(1);

  const { currentUser } = useAuth();
  const user_id = currentUser?.user_id;
  const { addItem } = useCart();

  // --- HÀM LẤY DỮ LIỆU ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const params = {
      search: urlSearchTerm, 
      category: urlCategorySlug, 
    };

    try {
      const [prodRes, catRes, brandRes] = await Promise.all([
        axios.get(`${BASE_URL}/products`, { params }),
        axios.get(`${BASE_URL}/categories`), 
        axios.get(`${BASE_URL}/brands`),
      ]);

      const loadedProducts = prodRes.data.map((p: any) => ({
        ...p,
        rating: p.rating ?? 0, 
        reviewCount: p.reviews ?? 0,
      }));

      setProducts(loadedProducts);
      setCategories(catRes.data);
      setBrands(brandRes.data);
      
      if (urlCategorySlug && catRes.data.length > 0) {
        const matchingCategory = catRes.data.find((cat: Category) => cat.slug === urlCategorySlug);
        if (matchingCategory) {
            const categoryId = String(matchingCategory.category_id);
            if (!filters.categories.includes(categoryId)) {
                setFilters(prev => ({ 
                    ...prev, 
                    categories: [categoryId]
                }));
            }
        }
      } else if (urlCategorySlug === '') {
          setFilters(prev => ({ ...prev, categories: [] }));
      }
      
      if (user_id) {
          const favRes = await axios.get(`${BASE_URL}/favorites/${user_id}`);
          const favProductIds = new Set<number>(favRes.data.map((fav: any) => fav.product_id));
          setFavorites(favProductIds);
      } else {
          setFavorites(new Set()); 
      }

    } catch (err) {
      console.error('Lỗi khi tải dữ liệu:', err);
      setError('Lỗi khi tải dữ liệu sản phẩm.');
    } finally {
      setLoading(false);
    }
  }, [urlSearchTerm, urlCategorySlug, user_id]); 

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  const handleFavoriteToggle = async (productId: number) => {
    if (!user_id) { 
        setAlert({ open: true, message: '❌ Vui lòng đăng nhập để thêm sản phẩm vào danh sách yêu thích!', severity: 'error' });
        navigate('/login'); 
        return;
    }

    const isCurrentlyFavorite = favorites.has(productId); 
    
    const newFavorites = new Set(favorites);
    if (isCurrentlyFavorite) {
        newFavorites.delete(productId);
    } else {
        newFavorites.add(productId);
    }
    setFavorites(newFavorites);

    try {
        if (isCurrentlyFavorite) {
            await axios.delete(`${BASE_URL}/favorites/${user_id}/${productId}`);
            setAlert({ open: true, message: `🗑️ Đã xóa sản phẩm khỏi yêu thích!`, severity: 'info' });
        } else {
            await axios.post(`${BASE_URL}/favorites`, {
                user_id: user_id,
                product_id: productId
            });
            setAlert({ open: true, message: `💖 Đã thêm sản phẩm vào yêu thích!`, severity: 'success' });
        }
    } catch (error) {
        setFavorites(favorites); 
        const msg = (error as any).response?.data?.message || 'Lỗi khi cập nhật danh sách yêu thích.';
        setAlert({ open: true, message: "Đã có trong danh sách yêu thích của bạn", severity: 'error' });
        console.error("Lỗi cập nhật yêu thích:", error);
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

  const handleFilterChange = (type: string, value: string | number) => {
    setFilters(prev => {
      const newArr = prev[type as keyof typeof prev] as any[];
      const index = newArr.indexOf(value);
      const updated = index === -1 ? [...newArr, value] : newArr.filter(i => i !== value);
      
      if (type === 'categories' && urlCategorySlug) {
          setSearchParams(currentParams => {
              const newParams = new URLSearchParams(currentParams);
              newParams.delete('category');
              return newParams;
          });
      }

      if (urlSearchTerm) {
          setSearchParams(currentParams => {
              const newParams = new URLSearchParams(currentParams);
              newParams.delete('search');
              return newParams;
          });
      }
      
      return { ...prev, [type]: updated };
    });
    setCurrentPage(1); 
  };

  const handlePriceChange = (_e: Event, newValue: number | number[]) => {
    setFilters(prev => ({ ...prev, price: newValue as number[] }));
    setCurrentPage(1);
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sortedFilteredProducts = useMemo(() => {
    let filtered = products.filter(p => {
      const matchBrand = filters.brands.length === 0 || filters.brands.includes(String(p.brand_id));
      const matchCat = filters.categories.length === 0 || filters.categories.includes(String(p.category_id));
      const matchRating = filters.ratings.length === 0 || filters.ratings.some(r => (p.rating || 0) >= r);
      const matchPrice = p.price >= filters.price[0] && p.price <= filters.price[1];
      
      return matchBrand && matchCat && matchRating && matchPrice;
    });

    filtered.sort((a, b) => {
      if (sortOption === 'giá tăng') return a.price - b.price;
      if (sortOption === 'giá giảm') return b.price - a.price;
      return b.product_id - a.product_id; 
    });

    return filtered;
  }, [products, filters, sortOption]);

  const paginatedProducts = sortedFilteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  // --- RENDER ---
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Đang tải sản phẩm...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', px: 4, py: 4, mt: 14}}>
    <h3 className="text-start fw-bold text-uppercase " style={{ letterSpacing: '2px' }}>
       Tất cả sản phẩm
      </h3>
      <Typography color="text.secondary" mb={4}>
        Khám phá bộ sưu tập mỹ phẩm chính hãng
      </Typography>

      {/* Hiển thị kết quả tìm kiếm/lọc */}
      {(urlSearchTerm || urlCategorySlug) && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" color="primary">
            {urlSearchTerm ? `Kết quả tìm kiếm cho: "${urlSearchTerm}"` : `Hiển thị sản phẩm thuộc danh mục: "${urlCategorySlug}"`}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Tổng {sortedFilteredProducts.length} sản phẩm phù hợp.
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 4 }}>
        {/* Phần Bộ lọc */}
        <Box sx={{ width: 250 }}>
          <Typography fontWeight="bold" mb={1}>Thương hiệu</Typography>
          <FormGroup>
            {brands.map(b => (
              <FormControlLabel
                key={b.brand_id}
                control={<Checkbox checked={filters.brands.includes(String(b.brand_id))} onChange={() => handleFilterChange('brands', String(b.brand_id))} />}
                label={b.brand_name}
                sx={{ color: '#e91e63', '&.Mui-checked': { color: '#e91e63' } }}
              />
            ))}
          </FormGroup>

          <Box mt={4}>
            <Typography fontWeight="bold" mb={1}>Danh mục</Typography>
            <FormGroup>
              {categories.map(c => (
                <FormControlLabel
                  key={c.category_id}
                  control={<Checkbox checked={filters.categories.includes(String(c.category_id))} onChange={() => handleFilterChange('categories', String(c.category_id))} />}
                  label={c.category_name}
                  sx={{ color: '#e91e63', '&.Mui-checked': { color: '#e91e63' } }} 
                />
              ))}
            </FormGroup>
          </Box>

          <Box mt={4}>
            <Typography fontWeight="bold" mb={1}>Khoảng giá</Typography>
            <Slider value={filters.price} onChange={handlePriceChange} valueLabelDisplay="auto" min={0} max={2000000} sx={{ color: '#e91e63' }} />
            <Typography variant="body2">
              {filters.price[0].toLocaleString()}đ - {filters.price[1].toLocaleString()}đ
            </Typography>
          </Box>

        </Box>

        {/* Phần Hiển thị Sản phẩm */}
        <Box flex={1}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1">Hiển thị {sortedFilteredProducts.length} sản phẩm</Typography>
            <Select size="small" value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
              <MenuItem value="mới nhất">Mới nhất</MenuItem>
              <MenuItem value="giá tăng">Giá tăng dần</MenuItem>
              <MenuItem value="giá giảm">Giá giảm dần</MenuItem>
            </Select>
          </Box>

          <Grid container spacing={2}>
            {paginatedProducts.length === 0 ? (
                <Grid item xs={12}>
                    <Alert severity="warning">
                        Không tìm thấy sản phẩm nào phù hợp với bộ lọc hiện tại.
                    </Alert>
                </Grid>
            ) : (
                paginatedProducts.map(product => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={product.product_id}>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                          <Card
                            sx={{
                              p: 2,
                              height: '100%',
                              width: 261,
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'flex-start',
                              borderRadius: 2,
                              border: '1px solid #e0e0e0',
                              boxShadow: 'rgba(0, 0, 0, 0.05) 0px 1px 2px',
                              transition: 'box-shadow 0.2s, transform 0.2s',
                              cursor: 'pointer',
                              '&:hover': {
                                transform: 'translateY(-6px)',
                                boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
                              }
                            }}
                            onClick={() => navigate(`/products/${product.product_id}`)}
                          >
                            <Box sx={{ position: 'relative', width: '100%', height: 240, mb: 2 }}>
                              <CardMedia
                                component="img"
                                image={product.thumbnail ? `${UPLOADS}${product.thumbnail}` : 'https://via.placeholder.com/240x200?text=No+Image'}
                                alt={product.name}
                                sx={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 1 }}
                              />
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFavoriteToggle(product.product_id);
                                }}
                                sx={{
                                  position: 'absolute',
                                  top: 8,
                                  right: 8,
                                  bgcolor: 'white',
                                  '&:hover': { bgcolor: 'grey.100' },
                                }}
                              >
                                {favorites.has(product.product_id)
                                  ? <FavoriteIcon sx={{ color: '#e91e63' }} />
                                  : <FavoriteBorderIcon sx={{ color: '#aaa' }} />}
                              </IconButton>
                            </Box>

                            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                              <Typography variant="caption" color="text.secondary">
                                {product.brand_name}
                              </Typography>

                              <Typography
                                variant="subtitle2"
                                fontWeight="bold"
                                mt={0.5}
                                sx={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  minHeight: '2.6em',
                                }}
                              >
                                {product.name}
                              </Typography>

                              <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                                  {/* ✅ THAY THẾ TOÀN BỘ ĐOẠN CODE GÂY LỖI BẰNG ĐOẠN NÀY */}
                                  <Rating value={product.rating || 0} precision={0.5} readOnly size="small" />
                                  <Typography variant="caption" color="text.secondary">({product.reviewCount || 0})</Typography>
                              </Box>

                              <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                                <Typography fontWeight="bold"  sx={{ color: '#d81b60' }} fontSize="1rem" >
                                  {Number(product.price).toLocaleString()}₫
                                </Typography>
                                <IconButton sx={{ color: '#d81b60' }} size="small" onClick={(e) => handleAddToCart(e, product)}>
                                  <AddShoppingCartIcon />
                                </IconButton>
                              </Box>
                            </Box>
                          </Card>
                        </motion.div>
                      </Grid>
                ))
            )}
          </Grid>

          {/* Phân trang */}
          <Box display="flex" justifyContent="flex-start" sx={{ mt: 4, ml: 45 }}>
            <Pagination
              count={Math.ceil(sortedFilteredProducts.length / PRODUCTS_PER_PAGE)}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        </Box>
      </Box>

      <Snackbar open={alert.open} autoHideDuration={3000} onClose={() => setAlert({ ...alert, open: false })}>
        <Alert severity={alert.severity as any} onClose={() => setAlert({ ...alert, open: false })}>
          {alert.message}
        </Alert>
      </Snackbar> <br />
      <FeaturedSection 
        smallHeading="Hôm nay bạn muốn săn sản phẩm gì?"
        largeHeading="Khám phá vẻ đẹp tự nhiên, tỏa sáng mỗi ngày"
        description="Từ những dòng serum dưỡng da chuyên sâu đến bảng màu son rực rỡ, chúng tôi mang đến các sản phẩm mỹ phẩm chính hãng giúp bạn tỏa sáng với phong cách riêng. Hãy bắt đầu hành trình làm đẹp cùng chúng tôi ngay hôm nay!"
        buttonText="XEM NGAY"
        buttonLink="/posts/kham-pha-ve-dep-tu-nhien"
        mainImage="https://www.lemon8-app.com/seo/image?item_id=7299463717391991297&index=0&sign=d309ed598e6fa9b3778efccb76f8fa3b"
      />

      {/* ✅ ProductDisplayPage đã bị gọi ở đây nhưng không cần thiết */}
      <ProductDisplayPage/>
    </Box>
  );
}