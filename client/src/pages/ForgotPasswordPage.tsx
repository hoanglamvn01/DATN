// TRANG YEU CAU DAT LAI MAT KHAU
import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Stack,
  CircularProgress,
  Snackbar,
  Alert as MuiAlert,
} from '@mui/material';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

// Component Alert tùy chỉnh cho Snackbar
const Alert = React.forwardRef<HTMLDivElement, any>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleForgotPassword = async () => {
    if (!email) {
      setSnackbar({ open: true, message: "Vui lòng nhập email!", severity: 'warning' });
      return;
    }
    if (!isValidEmail(email)) {
      setSnackbar({ open: true, message: "Email không hợp lệ!", severity: 'warning' });
      return;
    }

    setLoading(true);
    try {
      // Gửi yêu cầu OTP để đặt lại mật khẩu
      // Endpoint này KHÁC với request-otp của đăng ký. Nó cần xác nhận email tồn tại.
      const res = await axios.post('http://localhost:3000/api/auth/forgot-password-request-otp', { email });

      setSnackbar({ open: true, message: res.data.message || "Mã xác nhận đã được gửi đến email của bạn.", severity: 'success' });

      // Sau khi gửi OTP, chuyển hướng người dùng đến trang đặt lại mật khẩu với email đó
      setTimeout(() => {
        navigate(`/reset-password?email=${encodeURIComponent(email)}`);
      }, 2000);

    } catch (error: any) {
      console.error("Lỗi yêu cầu đặt lại mật khẩu:", error);
      const errorMessage = error.response?.data?.message || "Không thể gửi mã xác nhận. Vui lòng thử lại.";
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 450, mx: 'auto', mt: 17, mb: 8, p: 4, bgcolor: '#fdf9ef', borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h5" fontWeight="bold" mb={3} textAlign="center" color="#333">Quên mật khẩu</Typography>
      <Typography variant="body2" mb={3} textAlign="center" color="text.secondary">
        Vui lòng nhập địa chỉ email bạn đã đăng ký để nhận mã xác nhận.
      </Typography>

      <TextField
        fullWidth
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
        helperText={!isValidEmail(email) && email ? "Email không hợp lệ" : ""}
        error={!isValidEmail(email) && email ? true : false}
        sx={{ mb: 2 }}
      />

      <Button
        fullWidth
        variant="contained"
        onClick={handleForgotPassword}
        disabled={loading}
        sx={{ mb: 2 }}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : "Gửi mã xác nhận"}
      </Button>

      <Typography variant="body2" textAlign="center">
        <Link to="/login" style={{ textDecoration: 'none', color: '#b38b40', fontWeight: 'bold' }}>
          Quay lại Đăng nhập
        </Link>
      </Typography>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ForgotPasswordPage;
