import React, { useState, useRef } from 'react'; // Thêm useRef cho timer
import {
  Box,
  Button,
  TextField,
  Typography,
  Stack,
  InputAdornment, // Để thêm icon vào TextField
  IconButton,     // Để tạo icon button
  CircularProgress, // Để hiển thị loading spinner
  // Thêm Snackbar và Alert để hiển thị thông báo đẹp hơn
  Snackbar,
  Alert as MuiAlert,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';


// Component Alert tùy chỉnh cho Snackbar
const Alert = React.forwardRef<HTMLDivElement, any>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const RegisterPage = () => {
  // --- STATE QUẢN LÝ FORM VÀ TRẠNG THÁI ---
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // Thêm xác nhận mật khẩu

  const [otp, setOtp] = useState('');
  const [isOTPSent, setIsOTPSent] = useState(false); // Trạng thái đã gửi OTP
  const [isVerified, setIsVerified] = useState(false); // Trạng thái đã xác minh email qua OTP

  const [loading, setLoading] = useState(false); // Trạng thái loading chung cho các request
  const [showPassword, setShowPassword] = useState(false); // State ẩn/hiện mật khẩu
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // State ẩn/hiện xác nhận mật khẩu

  // State cho bộ đếm thời gian gửi lại OTP
  const [resendTimer, setResendTimer] = useState(0);
  const resendIntervalRef = useRef<NodeJS.Timeout | null>(null); // Ref để giữ ID của interval

  // State cho Snackbar thông báo
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });

  // --- HÀM HỖ TRỢ HIỂN THỊ SNACKBAR ---
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // --- HÀM BỘ ĐẾM THỜI GIAN GỬI LẠI OTP ---
  const startResendTimer = () => {
    setResendTimer(60); // Đặt lại 60 giây
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

  // --- VALIDATION PHÍA FRONTEND ---
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPassword = (password: string) => password.length >= 6; // Ví dụ: Mật khẩu tối thiểu 6 ký tự

  // --- HÀM XỬ LÝ GỬI MÃ XÁC NHẬN (OTP) ---
  const handleSendOTP = async () => {
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
      console.log("Đang gửi yêu cầu OTP cho email:", email);
      const res = await axios.post('http://localhost:3000/api/auth/request-otp', { email });
      console.log("Phản hồi từ server (gửi OTP):", res.data);
      setSnackbar({ open: true, message: res.data.message || "Đã gửi OTP đến email của bạn!", severity: 'success' });
      setIsOTPSent(true);
      startResendTimer(); // Bắt đầu đếm ngược thời gian gửi lại
    } catch (error: any) {
      console.error("Lỗi khi gửi OTP:", error);
      let errorMessage = "Không thể gửi OTP. Vui lòng thử lại.";
      if (error.response) {
        errorMessage = error.response.data?.message || error.response.statusText;
      } else if (error.request) {
        errorMessage = "Không nhận được phản hồi từ server. Đảm bảo backend đang chạy và không bị chặn CORS.";
      } else {
        errorMessage = error.message;
      }
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // --- HÀM XỬ LÝ XÁC MINH OTP ---
  const handleVerifyOTP = async () => {
    if (!otp) {
      setSnackbar({ open: true, message: "Vui lòng nhập mã OTP!", severity: 'warning' });
      return;
    }

    setLoading(true);
    try {
      console.log("Đang xác minh OTP:", otp, "cho email:", email);
      const res = await axios.post('http://localhost:3000/api/auth/verify-otp', { email, otp });
      console.log("Phản hồi từ server (xác minh OTP):", res.data);
      setSnackbar({ open: true, message: res.data.message || "Xác minh thành công!", severity: 'success' });
      setIsVerified(true);
      if (resendIntervalRef.current) { // Dừng timer nếu xác minh thành công
        clearInterval(resendIntervalRef.current);
        resendIntervalRef.current = null;
      }
      setResendTimer(0); // Reset timer
    } catch (error: any) {
      console.error("Lỗi khi xác minh OTP:", error);
      const errorMessage = error.response?.data?.message || "Xác minh thất bại. Vui lòng thử lại.";
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // --- HÀM XỬ LÝ ĐĂNG KÝ (Tạo tài khoản) ---
  const handleRegister = async () => {
    // 1. Kiểm tra xác minh OTP
    if (!isVerified) {
      setSnackbar({ open: true, message: 'Vui lòng xác minh email bằng OTP trước khi đăng ký!', severity: 'warning' });
      return;
    }

    // 2. Kiểm tra các trường thông tin bắt buộc
    if (!fullName || !email || !password || !confirmPassword || !phoneNumber) {
      setSnackbar({ open: true, message: 'Vui lòng điền đầy đủ tất cả các thông tin đăng ký!', severity: 'warning' });
      return;
    }

    // 3. Kiểm tra mật khẩu
    if (!isValidPassword(password)) {
      setSnackbar({ open: true, message: 'Mật khẩu phải có ít nhất 6 ký tự!', severity: 'warning' });
      return;
    }
    if (password !== confirmPassword) {
      setSnackbar({ open: true, message: 'Mật khẩu xác nhận không khớp!', severity: 'warning' });
      return;
    }

    setLoading(true);
    try {
      console.log("Đang gửi yêu cầu đăng ký người dùng mới...");
      await axios.post('http://localhost:3000/api/auth/register', {
        full_name: fullName,
        email,
        password_hash: password, // Đảm bảo backend của bạn nhận `password_hash`
        phone_number: phoneNumber,
      });
      console.log("Đăng ký thành công!");
      setSnackbar({ open: true, message: "Đăng ký tài khoản thành công!", severity: 'success' });

      // --- RESET FORM SAU KHI ĐĂNG KÝ THÀNH CÔNG ---
      setFullName('');
      setEmail('');
      setPhoneNumber('');
      setPassword('');
      setConfirmPassword('');
      setOtp('');
      setIsOTPSent(false);
      setIsVerified(false);
      if (resendIntervalRef.current) { // Dừng timer nếu vẫn chạy
        clearInterval(resendIntervalRef.current);
        resendIntervalRef.current = null;
      }
      setResendTimer(0);
setTimeout(() => {
  navigate('/login'); // Chuyển hướng về trang đăng nhập
}, 1500); // Chờ 1.5 giây để người dùng thấy thông báo

    } catch (error: any) {
      console.error("Lỗi khi đăng ký:", error);
      const errorMessage = error.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.";
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // --- JSX (Giao diện người dùng) ---
  return (
    <Box sx={{ maxWidth: 450, mx: 'auto', mt: 17, mb: 8, p: 4, bgcolor: '#fdf9ef', borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h5" fontWeight="bold" mb={3} textAlign="center" color="#333">Đăng ký tài khoản</Typography>

      {/* Trường Email và nút Gửi mã xác nhận */}
      <Stack spacing={2} mb={2}>
        <TextField
          fullWidth
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isOTPSent || loading} // Email bị disable khi OTP đã gửi hoặc đang loading
          helperText={!isValidEmail(email) && email ? "Email không hợp lệ" : ""}
          error={!isValidEmail(email) && email ? true : false}
        />
        <Button
          fullWidth
          variant="contained" // Dùng contained cho nút chính
          onClick={handleSendOTP}
          disabled={isOTPSent || loading || resendTimer > 0} // Disable khi OTP đã gửi, đang loading, hoặc timer đang chạy
        >
          {loading && !isOTPSent ? <CircularProgress size={24} color="inherit" /> : ( // Hiển thị spinner khi đang gửi
            resendTimer > 0 ? `Gửi lại sau ${resendTimer}s` : "Gửi mã xác nhận"
          )}
        </Button>
      </Stack>

      {/* Trường OTP và nút Xác minh OTP (chỉ hiển thị khi OTP đã được gửi và chưa xác minh) */}
      {isOTPSent && !isVerified && (
        <Stack spacing={2} mb={2}>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư (cả mục spam/junk).
          </Typography>
          <TextField
            fullWidth
            label="Nhập mã OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            disabled={isVerified || loading}
            type="number" // Đảm bảo chỉ nhập số
          />
          <Button variant="contained" onClick={handleVerifyOTP} disabled={isVerified || loading}>
            {loading && otp ? <CircularProgress size={24} color="inherit" /> : "Xác minh OTP"}
          </Button>
        </Stack>
      )}

      {/* Các trường thông tin còn lại và nút Đăng ký (chỉ hiển thị khi đã xác minh email) */}
      {isVerified && (
        <Stack spacing={2} mb={3}>
          <Typography variant="body2" color="primary" textAlign="center" fontWeight="bold">
            Email đã được xác minh. Vui lòng hoàn tất thông tin đăng ký.
          </Typography>
          <TextField fullWidth label="Họ và tên" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={loading} />
          <TextField fullWidth label="Số điện thoại" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} disabled={loading} type="tel" />

          <TextField
            fullWidth
            label="Mật khẩu"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            helperText={password && !isValidPassword(password) ? "Mật khẩu phải có ít nhất 6 ký tự" : ""}
            error={password && !isValidPassword(password) ? true : false}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            label="Xác nhận mật khẩu"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            helperText={confirmPassword && password !== confirmPassword ? "Mật khẩu xác nhận không khớp" : ""}
            error={confirmPassword && password !== confirmPassword ? true : false}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button fullWidth variant="contained" onClick={handleRegister} disabled={loading}>
            {loading ? <CircularProgress size={24} color="inherit" /> : "Đăng ký"}
          </Button>
        </Stack>
      )}

      {/* Snackbar để hiển thị thông báo */}
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

export default RegisterPage;
