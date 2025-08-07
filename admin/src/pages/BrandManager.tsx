//Thư
import React, { useState, useEffect, useMemo, useCallback } from 'react';

import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Button, TextField, InputAdornment, useTheme, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, Stack, Snackbar,
  TableSortLabel, TablePagination, DialogContentText
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
interface Brand {
  brand_id: number;
  brand_name: string;
  logo: string; // Tên file logo, sẽ được sử dụng để hiển thị ảnh từ server
  description: string;
  slug: string;
}

type Order = 'asc' | 'desc';
type HeadCellId = keyof Brand;

interface HeadCell {
  id: HeadCellId;
  label: string;
  numeric: boolean;
  disableSorting?: boolean;
}

const headCells: HeadCell[] = [
  { id: 'brand_id', numeric: false, label: 'ID' },
  { id: 'brand_name', numeric: false, label: 'Tên Thương hiệu' },
  { id: 'slug', numeric: false, label: 'Slug' },
  { id: 'logo', numeric: false, label: 'Logo', disableSorting: true }, // Logo không cần sắp xếp
  { id: 'description', numeric: false, label: 'Mô tả', disableSorting: true }, // Mô tả không cần sắp xếp
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

function getComparator<Key extends keyof Brand>(
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

// --- BRAND MANAGER COMPONENT ---
export default function BrandManagerr() {
  const theme = useTheme();

  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State cho phân trang
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(20);

  // State cho sắp xếp
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<HeadCellId>('brand_id');

  // State cho tìm kiếm
  const [searchTerm, setSearchTerm] = useState<string>('');

  // State cho Modal Add/Edit
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null); // Null khi thêm mới, Brand object khi chỉnh sửa
  const [modalFormData, setModalFormData] = useState<Partial<Brand>>({}); // Dữ liệu form trong modal
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(''); // URL để hiển thị ảnh preview

  // State cho Dialog xác nhận xóa
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // State cho Snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const API_BASE_URL = 'http://localhost:3000/api/brands';
  const UPLOADS_BASE_URL = 'http://localhost:3000/uploads/';

  // --- API CALL ---
  const fetchBrands = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setBrands(data);
    } catch (err) {
      setError('Không thể tải dữ liệu thương hiệu. Vui lòng thử lại.');
      console.error('Fetch brands error:', err);
      showSnackbar(`Lỗi khi tải thương hiệu: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

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

  const handleRequestSort = useCallback((_event: React.MouseEvent<unknown>, property: HeadCellId) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  }, [order, orderBy]);

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  }, []);

  const handleAddNewBrand = useCallback(() => {
    setEditingBrand(null); // Báo hiệu là thêm mới
    setModalFormData({ brand_name: '', description: '' }); // Giá trị mặc định
    setLogoFile(null);
    setLogoPreview('');
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback((brand: Brand) => {
    setEditingBrand(brand);
    setModalFormData({
      brand_name: brand.brand_name,
      slug: brand.slug, // ✅ LOAD SLUG VÀO FORM
      description: brand.description,
    });
    setLogoPreview(brand.logo ? UPLOADS_BASE_URL + brand.logo : '');
    setLogoFile(null);
    setIsModalOpen(true);
  }, [UPLOADS_BASE_URL]);

  const handleDeleteConfirm = useCallback((brandId: number) => {
    setDeletingId(brandId);
    setOpenConfirmDialog(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (deletingId === null) return;
    try {
      const response = await fetch(`${API_BASE_URL}/delete/${deletingId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      showSnackbar('Thương hiệu đã được xóa thành công!', 'success');
      setOpenConfirmDialog(false);
      setDeletingId(null);
      fetchBrands(); // Tải lại danh sách sau khi xóa
    } catch (error) {
      showSnackbar(`Lỗi khi xóa thương hiệu: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  }, [deletingId, fetchBrands, showSnackbar]);

  const handleCloseConfirmDialog = useCallback(() => {
    setOpenConfirmDialog(false);
    setDeletingId(null);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingBrand(null);
    setModalFormData({}); // Reset form data
    setLogoFile(null);
    setLogoPreview('');
  }, []);

  const handleModalFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setModalFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    } else {
      setLogoFile(null);
      // Nếu không có file được chọn lại và đang chỉnh sửa, giữ nguyên preview của logo cũ
      if (!editingBrand) { // Nếu thêm mới và hủy chọn file
        setLogoPreview('');
      }
    }
  }, [editingBrand]);


  const handleSaveBrand = useCallback(async () => {
    // Validate form data here if needed
    if (!modalFormData.brand_name) {
      showSnackbar('Vui lòng điền tên thương hiệu.', 'error');
      return;
    }

    try {
      const form = new FormData();
      form.append('brand_name', modalFormData.brand_name || '');
      form.append('slug', modalFormData.slug || '');
      form.append('description', modalFormData.description || '');
      if (logoFile) {
        form.append('logo', logoFile);
      } else if (editingBrand && !logoPreview && editingBrand.logo) {
        // Trường hợp người dùng xóa logo hiện có (nếu có cách nào đó trong UI để làm điều này)
        // Hoặc nếu không chọn file mới và không có logo cũ, bạn có thể gửi một tín hiệu để xóa logo
        // Hiện tại, nếu logoFile là null và logoPreview cũng null, nó sẽ không gửi trường 'logo'
        // Điều này có nghĩa là logo hiện tại (nếu có) sẽ không bị thay đổi.
        // Để xóa logo, bạn cần một logic riêng hoặc một giá trị đặc biệt cho 'logo'.
      }

      const method = editingBrand ? 'PUT' : 'POST';
      const url = editingBrand ? `${API_BASE_URL}/update/${editingBrand.brand_id}` : `${API_BASE_URL}/add`;

      const response = await fetch(url, {
        method,
        body: form,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      showSnackbar(`Thương hiệu đã được ${editingBrand ? 'cập nhật' : 'thêm mới'} thành công!`, 'success');
      handleCloseModal();
      fetchBrands(); // Tải lại danh sách sau khi lưu
    } catch (error) {
      showSnackbar(`Lỗi khi lưu thương hiệu: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  }, [editingBrand, modalFormData, logoFile, logoPreview, handleCloseModal, fetchBrands, showSnackbar]);

  // --- MEMOIZED DATA FOR TABLE ---
  const filteredAndSortedBrands = useMemo(() => {
    let currentBrands = brands;

    if (searchTerm) {
      currentBrands = currentBrands.filter((brand) =>
        brand.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        brand.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        brand.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(brand.brand_id).includes(searchTerm) // Tìm kiếm theo ID số
      );
    }

    currentBrands = stableSort(currentBrands, getComparator(order, orderBy));

    const startIndex = page * rowsPerPage;
    return currentBrands.slice(startIndex, startIndex + rowsPerPage);
  }, [brands, searchTerm, order, orderBy, page, rowsPerPage]);

  const totalFilteredBrands = useMemo(() => {
    let currentBrands = brands;
    if (searchTerm) {
      currentBrands = currentBrands.filter((brand) =>
        brand.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        brand.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        brand.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(brand.brand_id).includes(searchTerm)
      );
    }
    return currentBrands.length;
  }, [brands, searchTerm]);

  // --- RENDER ---
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Đang tải dữ liệu thương hiệu...</Typography>
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
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Typography color="error" variant="body1" sx={{ textAlign: 'center' }}>{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, backgroundColor: theme.palette.background.default }}>
 <Typography
  variant="h4"
  component="h1"
  gutterBottom
  sx={{
    mb: 4,
    fontWeight: 'bold',
    color: 'rgb(17, 82, 147)' // ✅ màu chị chọn
  }}
>
  Quản lý thương hiệu
</Typography>

      <Paper sx={{ p: 3, borderRadius: theme.shape.borderRadius, boxShadow: theme.shadows[3], mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 2, gap: 2 }}>
          <TextField
            label="Tìm kiếm thương hiệu..."
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
            onClick={handleAddNewBrand}
            sx={{ flexShrink: 0 }}
          >
            Thêm Thương hiệu Mới
          </Button>
        </Box>

        <TableContainer>
          <Table aria-label="brand management table">
            <TableHead>
              <TableRow>
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
                <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: theme.palette.grey[200] }}>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAndSortedBrands.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={headCells.length + 1} align="center" sx={{ py: 3 }}>
                    <Typography variant="subtitle1" color="text.secondary">
                      Không tìm thấy thương hiệu nào.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedBrands.map((brand) => (
                  <TableRow key={brand.brand_id} hover>
                    <TableCell>{brand.brand_id}</TableCell>
                    <TableCell>{brand.brand_name}</TableCell>
                    <TableCell>{brand.slug}</TableCell>
                    <TableCell>
                      {/* Đã chỉnh sửa Box để cố định kích thước cho Logo trong bảng */}
                      <Box
                        sx={{
                          width: 80,
                          height: 80,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          borderRadius: '100px',
                          border: `1px solid ${theme.palette.divider}`,
                        }}
                      >
                        {brand.logo ? (
                          <img
                            src={`${UPLOADS_BASE_URL}${brand.logo}`}
                            alt={brand.brand_name}
                            // img bên trong sẽ co giãn để vừa với container mà không làm thay đổi kích thước container
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                            onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/60?text=Error' }}
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', p: 0.5 }}>
                            No Logo
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{brand.description}</TableCell>
                    <TableCell align="right" sx={{ width: '120px', minWidth: '120px' }}> {/* ✅ Đặt width cho cell hành động */}
                      <IconButton
                        aria-label="edit"
                        color="primary"
                        onClick={() => handleEdit(brand)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        aria-label="delete"
                        color="error"
                        onClick={() => handleDeleteConfirm(brand.brand_id)}
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
          count={totalFilteredBrands}
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

      {/* Modal Thêm/Chỉnh sửa Brand */}
      <Dialog open={isModalOpen} onClose={handleCloseModal} fullWidth maxWidth="sm" scroll="paper">
        <DialogTitle>
          {editingBrand ? 'Chỉnh sửa Thương hiệu' : 'Thêm Thương hiệu Mới'}
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
              label="Tên Thương hiệu"
              name="brand_name"
              variant="outlined"
              fullWidth
              value={modalFormData.brand_name || ''}
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
            <Box>
              <Typography variant="subtitle1" gutterBottom>Logo Thương hiệu</Typography>
              {/* Đã chỉnh sửa Box để cố định kích thước cho ảnh preview Logo */}
              <Box sx={{ mt: 1, mb: 2, width: 100, height: 100, border: `1px solid ${theme.palette.divider}`, borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {logoPreview ? (
                  <img src={logoPreview} alt="Xem trước Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                ) : (
                  <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>Chọn logo</Typography>
                )}
              </Box>
              <Button variant="contained" component="label">
                {logoPreview ? 'Đổi ảnh' : 'Chọn ảnh logo'}
                <input hidden accept="image/*" type="file" onChange={handleLogoUpload} />
              </Button>
              {logoPreview && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => { setLogoPreview(''); setLogoFile(null); }}
                  sx={{ ml: 1 }}
                >
                  Xóa ảnh
                </Button>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="secondary">
            Hủy
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveBrand}
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
        <DialogTitle id="alert-dialog-title">{"Xác nhận xóa thương hiệu?"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Bạn có chắc chắn muốn xóa thương hiệu này? Thao tác này không thể hoàn tác.
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