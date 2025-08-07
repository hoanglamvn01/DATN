// src/theme.ts
import { createTheme, responsiveFontSizes } from '@mui/material/styles';

// Định nghĩa theme cho chế độ SÁNG
let nightOwlsTheme = createTheme({
  palette: {
    mode: 'light', // Đây là theme mặc định cho chế độ sáng
    primary: {
      main: '#556cd6', // Main primary color
    },
    secondary: {
      main: '#19857b', // Main secondary color
    },
    error: {
      main: '#ff1744', // Error color
    },
    background: {
      default: '#f4f6f8', // Light background for pages
      paper: '#ffffff',   // White background for Paper components
    },
    text: {
      primary: '#212B36', // Dark text for light mode
      secondary: '#637381',
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
    h1: {
      fontSize: '3rem',
      fontWeight: 700,
    },
    h4: {
      fontWeight: 700,
    },
    // Thêm các kiểu chữ khác theo thiết kế của bạn
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#f4f6f8', // Màu nền AppBar trong chế độ sáng
          color: '#333',
          boxShadow: 'none',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff', // Màu nền Drawer trong chế độ sáng
          color: '#333',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: '#e0e0e0', // Màu nền khi được chọn trong light mode
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: '#e0e0e0',
          color: 'rgba(0, 0, 0, 0.87)',
        },
        body: {
          color: 'rgba(0, 0, 0, 0.87)',
        },
      },
    },
  },
  // ... thêm bất kỳ tùy chỉnh nào khác của bạn
});

nightOwlsTheme = responsiveFontSizes(nightOwlsTheme);

export default nightOwlsTheme;
