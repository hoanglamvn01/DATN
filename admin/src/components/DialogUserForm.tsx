import React, { useState, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  InputAdornment,
  Grid,
  Box,
  Paper,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

// Định nghĩa type cho dữ liệu form
export interface UserFormData {
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

export interface UserFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => void;
  editingUser?: UserFormData | null;
  title?: string;
}

export default function DialogUserForm({
  open,
  onClose,
  onSubmit,
  editingUser,
  title,
}: UserFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UserFormData>({
    defaultValues: {
      full_name: "",
      email: "",
      password_hash: "",
      phone_number: "",
      gender: "Nam",
      date_of_birth: null,
      address: "",
      ward: "",
      district: "",
      province: "",
      role: "customer",
      status: "active",
    },
  });

  // Reset form values when editingUser changes
  useEffect(() => {
    if (editingUser) {
      reset({
        full_name: editingUser.full_name || "",
        email: editingUser.email || "",
        password_hash: editingUser.password_hash || "",
        phone_number: editingUser.phone_number || "",
        gender: editingUser.gender || "Nam",
        date_of_birth: editingUser.date_of_birth || null,
        address: editingUser.address || "",
        ward: editingUser.ward || "",
        district: editingUser.district || "",
        province: editingUser.province || "",
        role: editingUser.role || "customer",
        status: editingUser.status || "active",
      });
    } else {
      reset({
        full_name: "",
        email: "",
        password_hash: "",
        phone_number: "",
        gender: "Nam",
        date_of_birth: null,
        address: "",
        ward: "",
        district: "",
        province: "",
        role: "customer",
        status: "active",
      });
    }
  }, [editingUser, reset]);

  const handleFormSubmit = (data: UserFormData) => {
    onSubmit(data);
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle
          sx={{ p: 2, fontWeight: 600, fontSize: 22, bgcolor: "#fafafa" }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <span>{title}</span>
            <IconButton aria-label="close" onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          <Box>
            <Paper
              elevation={0}
              sx={{ p: 2, mb: 2, bgcolor: "#fff", boxShadow: "none" }}
            >
              <Grid container spacing={2} sx={{ flexDirection: "column" }}>
                <Grid component="div">
                  <Controller
                    name="full_name"
                    control={control}
                    rules={{ required: "Tên người dùng là bắt buộc" }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Tên người dùng"
                        variant="outlined"
                        fullWidth
                        error={!!errors.full_name}
                        helperText={errors.full_name?.message}
                        required
                      />
                    )}
                  />
                </Grid>
                <Grid component="div">
                  <Controller
                    name="email"
                    control={control}
                    rules={{
                      required: "Email là bắt buộc",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Email không hợp lệ",
                      },
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Email"
                        variant="outlined"
                        fullWidth
                        type="email"
                        error={!!errors.email}
                        helperText={errors.email?.message}
                        required
                      />
                    )}
                  />
                </Grid>
                <Grid component="div">
                  <Controller
                    name="password_hash"
                    control={control}
                    rules={{
                      required: "Mật khẩu là bắt buộc",
                      minLength: {
                        value: 6,
                        message: "Mật khẩu phải có ít nhất 6 ký tự",
                      },
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Mật khẩu"
                        variant="outlined"
                        fullWidth
                        type={showPassword ? "text" : "password"}
                        error={!!errors.password_hash}
                        helperText={errors.password_hash?.message}
                        required
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowPassword(!showPassword)}
                                edge="end"
                              >
                                {showPassword ? (
                                  <VisibilityOffIcon />
                                ) : (
                                  <VisibilityIcon />
                                )}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid component="div">
                  <Controller
                    name="phone_number"
                    control={control}
                    rules={{
                      required: "Số điện thoại là bắt buộc",
                      pattern: {
                        value: /^[0-9]{10,11}$/,
                        message: "Số điện thoại không hợp lệ",
                      },
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Số điện thoại"
                        variant="outlined"
                        fullWidth
                        error={!!errors.phone_number}
                        helperText={errors.phone_number?.message}
                        required
                      />
                    )}
                  />
                </Grid>
                <Grid component="div">
                  <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Giới tính</InputLabel>
                        <Select {...field} label="Giới tính">
                          <MenuItem value="Nam">Nam</MenuItem>
                          <MenuItem value="Nữ">Nữ</MenuItem>
                          <MenuItem value="Khác">Khác</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>
                <Grid component="div">
                  <Controller
                    name="date_of_birth"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        label="Ngày sinh"
                        value={field.value ? dayjs(field.value) : null}
                        onChange={(newValue) => {
                          field.onChange(newValue ? newValue.format('YYYY-MM-DD') : null);
                        }}
                        slotProps={{
                          textField: {
                            variant: "outlined",
                            fullWidth: true,
                            error: !!errors.date_of_birth,
                            helperText: errors.date_of_birth?.message,
                          },
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid component="div">
                  <Controller
                    name="address"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Địa chỉ"
                        variant="outlined"
                        fullWidth
                        multiline
                      />
                    )}
                  />
                </Grid>
                <Grid component="div">
                  <Controller
                    name="ward"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Phường/Xã"
                        variant="outlined"
                        fullWidth
                      />
                    )}
                  />
                </Grid>
                <Grid component="div">
                  <Controller
                    name="district"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Quận/Huyện"
                        variant="outlined"
                        fullWidth
                      />
                    )}
                  />
                </Grid>
                <Grid component="div">
                  <Controller
                    name="province"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Tỉnh/Thành phố"
                        variant="outlined"
                        fullWidth
                      />
                    )}
                  />
                </Grid>
                <Grid component="div">
                  <Controller
                    name="role"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Vai trò</InputLabel>
                        <Select {...field} label="Vai trò">
                          <MenuItem value="admin">Quản trị viên</MenuItem>
                          <MenuItem value="customer">Khách hàng</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>
                <Grid component="div">
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Trạng thái</InputLabel>
                        <Select {...field} label="Trạng thái">
                          <MenuItem value="active">Hoạt động</MenuItem>
                          <MenuItem value="inactive">Không hoạt động</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: "#fafafa" }}>
          <Button onClick={handleClose} variant="outlined">
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit(handleFormSubmit)}
          >
            {editingUser ? "Cập nhật" : "Tạo mới"}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}
