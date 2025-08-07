// src/context/ThemeContext.tsx
import React, { useState, useMemo, createContext, ReactNode, useEffect } from 'react';
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

// Import theme gốc của bạn (chỉ là nền tảng cho light mode)
import baseNightOwlsTheme from '../theme';

// Định nghĩa props cho ThemeContext
interface ThemeContextProps {
  toggleColorMode: () => void;
  mode: 'light' | 'dark';
 
}

// Tạo và export ThemeContext
export const ThemeContext = createContext<ThemeContextProps>({
  toggleColorMode: () => {},
  mode: 'light',
});

interface ThemeContextProviderProps {
  children: ReactNode;
}

export function ThemeContextProvider({ children }: ThemeContextProviderProps) {
  // Lấy mode từ localStorage, nếu không có thì mặc định là 'light'
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    const savedMode = localStorage.getItem('themeMode');
    return savedMode === 'dark' ? 'dark' : 'light';
  });

  // Lưu mode vào localStorage mỗi khi nó thay đổi
  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  // Hàm để chuyển đổi chế độ
  const toggleColorMode = useMemo(
    () => () => {
      setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
    },
    [],
  );

  // Tạo theme động dựa trên mode và theme gốc của bạn
  const theme = useMemo(
    () => {
      const dynamicTheme = createTheme({
        ...baseNightOwlsTheme, // Kế thừa toàn bộ cấu hình từ theme gốc của bạn
        palette: {
          ...baseNightOwlsTheme.palette, // Kế thừa palette gốc
          mode, // Ghi đè mode dựa trên state

          // Tùy chỉnh màu sắc riêng cho dark mode (sẽ ghi đè lên baseNightOwlsTheme.palette khi mode là 'dark')
          ...(mode === 'dark' && {
            primary: {
              main: '#90CAF9', // Màu primary sáng hơn cho dark mode
              light: '#BBDEFB',
              dark: '#64B5F6',
            },
            secondary: {
              main: '#F48FB1', // Màu secondary sáng hơn cho dark mode
              light: '#FFCDD2',
              dark: '#EF9A9A',
            },
            background: {
              default: '#121212', // Nền tối
              paper: '#1E1E1E',   // Nền Paper tối
            },
            text: {
              primary: '#E0E0E0', // Chữ sáng cho dark mode
              secondary: '#B0B0B0',
            },
          }),
        },
        components: {
          ...baseNightOwlsTheme.components, // Kế thừa components gốc
          // Ghi đè hoặc thêm styles cho components trong dark mode
          ...(mode === 'dark' && {
            MuiAppBar: {
              styleOverrides: {
                root: {
                  backgroundColor: '#1f1f1f', // Màu nền AppBar trong dark mode
                  color: '#eee',
                  boxShadow: 'none',
                },
              },
            },
            MuiDrawer: {
              styleOverrides: {
                paper: {
                  backgroundColor: '#1f1f1f', // Màu nền Drawer trong dark mode
                  color: '#eee',
                },
              },
            },
            MuiListItemButton: {
              styleOverrides: {
                root: {
                  '&.Mui-selected': {
                    backgroundColor: '#333', // Màu nền khi được chọn trong dark mode
                    color: '#90CAF9', // Màu chữ khi được chọn
                  },
                  '&.Mui-focusVisible': {
                    backgroundColor: '#333',
                  },
                  '&:hover': {
                    backgroundColor: '#2a2a2a',
                  },
                },
              },
            },
            MuiPaper: {
              styleOverrides: {
                root: {
                  backgroundColor: '#1e1e1e',
                },
              },
            },
            MuiTableCell: {
              styleOverrides: {
                head: {
                  backgroundColor: '#2a2a2a',
                  color: '#e0e0e0',
                },
                body: {
                  color: '#e0e0e0',
                },
              },
            },
            MuiChip: {
              styleOverrides: {
                root: ({ ownerState }) => ({
                  fontWeight: 'bold',
                  ...(ownerState.color === 'success' && {
                    backgroundColor: '#388E3C', // Màu tối hơn cho dark mode
                    color: '#FFF',
                  }),
                  ...(ownerState.color === 'warning' && {
                    backgroundColor: '#FFA000',
                    color: '#FFF',
                  }),
                  ...(ownerState.color === 'error' && {
                    backgroundColor: '#D32F2F',
                    color: '#FFF',
                  }),
                }),
              },
            },
          }),
        },
      });
      return responsiveFontSizes(dynamicTheme);
    },
    [mode],
  );

  return (
    <ThemeContext.Provider value={{ toggleColorMode, mode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}