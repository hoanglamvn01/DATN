// my-admin-app/src/components/PrivateRoute.tsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // ✅ Import useAuth từ context mới tạo
import { CircularProgress, Box, Typography } from '@mui/material'; // Để hiển thị loading UI

interface PrivateRouteProps {
  children: React.ReactNode;
  roles?: ('admin' | 'customer')[]; // Các vai trò được phép truy cập tuyến này
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, roles }) => {
  const { isAuthenticated, user, loading } = useAuth(); // Lấy trạng thái từ AuthContext

  // 1. Hiển thị loading trong khi AuthContext đang kiểm tra xác thực ban đầu
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Đang kiểm tra xác thực...</Typography>
      </Box>
    );
  }

  // 2. Nếu chưa xác thực (chưa đăng nhập)
  if (!isAuthenticated) {
    // Chuyển hướng đến trang đăng nhập của Admin App
    return <Navigate to="/login" replace />;
  }

  // 3. Nếu đã xác thực, kiểm tra vai trò (nếu `roles` được truyền vào và yêu cầu vai trò cụ thể)
  if (roles && user && !roles.includes(user.role)) {
    // Nếu người dùng không có vai trò phù hợp (ví dụ: là customer nhưng truy cập admin panel)
    // Chuyển hướng đến trang đăng nhập hoặc một trang báo lỗi "không có quyền"
    return <Navigate to="/login" replace />; // Hoặc Navigate to "/unauthorized" nếu bạn có trang đó
  }

  // 4. Nếu đã xác thực và có quyền, hiển thị component con (trang được bảo vệ)
  return <>{children}</>;
};

export default PrivateRoute;