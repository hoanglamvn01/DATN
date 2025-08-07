import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Button, TextField, InputAdornment, useTheme, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, Stack, Snackbar, 
  TableSortLabel, TablePagination, DialogContentText,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import MuiAlert, { type AlertProps } from '@mui/material/Alert';

import { useAuth } from '../context/AuthContext'; 
import { useSnackbar } from '../hooks/useSnackbar'; 

// Custom Alert component for Snackbar
const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

// --- INTERFACES ---
interface FavoriteProduct {
  favorite_id: number;
  user_id: number | string; 
  product_id: number | string; 
  name: string;      // ✅ Đổi từ 'product_name' thành 'name' để khớp với API
  price: number;
  thumbnail: string; // ✅ Đổi từ 'image_url' thành 'thumbnail' để khớp với API
}

interface FavoriteProductFormData {
  product_id?: number | string;
}

type Order = 'asc' | 'desc';
type HeadCellId = keyof FavoriteProduct;

interface HeadCell {
  id: HeadCellId;
  label: string;
  numeric: boolean;
  disableSorting?: boolean;
}

const headCells: HeadCell[] = [
  { id: 'favorite_id', numeric: false, label: 'ID Yêu Thích' },
  { id: 'user_id', numeric: false, label: 'ID Người Dùng' },
  { id: 'product_id', numeric: false, label: 'ID Sản Phẩm' },
  { id: 'name', numeric: false, label: 'Tên Sản Phẩm' }, // ✅ Đổi từ 'product_name' thành 'name'
  { id: 'price', numeric: true, label: 'Giá Sản Phẩm' },
  // { id: 'thumbnail', numeric: false, label: 'Hình ảnh', disableSorting: true }, // Có thể thêm cột hình ảnh nếu muốn
];

// --- UTILITY FUNCTIONS FOR SORTING ---
function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator<Key extends keyof FavoriteProduct>(
  order: Order,
  orderBy: Key,
): (a: [FavoriteProduct, number], b: [FavoriteProduct, number]) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a[0], b[0], orderBy)
    : (a, b) => -descendingComparator(a[0], b[0], orderBy);
}

function stableSort<T>(array: readonly T[], comparator: (a: [T, number], b: [T, number]) => number) {
  const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a, b);
    if (order !== 0) {
      return order;
    }
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

// --- FAVORITE PRODUCTS MANAGER COMPONENT ---
export default function FavoriteProductsManager() {
  const theme = useTheme();
  const { logout, loading: authLoading, isAuthenticated } = useAuth();
  const { openSnackbar } = useSnackbar(); 

  const [favoriteProducts, setFavoriteProducts] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State cho phân trang
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10); 
  const [totalFavorites, setTotalFavorites] = useState<number>(0); // ✅ State mới để lưu tổng số từ API

  // State cho sắp xếp
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<HeadCellId>('favorite_id');

  // State cho tìm kiếm
  const [searchTerm, setSearchTerm] = useState<string>('');

  // State cho Modal Thêm sản phẩm yêu thích
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalFormData, setModalFormData] = useState<Partial<FavoriteProductFormData>>({ product_id: undefined });

  // State cho Dialog xác nhận xóa
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<number | string | null>(null);

  const API_BASE_URL = 'http://localhost:3000/api/favorites';

  // --- API CALLS ---
  const fetchFavoriteProducts = useCallback(async () => {
    if (authLoading) {
      setLoading(true);
      return;
    }
    if (!isAuthenticated) {
      setLoading(false); 
      setError("Bạn cần đăng nhập để xem danh sách sản phẩm yêu thích.");
      openSnackbar({ text: "Bạn cần đăng nhập để xem danh sách sản phẩm yêu thích.", severity: "error" });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // ✅ Vẫn giữ COMMENT phần xác thực token cho GET ALL để debug backend trước
      // const token = localStorage.getItem('token');
      // if (!token) {
      //   throw new Error('Không có token xác thực. Vui lòng đăng nhập lại.');
      // }

      const url = new URL(API_BASE_URL);
      url.searchParams.set("page", (page + 1).toString());
      url.searchParams.set("limit", rowsPerPage.toString());
      // Thêm searchParam nếu backend hỗ trợ tìm kiếm cho favorites
      // if (searchTerm) { url.searchParams.set("search", searchTerm); }

      const response = await fetch(url.toString(), {
        // ✅ Vẫn giữ COMMENT phần gửi header Authorization cho GET ALL
        // headers: {
        //   'Authorization': `Bearer ${token}`,
        //   'Content-Type': 'application/json',
        // },
      });

      // ✅ Vẫn giữ COMMENT phần xử lý lỗi 401/403 cho FETCHPRODUCTS
      // if (response.status === 401 || response.status === 403) {
      //   const errorData = await response.json();
      //   openSnackbar({
      //     text: errorData.message || 'Phiên đăng nhập đã hết hạn hoặc không có quyền. Vui lòng đăng nhập lại.',
      //     severity: 'error',
      //   });
      //   logout(); 
      //   return;
      // }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setFavoriteProducts(data.favoriteProducts);
      setTotalFavorites(data.total); // ✅ LƯU TỔNG SỐ LƯỢNG TỪ API
      // setPage(data.page - 1); // Frontend của bạn đã là 0-based
    } catch (err) {
      setError('Không thể tải dữ liệu sản phẩm yêu thích. Vui lòng thử lại.');
      console.error('Fetch favorite products error:', err);
      openSnackbar({ text: `Lỗi khi tải sản phẩm yêu thích: ${err instanceof Error ? err.message : String(err)}`, severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchTerm, authLoading, isAuthenticated, logout, openSnackbar]);

  useEffect(() => {
    fetchFavoriteProducts();
  }, [fetchFavoriteProducts]);

  // --- HANDLERS ---
  const handleSnackbarClose = useCallback((_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    // openSnackbar (từ hook) sẽ tự động đóng. Không cần gọi set state cho snackbar ở đây.
    // Nếu muốn tự động đóng, hãy đảm bảo SnackbarProvider có autoHideDuration.
  }, []); 

  const handleChangePage = useCallback((_event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset về trang đầu tiên
  }, []);

  const handleRequestSort = useCallback((property: HeadCellId) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  }, [order, orderBy]);

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0); // Reset về trang đầu tiên khi tìm kiếm
  }, []);

  const handleAddNewFavoriteProduct = useCallback(() => {
    setModalFormData({ product_id: undefined }); // Reset form
    setIsModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback((productId: number | string) => {
    setDeletingProductId(productId);
    setOpenConfirmDialog(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (deletingProductId === null) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        openSnackbar({ text: "Không có token xác thực để xóa.", severity: "error" });
        logout();
        return;
      }

      const response = await fetch(`${API_BASE_URL}/${deletingProductId}`, { // DELETE theo product_id
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401 || response.status === 403) {
        const errorData = await response.json();
        openSnackbar({ text: errorData.message || 'Phiên đăng nhập đã hết hạn hoặc không có quyền.', severity: 'error' });
        logout();
        return;
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      openSnackbar({ text: 'Sản phẩm yêu thích đã được xóa thành công!', severity: 'success' });
      setOpenConfirmDialog(false);
      setDeletingProductId(null);
      fetchFavoriteProducts(); // Tải lại danh sách sau khi xóa
    } catch (error) {
      openSnackbar({ text: `Lỗi khi xóa sản phẩm yêu thích: ${error instanceof Error ? error.message : String(error)}`, severity: 'error' });
    }
  }, [deletingProductId, fetchFavoriteProducts, openSnackbar, logout]);

  const handleCloseConfirmDialog = useCallback(() => {
    setOpenConfirmDialog(false);
    setDeletingProductId(null);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setModalFormData({ product_id: undefined }); // Reset form
  }, []);

  const handleModalFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setModalFormData((prev) => ({
      ...prev,
      [name]: name === 'product_id' ? (parseInt(value, 10) || undefined) : value, // Chuyển product_id sang số
    }));
  }, []);

  const handleSaveFavoriteProduct = useCallback(async () => {
    if (modalFormData.product_id === undefined || modalFormData.product_id === null || String(modalFormData.product_id).trim() === '') {
      openSnackbar({ text: 'Vui lòng nhập ID Sản phẩm.', severity: 'error' });
      return;
    }
    
    const productIdToSend = typeof modalFormData.product_id === 'string' 
      ? parseInt(modalFormData.product_id, 10) 
      : modalFormData.product_id;

    if (isNaN(productIdToSend as number)) {
        openSnackbar({ text: 'ID Sản phẩm không hợp lệ (phải là số).', severity: 'error' });
        return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        openSnackbar({ text: "Không có token xác thực.", severity: "error" });
        logout();
        return;
      }

      const method = 'POST';
      const url = API_BASE_URL;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ product_id: productIdToSend }),
      });

      if (response.status === 401 || response.status === 403) {
        const errorData = await response.json();
        openSnackbar({ text: errorData.message || 'Phiên đăng nhập đã hết hạn hoặc không có quyền.', severity: 'error' });
        logout();
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      openSnackbar({ text: `Sản phẩm yêu thích đã được thêm thành công!`, severity: 'success' });
      handleCloseModal();
      fetchFavoriteProducts();
    } catch (error) {
      openSnackbar({ text: `Lỗi khi lưu sản phẩm yêu thích: ${error instanceof Error ? error.message : String(error)}`, severity: 'error' });
    }
  }, [modalFormData, handleCloseModal, fetchFavoriteProducts, openSnackbar, logout]);


  // --- MEMOIZED DATA FOR TABLE ---
  const filteredAndSortedFavoriteProducts = useMemo(() => {
    let currentFavorites = favoriteProducts;

    if (searchTerm) {
      currentFavorites = currentFavorites.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(product.product_id).includes(searchTerm) ||
        String(product.user_id).includes(searchTerm)
      );
    }
    return stableSort(currentFavorites, getComparator(order, orderBy));
  }, [favoriteProducts, searchTerm, order, orderBy]);

  // Tổng số lượng cho phân trang
  // Bây giờ sử dụng totalFavorites từ state, được cập nhật từ API
  const totalDisplayCount = useMemo(() => { // ✅ Đổi tên biến để tránh nhầm lẫn với state totalFavorites
    return totalFavorites; // ✅ Sử dụng totalFavorites từ state
  }, [totalFavorites]); 

  const displayedFavoriteProducts = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredAndSortedFavoriteProducts.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAndSortedFavoriteProducts, page, rowsPerPage]);


  // --- RENDER ---
  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Đang kiểm tra xác thực...</Typography>
      </Box>
    );
  }

  if (loading) { 
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Đang tải dữ liệu sản phẩm yêu thích...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, backgroundColor: theme.palette.background.default, minHeight: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="error" variant="body1" sx={{ textAlign: 'center' }}>{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, backgroundColor: theme.palette.background.default }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, fontWeight: 'bold', color: theme.palette.primary.dark }}>
        Quản lý sản phẩm yêu thích
      </Typography>

      <Paper sx={{ p: 3, borderRadius: theme.shape.borderRadius, boxShadow: theme.shadows[3], mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 2, gap: 2 }}>
          <TextField
            label="Tìm kiếm sản phẩm yêu thích..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ width: { xs: '100%', sm: '300px' } }}
          />
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddNewFavoriteProduct}
            sx={{ flexShrink: 0 }}
          >
            Thêm Sản phẩm Yêu thích
          </Button>
        </Box>

        <TableContainer>
          <Table aria-label="favorite products management table">
            <TableHead>
              <TableRow>
                {headCells.map((headCell) => (
                  <TableCell
                    key={headCell.id}
                    align={headCell.numeric ? 'right' : 'left'}
                    sx={{ fontWeight: 'bold', backgroundColor: theme.palette.grey[200] }}
                  >
                    {!headCell.disableSorting ? (
                      <TableSortLabel
                        active={orderBy === headCell.id}
                        direction={orderBy === headCell.id ? order : 'asc'}
                        onClick={() => handleRequestSort(headCell.id)}
                      >
                        {headCell.label}
                      </TableSortLabel>
                    ) : (
                      headCell.label
                    )}
                  </TableCell>
                ))}
                <TableCell align="left" sx={{ fontWeight: 'bold', backgroundColor: theme.palette.grey[200] }}>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedFavoriteProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={headCells.length + 1} align="center" sx={{ py: 3 }}>
                    <Typography variant="subtitle1" color="text.secondary">
                      Không tìm thấy sản phẩm yêu thích nào.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                displayedFavoriteProducts.map((favorite) => (
                  <TableRow key={favorite.favorite_id} hover>
                    <TableCell align="left">{favorite.favorite_id}</TableCell>
                    <TableCell align="left">{favorite.user_id}</TableCell>
                    <TableCell align="left">{favorite.product_id}</TableCell>
                    <TableCell align="left">{favorite.name}</TableCell>{/* ✅ Đã sửa tên cột */}
                    <TableCell align="right">
                        {Number(favorite.price).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                    </TableCell>

                    <TableCell align="left">
                      <Box sx={{ display: 'flex', justifyContent: 'left', gap: 1 }}>
                        <IconButton
                          aria-label="delete"
                          color="error"
                          onClick={() => handleDeleteConfirm(favorite.product_id)} // Xóa theo product_id
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 20]} // Tùy chọn hàng mỗi trang
          component="div"
          count={totalDisplayCount} // ✅ Sử dụng totalDisplayCount
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Số hàng mỗi trang:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} trên ${count !== -1 ? count : `hơn ${to}`}`
          }
        />
      </Paper>

      {/* Modal Thêm Sản phẩm Yêu thích */}
      <Dialog open={isModalOpen} onClose={handleCloseModal} fullWidth maxWidth="sm" scroll="paper">
        <DialogTitle>
          Thêm Sản phẩm Yêu thích Mới
          <IconButton
            aria-label="close"
            onClick={handleCloseModal}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="ID Sản phẩm"
              name="product_id"
              variant="outlined"
              fullWidth
              type="number" 
              value={modalFormData.product_id === undefined ? '' : modalFormData.product_id}
              onChange={handleModalFormChange}
              required
              helperText="Nhập ID của sản phẩm muốn thêm vào yêu thích."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="secondary">
            Hủy
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveFavoriteProduct}
          >
            Lưu
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Xác nhận Xóa */}
      <Dialog
        open={openConfirmDialog}
        onClose={handleCloseConfirmDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Xác nhận xóa sản phẩm yêu thích?"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Bạn có chắc chắn muốn xóa sản phẩm này khỏi danh sách yêu thích? Thao tác này không thể hoàn tác.
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

      {/* Snackbar thông báo (quản lý bởi SnackbarContext) */}
      {/* Không cần truyền `open`, `severity`, `message` trực tiếp từ state của component nữa */}
      {/* SnackbarProvider sẽ tự render Snackbar. */}
      {/* Bạn chỉ cần gọi `openSnackbar({ text: '...', severity: '...' })` để kích hoạt nó. */}
    </Box>
  );
}