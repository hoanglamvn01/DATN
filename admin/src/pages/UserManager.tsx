import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  useTheme,
  TablePagination,
  CircularProgress,
  Alert,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import DialogUserForm from "../components/DialogUserForm";
import { useSnackbar } from "../hooks/useSnackbar";
import type { UserFormData } from "../components/DialogUserForm";

// --- INTERFACES ---
interface User {
  user_id: string;
  full_name: string;
  email: string;
  password_hash: string;
  phone_number: string;
  gender: "Nam" | "Nữ" | "Khác";
  date_of_birth: string | null;
  address: string;
  ward: string;
  district: string;
  province: string;
  role: "admin" | "customer";
  status: "active" | "inactive";
}

const API_URL_USERS = "http://localhost:3000/api/users";

type HeadCellId = keyof User;

interface HeadCell {
  id: HeadCellId;
  label: string;
  numeric: boolean;
  disableSorting?: boolean;
}

const headCells: HeadCell[] = [
  { id: "user_id", numeric: false, label: "ID Người Dùng" },
  { id: "full_name", numeric: false, label: "Tên Người Dùng" },
  { id: "email", numeric: false, label: "Email" },
  { id: "phone_number", numeric: false, label: "Số điện thoại" },
  { id: "role", numeric: false, label: "Vai trò" },
  { id: "status", numeric: false, label: "Trạng thái" },
];

// --- USER MANAGER COMPONENT ---
export default function UserManager() {
  const theme = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [tableLoading, setTableLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Lấy token ngay trước khi cần, hoặc trong useEffect nếu nó thay đổi
  // và cần re-render
  // const token = localStorage.getItem("token"); // Không nên lưu ở đây như state, lấy khi dùng

  const { openSnackbar } = useSnackbar();

  // State cho phân trang
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);

  // State cho tìm kiếm
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");

  // State cho Modal Add/Edit
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // --- API CALL list users---
  const fetchUsers = useCallback(
    async (
      pageParam = page,
      limitParam = rowsPerPage,
      searchParam = debouncedSearchTerm
    ) => {
      // Lấy token ngay trước khi sử dụng
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Không có token xác thực. Vui lòng đăng nhập lại.");
        setLoading(false);
        setTableLoading(false);
        // Có thể thêm logic chuyển hướng người dùng đến trang đăng nhập ở đây
        // navigate('/login');
        return;
      }

      if (searchParam.trim() || pageParam !== 0) {
        setTableLoading(true);
      } else {
        setLoading(true);
      }
      setError(null);
      try {
        const url = new URL(`${API_URL_USERS}`);
        url.searchParams.set("page", (pageParam + 1).toString());
        url.searchParams.set("limit", limitParam.toString());

        if (searchParam.trim()) {
          url.searchParams.set("search", searchParam.trim());
        }
        // console.log("Fetching users with token:", token); // Ghi log để kiểm tra token

        const response = await fetch(url.toString(), {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`, // Đảm bảo token được gửi đúng cách
            "Content-Type": "application/json",
          },
        });

        // Xử lý lỗi 401 cụ thể từ response
        if (response.status === 401) {
          const errorData = await response.json();
          setError(errorData.message || "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
          // Clear token cũ và có thể chuyển hướng
          localStorage.removeItem("token");
          // navigate('/login'); // Nếu có react-router-dom
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Lỗi khi tải dữ liệu");
        }

        await new Promise((resolve) => setTimeout(resolve, 300)); // Giảm delay
        setUsers(data.users);
        setFilteredUsers(data.users);
        setTotalUsers(data.total || data.users.length);
      } catch (err: any) { // Dùng any hoặc unknown và kiểm tra instance of Error
        console.error("Lỗi khi tải dữ liệu người dùng:", err);
        setError(err.message || "Không thể tải dữ liệu người dùng. Vui lòng thử lại.");
      } finally {
        setLoading(false);
        setTableLoading(false);
      }
    },
    [page, rowsPerPage, debouncedSearchTerm] // Loại bỏ token khỏi dependency vì nó được lấy bên trong
  );

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, [page, rowsPerPage, debouncedSearchTerm]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // Tăng delay để giảm số lần gọi API

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // --- LOGIC TÌM KIẾM (Server-side) ---
  // Không cần lọc ở client nữa vì đã tìm kiếm từ server
  const filteredUsersData = useMemo(() => {
    return users;
  }, [users]);

  // Cập nhật filteredUsers khi có thay đổi
  useEffect(() => {
    setFilteredUsers(filteredUsersData);
  }, [filteredUsersData]);

  // --- HANDLERS ---

  // Xử lý thay đổi trang
  const handleChangePage = useCallback((event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  // Xử lý thay đổi số lượng hàng trên mỗi trang
  const handleChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setPage(0);
    },
    []
  );

  // Xử lý tìm kiếm với debounce
  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(event.target.value);
    },
    []
  );

  // Xử lý xóa tìm kiếm
  const handleClearSearch = useCallback(() => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setPage(0);
  }, []);

  // Mở modal Thêm người dùng
  const handleAddNewUser = useCallback(() => {
    setEditingUser(null);
    setIsModalOpen(true);
  }, []);

  // Mở modal Chỉnh sửa người dùng
  const handleEdit = useCallback((user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  }, []);

  // Xử lý xóa người dùng
  const handleDelete = useCallback(
    async (userId: string) => {
      if (window.confirm(`Bạn có chắc chắn muốn xóa người dùng ${userId}?`)) {
        const token = localStorage.getItem("token"); // Lấy token trước khi sử dụng
        if (!token) {
          openSnackbar({
            text: "Không có token xác thực để xóa.",
            severity: "error",
          });
          return;
        }

        try {
          const response = await fetch(`${API_URL_USERS}/${userId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (response.status === 401) {
            const errorData = await response.json();
            openSnackbar({
              text: errorData.message || "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
              severity: "error",
            });
            localStorage.removeItem("token");
            return;
          }

          if (response.ok) {
            setUsers((prevUsers) =>
              prevUsers.filter((user) => user.user_id !== userId)
            );
            openSnackbar({
              text: "Xóa người dùng thành công",
              severity: "success",
            });
            // Refresh danh sách để cập nhật số lượng - chỉ load table, không load toàn trang
            fetchUsers(page, rowsPerPage, debouncedSearchTerm);
          } else {
            const errorData = await response.json();
            openSnackbar({
              text: errorData.message || "Lỗi khi xóa người dùng",
              severity: "error",
            });
          }
        } catch (error) {
          console.error("Lỗi kết nối khi xóa người dùng:", error);
          openSnackbar({
            text: "Lỗi kết nối khi xóa người dùng",
            severity: "error",
          });
        }
      }
    },
    [openSnackbar, fetchUsers, page, rowsPerPage, debouncedSearchTerm]
  );

  // Đóng modal
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingUser(null);
  }, []);

  // Xử lý lưu người dùng từ form
  const handleSaveUser = useCallback(
    async (userData: Omit<User, "user_id">) => {
      const token = localStorage.getItem("token"); // Lấy token trước khi sử dụng
      if (!token) {
        openSnackbar({
          text: "Không có token xác thực để lưu người dùng.",
          severity: "error",
        });
        return;
      }

      try {
        // Format date_of_birth to ensure it's in YYYY-MM-DD format
        const formattedUserData = {
          ...userData,
          date_of_birth: userData.date_of_birth
            ? new Date(userData.date_of_birth).toISOString().split("T")[0]
            : null,
        };

        let response;
        if (editingUser) {
          response = await fetch(
            `${API_URL_USERS}/${editingUser.user_id}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(formattedUserData),
            }
          );
        } else {
          // Thêm người dùng mới
          response = await fetch(API_URL_USERS, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(formattedUserData),
          });
        }

        if (response.status === 401) {
          const errorData = await response.json();
          openSnackbar({
            text: errorData.message || "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
            severity: "error",
          });
          localStorage.removeItem("token");
          return;
        }

        if (response.ok) {
          openSnackbar({
            text: editingUser ? "Cập nhật người dùng thành công" : "Thêm người dùng mới thành công",
            severity: "success",
          });
          handleCloseModal();
          fetchUsers(page, rowsPerPage, debouncedSearchTerm); // Refresh danh sách - chỉ load table
        } else {
          const errorData = await response.json();
          openSnackbar({
            text: errorData.message || (editingUser ? "Lỗi khi cập nhật người dùng" : "Lỗi khi thêm người dùng mới"),
            severity: "error",
          });
        }
      } catch (error: unknown) {
        console.error("Lỗi khi lưu người dùng:", error);
        let errorMessage = "Lỗi khi lưu người dùng";
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        openSnackbar({
          text: errorMessage,
          severity: "error",
        });
      }
    },
    [
      editingUser,
      handleCloseModal,
      fetchUsers,
      openSnackbar,
      page,
      rowsPerPage,
      debouncedSearchTerm,
    ]
  );

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Đang tải dữ liệu...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        backgroundColor: theme.palette.background.default,
      }}
    >
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{ mb: 4, fontWeight: "bold", color: theme.palette.primary.dark }}
      >
        Quản Lý Người Dùng
      </Typography>

      <Paper
        sx={{
          p: 3,
          borderRadius: theme.shape.borderRadius,
          boxShadow: theme.shadows[3],
          mb: 3,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            mb: 2,
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
            <TextField
              label="Tìm kiếm người dùng..."
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
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={handleClearSearch}
                      edge="end"
                    >
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ width: { xs: "100%", sm: "300px" } }}
            />
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddNewUser}
            sx={{ flexShrink: 0 }}
          >
            Thêm Người Dùng Mới
          </Button>
        </Box>

        <TableContainer>
          <Table aria-label="user management table">
            <TableHead>
              <TableRow>
                {headCells.map((headCell) => (
                  <TableCell
                    key={headCell.id}
                    align={headCell.numeric ? "right" : "left"}
                    sx={{
                      fontWeight: "bold",
                      backgroundColor: theme.palette.grey[200],
                    }}
                  >
                    {headCell.label}
                  </TableCell>
                ))}
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: theme.palette.grey[200],
                  }}
                >
                  Hành động
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tableLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={headCells.length + 1}
                    align="center"
                    sx={{ py: 3 }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      <CircularProgress size={24} />
                      <Typography variant="body2" color="text.secondary">
                        Đang tìm kiếm...
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={headCells.length + 1}
                    align="center"
                    sx={{ py: 3 }}
                  >
                    <Typography variant="subtitle1" color="text.secondary">
                      {debouncedSearchTerm
                        ? `Không tìm thấy người dùng nào phù hợp với "${debouncedSearchTerm}"`
                        : "Không tìm thấy người dùng nào."}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user, index) => (
                  <TableRow key={user.user_id} hover>
                    {/* `user_id` should probably be displayed as the ID, not `index + 1` */}
                    <TableCell>{user.user_id}</TableCell> 
                    <TableCell>{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone_number}</TableCell>
                    <TableCell>
                      {user.role === "admin" ? "Admin" : "Customer"}
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          color:
                            user.status === "active"
                              ? theme.palette.success.main
                              : theme.palette.error.main,
                          fontWeight: "medium",
                        }}
                      >
                        {user.status === "active"
                          ? "Hoạt động"
                          : "Không hoạt động"}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        aria-label="edit"
                        color="primary"
                        onClick={() => handleEdit(user)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        aria-label="delete"
                        color="error"
                        onClick={() => handleDelete(user.user_id)}
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

        {/* Phân trang */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalUsers}
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

      {/* UserForm Component */}
      <DialogUserForm
        open={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSaveUser as unknown as (data: UserFormData) => void}
        editingUser={editingUser as UserFormData | null}
        title={editingUser ? "Chỉnh sửa Người dùng" : "Thêm Người dùng Mới"}
      />
    </Box>
  );
}