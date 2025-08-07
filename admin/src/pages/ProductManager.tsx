// 📁 src/pages/ProductManager.tsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box, Typography, Button, Paper, Grid,
  TextField, InputAdornment, MenuItem, Snackbar, Alert as MuiAlert, CircularProgress, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
  Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText, Stack, useTheme
} from '@mui/material';
import Rating from '@mui/material/Rating';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';

import type { AlertProps, AlertColor } from '@mui/material';
import axios from 'axios';

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

interface Product {
  product_id: number;
  name: string;
  description: string | null;
  short_description: string | null;
  // ✅ THÊM 2 TRƯỜNG MỚI
  ingredients?: string | null;
  usage_instructions?: string | null;
  // ...
  price: number;
  stock_quantity: number;
  thumbnail?: string | null;
  category_id: number;
  brand_id: number;
  images?: string[]; 
}

interface Category {
  category_id: number;
  category_name: string;
}

interface Brand {
  brand_id: number;
  brand_name: string;
}

const BASE_URL = 'http://localhost:3000/api';
const UPLOADS_BASE_URL = 'http://localhost:3000/uploads/';

export default function ProductManager() {
  const theme = useTheme();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '', description: '', short_description: '',
    // ✅ THÊM 2 TRƯỜNG MỚI VÀO formData
    ingredients: '', usage_instructions: '',
    // ...
    price: '', stock_quantity: '',
    thumbnailFile: null as File | null,
    thumbnailPreviewUrl: '',
    otherImagesFiles: [] as File[],
    otherImagesPreviewUrls: [] as string[],
    existingOtherImages: [] as string[], 
    category_id: '', brand_id: ''
  });
  const [alert, setAlert] = useState<{ open: boolean; message: string; severity: AlertColor }>({ open: false, message: '', severity: 'success' });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${BASE_URL}/products`);
      
      const productsData: Product[] = res.data.map((p: any) => {
        let processedImages: string[];
        if (Array.isArray(p.images)) {
            processedImages = p.images;
        } else if (typeof p.images === 'string' && p.images.length > 0) {
            processedImages = p.images.split(',');
        } else {
            processedImages = [];
        }
        
        return {
          ...p,
          description: p.description ?? null,
          short_description: p.short_description ?? null,
          // ✅ Xử lý 2 trường mới từ API
          ingredients: p.ingredients ?? null,
          usage_instructions: p.usage_instructions ?? null,
          // ...
          thumbnail: p.thumbnail ?? null,
          product_id: Number(p.product_id),
          category_id: Number(p.category_id),
          brand_id: Number(p.brand_id),
          images: processedImages,
        };
      });

      const sortedProducts = productsData.sort((a, b) => b.product_id - a.product_id);
      
      setProducts(sortedProducts);
    } catch (err) {
      console.error('Lỗi khi lấy sản phẩm:', err);
      const errorMessage = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Lỗi không xác định khi tải sản phẩm.';
      setError(errorMessage);
      setProducts([]); 
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const fetchCategoriesAndBrands = async () => {
      try {
        const [categoriesRes, brandsRes] = await Promise.all([
          axios.get(`${BASE_URL}/categories`),
          axios.get(`${BASE_URL}/brands`)
        ]);
        setCategories(categoriesRes.data);
        setBrands(brandsRes.data);
      } catch (err) {
        console.error('Lỗi khi tải danh mục hoặc thương hiệu:', err);
        const errorMessage = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Lỗi không xác định khi tải danh mục hoặc thương hiệu.';
        setAlert({ open: true, message: `❌ ${errorMessage}`, severity: 'error' });
      }
    };
    fetchCategoriesAndBrands();
  }, []);

  const handleOpenAdd = useCallback(() => {
    setEditingProduct(null);
    setFormData({
      name: '', description: '', short_description: '',
      // ✅ Cập nhật formData
      ingredients: '', usage_instructions: '',
      // ...
      price: '', stock_quantity: '',
      thumbnailFile: null, thumbnailPreviewUrl: '',
      otherImagesFiles: [], otherImagesPreviewUrls: [],
      existingOtherImages: [],
      category_id: '', brand_id: ''
    });
    setOpenDialog(true);
  }, []);

  const handleEdit = useCallback((product: Product) => {
    setEditingProduct(product);
    const initialOtherImages = product.images ? product.images.filter(img => img !== product.thumbnail) : [];
    
    setFormData({
      name: product.name,
      description: product.description ?? '',
      short_description: product.short_description ?? '',
      // ✅ Cập nhật formData từ dữ liệu sản phẩm
      ingredients: product.ingredients ?? '',
      usage_instructions: product.usage_instructions ?? '',
      // ...
      price: product.price.toString(),
      stock_quantity: product.stock_quantity.toString(),
      thumbnailFile: null,
      thumbnailPreviewUrl: product.thumbnail ? `${UPLOADS_BASE_URL}${product.thumbnail}` : '',
      otherImagesFiles: [],
      otherImagesPreviewUrls: [],
      existingOtherImages: initialOtherImages,
      category_id: String(product.category_id),
      brand_id: String(product.brand_id)
    });
    setOpenDialog(true);
  }, []);

  const handleDeleteConfirm = useCallback((productId: number) => {
    setDeletingId(productId);
    setOpenConfirmDialog(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (deletingId === null) return;
    try {
      await axios.delete(`${BASE_URL}/products/${deletingId}`);
      setAlert({ open: true, message: '🗑️ Xoá sản phẩm thành công', severity: 'info' });
      setOpenConfirmDialog(false);
      setDeletingId(null);
      fetchProducts();
    } catch (err) {
      console.error('Lỗi khi xóa sản phẩm:', err);
      const errorMessage = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Lỗi không xác định khi xóa sản phẩm.';
      setAlert({ open: true, message: `❌ ${errorMessage}`, severity: 'error' });
    }
  }, [deletingId, fetchProducts]);

  const handleCloseConfirmDialog = useCallback(() => {
    setOpenConfirmDialog(false);
    setDeletingId(null);
  }, []);

  const handleCloseDialog = useCallback(() => setOpenDialog(false), []);

  const handleChangePage = useCallback((_event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(0);
  }, []);
  
  const handleThumbnailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    const previewUrl = file ? URL.createObjectURL(file) : '';
    setFormData(prev => ({ ...prev, thumbnailFile: file, thumbnailPreviewUrl: previewUrl }));
  }, []);

  const handleOtherImagesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    const previewUrls = imageFiles.map(file => URL.createObjectURL(file));

    setFormData(prev => ({
      ...prev,
      otherImagesFiles: imageFiles,
      otherImagesPreviewUrls: previewUrls
    }));
  }, []);

  const handleDeleteExistingImage = useCallback((indexToDelete: number) => {
    setFormData(prev => {
        const updatedExistingImages = prev.existingOtherImages.filter((_, index) => index !== indexToDelete);
        return {
            ...prev,
            existingOtherImages: updatedExistingImages,
        };
    });
  }, []);

  const handleDeleteNewImagePreview = useCallback((indexToDelete: number) => {
    setFormData(prev => {
        if (prev.otherImagesPreviewUrls[indexToDelete]) {
            URL.revokeObjectURL(prev.otherImagesPreviewUrls[indexToDelete]);
        }
        const updatedNewImagesFiles = prev.otherImagesFiles.filter((_, index) => index !== indexToDelete);
        const updatedNewImagesPreviewUrls = prev.otherImagesPreviewUrls.filter((_, index) => index !== indexToDelete);
        
        return {
            ...prev,
            otherImagesFiles: updatedNewImagesFiles,
            otherImagesPreviewUrls: updatedNewImagesPreviewUrls
        };
    });
  }, []);


  const handleSave = useCallback(async () => {
    const categoryId = Number(formData.category_id);
    const brandId = Number(formData.brand_id);
    const priceNum = Number(formData.price);
    const quantityNum = Number(formData.stock_quantity);

    if (!formData.name || !formData.description || !formData.short_description || isNaN(priceNum) || isNaN(quantityNum) || isNaN(categoryId) || isNaN(brandId) || priceNum < 0 || quantityNum < 0) {
      setAlert({ open: true, message: '❌ Vui lòng điền đầy đủ thông tin hợp lệ (tên, mô tả, giá, số lượng, danh mục, thương hiệu phải là số không âm).', severity: 'warning' });
      return;
    }
    // ✅ Kiểm tra 2 trường mới
    if (!formData.ingredients || !formData.usage_instructions) {
      setAlert({ open: true, message: '❌ Vui lòng điền đầy đủ thông tin Thành phần và Hướng dẫn sử dụng.', severity: 'warning' });
      return;
    }


    if (!editingProduct && !formData.thumbnailFile) {
        setAlert({ open: true, message: '❌ Vui lòng chọn ảnh thumbnail sản phẩm.', severity: 'error' });
        return;
    }
    if (editingProduct && !formData.thumbnailFile && !editingProduct.thumbnail) {
        setAlert({ open: true, message: '❌ Vui lòng chọn ảnh thumbnail sản phẩm hoặc đảm bảo ảnh cũ còn tồn tại.', severity: 'error' });
        return;
    }


    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('short_description', formData.short_description);
    // ✅ THÊM 2 TRƯỜNG MỚI VÀO formData
    data.append('ingredients', formData.ingredients);
    data.append('usage_instructions', formData.usage_instructions);
    // ...
    data.append('price', String(priceNum));
    data.append('stock_quantity', String(quantityNum));
    data.append('category_id', String(categoryId));
    data.append('brand_id', String(brandId));
    
    if (formData.thumbnailFile) {
      data.append('thumbnail', formData.thumbnailFile);
    }
    
    formData.otherImagesFiles.forEach(file => {
      data.append('other_images', file);
    });

    if (editingProduct) {
        data.append('existing_images', JSON.stringify(formData.existingOtherImages));
    }


    try {
      if (editingProduct) {
        await axios.put(`${BASE_URL}/products/${editingProduct.product_id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setAlert({ open: true, message: '✅ Cập nhật sản phẩm thành công', severity: 'success' });
      } else {
        await axios.post(`${BASE_URL}/products`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setAlert({ open: true, message: '✅ Thêm sản phẩm thành công', severity: 'success' });
        setPage(0);
      }
      fetchProducts(); 
      handleCloseDialog();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        console.error('Save error:', err.response?.data || err.message);
        setAlert({ open: true, message: `❌ Lỗi khi lưu sản phẩm: ${err.response?.data?.message || err.message}`, severity: 'error' });
      } else if (err instanceof Error) {
        console.error('Save error:', err.message);
        setAlert({ open: true, message: `❌ Lỗi khi lưu sản phẩm: ${err.message}`, severity: 'error' });
      } else {
        console.error('Save error:', err);
        setAlert({ open: true, message: '❌ Lỗi không xác định khi lưu sản phẩm.', severity: 'error' });
      }
    }
  }, [editingProduct, formData, fetchProducts, handleCloseDialog, categories, brands]);

  const filteredAndPaginatedProducts = useMemo(() => {
    let currentProducts = products;

    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      currentProducts = currentProducts.filter((product) =>
        String(product.product_id).includes(lowerCaseSearchTerm) ||
        product.name.toLowerCase().includes(lowerCaseSearchTerm) ||
        (product.description && product.description.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (product.short_description && product.short_description.toLowerCase().includes(lowerCaseSearchTerm)) ||
        // ✅ THÊM 2 TRƯỜNG MỚI VÀO LOGIC TÌM KIẾM
        (product.ingredients && product.ingredients.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (product.usage_instructions && product.usage_instructions.toLowerCase().includes(lowerCaseSearchTerm)) ||
        // ...
        String(product.price).includes(lowerCaseSearchTerm) ||
        String(product.stock_quantity).includes(lowerCaseSearchTerm) ||
        (categories.find(c => c.category_id === product.category_id)?.category_name?.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (brands.find(b => b.brand_id === product.brand_id)?.brand_name?.toLowerCase().includes(lowerCaseSearchTerm))
      );
    }
    
    const startIndex = page * rowsPerPage;
    return currentProducts.slice(startIndex, startIndex + rowsPerPage);
  }, [products, searchTerm, page, rowsPerPage, categories, brands]); 

  const totalFilteredProductCount = useMemo(() => {
    let currentProducts = products;
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      currentProducts = currentProducts.filter((product) =>
        String(product.product_id).includes(lowerCaseSearchTerm) ||
        product.name.toLowerCase().includes(lowerCaseSearchTerm) ||
        (product.description && product.description.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (product.short_description && product.short_description.toLowerCase().includes(lowerCaseSearchTerm)) ||
        // ✅ THÊM 2 TRƯỜNG MỚI VÀO LOGIC TÌM KIẾM
        (product.ingredients && product.ingredients.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (product.usage_instructions && product.usage_instructions.toLowerCase().includes(lowerCaseSearchTerm)) ||
        // ...
        String(product.price).includes(lowerCaseSearchTerm) ||
        String(product.stock_quantity).includes(lowerCaseSearchTerm) ||
        (categories.find(c => c.category_id === product.category_id)?.category_name?.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (brands.find(b => b.brand_id === product.brand_id)?.brand_name?.toLowerCase().includes(lowerCaseSearchTerm))
      );
    }
    return currentProducts.length;
  }, [products, searchTerm, categories, brands]);


  // --- Conditional Rendering for Loading State ---
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Đang tải sản phẩm...</Typography>
      </Box>
    );
  }

  // --- Conditional Rendering for Error State ---
  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
        <Button variant="contained" onClick={fetchProducts} sx={{ mt: 2 }}>
          Thử lại
        </Button>
      </Box>
    );
  }

  // --- Main Component JSX Return ---
  return (
    <Box sx={{ p: 3 }}>
     <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{
            mb: 4,
            fontWeight: 'bold',
            color: 'rgb(17, 82, 147)' 
        }}
    >
        Quản lý sản phẩm
    </Typography>
      <Paper sx={{ p: 3, boxShadow: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Tìm kiếm sản phẩm..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  {searchTerm && ( 
                    <IconButton onClick={() => setSearchTerm('')} size="small">
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  )}
                </InputAdornment>
              ),
            }}
            sx={{ width: '300px' }}
          />
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>Thêm sản phẩm</Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Tên</TableCell>
                <TableCell>Mô tả ngắn</TableCell>
                <TableCell>Mô tả dài</TableCell>
                 {/* ✅ THÊM 2 CỘT MỚI VÀO TABLE HEAD */}
                <TableCell>Thành phần</TableCell>
                <TableCell>Hướng dẫn</TableCell>
                {/* ... */}
                <TableCell>Giá</TableCell>
                <TableCell>Số lượng</TableCell>
                <TableCell>Ảnh</TableCell>
                <TableCell>Danh mục</TableCell>
                <TableCell>Thương hiệu</TableCell>
                <TableCell sx={{ width: '120px', minWidth: '120px' }}>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAndPaginatedProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    Không tìm thấy sản phẩm nào.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndPaginatedProducts.map((p) => (
                  <TableRow key={p.product_id}>
                    <TableCell>{p.product_id}</TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.short_description ? p.short_description.substring(0, 50) + (p.short_description.length > 50 ? '...' : '') : '—'}</TableCell>
                    <TableCell>{p.description ? p.description.substring(0, 50) + (p.description.length > 50 ? '...' : '') : '—'}</TableCell>
                    {/* ✅ THÊM 2 CỘT MỚI VÀO TABLE BODY */}
                    <TableCell>{p.ingredients ? p.ingredients.substring(0, 50) + (p.ingredients.length > 50 ? '...' : '') : '—'}</TableCell>
                    <TableCell>{p.usage_instructions ? p.usage_instructions.substring(0, 50) + (p.usage_instructions.length > 50 ? '...' : '') : '—'}</TableCell>
                    {/* ... */}
                    <TableCell>{Number(p.price).toLocaleString('vi-VN')}₫</TableCell>
                    <TableCell>{p.stock_quantity}</TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          width: 80,
                          height: 80,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          borderRadius: '8px',
                          border: '1px solid #ddd',
                          backgroundColor: '#f9f9f9',
                        }}
                      >
                        {p.thumbnail ? (
                          <img
                            src={`${UPLOADS_BASE_URL}${p.thumbnail}`}
                            alt={p.name}
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/80?text=No+Image';
                            }}
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">Không có ảnh</Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {categories.find(c => c.category_id === p.category_id)?.category_name || '—'}
                    </TableCell>
                    <TableCell>{brands.find(b => b.brand_id === p.brand_id)?.brand_name || '—'}</TableCell>
                    <TableCell align="right" sx={{ width: '120px', minWidth: '120px' }}>
                      <IconButton
                        aria-label="edit"
                        color="primary"
                        onClick={() => handleEdit(p)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        aria-label="delete"
                        color="error"
                        onClick={() => handleDeleteConfirm(p.product_id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 20, 50]}
          component="div"
          count={totalFilteredProductCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Số hàng mỗi trang:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} trên ${count === -1 ? `hơn ${to}` : count}`
          }
        />
      </Paper>

      {/* Dialog form */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth label="Tên" margin="dense"
              name="name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              fullWidth label="Mô tả ngắn" margin="dense" multiline rows={3}
              name="short_description"
              value={formData.short_description}
              onChange={e => setFormData({ ...formData, short_description: e.target.value })}
            />
            <TextField
              fullWidth label="Mô tả dài" margin="dense" multiline rows={3}
              name="description"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
            {/* ✅ THÊM 2 TRƯỜNG TEXTFIELD MỚI VÀO FORM */}
            <TextField
              fullWidth label="Thành phần" margin="dense" multiline rows={3}
              name="ingredients"
              value={formData.ingredients}
              onChange={e => setFormData({ ...formData, ingredients: e.target.value })}
            />
            <TextField
              fullWidth label="Hướng dẫn sử dụng" margin="dense" multiline rows={3}
              name="usage_instructions"
              value={formData.usage_instructions}
              onChange={e => setFormData({ ...formData, usage_instructions: e.target.value })}
            />
            <TextField
              fullWidth label="Giá" type="number" margin="dense"
              name="price"
              value={formData.price}
              onChange={e => setFormData({ ...formData, price: e.target.value })}
              inputProps={{ min: "0" }}
            />
            <TextField
              fullWidth label="Số lượng" type="number" margin="dense"
              name="stock_quantity"
              value={formData.stock_quantity}
              onChange={e => setFormData({ ...formData, stock_quantity: e.target.value })}
              inputProps={{ min: "0" }}
            />

            <TextField
              select
              fullWidth
              label="Danh mục"
              margin="dense"
              name="category_id"
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            >
              {categories.map((c) => (
                <MenuItem key={c.category_id} value={String(c.category_id)}>
                  {c.category_name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              fullWidth
              label="Thương hiệu"
              margin="dense"
              name="brand_id"
              value={formData.brand_id}
              onChange={e => setFormData({ ...formData, brand_id: e.target.value })}
            >
              {brands.map(b => (
                <MenuItem key={b.brand_id} value={String(b.brand_id)}>{b.brand_name}</MenuItem>
              ))}
            </TextField>

            <Box sx={{ mt: 2 }} component="label">
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Ảnh Thumbnail chính</Typography>
              <Box
                sx={{
                  width: 100, height: 100, border: '1px dashed #ccc', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', position: 'relative',
                  overflow: 'hidden', cursor: 'pointer', backgroundColor: '#fafafa'
                }}
              >
                {formData.thumbnailPreviewUrl ? (
                  <>
                    <img src={formData.thumbnailPreviewUrl} alt="thumbnail preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <Button
                      size="small" color="error" sx={{
                        position: 'absolute', top: 2, right: 2, fontSize: 10, minWidth: 'unset', px: 1, py: '2px'
                      }}
                      onClick={e => {
                        e.stopPropagation();
                        setFormData({ ...formData, thumbnailFile: null, thumbnailPreviewUrl: '' });
                      }}
                    >X</Button>
                  </>
                ) : (
                  <Typography variant="caption">Chọn ảnh</Typography>
                )}
              </Box>
              <input type="file" hidden accept="image/*" onChange={handleThumbnailChange} />
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Ảnh phụ (nhiều ảnh)</Typography>
              <Button
                variant="outlined"
                component="label"
                startIcon={<PhotoCameraIcon />}
              >
                Chọn ảnh phụ
                <input type="file" hidden accept="image/*" multiple onChange={handleOtherImagesChange} />
              </Button>

              <Grid container spacing={1} sx={{ mt: 1 }}>
                {formData.existingOtherImages.map((imageName, index) => (
                  <Grid item key={imageName} component="div">
                    <Box
                      sx={{
                        width: 80, height: 80, border: '1px solid #ddd', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', position: 'relative',
                        overflow: 'hidden', borderRadius: '8px'
                      }}
                    >
                      <img
                        src={`${UPLOADS_BASE_URL}${imageName}`}
                        alt={`Existing image ${index}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <IconButton
                        size="small" color="error" sx={{
                          position: 'absolute', top: -4, right: -4, bgcolor: 'background.paper',
                          '&:hover': { bgcolor: 'error.light' }
                        }}
                        onClick={() => handleDeleteExistingImage(index)}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Grid>
                ))}
                {formData.otherImagesPreviewUrls.map((url, index) => (
                  <Grid item key={index} component="div">
                    <Box
                      sx={{
                        width: 80, height: 80, border: '1px dashed #aaa', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', position: 'relative',
                        overflow: 'hidden', borderRadius: '8px'
                      }}
                    >
                      <img
                        src={url}
                        alt={`New image preview ${index}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <IconButton
                        size="small" color="error" sx={{
                          position: 'absolute', top: -4, right: -4, bgcolor: 'background.paper',
                          '&:hover': { bgcolor: 'error.light' }
                        }}
                        onClick={() => handleDeleteNewImagePreview(index)}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button onClick={handleSave} variant="contained">Lưu</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Xác nhận Xóa */}
      <Dialog
        open={openConfirmDialog}
        onClose={handleCloseConfirmDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Xác nhận xóa sản phẩm?"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Bạn có chắc chắn muốn xóa sản phẩm này? Thao tác này không thể hoàn tác.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} color="primary">
            Hủy
          </Button>
          <Button onClick={handleDelete} color="error" autoFocus>
            Xóa
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={alert.open} autoHideDuration={3000} onClose={() => setAlert({ ...alert, open: false })}>
        <Alert severity={alert.severity} onClose={() => setAlert({ ...alert, open: false })} sx={{ width: '100%' }}>
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}