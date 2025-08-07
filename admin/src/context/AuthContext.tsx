// my-admin-app/src/context/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from '../hooks/useSnackbar'; // Giả sử bạn có hook useSnackbar trong Admin App

// Định nghĩa kiểu dữ liệu cho thông tin người dùng được lưu trữ trong context
// Đảm bảo các trường này khớp với dữ liệu 'user' mà backend trả về khi đăng nhập
interface AuthUser {
  user_id: string;
  email: string;
  role: 'admin' | 'customer';
  full_name?: string; // Tùy chọn, thêm nếu cần hiển thị tên người dùng
  phone_number?: string;
  gender?: 'Nam' | 'Nữ' | 'Khác' | null;
  date_of_birth?: string | null;
  address?: string | null;
  ward?: string | null;
  district?: string | null;
  province?: string | null;
  status?: 'active' | 'inactive';
  // Không nên bao gồm password_hash ở đây
}

// Định nghĩa kiểu dữ liệu cho AuthContext
interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean; // Để theo dõi trạng thái đang tải (ví dụ: khi kiểm tra token lúc khởi động)
  login: (token: string, userData: AuthUser) => void;
  logout: () => void;
}

// Tạo Context với giá trị mặc định là undefined (TypeScript sẽ yêu cầu kiểm tra null/undefined)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider Component sẽ bao bọc toàn bộ Admin App của bạn
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true); // Bắt đầu là true để kiểm tra token từ localStorage
  
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar(); 

  // Hàm tải thông tin người dùng và token từ localStorage
  // Chạy một lần khi component AuthProvider được mount (ứng dụng khởi động)
  const loadUserFromLocalStorage = useCallback(() => {
    try {
      const token = localStorage.getItem('token');
      const userDataString = localStorage.getItem('user'); 

      if (token && userDataString) {
        const userData: AuthUser = JSON.parse(userDataString);
        // ✅ TÙY CHỌN: Gọi API backend để xác thực lại token ở đây
        // Điều này giúp đảm bảo token còn hạn và hợp lệ.
        // Nếu API xác thực token thất bại, coi như không xác thực.
        // For simplicity, we'll assume token from localStorage is valid if present.
        
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Lỗi khi tải thông tin người dùng từ localStorage:", error);
      setUser(null);
      setIsAuthenticated(false);
      openSnackbar({ text: "Lỗi tải thông tin đăng nhập. Vui lòng đăng nhập lại.", severity: "error" });
      // Xóa token lỗi để tránh lặp lại lỗi
      localStorage.removeItem('token'); 
      localStorage.removeItem('user');
    } finally {
      setLoading(false); // Hoàn thành việc kiểm tra loading
    }
  }, [openSnackbar]); // openSnackbar là dependency vì nó được dùng trong hàm này

  // Chạy hàm loadUserFromLocalStorage khi component mount
  useEffect(() => {
    loadUserFromLocalStorage();
  }, [loadUserFromLocalStorage]);

  // Hàm đăng nhập: Được gọi từ LoginPage sau khi xác thực backend thành công
  const login = useCallback((token: string, userData: AuthUser) => {
    localStorage.setItem('token', token); // Lưu token
    localStorage.setItem('user', JSON.stringify(userData)); // Lưu thông tin người dùng
    setUser(userData);
    setIsAuthenticated(true);
    openSnackbar({ text: "Đăng nhập thành công!", severity: "success" });

    // Chuyển hướng sau khi đăng nhập thành công
    if (userData.role === 'admin') {
      // Chuyển hướng đến Dashboard hoặc trang admin mặc định
      navigate('/dashboard', { replace: true }); 
    } else {
      // Nếu Admin App này chỉ dành cho admin, người dùng vai trò khác sẽ được chuyển hướng về trang login
      // hoặc một trang lỗi "không có quyền".
      navigate('/login', { replace: true }); 
      openSnackbar({ text: "Bạn không có quyền truy cập trang quản trị.", severity: "error" });
      // Xóa token nếu không phải admin
      localStorage.removeItem('token'); 
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    }
  }, [navigate, openSnackbar]);

  // Hàm đăng xuất: Được gọi từ Sidebar (Layout) hoặc PrivateRoute khi token hết hạn/không hợp lệ
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    openSnackbar({ text: "Đã đăng xuất.", severity: "info" });
    navigate('/login', { replace: true }); // Chuyển hướng về trang đăng nhập của Admin App
  }, [navigate, openSnackbar]);

  // Sử dụng useMemo để tối ưu hiệu suất, chỉ tạo lại value khi dependencies thay đổi
  const contextValue = useMemo(() => ({
    user,
    isAuthenticated,
    loading,
    login,
    logout,
  }), [user, isAuthenticated, loading, login, logout]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

// Hook tùy chỉnh để dễ dàng sử dụng context trong các component
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Đảm bảo useAuth chỉ được gọi bên trong AuthProvider
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};