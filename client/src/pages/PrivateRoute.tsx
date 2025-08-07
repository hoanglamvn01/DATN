// chỉ cho phép người dùng đã đăng nhập truy cập
// src/components/PrivateRoute.tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material'; // Để hiển thị loading

interface PrivateRouteProps {
  children?: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated, loadingAuth } = useAuth(); // Lấy trạng thái từ AuthContext

  if (loadingAuth) {
    // Hiển thị loading spinner trong khi đang kiểm tra trạng thái xác thực ban đầu
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Đang kiểm tra phiên đăng nhập...</Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    // Nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập
    return <Navigate to="/login" replace />;
  }

  // Nếu đã đăng nhập, hiển thị nội dung của route con
  return children ? <>{children}</> : <Outlet />;
};

export default PrivateRoute;