import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Button, TextField, InputAdornment, useTheme, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, Stack, Snackbar,
  TableSortLabel, TablePagination, DialogContentText, Rating
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import MuiAlert, { type AlertProps } from '@mui/material/Alert';
// Vẫn import AddIcon mặc dù không sử dụng trong logic (để tránh lỗi TS6133 nếu bạn sử dụng nó trong JSX)
import AddIcon from '@mui/icons-material/Add';


// Custom Alert component for Snackbar
const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

// --- INTERFACES ---
interface Review {
  review_id: number;
  user_id: number;
  username: string; 
  product_id: number;
  product_name: string; 
  rating: number; 
  comment: string | null;
  created_at: string; 
}

type Order = 'asc' | 'desc';
type HeadCellId = keyof Review;

interface HeadCell {
  id: HeadCellId;
  label: string;
  numeric: boolean;
  disableSorting?: boolean;
}

const headCells: HeadCell[] = [
  { id: 'review_id', numeric: false, label: 'ID' },
  { id: 'product_name', numeric: false, label: 'Sản phẩm' },
  { id: 'username', numeric: false, label: 'Khách hàng' },
  { id: 'rating', numeric: true, label: 'Đánh giá' },
  { id: 'comment', numeric: false, label: 'Bình luận', disableSorting: true },
  { id: 'created_at', numeric: false, label: 'Ngày', disableSorting: true },
];

// --- UTILITY FUNCTIONS FOR SORTING ---

// Hàm so sánh chung, đã được điều chỉnh để xử lý Review một cách an toàn hơn
function descendingComparator<T extends Review>(a: T, b: T, orderBy: keyof T) {
    // Sử dụng `any` để truy cập thuộc tính và xử lý null/undefined an toàn
    const valueA = (a as any)[orderBy] === null || (a as any)[orderBy] === undefined ? '' : (a as any)[orderBy];
    const valueB = (b as any)[orderBy] === null || (b as any)[orderBy] === undefined ? '' : (b as any)[orderBy];

    if (valueB < valueA) {
      return -1;
    }
    if (valueB > valueA) {
      return 1;
    }
    return 0;
}

// Hàm getComparator đã được điều chỉnh để chấp nhận Review
function getComparator<Key extends keyof Review>( 
  order: Order,
  orderBy: Key,
): (a: Review, b: Review) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

// Hàm stableSort (Đã sửa lỗi TS2345 bằng cách đảm bảo comparator hoạt động đúng trên Review[])
function stableSort<T>(array: readonly T[], comparator: (a: T, b: T) => number) {
  const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) {
      return order;
    }
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

// --- REVIEW MANAGER COMPONENT ---
export default function ReviewManager() {
  const theme = useTheme();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10); 
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<HeadCellId>('created_at'); 

  const [searchTerm, setSearchTerm] = useState<string>('');

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [modalFormData, setModalFormData] = useState<Partial<Review>>({});

  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // Đảm bảo URL này chính xác
  const API_URL = 'http://localhost:3000/api/reviews'; 

  // --- API CALLS ---
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(API_URL);
      
      // ✅ Ép kiểu dữ liệu khi nhận (đảm bảo các ID và rating là số)
      const formattedData: Review[] = response.data.map((item: any) => ({
          ...item,
          review_id: Number(item.review_id),
          user_id: Number(item.user_id),
          product_id: Number(item.product_id),
          rating: Number(item.rating),
          created_at: item.created_at, 
          // Đảm bảo comment có thể là null
          comment: item.comment === undefined ? null : item.comment, 
          username: item.username,
          product_name: item.product_name,
      }));
      
      setReviews(formattedData);
    } catch (err) {
      setError('Không thể tải dữ liệu đánh giá. Vui lòng kiểm tra kết nối backend.');
      console.error('Fetch reviews error:', err);
      showSnackbar(`Lỗi khi tải đánh giá: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // --- HANDLERS ---

  const showSnackbar = useCallback((message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  // ✅ Sửa lỗi TS6133: Tham số _event được sử dụng đúng cách
  const handleSnackbarClose = useCallback((_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  }, []);

  const handleChangePage = useCallback((_event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  }, []);

  // ✅ Sửa lỗi TS6133: Tham số event được sử dụng đúng cách
  const handleRequestSort = useCallback((event: React.MouseEvent<unknown>, property: HeadCellId) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  }, [order, orderBy]);


  const handleEdit = useCallback((review: Review) => {
    setEditingReview(review);
    setModalFormData({ 
        review_id: review.review_id,
        rating: review.rating, 
        comment: review.comment,
        user_id: review.user_id,
        product_id: review.product_id,
        username: review.username,
        product_name: review.product_name,
    }); 
    setIsModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback((reviewId: number) => {
    setDeletingId(reviewId);
    setOpenConfirmDialog(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (deletingId === null) return;
    try {
      await axios.delete(`${API_URL}/${deletingId}`);
      
      showSnackbar('Đánh giá đã được xóa thành công!', 'success');
      setOpenConfirmDialog(false);
      setDeletingId(null);
      fetchReviews(); 
    } catch (error) {
      showSnackbar(`Lỗi khi xóa đánh giá: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  }, [deletingId, fetchReviews, showSnackbar]);

  const handleCloseConfirmDialog = useCallback(() => {
    setOpenConfirmDialog(false);
    setDeletingId(null);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingReview(null);
    setModalFormData({}); 
  }, []);

  const handleModalFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setModalFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleSaveReview = useCallback(async () => {
    if (!editingReview) {
        showSnackbar('Chức năng thêm mới không được hỗ trợ trong giao diện này.', 'error');
        return;
    }
    
    // Đảm bảo rating là số và nằm trong khoảng 1-5
    const rating = modalFormData.rating;
    const comment = modalFormData.comment;
    
    if (rating === undefined || rating < 1 || rating > 5) {
        showSnackbar('Đánh giá phải từ 1 đến 5 sao.', 'error');
        return;
    }

    try {
      // Gọi API PUT để cập nhật
      await axios.put(`${API_URL}/${editingReview.review_id}`, {
          rating: rating,
          comment: comment,
      });

      showSnackbar('Đánh giá đã được cập nhật thành công!', 'success');
      handleCloseModal();
      fetchReviews(); 
      
    } catch (error) {
      showSnackbar(`Lỗi khi lưu đánh giá: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  }, [editingReview, modalFormData, handleCloseModal, fetchReviews, showSnackbar]);

  // --- MEMOIZED DATA FOR TABLE ---
  const filteredAndSortedReviews = useMemo(() => {
    let currentReviews = reviews;

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      currentReviews = currentReviews.filter((review) =>
        review.product_name.toLowerCase().includes(lowerSearchTerm) ||
        review.username.toLowerCase().includes(lowerSearchTerm) ||
        (review.comment && review.comment.toLowerCase().includes(lowerSearchTerm)) ||
        String(review.rating).includes(searchTerm) || 
        String(review.review_id).includes(searchTerm)
      );
    }
     
    // Áp dụng sắp xếp
    // Sử dụng stableSort với getComparator đã được định nghĩa lại
    currentReviews = stableSort(currentReviews, getComparator(order, orderBy));

    const startIndex = page * rowsPerPage;
    return currentReviews.slice(startIndex, startIndex + rowsPerPage);
  }, [reviews, searchTerm, order, orderBy, page, rowsPerPage]);

  const totalFilteredReviews = useMemo(() => {
    let currentReviews = reviews;
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      currentReviews = currentReviews.filter((review) =>
        review.product_name.toLowerCase().includes(lowerSearchTerm) ||
        review.username.toLowerCase().includes(lowerSearchTerm) ||
        (review.comment && review.comment.toLowerCase().includes(lowerSearchTerm)) ||
        String(review.rating).includes(searchTerm) ||
        String(review.review_id).includes(searchTerm)
      );
    }
    return currentReviews.length;
  }, [reviews, searchTerm]);

  // --- RENDER ---
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Đang tải dữ liệu đánh giá...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box 
        sx={{ 
          p: { xs: 2, sm: 3, md: 4 }, 
          backgroundColor: theme.palette.background.default,
          minHeight: '50px',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}
      >
        <Typography color="error" variant="body1">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, backgroundColor: theme.palette.background.default }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, fontWeight: 'bold', color: theme.palette.primary.dark }}>
        Quản lý đánh giá sản phẩm
      </Typography>

      <Paper sx={{ p: 3, borderRadius: theme.shape.borderRadius, boxShadow: theme.shadows[3], mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 2, gap: 2 }}>
          <TextField
            label="Tìm kiếm đánh giá (sản phẩm, khách hàng...)"
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
            sx={{ width: { xs: '100%', sm: '400px' } }}
          />
          {/* Đã xóa nút Thêm đánh giá mới theo yêu cầu */}
        </Box>

        <TableContainer>
          <Table aria-label="review management table">
            <TableHead>
              <TableRow>
                {/* Render Header */}
                {headCells.map((headCell) => (
                  <TableCell
                    key={headCell.id}
                    align={headCell.numeric ? 'right' : 'left'}
                    sortDirection={orderBy === headCell.id ? order : false}
                    sx={{
                      fontWeight: 'bold',
                      backgroundColor: theme.palette.grey[200],
                      cursor: headCell.disableSorting ? 'default' : 'pointer',
                    }}
                  >
                    {!headCell.disableSorting ? (
                      <TableSortLabel
                        active={orderBy === headCell.id}
                        direction={orderBy === headCell.id ? order : 'asc'}
                        onClick={(event) => handleRequestSort(event, headCell.id)}
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
              {filteredAndSortedReviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={headCells.length + 1} align="left" sx={{ py: 3 }}>
                    <Typography variant="subtitle1" color="text.secondary">
                      Không tìm thấy đánh giá nào.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedReviews.map((review) => (
                  <TableRow key={review.review_id} hover>
                    <TableCell align="left">{review.review_id}</TableCell>
                    <TableCell align="left">{review.product_name}</TableCell>
                    <TableCell align="left">{review.username}</TableCell>
                    <TableCell align="left">
                        <Rating name="read-only-rating" value={review.rating} readOnly size="small" />
                        <Typography variant="body2" color="text.secondary">({review.rating}/5)</Typography>
                    </TableCell>
                    <TableCell align="left" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {review.comment}
                    </TableCell>
                    <TableCell align="left">
                        {/* Định dạng ngày tháng */}
                        {review.created_at ? format(new Date(review.created_at), 'dd/MM/yyyy HH:mm') : 'N/A'}
                    </TableCell>
                    <TableCell align="left">
                      <Box sx={{ display: 'flex', justifyContent: 'left', gap: 1 }}>
                        <IconButton
                          aria-label="edit"
                          color="primary"
                          onClick={() => handleEdit(review)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          aria-label="delete"
                          color="error"
                          onClick={() => handleDeleteConfirm(review.review_id)}
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
          rowsPerPageOptions={[10, 20, 50]}
          component="div"
          count={totalFilteredReviews}
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

      {/* Modal Chỉnh sửa Đánh giá */}
      <Dialog open={isModalOpen} onClose={handleCloseModal} fullWidth maxWidth="sm" scroll="paper">
        <DialogTitle>
          Chỉnh sửa Đánh giá
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
            {/* Hiển thị thông tin không thể sửa */}
            <Typography variant="subtitle1">
                <strong>Sản phẩm:</strong> {modalFormData.product_name}
            </Typography>
            <Typography variant="subtitle1">
                <strong>Khách hàng:</strong> {modalFormData.username}
            </Typography>

            {/* Input cho Rating (Sao) */}
            <Box>
                <Typography component="legend">Điểm đánh giá (1-5 sao)</Typography>
                <Rating 
                    name="rating" 
                    value={modalFormData.rating ?? 0} 
                    onChange={(event, newValue) => {
                        setModalFormData(prev => ({ ...prev, rating: newValue ?? 0 }));
                    }}
                    precision={1}
                />
            </Box>

            {/* Input cho Bình luận */}
            <TextField
              label="Bình luận"
              name="comment"
              variant="outlined"
              fullWidth
              multiline
              rows={4}
              value={modalFormData.comment || ''}
              onChange={handleModalFormChange}
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
            onClick={handleSaveReview}
          >
            Lưu thay đổi
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Xác nhận Xóa */}
      <Dialog
        open={openConfirmDialog}
        onClose={handleCloseConfirmDialog}
      >
        <DialogTitle>{"Xác nhận xóa đánh giá?"}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn xóa đánh giá này? Thao tác này không thể hoàn tác.
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

      {/* Snackbar thông báo */}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}