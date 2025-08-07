// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';


// Import các context của bạn
import { ThemeContextProvider } from './context/ThemeContext'; 
import { SnackbarProvider } from './context/SnackbarContext.tsx';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material'; // Thêm CssBaseline ở đây để reset CSS mặc định


// Tùy chỉnh theme cơ bản cho Material-UI
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Màu xanh dương đậm
    },
    secondary: {
      main: '#dc004e', // Màu hồng
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif', // Font chữ mặc định
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeContextProvider> {/* Đặt ThemeContextProvider ở đây nếu nó là một provider riêng */}
      <SnackbarProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline /> {/* Đặt CssBaseline bên trong ThemeProvider */}
          <App />
        </ThemeProvider>
      </SnackbarProvider>
    </ThemeContextProvider>
  </React.StrictMode>



);