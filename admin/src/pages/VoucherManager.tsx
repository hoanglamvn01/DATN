import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Button, TextField, InputAdornment, useTheme, CircularProgress, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, Stack, Chip, FormControl, InputLabel, Select, MenuItem,
  TableSortLabel, TablePagination,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { format } from 'date-fns';

// --- Cấu hình API Backend URL ---
const API_URL = 'http://localhost:3000/api/discounts';

// --- INTERFACE DỮ LIỆU TỪ DB ---
// Interface cho dữ liệu nhận được từ DB
interface DiscountCodeDb {
  code_id: number;
  code: string;
  description: string;
  discount_percent: number | null;
  discount_amount: number | null;
  start_date: string;
  end_date: string;
}

// Interface cho dữ liệu hiển thị trên Frontend (đã xử lý trạng thái và giá trị)
interface VoucherDisplay {
  code_id: number;
  code: string;
  name: string; // Tên hiển thị (description từ DB)
  value: number; // Giá trị (discount_percent hoặc discount_amount)
  type: 'percentage' | 'fixed_amount';
  expiryDate: string; // Ngày hết hạn (end_date từ DB)
  status: 'Active' | 'Inactive' | 'Expired';
}

// --- LOGIC XỬ LÝ DỮ LIỆU TỪ DB ---
const processDbData = (data: DiscountCodeDb[]): VoucherDisplay[] => {
  const now = new Date();
  return data.map(item => {
    let type: 'percentage' | 'fixed_amount';
    let value: number;

    if (item.discount_percent !== null && item.discount_percent > 0) {
      type = 'percentage';
      value = item.discount_percent;
    } else {
      type = 'fixed_amount';
      value = item.discount_amount || 0;
    }

    // Suy luận trạng thái
    const startDate = new Date(item.start_date);
    const endDate = new Date(item.end_date);
    let status: 'Active' | 'Inactive' | 'Expired';

    if (now > endDate) {
      status = 'Expired';
    } else if (now >= startDate && now <= endDate) {
      status = 'Active';
    } else {
      status = 'Inactive';
    }

    return {
      code_id: item.code_id,
      code: item.code,
      name: item.description, // Sử dụng description làm tên hiển thị
      value,
      type,
      expiryDate: item.end_date, // Sử dụng end_date làm ngày hết hạn hiển thị
      status,
    };
  });
};

// --- UTILITY FUNCTIONS FOR SORTING ---
type Order = 'asc' | 'desc';
type HeadCellId = keyof VoucherDisplay;

// Cấu hình cột hiển thị, sử dụng key từ VoucherDisplay
const headCells: { id: HeadCellId; label: string; numeric: boolean; disableSorting?: boolean; }[] = [
  { id: 'code', numeric: false, label: 'Mã Voucher' },
  { id: 'name', numeric: false, label: 'Tên Voucher' },
  { id: 'value', numeric: true, label: 'Giá trị' },
  { id: 'expiryDate', numeric: false, label: 'Ngày hết hạn' },
  { id: 'status', numeric: false, label: 'Trạng thái' },
];

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) { return -1; }
  if (b[orderBy] > a[orderBy]) { return 1; }
  return 0;
}

function getComparator<Key extends keyof VoucherDisplay>(
  order: Order,
  orderBy: Key,
): (a: { [key in Key]: number | string | Date }, b: { [key in Key]: number | string | Date }) => number {
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

// --- VOUCHER MANAGER COMPONENT ---
export default function VoucherManager() {
  const theme = useTheme();

  const [vouchers, setVouchers] = useState<VoucherDisplay[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State cho phân trang và sắp xếp
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<HeadCellId>('code');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // State cho Modal Add/Edit
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingVoucher, setEditingVoucher] = useState<VoucherDisplay | null>(null);

  // Dữ liệu form trong modal, bao gồm type để xử lý input value
  const [modalFormData, setModalFormData] = useState<Partial<DiscountCodeDb & { type: 'percentage' | 'fixed_amount' }>>({});

  // --- HÀM LẤY DỮ LIỆU TỪ API (GET) ---
  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<DiscountCodeDb[]>(API_URL);
      const processedVouchers = processDbData(response.data);
      setVouchers(processedVouchers);
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu voucher:", err);
      setError('Không thể tải dữ liệu mã giảm giá. Vui lòng kiểm tra kết nối backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  // --- HANDLERS ---

  const handleChangePage = useCallback((event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const handleRequestSort = useCallback((event: React.MouseEvent<unknown>, property: HeadCellId) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  }, [order, orderBy]);

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  }, []);

  // LƯU Ý: Chức năng toggle status đã bị xóa vì trạng thái được tính toán từ DB (start_date/end_date)
  // Nếu muốn thay đổi trạng thái, bạn phải thay đổi start_date hoặc end_date.

  const handleAddNewVoucher = useCallback(() => {
    setEditingVoucher(null);
    setModalFormData({ 
      type: 'fixed_amount', 
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: format(new Date(), 'yyyy-MM-dd'),
    });
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback((voucher: VoucherDisplay) => {
    setEditingVoucher(voucher);
    setModalFormData({
      code_id: voucher.code_id,
      code: voucher.code,
      description: voucher.name,
      discount_percent: voucher.type === 'percentage' ? voucher.value : null,
      discount_amount: voucher.type === 'fixed_amount' ? voucher.value : null,
      // Chuyển đổi DATETIME string sang định dạng yyyy-MM-dd cho input type="date"
      start_date: format(new Date(voucher.expiryDate), 'yyyy-MM-dd'), // Lấy ngày hết hạn để hiển thị trong form
      end_date: format(new Date(voucher.expiryDate), 'yyyy-MM-dd'),
      type: voucher.type,
    });
    setIsModalOpen(true);
  }, []);

  const handleDelete = useCallback(async (codeId: number) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa mã giảm giá #${codeId}?`)) {
      try {
        await axios.delete(`${API_URL}/${codeId}`);
        fetchVouchers(); // Tải lại dữ liệu sau khi xóa
      } catch (err) {
        setError('Không thể xóa mã giảm giá. Vui lòng thử lại.');
      }
    }
  }, [fetchVouchers]);

  const handleModalFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setModalFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Xử lý thay đổi loại và giá trị giảm giá
  const handleValueAndTypeChange = useCallback((e: any, type: 'type' | 'value') => {
    const { value } = e.target;
    setModalFormData((prev) => {
      const newFormData = { ...prev };
      
      if (type === 'type') {
        newFormData.type = value;
        // Đặt giá trị còn lại về null khi đổi loại
        if (newFormData.type === 'percentage') {
          newFormData.discount_amount = null;
        } else {
          newFormData.discount_percent = null;
        }
      } else if (type === 'value') {
        const numericValue = parseFloat(value) || 0;
        if (newFormData.type === 'percentage') {
          newFormData.discount_percent = numericValue;
        } else {
          newFormData.discount_amount = numericValue;
        }
      }
      return newFormData;
    });
  }, []);

  const handleSaveVoucher = useCallback(async () => {
    const { code, description, discount_percent, discount_amount, start_date, end_date } = modalFormData;

    // Kiểm tra dữ liệu bắt buộc
    if (!code || !description || !start_date || !end_date) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc (Mã, Tên, Ngày bắt đầu và Ngày hết hạn).');
      return;
    }

    const dataToSave = { code, description, discount_percent, discount_amount, start_date, end_date };

    try {
      if (editingVoucher) {
        // Cập nhật (PUT)
        await axios.put(`${API_URL}/${editingVoucher.code_id}`, dataToSave);
      } else {
        // Thêm mới (POST)
        await axios.post(API_URL, dataToSave);
      }
      
      handleCloseModal();
      fetchVouchers(); // Tải lại dữ liệu sau khi lưu
      
    } catch (err) {
      console.error("Lỗi khi lưu voucher:", err);
      if (axios.isAxiosError(err) && err.response && err.response.data && err.response.data.error) {
        setError(`Lỗi: ${err.response.data.error}`);
      } else {
        setError('Lỗi khi lưu mã giảm giá. Vui lòng thử lại.');
      }
    }
  }, [editingVoucher, modalFormData, fetchVouchers]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingVoucher(null);
    setModalFormData({});
    setError(null);
  }, []);

  // --- MEMOIZED DATA FOR TABLE ---
  const filteredAndSortedVouchers = useMemo(() => {
    let currentVouchers = vouchers;

    if (searchTerm) {
      currentVouchers = currentVouchers.filter((voucher) =>
        voucher.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        voucher.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sắp xếp dữ liệu
    currentVouchers = stableSort(currentVouchers, getComparator(order, orderBy));

    const startIndex = page * rowsPerPage;
    return currentVouchers.slice(startIndex, startIndex + rowsPerPage);
  }, [vouchers, searchTerm, order, orderBy, page, rowsPerPage]);

  const totalFilteredVouchers = useMemo(() => {
    let currentVouchers = vouchers;
    if (searchTerm) {
      currentVouchers = currentVouchers.filter((voucher) =>
        voucher.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        voucher.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return currentVouchers.length;
  }, [vouchers, searchTerm]);

  const getStatusChipColor = (status: 'Active' | 'Inactive' | 'Expired') => {
    switch (status) {
      case 'Active': return 'success';
      case 'Inactive': return 'warning';
      case 'Expired': return 'error';
      default: return 'default';
    }
  };

  const formatVoucherValue = (voucher: VoucherDisplay) => {
    if (voucher.type === 'percentage') {
      return `${voucher.value}%`;
    } else {
      return `${voucher.value.toLocaleString('vi-VN')} VND`;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Đang tải dữ liệu voucher...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, backgroundColor: theme.palette.background.default }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, fontWeight: 'bold', color: theme.palette.primary.dark }}>
        Quản Lý Voucher
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Paper sx={{ p: 3, borderRadius: theme.shape.borderRadius, boxShadow: theme.shadows[3], mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 2, gap: 2 }}>
          <TextField
            label="Tìm kiếm voucher..."
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
            onClick={handleAddNewVoucher}
            sx={{ flexShrink: 0 }}
          >
            Thêm Voucher Mới
          </Button>
        </Box>

        <TableContainer>
          <Table aria-label="voucher management table">
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
              {filteredAndSortedVouchers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={headCells.length + 1} align="center" sx={{ py: 3 }}>
                    <Typography variant="subtitle1" color="text.secondary">
                      Không tìm thấy voucher nào.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedVouchers.map((voucher) => (
                  <TableRow key={voucher.code_id} hover>
                    <TableCell>{voucher.code}</TableCell>
                    <TableCell>{voucher.name}</TableCell>
                    <TableCell align="right">{formatVoucherValue(voucher)}</TableCell>
                    {/* Định dạng lại ngày tháng từ string sang dd/MM/yyyy */}
                    <TableCell>{format(new Date(voucher.expiryDate), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>
                      <Chip
                        label={voucher.status === 'Active' ? 'Hoạt động' : (voucher.status === 'Inactive' ? 'Chưa hoạt động' : 'Hết hạn')}
                        color={getStatusChipColor(voucher.status)}
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        aria-label="edit"
                        color="primary"
                        onClick={() => handleEdit(voucher)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        aria-label="delete"
                        color="error"
                        onClick={() => handleDelete(voucher.code_id)}
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
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalFilteredVouchers}
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

      {/* Modal Thêm/Chỉnh sửa Voucher */}
      <Dialog open={isModalOpen} onClose={handleCloseModal} fullWidth maxWidth="sm">
        <DialogTitle>
          {editingVoucher ? 'Chỉnh sửa Voucher' : 'Thêm Voucher Mới'}
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
              label="Mã Voucher"
              name="code"
              variant="outlined"
              fullWidth
              value={modalFormData.code || ''}
              onChange={handleModalFormChange}
              required
            />
            {/* Cập nhật Tên Voucher thành Mô tả (description) */}
            <TextField
              label="Tên Voucher (Mô tả)"
              name="description"
              variant="outlined"
              fullWidth
              value={modalFormData.description || ''}
              onChange={handleModalFormChange}
              required
            />

            {/* Điều chỉnh input giá trị và loại */}
            <FormControl fullWidth>
              <InputLabel id="voucher-type-label">Loại giảm giá</InputLabel>
              <Select
                labelId="voucher-type-label"
                name="type"
                value={modalFormData.type || 'fixed_amount'}
                label="Loại giảm giá"
                onChange={(e) => handleValueAndTypeChange(e, 'type')}
              >
                <MenuItem value="fixed_amount">Theo số tiền (VND)</MenuItem>
                <MenuItem value="percentage">Theo %</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Giá trị"
              name="value"
              variant="outlined"
              fullWidth
              type="number"
              // Hiển thị giá trị tương ứng với loại đang chọn
              value={modalFormData.type === 'percentage' 
                ? modalFormData.discount_percent || '' 
                : modalFormData.discount_amount || ''}
              onChange={(e) => handleValueAndTypeChange(e, 'value')}
              inputProps={{ min: 0, step: modalFormData.type === 'percentage' ? 0.01 : 1 }}
              InputProps={{
                endAdornment: <InputAdornment position="end">{modalFormData.type === 'percentage' ? '%' : 'VND'}</InputAdornment>,
              }}
              required
            />

            {/* Thêm Ngày bắt đầu (start_date) */}
            <TextField
              label="Ngày bắt đầu hiệu lực"
              name="start_date"
              variant="outlined"
              fullWidth
              type="date"
              value={modalFormData.start_date ? format(new Date(modalFormData.start_date), 'yyyy-MM-dd') : ''}
              onChange={handleModalFormChange}
              InputLabelProps={{ shrink: true }}
              required
            />

            {/* Cập nhật Ngày hết hạn (end_date) */}
            <TextField
              label="Ngày hết hạn"
              name="end_date"
              variant="outlined"
              fullWidth
              type="date"
              value={modalFormData.end_date ? format(new Date(modalFormData.end_date), 'yyyy-MM-dd') : ''}
              onChange={handleModalFormChange}
              InputLabelProps={{ shrink: true }}
              required
            />
            
            {/* LƯU Ý: Trạng thái không thể chỉnh sửa trực tiếp qua Switch
               vì nó được suy luận từ start_date và end_date trong DB */}
            
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="secondary">
            Hủy
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveVoucher}
          >
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}