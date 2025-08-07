// my-admin-app/src/pages/Login.tsx
import React, { useState, useEffect } from 'react';
import { Button, TextField, Box, Typography, Container, Paper, CircularProgress } from '@mui/material';
import { useAuth } from '../context/AuthContext'; // Import useAuth hook bạn đã tạo
import { useSnackbar } from '../hooks/useSnackbar'; // Nếu bạn có hook useSnackbar trong Admin App
import { useNavigate } from 'react-router-dom'; // Dùng useNavigate để điều hướng

// Component trang đăng nhập Admin
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // State để quản lý trạng thái loading khi gửi form

  const { login, isAuthenticated } = useAuth(); // Lấy hàm login và trạng thái isAuthenticated từ AuthContext
  const { openSnackbar } = useSnackbar(); // Lấy hook snackbar để hiển thị thông báo
  const navigate = useNavigate(); // Hook để điều hướng

  // Effect để kiểm tra nếu người dùng đã đăng nhập, chuyển hướng ngay lập tức
  useEffect(() => {
    if (isAuthenticated) {
      // Chuyển hướng đến trang Dashboard hoặc trang mặc định của Admin App
      navigate('/dashboard', { replace: true }); 
    }
  }, [isAuthenticated, navigate]); // Chạy khi isAuthenticated hoặc navigate thay đổi

  // Hàm xử lý khi gửi form đăng nhập
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); // Ngăn chặn hành vi mặc định của form
    setLoading(true); // Bắt đầu loading

    try {
      // Gửi yêu cầu POST đến API đăng nhập của backend
      const response = await fetch('http://localhost:3000/api/auth/login', { // ✅ Đảm bảo URL backend của bạn là đúng
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Backend của bạn mong đợi password_hash
        body: JSON.stringify({ email, password_hash: password }), 
      });

      const data = await response.json(); // Lấy dữ liệu phản hồi từ backend

      if (response.ok) {
        // Nếu đăng nhập thành công, gọi hàm login từ AuthContext
        // AuthContext sẽ lưu token và thông tin người dùng, sau đó tự động điều hướng
        login(data.token, data.user); 
        openSnackbar({ text: data.message || 'Đăng nhập thành công!', severity: 'success' });
      } else {
        // Nếu đăng nhập thất bại, hiển thị thông báo lỗi
        openSnackbar({ text: data.message || 'Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.', severity: 'error' });
      }
    } catch (error) {
      // Xử lý lỗi mạng hoặc lỗi không xác định
      console.error('Lỗi đăng nhập:', error);
      openSnackbar({ text: 'Lỗi kết nối đến máy chủ. Vui lòng thử lại sau.', severity: 'error' });
    } finally {
      setLoading(false); // Kết thúc loading
    }
  };

  return (
    <Container 
      component="main" 
      maxWidth="xs" 
      sx={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        // Thiết lập background cho trang login (tùy chọn)
        // backgroundImage: 'url(/path/to/your/background-image.jpg)', 
        // backgroundSize: 'cover',
        // backgroundPosition: 'center',
      }}
    >
      <Paper 
        elevation={6} // Tăng đổ bóng cho đẹp hơn
        sx={{ 
          p: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          width: '100%',
          borderRadius: 2, // Bo góc giấy
          backgroundColor: 'rgba(255, 255, 255, 0.9)', // Nền trong suốt nhẹ
        }}
      >
        <Typography component="h1" variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
          Đăng nhập Quản trị
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Địa chỉ Email"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Mật khẩu"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 3 }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading} // Vô hiệu hóa nút khi đang loading
            sx={{ 
              mt: 2, 
              mb: 2, 
              py: 1.5, // Tăng padding
              fontWeight: 'bold',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Đăng nhập'}
          </Button>
          {/* Bạn có thể thêm link quên mật khẩu hoặc đăng ký nếu Admin App có chức năng đó */}
          {/* <Typography variant="body2" sx={{ mt: 2 }}>
            <Link component={RouterLink} to="/forgot-password" variant="body2">
              Quên mật khẩu?
            </Link>
          </Typography> */}
        </Box>
      </Paper>
    </Container>
  );
}