import React, { useState } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  CircularProgress, 
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CategoryIcon from '@mui/icons-material/Category';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import FavoriteIcon from '@mui/icons-material/Favorite';
import LoyaltyIcon from '@mui/icons-material/Loyalty';
import StoreIcon from '@mui/icons-material/Store';
import ArticleIcon from '@mui/icons-material/Article';
import ReceiptIcon from '@mui/icons-material/Receipt';
import RateReviewIcon from '@mui/icons-material/RateReview';
import { Link as RouterLink, useLocation } from 'react-router-dom';

import { useAuth } from '../context/AuthContext'; // ✅ IMPORT useAuth từ đúng đường dẫn trong Admin App
// import Header from './Header'; // Nếu bạn có Admin Header riêng

const drawerWidth = 240;

// LayoutProps chỉ cần children, vì logic authorized đã được PrivateRoute xử lý bên ngoài
interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { logout } = useAuth(); // ✅ Lấy hàm logout từ AuthContext

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Cập nhật đường dẫn (path) để phản ánh cấu trúc gốc của Admin App
  // Ví dụ: /dashboard, /users, v.v. (KHÔNG CÓ TIỀN TỐ /admin/)
  const navItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' }, // Đường dẫn gốc của Admin App
    { text: 'Quản lý danh mục', icon: <CategoryIcon />, path: '/categories' },
    { text: 'Quản lý sản phẩm', icon: <ShoppingBagIcon />, path: '/products' },
    { text: 'Quản lý sản phẩm yêu thích', icon: <FavoriteIcon />, path: '/favorites' },
    { text: 'Quản lý người dùng', icon: <PeopleIcon />, path: '/users' },
    { text: 'Quản lý thương hiệu', icon: <StoreIcon />, path: '/brands' },
    { text: 'Quản lý mã giảm giá', icon: <LoyaltyIcon />, path: '/vouchers' },
    { text: 'Quản lý đơn hàng', icon: <ReceiptIcon />, path: '/orders' },
    { text: 'Quản lý bài viết', icon: <ArticleIcon />, path: '/posts' },
    { text: 'Quản lý đánh giá sản phẩm', icon: <RateReviewIcon />, path: '/reviews' },
    { text: 'Quản lý liên hệ', icon: <ContactMailIcon />, path: '/contact' },
    { text: 'Cài đặt', icon: <SettingsIcon />, path: '/settings' },
  ];

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ my: 2 }}>
        Night Owls - Admin Panel
      </Typography>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={RouterLink}
              to={item.path}
              selected={location.pathname === item.path}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '& .MuiListItemIcon-root': { color: 'white' },
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={logout}> {/* ✅ Gọi hàm logout từ AuthContext */}
            <ListItemIcon><LogoutIcon /></ListItemIcon>
            <ListItemText primary="Đăng xuất" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  // Không cần logic loading/authorized ở đây vì PrivateRoute đã xử lý.

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Nếu bạn có một Header riêng cho Admin, import và render nó ở đây */}
      {/* Ví dụ: <Header drawerWidth={drawerWidth} handleDrawerToggle={handleDrawerToggle} /> */}
      
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="primary sidebar"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          // mt: '64px', // Thêm margin-top nếu bạn có Header cố định
        }}
      >
        {children} {/* Đây là nơi các trang con của admin (UserManager, Dashboard, v.v.) sẽ được hiển thị */}
      </Box>
    </Box>
  );
}