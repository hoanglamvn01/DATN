import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer, // Component quan trọng tạo Sidebar
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  CssBaseline,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu'; // Icon cho nút mở Sidebar trên mobile
import DashboardIcon from '@mui/icons-material/Dashboard';
import CategoryIcon from '@mui/icons-material/Category';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks'; // Quản lý bài viết
import ReviewsIcon from '@mui/icons-material/Reviews';           // Quản lý đánh giá

import { Link as RouterLink } from 'react-router-dom'; // Dùng để liên kết các mục menu với React Router
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber' // <-- Icon này đã đúng, chỉ cần để nó cùng với các icon khác

// Chiều rộng cố định của Sidebar trên desktop
const drawerWidth = 240;

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  // State để quản lý việc mở/đóng Sidebar trên thiết bị di động
  const [mobileOpen, setMobileOpen] = useState(false);

  // Hàm xử lý khi nhấn nút mở/đóng Sidebar trên di động
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // --- Danh sách các mục trong Sidebar ---
  const navItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Quản lý Danh mục', icon: <CategoryIcon />, path: '/categories' },
    { text: 'Quản lý Sản phẩm', icon: <ShoppingBagIcon />, path: '/products' },
    { text: 'Quản lý Người dùng', icon: <PeopleIcon />, path: '/users' },
    { text: 'Quản lý Voucher', icon: <ConfirmationNumberIcon />, path: '/vouchers' }, // <-- THÊM DÒNG NÀY VÀO ĐÂY
    { text: 'Quản lý Bài viết', icon: <LibraryBooksIcon />, path: '/posts' },
    { text: 'Quản lý Đánh giá', icon: <ReviewsIcon />, path: '/reviews' },
    { text: 'Cài đặt', icon: <SettingsIcon />, path: '/settings' },
  ];

  // --- Nội dung của Sidebar (dùng chung cho cả bản mobile và desktop) ---
  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ my: 2 }}>
        Admin Panel
      </Typography>
      <Divider /> {/* Đường phân cách */}
      <List> {/* Danh sách các mục điều hướng chính */}
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            {/* ListItemButton là một nút bấm, component={RouterLink} để nó hoạt động như một Link của React Router */}
            <ListItemButton component={RouterLink} to={item.path}>
              <ListItemIcon>{item.icon}</ListItemIcon> {/* Biểu tượng */}
              <ListItemText primary={item.text} /> {/* Văn bản của mục menu */}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List> {/* Danh sách các mục khác (ví dụ: Đăng xuất) */}
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemIcon><LogoutIcon /></ListItemIcon>
            <ListItemText primary="Đăng xuất" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      {/* --- Thanh AppBar (Header) --- */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          {/* Nút Menu chỉ hiển thị trên màn hình di động */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }} // Ẩn nút này trên màn hình lớn hơn sm (600px)
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Admin Dashboard
          </Typography>
          {/* Các phần tử khác của AppBar (ví dụ: thông báo, avatar) có thể thêm ở đây */}
        </Toolbar>
      </AppBar>

      {/* --- Vùng Sidebar Navigation --- */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="primary sidebar"
      >
        {/* Sidebar cho màn hình di động (temporary) */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Tối ưu hiệu suất mở/đóng
          }}
          sx={{
            display: { xs: 'block', sm: 'none' }, // Chỉ hiển thị trên màn hình rất nhỏ (mobile)
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer} {/* Sử dụng nội dung Sidebar đã định nghĩa ở trên */}
        </Drawer>

        {/* Sidebar cho màn hình máy tính (permanent) */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' }, // Chỉ hiển thị từ màn hình sm (desktop) trở lên
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open // Luôn mở trên desktop
        >
          {drawer} {/* Sử dụng nội dung Sidebar đã định nghĩa ở trên */}
        </Drawer>
      </Box>

      {/* --- Khu vực nội dung chính --- */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: '64px', // Đẩy nội dung xuống dưới AppBar
        }}
      >
        {children} {/* Các trang Dashboard, CategoryManager, v.v. sẽ hiển thị ở đây */}
      </Box>
    </Box>
  );
}