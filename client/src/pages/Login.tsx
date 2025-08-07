import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  Stack,
  CircularProgress,
  Snackbar,
  Alert as MuiAlert,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import AppleIcon from '@mui/icons-material/Apple';
import GoogleIcon from '@mui/icons-material/Google'; // Có thể không cần nếu dùng GSI render button
import FacebookIcon from '@mui/icons-material/Facebook';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// Import type cho google.accounts
declare global {
  interface Window {
    google: any;
  }
}

const Alert = React.forwardRef<HTMLDivElement, any>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login: authLogin, isAuthenticated, loadingAuth } = useAuth();

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });

  // ✅ Client ID của bạn - HÃY THAY THẾ BẰNG ID THẬT CỦA BẠN TẠI ĐÂY
  // Nếu bạn lưu trong .env của frontend, hãy truy cập nó qua import.meta.env.VITE_GOOGLE_CLIENT_ID (Vite)
  // hoặc process.env.REACT_APP_GOOGLE_CLIENT_ID (Create React App)
  const GOOGLE_CLIENT_ID = "883960697284-onbjvhdhnkkcn54ttvqekb29d425lsi7.apps.googleusercontent.com"; // ✅ THAY THẾ BẰNG CLIENT ID THẬT CỦA BẠN

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.\S+$/.test(email);
  const isValidPassword = (password: string) => password.length >= 6;

  // Chuyển hướng nếu đã đăng nhập
  useEffect(() => {
    if (!loadingAuth && isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, loadingAuth, navigate]);

  // ✅ HÀM XỬ LÝ PHẢN HỒI TỪ GOOGLE
  const handleCredentialResponse = async (response: any) => {
    console.log("Encoded JWT ID token: " + response.credential);
    setLoading(true);
    try {
      // Gửi Google JWT đến Backend của bạn để xác thực
      const res = await axios.post('http://localhost:3000/api/auth/google-login', {
        token: response.credential, // Đây là JWT token từ Google
      });

      const { token, user } = res.data; // Backend của bạn cần trả về token và user object riêng của ứng dụng
      authLogin(token, user);
      setSnackbar({ open: true, message: 'Đăng nhập bằng Google thành công!', severity: 'success' });

    } catch (err: any) {
      console.error('Lỗi đăng nhập Google:', err);
      let errorMessage = 'Đăng nhập Google thất bại. Vui lòng thử lại.';
      if (err.response) {
        errorMessage = err.response.data?.message || err.response.statusText;
      } else if (err.request) {
        errorMessage = 'Không nhận được phản hồi từ server khi đăng nhập Google.';
      } else {
        errorMessage = err.message;
      }
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // ✅ useEffect để khởi tạo Google Sign-In
  useEffect(() => {
    // Chỉ khởi tạo nếu người dùng chưa xác thực (để không hiển thị nút khi đã đăng nhập)
    // và thư viện Google đã tải xong
    if (!isAuthenticated && window.google && window.google.accounts && window.google.accounts.id) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID, // ✅ SỬ DỤNG CLIENT ID CỦA BẠN TẠI ĐÂY
        callback: handleCredentialResponse, // Hàm callback khi nhận được phản hồi JWT
      });

      // Render nút đăng nhập Google vào một div cụ thể
      // `renderButton` chỉ được gọi khi div tồn tại
      window.google.accounts.id.renderButton(
        document.getElementById("signInDiv"), // ID của div mà nút sẽ được render vào
        { theme: "outline", size: "large", text: "signin_with", width: "300px" } // Tùy chỉnh nút
      );

      // Có thể thêm tính năng Google One Tap (đăng nhập tự động khi quay lại)
      // window.google.accounts.id.prompt();
    }
    // Nếu đã đăng nhập, và đang hiển thị trang này (ví dụ: quay lại từ /), ẩn nút Google
    if (isAuthenticated) {
        const signInDiv = document.getElementById("signInDiv");
        if (signInDiv) signInDiv.style.display = 'none';
    } else {
        const signInDiv = document.getElementById("signInDiv");
        if (signInDiv) signInDiv.style.display = 'block';
    }

  }, [isAuthenticated, GOOGLE_CLIENT_ID]); // Chạy lại khi isAuthenticated hoặc CLIENT_ID thay đổi


  const handleLogin = async () => {
    if (!email) {
      setSnackbar({ open: true, message: 'Vui lòng nhập email!', severity: 'warning' });
      return;
    }
    if (!isValidEmail(email)) {
      setSnackbar({ open: true, message: 'Email không hợp lệ!', severity: 'warning' });
      return;
    }
    if (!password) {
      setSnackbar({ open: true, message: 'Vui lòng nhập mật khẩu!', severity: 'warning' });
      return;
    }
    if (!isValidPassword(password)) {
      setSnackbar({ open: true, message: 'Mật khẩu phải có ít nhất 6 ký tự!', severity: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('http://localhost:3000/api/auth/login', {
        email,
        password_hash: password, // Đảm bảo backend của bạn nhận `password_hash`
      });

      const token = res.data.token;
      const user = res.data.user;

      authLogin(token, user);
      setSnackbar({ open: true, message: 'Đăng nhập thành công!', severity: 'success' });

    } catch (err: any) {
      console.error('Lỗi đăng nhập:', err);
      let errorMessage = 'Đăng nhập thất bại. Vui lòng thử lại.';
      if (err.response) {
        errorMessage = err.response.data?.message || err.response.statusText;
      } else if (err.request) {
        errorMessage = 'Không nhận được phản hồi từ server. Đảm bảo backend đang chạy.';
      } else {
        errorMessage = err.message;
      }
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };
console.log("Client ID being used:", GOOGLE_CLIENT_ID);
  return (
    <Box
      sx={{
        maxWidth: 400,
        mx: 'auto',
        mt: 16,
        mb: 8,
        p: 4,
        bgcolor: '#fdf9ef',
        borderRadius: 2,
        boxShadow: 3,
      }}
    >
      <Typography variant="h6" fontWeight="bold">Đăng nhập</Typography>
      <Typography variant="h5" mt={1} mb={2} fontWeight="bold" color="text.primary">
        Night Owls chào bạn trở lại.
      </Typography>
      <Typography variant="body2" mb={2}>
        Bạn chưa có tài khoản?{' '}
        <Typography
          component={Link}
          to="/register"
          sx={{
            color: '#b38b40',
            cursor: 'pointer',
            textDecoration: 'none',
            fontWeight: 'bold',
            '&:hover': {
              textDecoration: 'underline'
            }
          }}
        >
          Tạo tài khoản
        </Typography>
      </Typography>

      <TextField
        fullWidth
        variant="standard"
        placeholder="Nhập email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <EmailIcon />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3 }}
        disabled={loading}
        helperText={email && !isValidEmail(email) ? "Email không hợp lệ" : ""}
        error={email && !isValidEmail(email) ? true : false}
      />

      <TextField
        fullWidth
        variant="standard"
        placeholder="Nhập mật khẩu"
        type={showPassword ? 'text' : 'password'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LockIcon />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3 }}
        disabled={loading}
        helperText={password && !isValidPassword(password) ? "Mật khẩu phải có ít nhất 6 ký tự" : ""}
        error={password && !isValidPassword(password) ? true : false}
      />

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <FormControlLabel
          control={<Checkbox sx={{ color: '#b38b40' }} />}
          label="Ghi nhớ mật khẩu cho lần sau"
          disabled={loading}
        />
        <Typography
          variant="body2"
          component={Link}
          to="/forgot-password"
          sx={{
            color: '#b38b40',
            cursor: 'pointer',
            textDecoration: 'none',
            fontWeight: 'bold',
            '&:hover': {
              textDecoration: 'underline'
            }
          }}
          disabled={loading}
        >
          Quên mật khẩu?
        </Typography>
      </Box>

      <Button
        fullWidth
        variant="contained"
        sx={{ bgcolor: '#1e1e1c', color: '#fff', py: 1.5, fontWeight: 'bold', mb: 2 }}
        onClick={handleLogin}
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : "ĐĂNG NHẬP"}
      </Button>

      <Typography align="center" mb={2}>Hoặc đăng nhập bằng</Typography>

      <Stack direction="row" justifyContent="center" spacing={3}>
        {/* ✅ GOOGLE LOGIN BUTTON - sẽ được render vào div này */}
        <div id="signInDiv" style={{ width: 'auto' }}></div>
      </Stack>

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

export default LoginPage;