// src/components/PrivateRoute.tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material'; 

interface PrivateRouteProps {
  children?: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated, loadingAuth } = useAuth(); 

  // Hiển thị loading spinner trong khi đang kiểm tra trạng thái xác thực ban đầu
  if (loadingAuth) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Đang kiểm tra phiên đăng nhập...</Typography>
      </Box>
    );
  }

  // Nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />; // `replace` để thay thế entry hiện tại trong lịch sử
  }

  // Nếu đã đăng nhập, hiển thị nội dung của route con
  return children ? <>{children}</> : <Outlet />;
};

export default PrivateRoute;