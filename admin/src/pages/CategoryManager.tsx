//Thư
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Button, TextField, InputAdornment, useTheme, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, Stack, Snackbar,
  TableSortLabel, TablePagination, DialogContentText, // Thêm DialogContentText từ @mui/material
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import MuiAlert, { type AlertProps } from '@mui/material/Alert';

// Custom Alert component for Snackbar
const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

// --- INTERFACES ---
interface Category {
  category_id: number;
  category_name: string;
  slug: string;
  description: string;
}

type Order = 'asc' | 'desc';
type HeadCellId = keyof Category; // Đã đổi Brand thành Category

interface HeadCell {
  id: HeadCellId;
  label: string;
  numeric: boolean;
  disableSorting?: boolean;
}

const headCells: HeadCell[] = [
  { id: 'category_id', numeric: false, label: 'ID' }, // numeric: false để căn trái theo yêu cầu
  { id: 'category_name', numeric: false, label: 'Tên Danh mục' },
  { id: 'slug', numeric: false, label: 'Slug' },
  { id: 'description', numeric: false, label: 'Mô tả', disableSorting: true },
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

function getComparator<Key extends keyof Category>( // Đã đổi Brand thành Category
  order: Order,
  orderBy: Key,
): (a: { [key in Key]: number | string }, b: { [key in Key]: number | string }) => number {
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

// --- CATEGORY MANAGER COMPONENT ---
export default function CategoryManager() { // Đã đổi tên hàm export
  const theme = useTheme();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State cho phân trang
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10); 

  // State cho sắp xếp
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<HeadCellId>('category_id');

  // State cho tìm kiếm
  const [searchTerm, setSearchTerm] = useState<string>('');

  // State cho Modal Add/Edit
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null); // Null khi thêm mới, Category object khi chỉnh sửa
  const [modalFormData, setModalFormData] = useState<Partial<Category>>({}); // Dữ liệu form trong modal

  // State cho Dialog xác nhận xóa
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // State cho Snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const API_BASE_URL = 'http://localhost:3000/api/categories'; // Đã cập nhật API endpoint

  // --- API CALLS ---
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      setError('Không thể tải dữ liệu danh mục. Vui lòng thử lại.');
      console.error('Fetch categories error:', err);
      showSnackbar(`Lỗi khi tải danh mục: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      setLoading(false);
    }
  }, []); // Dependency array: rỗng để chỉ fetch 1 lần khi component mount

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // --- HANDLERS ---

  const showSnackbar = useCallback((message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

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

  const handleAddNewCategory = useCallback(() => { // Đổi tên handler
    setEditingCategory(null); // Báo hiệu là thêm mới
    setModalFormData({ category_name: '', slug: '', description: '' }); // Giá trị mặc định
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback((category: Category) => { // Đổi tên handler
    setEditingCategory(category); // Đặt đối tượng category để chỉnh sửa
    setModalFormData(category); // Load dữ liệu category vào form
    setIsModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback((categoryId: number) => { // Đổi tên handler
    setDeletingId(categoryId);
    setOpenConfirmDialog(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (deletingId === null) return;
    try {
      const response = await fetch(`${API_BASE_URL}/delete/${deletingId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      showSnackbar('Danh mục đã được xóa thành công!', 'success');
      setOpenConfirmDialog(false);
      setDeletingId(null);
      fetchCategories(); // Tải lại danh sách sau khi xóa
    } catch (error) {
      showSnackbar(`Lỗi khi xóa danh mục: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  }, [deletingId, fetchCategories, showSnackbar]);

  const handleCloseConfirmDialog = useCallback(() => {
    setOpenConfirmDialog(false);
    setDeletingId(null);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setModalFormData({}); // Reset form data
  }, []);

  const handleModalFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setModalFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);


  const handleSaveCategory = useCallback(async () => { // Đổi tên handler
    // Validate form data here if needed
    if (!modalFormData.category_name || !modalFormData.slug) {
      showSnackbar('Vui lòng điền đầy đủ Tên Danh mục và Slug.', 'error');
      return;
    }

    try {
      const method = editingCategory ? 'PUT' : 'POST';
      const url = editingCategory ? `${API_BASE_URL}/update/${editingCategory.category_id}` : `${API_BASE_URL}/add`;

      const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(modalFormData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      showSnackbar(`Danh mục đã được ${editingCategory ? 'cập nhật' : 'thêm mới'} thành công!`, 'success');
      handleCloseModal();
      fetchCategories(); // Tải lại danh sách sau khi lưu
    } catch (error) {
      showSnackbar(`Lỗi khi lưu danh mục: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  }, [editingCategory, modalFormData, handleCloseModal, fetchCategories, showSnackbar]);

  // --- MEMOIZED DATA FOR TABLE ---
  const filteredAndSortedCategories = useMemo(() => { // Đổi tên biến
    let currentCategories = categories;

    if (searchTerm) {
      currentCategories = currentCategories.filter((category) =>
        category.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(category.category_id).includes(searchTerm) // Tìm kiếm theo ID số
      );
    }
     
    currentCategories = stableSort(currentCategories, getComparator(order, orderBy));

    const startIndex = page * rowsPerPage;
    return currentCategories.slice(startIndex, startIndex + rowsPerPage);
  }, [categories, searchTerm, order, orderBy, page, rowsPerPage]);

  const totalFilteredCategories = useMemo(() => { // Đổi tên biến
    let currentCategories = categories;
    if (searchTerm) {
      currentCategories = currentCategories.filter((category) =>
        category.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(category.category_id).includes(searchTerm)
      );
    }
    return currentCategories.length;
  }, [categories, searchTerm]);

  // --- RENDER ---
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'left', alignItems: 'left', height: '80vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Đang tải dữ liệu danh mục...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box 
        sx={{ 
          p: { xs: 2, sm: 3, md: 4 }, 
          backgroundColor: theme.palette.background.default,
          minHeight: '50px', // Đặt minHeight để vùng lỗi luôn chiếm không gian
          display: 'flex', 
          alignItems: 'left', 
          justifyContent: 'left' 
        }}
      >
        <Typography color="error" variant="body1" sx={{ textAlign: 'left' }}>{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, backgroundColor: theme.palette.background.default }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, fontWeight: 'bold', color: theme.palette.primary.dark }}>
        Quản lý danh mục
      </Typography>

      <Paper sx={{ p: 3, borderRadius: theme.shape.borderRadius, boxShadow: theme.shadows[3], mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'left' }, mb: 2, gap: 2 }}>
          <TextField
            label="Tìm kiếm danh mục..."
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
            onClick={handleAddNewCategory} // Đổi tên handler
            sx={{ flexShrink: 0 }}
          >
            Thêm Danh mục Mới
          </Button>
        </Box>

        <TableContainer>
          <Table aria-label="category management table">
            <TableHead>
              <TableRow>
                <TableCell align="left" sx={{ fontWeight: 'bold', backgroundColor: theme.palette.grey[200] }}>
                  <TableSortLabel
                    active={orderBy === 'category_id'}
                    direction={orderBy === 'category_id' ? order : 'asc'}
                    onClick={() => {
                      const isAsc = orderBy === 'category_id' && order === 'asc';
                      setOrder(isAsc ? 'desc' : 'asc');
                      setOrderBy('category_id');
                    }}
                  >
                    ID
                  </TableSortLabel>
                </TableCell>
                <TableCell align="left" sx={{ fontWeight: 'bold', backgroundColor: theme.palette.grey[200] }}>
                  <TableSortLabel
                    active={orderBy === 'category_name'}
                    direction={orderBy === 'category_name' ? order : 'asc'}
                    onClick={() => {
                      const isAsc = orderBy === 'category_name' && order === 'asc';
                      setOrder(isAsc ? 'desc' : 'asc');
                      setOrderBy('category_name');
                    }}
                  >
                    Danh mục
                  </TableSortLabel>
                </TableCell>
                <TableCell align="left" sx={{ fontWeight: 'bold', backgroundColor: theme.palette.grey[200] }}>
                  <TableSortLabel
                    active={orderBy === 'slug'}
                    direction={orderBy === 'slug' ? order : 'asc'}
                    onClick={() => {
                      const isAsc = orderBy === 'slug' && order === 'asc';
                      setOrder(isAsc ? 'desc' : 'asc');
                      setOrderBy('slug');
                    }}
                  >
                    Slug
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: theme.palette.grey[200] }}>
                  Mô tả
                </TableCell>
                <TableCell align="left" sx={{ fontWeight: 'bold', backgroundColor: theme.palette.grey[200] }}>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAndSortedCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="left" sx={{ py: 3 }}>
                    <Typography variant="subtitle1" color="text.secondary">
                      Không tìm thấy danh mục nào.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedCategories.map((category) => (
                  <TableRow key={category.category_id} hover>
                    <TableCell align="left">{category.category_id}</TableCell>
                    <TableCell align="left">{category.category_name}</TableCell>
                    <TableCell align="left">{category.slug}</TableCell>
                    <TableCell align="left">{category.description}</TableCell>
                    <TableCell align="left">
                      <Box sx={{ display: 'flex', justifyContent: 'left', gap: 1 }}>
                        <IconButton
                          aria-label="edit"
                          color="primary"
                          onClick={() => handleEdit(category)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          aria-label="delete"
                          color="error"
                          onClick={() => handleDeleteConfirm(category.category_id)}
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
          rowsPerPageOptions={[10, 20, 50]} // Lựa chọn 10, 20, 50 hàng
          component="div"
          count={totalFilteredCategories}
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

      {/* Modal Thêm/Chỉnh sửa Category */}
      <Dialog open={isModalOpen} onClose={handleCloseModal} fullWidth maxWidth="sm" scroll="paper">
        <DialogTitle>
          {editingCategory ? 'Chỉnh sửa Danh mục' : 'Thêm Danh mục Mới'}
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
              label="Danh mục"
              name="category_name"
              variant="outlined"
              fullWidth
              value={modalFormData.category_name || ''}
              onChange={handleModalFormChange}
              required
            />
            <TextField
              label="Slug"
              name="slug"
              variant="outlined"
              fullWidth
              value={modalFormData.slug || ''}
              onChange={handleModalFormChange}
              required
            />
            <TextField
              label="Mô tả"
              name="description"
              variant="outlined"
              fullWidth
              multiline
              rows={3}
              value={modalFormData.description || ''}
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
            onClick={handleSaveCategory} // Đổi tên handler
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
        <DialogTitle id="alert-dialog-title">{"Xác nhận xóa danh mục?"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Bạn có chắc chắn muốn xóa danh mục này? Thao tác này không thể hoàn tác.
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