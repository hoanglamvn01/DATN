import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { 
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Button, TextField, InputAdornment, useTheme, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, Stack, Snackbar, Divider, // Thêm Divider
  TableSortLabel, TablePagination, DialogContentText, MenuItem, Select, FormControl, InputLabel,
  Grid // <-- ĐÃ THÊM IMPORT GRID
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MuiAlert, { type AlertProps } from '@mui/material/Alert';
import type { SelectChangeEvent } from '@mui/material/Select'; 

// Custom Alert component for Snackbar
const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

// --- Interfaces (Đảm bảo khớp với backend `getOrderDetails`) ---

// Interface cho một sản phẩm trong chi tiết đơn hàng (từ getOrderDetails)
interface OrderDetailItem {
  order_item_id: string;
  product_id: number;
  product_name: string;
  product_thumbnail: string;
  quantity: number;
  item_price: number;
}

// Interface cho chi tiết đơn hàng đầy đủ (từ getOrderDetails)
interface FullOrderDetails {
  order_id: string;
  user_id: number;
  username: string;
  address_id: string;
  total_amount: number;
  shipping_fee: number;
  discount_amount: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  coupon_code: string | null;
  order_code: string;
  recipient_name: string;
  recipient_phone: string;
  shipping_address_line: string;
  created_at: string;
  updated_at: string;
  items: OrderDetailItem[]; // <-- Mảng các sản phẩm
}

// Interface cho dữ liệu đơn hàng trong bảng (từ getAllOrders)
interface OrderData {
  order_id: string;
  user_id: number;
  username: string; 
  order_code: string;
  recipient_name: string;
  recipient_phone: string;
  shipping_address_line: string;
  total_amount: number;
  shipping_fee: number;
  discount_amount: number;
  payment_method: 'cod' | 'momo';
  payment_status: 'pending' | 'pending_momo' | 'success' | 'failed';
  order_status: 'pending' | 'confirmed' | 'shipping' | 'completed' | 'cancelled';
  coupon_code: string | null;
  created_at: string; 
  updated_at: string; 
  // note: string | null;
}

// Cập nhật lại HeadCellId để khớp với OrderData
type HeadCellId = keyof OrderData;

interface HeadCell {
  id: HeadCellId;
  label: string;
  numeric: boolean;
  disableSorting?: boolean;
}

const headCells: HeadCell[] = [
  { id: 'order_code', numeric: false, label: 'Mã Đơn Hàng' },
  { id: 'recipient_name', numeric: false, label: 'Người nhận', disableSorting: true },
  { id: 'recipient_phone', numeric: false, label: 'SĐT', disableSorting: true },
  { id: 'total_amount', numeric: true, label: 'Tổng tiền' },
  { id: 'payment_status', numeric: false, label: 'Thanh toán' },
  { id: 'order_status', numeric: false, label: 'Trạng thái' },
  { id: 'created_at', numeric: false, label: 'Ngày đặt hàng' },
  { id: 'shipping_address_line', numeric: false, label: 'Địa chỉ giao hàng', disableSorting: true },
];

// --- UTILITY FUNCTIONS FOR SORTING ---
type SortOrder = 'asc' | 'desc';

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator<Key extends keyof OrderData>(
  order: SortOrder,
  orderBy: Key,
): (a: OrderData, b: OrderData) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

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

// --- ORDER MANAGER COMPONENT ---
export default function OrderManager() {
  const theme = useTheme();

  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10); 
  const [order, setOrder] = useState<SortOrder>('desc');
  const [orderBy, setOrderBy] = useState<HeadCellId>('created_at'); 

  const [searchTerm, setSearchTerm] = useState<string>('');

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingOrder, setEditingOrder] = useState<OrderData | null>(null);
  const [modalFormData, setModalFormData] = useState<Partial<OrderData>>({});

  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [viewingOrderDetails, setViewingOrderDetails] = useState<FullOrderDetails | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const API_URL = 'http://localhost:3000/api/orders';

  // --- HANDLERS (Di chuyển lên trên để showSnackbar có thể được truy cập sớm) ---
  const showSnackbar = useCallback((message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  const handleSnackbarClose = useCallback((_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  }, []);

  // --- API CALLS --- (Có thể gọi showSnackbar bây giờ)
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(API_URL);
      setOrders(response.data);
    } catch (err) {
      setError('Không thể tải dữ liệu đơn hàng. Vui lòng thử lại.');
      console.error('Fetch orders error:', err);
      showSnackbar(`Lỗi khi tải đơn hàng: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]); // showSnackbar là dependency

  const fetchOrderDetails = useCallback(async (orderId: string) => {
    setLoadingDetail(true);
    setDetailError(null);
    try {
      const response = await axios.get(`${API_URL}/${orderId}`);
      setViewingOrderDetails(response.data);
      setIsDetailModalOpen(true);
    } catch (err) {
      setDetailError('Không thể tải chi tiết đơn hàng. Vui lòng thử lại.');
      console.error('Fetch order details error:', err);
      showSnackbar(`Lỗi khi tải chi tiết đơn hàng: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      setLoadingDetail(false);
    }
  }, [showSnackbar]);


  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);


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

  const handleRequestSort = useCallback((event: React.MouseEvent<unknown>, property: HeadCellId) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  }, [order, orderBy]);

  const handleEdit = useCallback((orderData: OrderData) => {
    setEditingOrder(orderData);
    setModalFormData({
      order_status: orderData.order_status,
      payment_status: orderData.payment_status,
      // note: orderData.note, // Nếu bạn dùng trường note
    });
    setIsModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback((orderId: string) => {
    setDeletingId(orderId);
    setOpenConfirmDialog(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (deletingId === null) return;
    try {
      await axios.delete(`${API_URL}/${deletingId}`);
      showSnackbar('Đơn hàng đã được xóa thành công!', 'success');
      setOpenConfirmDialog(false);
      setDeletingId(null);
      fetchOrders(); 
    } catch (error) {
      showSnackbar(`Lỗi khi xóa đơn hàng: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  }, [deletingId, fetchOrders, showSnackbar]);

  const handleCloseConfirmDialog = useCallback(() => {
    setOpenConfirmDialog(false);
    setDeletingId(null);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingOrder(null);
    setModalFormData({}); 
  }, []);

  const handleCloseDetailModal = useCallback(() => {
    setIsDetailModalOpen(false);
    setViewingOrderDetails(null);
  }, []);


  const handleModalFormChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    const { name, value } = event.target;
    
    setModalFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleSaveOrder = useCallback(async () => {
    if (!editingOrder) return; 
    
    try {
      await axios.put(`${API_URL}/${editingOrder.order_id}`, {
        order_status: modalFormData.order_status,
        payment_status: modalFormData.payment_status,
        // note: modalFormData.note, // Nếu bạn dùng trường note
      });

      showSnackbar('Đơn hàng đã được cập nhật thành công!', 'success');
      handleCloseModal();
      fetchOrders(); 
    } catch (error) {
      showSnackbar(`Lỗi khi lưu đơn hàng: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  }, [editingOrder, modalFormData, handleCloseModal, fetchOrders, showSnackbar]);

  // --- MEMOIZED DATA FOR TABLE ---
  const filteredAndSortedOrders = useMemo(() => {
    let currentOrders = orders;

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      currentOrders = currentOrders.filter((order) =>
        String(order.order_code).includes(searchTerm) ||
        order.username.toLowerCase().includes(lowerSearchTerm) ||
        order.recipient_name.toLowerCase().includes(lowerSearchTerm) ||
        order.recipient_phone.toLowerCase().includes(lowerSearchTerm) ||
        order.shipping_address_line.toLowerCase().includes(lowerSearchTerm) ||
        order.order_status.toLowerCase().includes(lowerSearchTerm) ||
        order.payment_status.toLowerCase().includes(lowerSearchTerm)
      );
    }
     
    currentOrders = stableSort(currentOrders, getComparator(order, orderBy));

    const startIndex = page * rowsPerPage;
    return currentOrders.slice(startIndex, startIndex + rowsPerPage);
  }, [orders, searchTerm, order, orderBy, page, rowsPerPage]);

  const totalFilteredOrders = useMemo(() => {
    let currentOrders = orders;
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      currentOrders = currentOrders.filter((order) =>
        String(order.order_code).includes(searchTerm) ||
        order.username.toLowerCase().includes(lowerSearchTerm) ||
        order.recipient_name.toLowerCase().includes(lowerSearchTerm) ||
        order.recipient_phone.toLowerCase().includes(lowerSearchTerm) ||
        order.shipping_address_line.toLowerCase().includes(lowerSearchTerm) ||
        order.order_status.toLowerCase().includes(lowerSearchTerm) ||
        order.payment_status.toLowerCase().includes(lowerSearchTerm)
      );
    }
    return currentOrders.length;
  }, [orders, searchTerm]);

  // --- RENDER ---
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Đang tải dữ liệu đơn hàng...</Typography>
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
        Quản lý đơn hàng
      </Typography>

      <Paper sx={{ p: 3, borderRadius: theme.shape.borderRadius, boxShadow: theme.shadows[3], mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 2, gap: 2 }}>
          <TextField
            label="Tìm kiếm đơn hàng..."
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
        </Box>

        <TableContainer>
          <Table aria-label="order management table">
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
              {filteredAndSortedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={headCells.length + 1} align="left" sx={{ py: 3 }}>
                    <Typography variant="subtitle1" color="text.secondary">
                      Không tìm thấy đơn hàng nào.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedOrders.map((orderData) => (
                  <TableRow key={orderData.order_id} hover>
                    <TableCell align="left">{orderData.order_code}</TableCell>
                    <TableCell align="left">{orderData.recipient_name}</TableCell>
                    <TableCell align="left">{orderData.recipient_phone}</TableCell>
                    <TableCell align="right">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(orderData.total_amount)}
                    </TableCell>

                    <TableCell align="left">
                        {orderData.payment_status === 'pending' ? 'Chưa thanh toán' : 
                         orderData.payment_status === 'pending_momo' ? 'Đang chờ MoMo' : 
                         orderData.payment_status === 'success' ? 'Đã thanh toán' : 
                         'Thất bại'}
                    </TableCell>
                    <TableCell align="left">
                        {orderData.order_status === 'pending' ? 'Chờ xác nhận' :
                         orderData.order_status === 'confirmed' ? 'Đã xác nhận' :
                         orderData.order_status === 'shipping' ? 'Đang giao' :
                         orderData.order_status === 'completed' ? 'Hoàn thành' :
                         'Đã hủy'}
                    </TableCell>
                    <TableCell align="left">{format(new Date(orderData.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                    <TableCell align="left" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {orderData.shipping_address_line}
                    </TableCell>
                    <TableCell align="left">
                      <Box sx={{ display: 'flex', justifyContent: 'left', gap: 1 }}>
                        <IconButton
                          aria-label="view-details"
                          color="info"
                          onClick={() => fetchOrderDetails(orderData.order_id)} // <-- Mở modal chi tiết
                        >
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton
                          aria-label="edit"
                          color="primary"
                          onClick={() => handleEdit(orderData)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          aria-label="delete"
                          color="error"
                          onClick={() => handleDeleteConfirm(orderData.order_id)}
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
          count={totalFilteredOrders}
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

      {/* Modal Chỉnh sửa Đơn hàng */}
      <Dialog open={isModalOpen} onClose={handleCloseModal} fullWidth maxWidth="sm" scroll="paper">
        <DialogTitle>
          Chỉnh sửa Đơn hàng #{editingOrder?.order_code}
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
            {editingOrder && (
              <>
                <Typography variant="subtitle1">
                  <strong>Khách hàng:</strong> {editingOrder.username}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>Người nhận:</strong> {editingOrder.recipient_name}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>SĐT Người nhận:</strong> {editingOrder.recipient_phone}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>Địa chỉ:</strong> {editingOrder.shipping_address_line}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>Tổng tiền:</strong> {editingOrder.total_amount.toLocaleString('vi-VN')} đ
                </Typography>
                <Typography variant="subtitle1">
                  <strong>Phí vận chuyển:</strong> {editingOrder.shipping_fee.toLocaleString('vi-VN')} đ
                </Typography>
                {editingOrder.discount_amount > 0 && (
                  <Typography variant="subtitle1">
                    <strong>Giảm giá:</strong> {editingOrder.discount_amount.toLocaleString('vi-VN')} đ
                  </Typography>
                )}
                <Typography variant="subtitle1">
                  <strong>Phương thức TT:</strong> {editingOrder.payment_method === 'cod' ? 'Thanh toán khi nhận hàng' : 'Ví MoMo'}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>Mã Coupon:</strong> {editingOrder.coupon_code || 'Không có'}
                </Typography>
                
                <FormControl fullWidth>
                  <InputLabel id="order-status-label">Trạng thái đơn hàng</InputLabel>
                  <Select
                    labelId="order-status-label"
                    name="order_status"
                    label="Trạng thái đơn hàng"
                    value={modalFormData.order_status || editingOrder.order_status}
                    onChange={handleModalFormChange}
                  >
                    <MenuItem value="pending">Chờ xác nhận</MenuItem>
                    <MenuItem value="confirmed">Đã xác nhận</MenuItem>
                    <MenuItem value="shipping">Đang giao</MenuItem>
                    <MenuItem value="completed">Hoàn thành</MenuItem>
                    <MenuItem value="cancelled">Đã hủy</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel id="payment-status-label">Trạng thái thanh toán</InputLabel>
                  <Select
                    labelId="payment-status-label"
                    name="payment_status"
                    label="Trạng thái thanh toán"
                    value={modalFormData.payment_status || editingOrder.payment_status}
                    onChange={handleModalFormChange}
                  >
                    <MenuItem value="pending">Chưa thanh toán</MenuItem>
                    <MenuItem value="success">Đã thanh toán</MenuItem>
                  </Select>
                </FormControl>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="secondary">
            Hủy
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveOrder}
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
        <DialogTitle id="alert-dialog-title">{"Xác nhận xóa đơn hàng?"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Bạn có chắc chắn muốn xóa đơn hàng này? Thao tác này không thể hoàn tác.
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

      {/* Modal Chi tiết Đơn hàng (Hiển thị sản phẩm đã đặt) */}
      <Dialog open={isDetailModalOpen} onClose={handleCloseDetailModal} fullWidth maxWidth="md" scroll="paper">
        <DialogTitle>
          Chi tiết Đơn hàng #{viewingOrderDetails?.order_code}
          <IconButton
            aria-label="close"
            onClick={handleCloseDetailModal}
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
          {loadingDetail ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : detailError ? (
            <Typography color="error" align="center" py={4}>{detailError}</Typography>
          ) : viewingOrderDetails ? (
            <Stack spacing={2}>
              <Typography variant="h6" gutterBottom>Thông tin chung</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography><strong>Mã ĐH:</strong> {viewingOrderDetails.order_code}</Typography>
                  <Typography><strong>Khách hàng:</strong> {viewingOrderDetails.username}</Typography>
                  <Typography><strong>Ngày đặt:</strong> {format(new Date(viewingOrderDetails.created_at), 'dd/MM/yyyy HH:mm')}</Typography>
                  <Typography><strong>Trạng thái ĐH:</strong> {viewingOrderDetails.order_status}</Typography>
                  <Typography><strong>Trạng thái TT:</strong> {viewingOrderDetails.payment_status}</Typography>
                  <Typography><strong>Phương thức TT:</strong> {viewingOrderDetails.payment_method}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography><strong>Người nhận:</strong> {viewingOrderDetails.recipient_name}</Typography>
                  <Typography><strong>SĐT:</strong> {viewingOrderDetails.recipient_phone}</Typography>
                  <Typography><strong>Địa chỉ:</strong> {viewingOrderDetails.shipping_address_line}</Typography>
                  <Typography><strong>Mã Coupon:</strong> {viewingOrderDetails.coupon_code || 'Không có'}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>Sản phẩm trong đơn hàng</Typography>
              {viewingOrderDetails.items && viewingOrderDetails.items.length > 0 ? (
                viewingOrderDetails.items.map((item) => (
                  <Box key={item.order_item_id} sx={{ display: 'flex', alignItems: 'center', mb: 1, p: 1, border: '1px solid #eee', borderRadius: 1 }}>
                    <img 
                      src={`http://localhost:3000/uploads/${item.product_thumbnail}`} 
                      alt={item.product_name} 
                      style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4, marginRight: 8 }} // Đã sửa mr -> marginRight
                    />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body1" fontWeight="bold">{item.product_name}</Typography>
                      <Typography variant="body2" color="text.secondary">Số lượng: {item.quantity}</Typography>
                      <Typography variant="body2" color="text.secondary">Đơn giá: {item.item_price.toLocaleString('vi-VN')} đ</Typography>
                    </Box>
                    <Typography variant="body1" fontWeight="bold" sx={{ ml: 2 }}>
                      {(item.item_price * item.quantity).toLocaleString('vi-VN')} đ
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography>Không có sản phẩm nào trong đơn hàng này.</Typography>
              )}

              <Divider sx={{ my: 2 }} />

              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Tạm tính:</Typography>
                    <Typography>
                        {viewingOrderDetails.items.reduce((sum, item) => sum + (item.item_price * item.quantity), 0).toLocaleString('vi-VN')} đ
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Phí vận chuyển:</Typography>
                      <Typography>
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                          viewingOrderDetails.shipping_fee
                        )}
                      </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Giảm giá:</Typography>
                    <Typography>
                        - {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                          viewingOrderDetails.discount_amount
                        )}
                      </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="h6" fontWeight="bold">Tổng cộng:</Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                        viewingOrderDetails.total_amount
                      )}
                    </Typography>
                </Box>
              </Box>

            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailModal} color="primary" variant="contained">
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}