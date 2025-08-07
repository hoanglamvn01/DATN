// 📁 src/pages/PostManager.tsx
// Đã sửa lỗi cú pháp trong TextField tìm kiếm

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Button, TextField, InputAdornment, useTheme, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, Stack, Snackbar,
  TableSortLabel, TablePagination, DialogContentText, Input
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
interface Post {
  post_id: number;
  title: string;
  content: string;
  thumbnail: string | null; // Có thể null
  author_id: number;
  slug: string;
  created_at: string; // DATETIME từ MySQL thường về dạng chuỗi ISO
  updated_at: string | null; // Có thể null
}

type Order = 'asc' | 'desc';
type HeadCellId = keyof Post;

interface HeadCell {
  id: HeadCellId;
  label: string;
  numeric: boolean;
  disableSorting?: boolean;
}

const headCells: HeadCell[] = [
  { id: 'post_id', numeric: false, label: 'ID' },
  { id: 'title', numeric: false, label: 'Tiêu đề' },
  { id: 'slug', numeric: false, label: 'Slug' },
  { id: 'author_id', numeric: true, label: 'ID Tác giả' },
  { id: 'created_at', numeric: false, label: 'Ngày tạo' },
  { id: 'thumbnail', numeric: false, label: 'Ảnh', disableSorting: true }, // Không sắp xếp theo ảnh
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

function getComparator<Key extends keyof Post>(
  order: Order,
  orderBy: Key,
): (a: { [key in Key]: number | string | null }, b: { [key in Key]: number | string | null }) => number {
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

// --- CONSTANTS ---
const API_BASE_URL = 'http://localhost:3000/api/posts';
const UPLOADS_BASE_URL = 'http://localhost:3000/uploads/';

// --- POST MANAGER COMPONENT ---
export default function PostManager() {
  const theme = useTheme();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<HeadCellId>('post_id');

  const [searchTerm, setSearchTerm] = useState<string>('');

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [modalFormData, setModalFormData] = useState<Partial<Post>>({});
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null);
  const [previewThumbnail, setPreviewThumbnail] = useState<string | null>(null);

  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setPosts(data);
    } catch (err) {
      setError('Không thể tải dữ liệu bài viết. Vui lòng thử lại.');
      console.error('Fetch posts error:', err);
      showSnackbar(`Lỗi khi tải bài viết: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

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

  const handleAddNewPost = useCallback(() => {
    setEditingPost(null);
    setModalFormData({ title: '', content: '', author_id: 1, slug: '' });
    setSelectedThumbnail(null);
    setPreviewThumbnail(null);
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback((post: Post) => {
    setEditingPost(post);
    setModalFormData(post);
    setSelectedThumbnail(null);
    setPreviewThumbnail(post.thumbnail ? `${UPLOADS_BASE_URL}${post.thumbnail}` : null);
    setIsModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback((postId: number) => {
    setDeletingId(postId);
    setOpenConfirmDialog(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (deletingId === null) return;
    try {
      const response = await fetch(`${API_BASE_URL}/${deletingId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      showSnackbar('Bài viết đã được xóa thành công!', 'success');
      setOpenConfirmDialog(false);
      setDeletingId(null);
      fetchPosts();
    } catch (error) {
      showSnackbar(`Lỗi khi xóa bài viết: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  }, [deletingId, fetchPosts, showSnackbar]);

  const handleCloseConfirmDialog = useCallback(() => {
    setOpenConfirmDialog(false);
    setDeletingId(null);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingPost(null);
    setModalFormData({});
    setSelectedThumbnail(null);
    setPreviewThumbnail(null);
  }, []);

  const handleModalFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setModalFormData((prev) => ({
      ...prev,
      [name]: name === 'author_id' ? parseInt(value, 10) : value,
    }));
  }, []);

  const handleThumbnailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedThumbnail(file);
      setPreviewThumbnail(URL.createObjectURL(file));
    } else {
      setSelectedThumbnail(null);
      // Giữ ảnh cũ nếu người dùng không chọn ảnh mới khi edit
      if (editingPost) {
        setPreviewThumbnail(editingPost.thumbnail ? `${UPLOADS_BASE_URL}${editingPost.thumbnail}` : null);
      } else {
        setPreviewThumbnail(null);
      }
    }
  }, [editingPost]);

  const handleSavePost = useCallback(async () => {
    if (!modalFormData.title || !modalFormData.content || !modalFormData.slug || !modalFormData.author_id) {
      showSnackbar('Vui lòng điền đầy đủ Tiêu đề, Nội dung, Đường dẫn và ID Tác giả.', 'error');
      return;
    }
    if (!editingPost && !selectedThumbnail) {
        showSnackbar('Vui lòng chọn ảnh đại diện cho bài viết mới.', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('title', modalFormData.title);
    formData.append('content', modalFormData.content);
    formData.append('author_id', String(modalFormData.author_id));
    formData.append('slug', modalFormData.slug);
    
    if (selectedThumbnail) {
        formData.append('thumbnail', selectedThumbnail);
    }

    try {
      const method = editingPost ? 'PUT' : 'POST';
      const url = editingPost ? `${API_BASE_URL}/${editingPost.post_id}` : API_BASE_URL;

      const response = await fetch(url, {
        method,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      showSnackbar(`Bài viết đã được ${editingPost ? 'cập nhật' : 'thêm mới'} thành công!`, 'success');
      handleCloseModal();
      fetchPosts();
    } catch (error) {
      showSnackbar(`Lỗi khi lưu bài viết: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  }, [editingPost, modalFormData, selectedThumbnail, handleCloseModal, fetchPosts, showSnackbar]);

  const filteredAndSortedPosts = useMemo(() => {
    let currentPosts = posts;

    if (searchTerm) {
      const lowercasedFilter = searchTerm.toLowerCase();
      currentPosts = currentPosts.filter((post) =>
        post.title.toLowerCase().includes(lowercasedFilter) ||
        post.content.toLowerCase().includes(lowercasedFilter) ||
        post.slug.toLowerCase().includes(lowercasedFilter) ||
        String(post.post_id).includes(lowercasedFilter) ||
        String(post.author_id).includes(lowercasedFilter)
      );
    }

    return stableSort(currentPosts, getComparator(order, orderBy))
           .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [posts, searchTerm, order, orderBy, page, rowsPerPage]);

  const totalFilteredPosts = useMemo(() => {
    if (!searchTerm) return posts.length;
    
    const lowercasedFilter = searchTerm.toLowerCase();
    return posts.filter((post) =>
      post.title.toLowerCase().includes(lowercasedFilter) ||
      post.content.toLowerCase().includes(lowercasedFilter) ||
      post.slug.toLowerCase().includes(lowercasedFilter) ||
      String(post.post_id).includes(lowercasedFilter) ||
      String(post.author_id).includes(lowercasedFilter)
    ).length;
  }, [posts, searchTerm]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Đang tải dữ liệu bài viết...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="error" variant="body1">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, backgroundColor: theme.palette.background.default }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, fontWeight: 'bold', color: theme.palette.primary.dark }}>
        Quản lý Bài viết
      </Typography>

      <Paper sx={{ p: 3, borderRadius: theme.shape.borderRadius, boxShadow: theme.shadows[3], mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 2, gap: 2 }}>
          <TextField
            label="Tìm kiếm bài viết..."
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
            onClick={handleAddNewPost}
            sx={{ flexShrink: 0 }}
          >
            Thêm Bài viết Mới
          </Button>
        </Box>

        <TableContainer>
          <Table aria-label="post management table">
            <TableHead>
              <TableRow>
                {headCells.map((headCell) => (
                  <TableCell
                    key={headCell.id}
                    align={headCell.numeric ? 'right' : 'left'}
                    padding="normal"
                    sortDirection={orderBy === headCell.id ? order : false}
                    sx={{ fontWeight: 'bold', backgroundColor: theme.palette.grey[200] }}
                  >
                    {headCell.disableSorting ? (
                      headCell.label
                    ) : (
                      <TableSortLabel
                        active={orderBy === headCell.id}
                        direction={orderBy === headCell.id ? order : 'asc'}
                        onClick={(event) => handleRequestSort(event, headCell.id)}
                      >
                        {headCell.label}
                      </TableSortLabel>
                    )}
                  </TableCell>
                ))}
                <TableCell align="left" sx={{ fontWeight: 'bold', backgroundColor: theme.palette.grey[200] }}>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAndSortedPosts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={headCells.length + 1} align="center" sx={{ py: 3 }}>
                    <Typography variant="subtitle1" color="text.secondary">
                      Không tìm thấy bài viết nào.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedPosts.map((post) => (
                  <TableRow key={post.post_id} hover>
                    <TableCell align="left">{post.post_id}</TableCell>
                    <TableCell align="left">{post.title}</TableCell>
                    <TableCell align="left">{post.slug}</TableCell>
                    <TableCell align="right">{post.author_id}</TableCell>
                    <TableCell align="left">{new Date(post.created_at).toLocaleDateString()}</TableCell>
                    <TableCell align="left">
                      {post.thumbnail ? (
                        <img
                          src={`${UPLOADS_BASE_URL}${post.thumbnail}`}
                          alt={post.title}
                          style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }}
                          onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/50x50?text=No+Image'; }}
                        />
                      ) : (
                        <Typography variant="caption" color="text.secondary">Không ảnh</Typography>
                      )}
                    </TableCell>
                    <TableCell align="left">
                      <Box sx={{ display: 'flex', justifyContent: 'left', gap: 1 }}>
                        <IconButton
                          aria-label="edit"
                          color="primary"
                          onClick={() => handleEdit(post)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          aria-label="delete"
                          color="error"
                          onClick={() => handleDeleteConfirm(post.post_id)}
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
          count={totalFilteredPosts}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Số hàng mỗi trang:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}–${to} trên ${count !== -1 ? count : `hơn ${to}`}`
          }
        />
      </Paper>

      {/* Modal Thêm/Chỉnh sửa Bài viết */}
      <Dialog open={isModalOpen} onClose={handleCloseModal} fullWidth maxWidth="md" scroll="paper">
        <DialogTitle>
          {editingPost ? 'Chỉnh sửa Bài viết' : 'Thêm Bài viết Mới'}
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
          <Stack spacing={3} sx={{ mt: 1, p: 1 }}>
            <TextField
              label="Tiêu đề"
              name="title"
              variant="outlined"
              fullWidth
              value={modalFormData.title || ''}
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
              label="ID Tác giả"
              name="author_id"
              type="number"
              variant="outlined"
              fullWidth
              value={modalFormData.author_id || ''}
              onChange={handleModalFormChange}
              required
            />
            <TextField
              label="Nội dung"
              name="content"
              variant="outlined"
              fullWidth
              multiline
              rows={6}
              value={modalFormData.content || ''}
              onChange={handleModalFormChange}
              required
            />
            <Box>
              <Typography variant="subtitle2" gutterBottom>Ảnh đại diện (Thumbnail)</Typography>
              <Button variant="outlined" component="label">
                Chọn ảnh
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleThumbnailChange}
                />
              </Button>
              {previewThumbnail && (
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2, border: '1px dashed grey', p: 1, borderRadius: 1 }}>
                  <img src={previewThumbnail} alt="Thumbnail Preview" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4 }} />
                  <Typography variant="body2">{selectedThumbnail ? selectedThumbnail.name : 'Ảnh hiện tại'}</Typography>
                </Box>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: '16px 24px' }}>
          <Button onClick={handleCloseModal} color="secondary">
            Hủy
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSavePost}
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
        <DialogTitle id="alert-dialog-title">{"Xác nhận xóa bài viết?"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Bạn có chắc chắn muốn xóa bài viết này? Thao tác này không thể hoàn tác.
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