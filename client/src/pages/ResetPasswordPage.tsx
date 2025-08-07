//TRANG DAT LAI MAT KHAU MOI
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Stack,
  CircularProgress,
  Snackbar,
  Alert as MuiAlert,
  InputAdornment, IconButton
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';

// Component Alert tùy chỉnh cho Snackbar
const Alert = React.forwardRef<HTMLDivElement, any>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [isOtpVerifiedForReset, setIsOtpVerifiedForReset] = useState(false); // ✅ State mới: Đã xác minh OTP cho đặt lại mật khẩu chưa

  const [resendTimer, setResendTimer] = useState(0);
  const resendIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });

  useEffect(() => {
    const emailFromUrl = searchParams.get('email');
    if (emailFromUrl) {
      setEmail(decodeURIComponent(emailFromUrl));
    } else {
      setSnackbar({ open: true, message: "Email không hợp lệ. Vui lòng thử lại.", severity: 'warning' });
      setTimeout(() => navigate('/forgot-password'), 3000);
    }
  }, [searchParams, navigate]);

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const isValidPassword = (password: string) => password.length >= 6;

  const startResendTimer = () => {
    setResendTimer(60);
    if (resendIntervalRef.current) {
      clearInterval(resendIntervalRef.current);
    }
    resendIntervalRef.current = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          clearInterval(resendIntervalRef.current!);
          resendIntervalRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendOTP = async () => {
    if (!email) {
      setSnackbar({ open: true, message: "Không tìm thấy email để gửi lại OTP.", severity: 'warning' });
      return;
    }

    setLoading(true);
    try {
      // Gọi lại endpoint gửi OTP cho forgot password
      const res = await axios.post('http://localhost:3000/api/auth/forgot-password-request-otp', { email });
      setSnackbar({ open: true, message: res.data.message || "Đã gửi lại mã xác nhận!", severity: 'success' });
      startResendTimer();
    } catch (error: any) {
      console.error("Lỗi gửi lại OTP:", error);
      const errorMessage = error.response?.data?.message || "Không thể gửi lại mã xác nhận. Vui lòng thử lại.";
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // ✅ HÀM MỚI: XÁC MINH OTP CHO ĐẶT LẠI MẬT KHẨU
  const handleVerifyOtpForReset = async () => {
    if (!otp) {
      setSnackbar({ open: true, message: "Vui lòng nhập mã OTP!", severity: 'warning' });
      return;
    }

    setLoading(true);
    try {
      // Gọi endpoint xác minh OTP cho đặt lại mật khẩu (có thể dùng chung hoặc riêng)
      // Backend cần phân biệt OTP này là cho đăng ký hay đặt lại mật khẩu
      const res = await axios.post('http://localhost:3000/api/auth/verify-otp-for-reset-password', { email, otp }); // ✅ Endpoint mới hoặc chỉnh sửa
      
      setSnackbar({ open: true, message: res.data.message || "Xác minh OTP thành công! Vui lòng đặt mật khẩu mới.", severity: 'success' });
      setIsOtpVerifiedForReset(true); // ✅ Đánh dấu đã xác minh thành công
      if (resendIntervalRef.current) {
        clearInterval(resendIntervalRef.current);
        resendIntervalRef.current = null;
      }
      setResendTimer(0);

    } catch (error: any) {
      console.error("Lỗi xác minh OTP đặt lại mật khẩu:", error);
      const errorMessage = error.response?.data?.message || "Xác minh OTP thất bại. Vui lòng kiểm tra lại mã.";
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Hàm đặt lại mật khẩu (chỉ gọi khi OTP đã được xác minh)
  const handleResetPassword = async () => {
    if (!isOtpVerifiedForReset) { // ✅ Đảm bảo OTP đã được xác minh
      setSnackbar({ open: true, message: "Vui lòng xác minh mã OTP trước!", severity: 'warning' });
      return;
    }
    if (!newPassword || !confirmNewPassword) {
      setSnackbar({ open: true, message: "Vui lòng nhập mật khẩu mới và xác nhận!", severity: 'warning' });
      return;
    }
    if (!isValidPassword(newPassword)) {
      setSnackbar({ open: true, message: "Mật khẩu mới phải có ít nhất 6 ký tự!", severity: 'warning' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setSnackbar({ open: true, message: "Mật khẩu xác nhận không khớp!", severity: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('http://localhost:3000/api/auth/reset-password', {
        email,
        // otp, // ✅ KHÔNG CẦN GỬI LẠI OTP NỮA VÌ ĐÃ XÁC MINH RỒI
        new_password: newPassword,
      });
      
      setSnackbar({ open: true, message: res.data.message || "Đặt lại mật khẩu thành công!", severity: 'success' });
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (error: any) {
      console.error("Lỗi đặt lại mật khẩu:", error);
      const errorMessage = error.response?.data?.message || "Đặt lại mật khẩu thất bại. Vui lòng thử lại.";
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 450, mx: 'auto', mt: 15, p: 4, bgcolor: '#fdf9ef', borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h5" fontWeight="bold" mb={3} textAlign="center" color="#333">Đặt lại mật khẩu</Typography>
      <Typography variant="body2" mb={3} textAlign="center" color="text.secondary">
        Email của bạn: <Box component="span" fontWeight="bold">{email}</Box>
      </Typography>

      {/* Phần nhập OTP và nút xác minh (luôn hiển thị ban đầu) */}
      {!isOtpVerifiedForReset ? ( // ✅ Chỉ hiển thị khi OTP chưa được xác minh
        <Stack spacing={2} mb={3}>
          <TextField
            fullWidth
            label="Mã xác nhận (OTP)"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            disabled={loading}
            type="number"
          />
          <Button
            fullWidth
            variant="contained" // Đổi thành contained cho nút xác minh chính
            onClick={handleVerifyOtpForReset} // ✅ Gọi hàm xác minh OTP mới
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Xác minh OTP"}
          </Button>
          <Button
            fullWidth
            variant="outlined" // Nút gửi lại OTP
            onClick={handleResendOTP}
            disabled={loading || resendTimer > 0}
          >
            {loading && !resendTimer ? <CircularProgress size={24} color="inherit" /> : (
              resendTimer > 0 ? `Gửi lại sau ${resendTimer}s` : "Gửi lại mã xác nhận"
            )}
          </Button>
        </Stack>
      ) : (
        // ✅ Phần nhập mật khẩu mới (chỉ hiển thị khi OTP đã được xác minh)
        <Stack spacing={2} mb={3}>
          <Typography variant="body2" color="primary" textAlign="center" fontWeight="bold">
            Mã xác nhận đã đúng. Vui lòng đặt mật khẩu mới.
          </Typography>
          <TextField
            fullWidth
            label="Mật khẩu mới"
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={loading}
            helperText={newPassword && !isValidPassword(newPassword) ? "Mật khẩu mới phải có ít nhất 6 ký tự!" : ""}
            error={newPassword && !isValidPassword(newPassword) ? true : false}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end">
                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            label="Xác nhận mật khẩu mới"
            type={showConfirmNewPassword ? 'text' : 'password'}
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            disabled={loading}
            helperText={confirmNewPassword && newPassword !== confirmNewPassword ? "Mật khẩu xác nhận không khớp!" : ""}
            error={confirmNewPassword && newPassword !== confirmNewPassword ? true : false}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)} edge="end">
                    {showConfirmNewPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            fullWidth
            variant="contained"
            onClick={handleResetPassword}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Đặt lại mật khẩu"}
          </Button>
        </Stack>
      )}

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

export default ResetPasswordPage;