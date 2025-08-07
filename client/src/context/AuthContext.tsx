import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';

interface User {
  user_id: number;
  full_name: string;
  email: string;
  phone_number?: string | null; 
  role: 'user' | 'admin';
  gender?: 'Nam' | 'Nữ' | 'Khác' | null; 
  date_of_birth?: string | null; 
  address?: string | null; 
  ward?: string | null;     
  district?: string | null; 
  province?: string | null; 
}

interface AuthContextType {
  currentUser: User | null; 
  isAuthenticated: boolean; 
  token: string | null;     
  login: (token: string, user: User) => void; 
  logout: () => void; 
  updateUser: (updatedUserData: Partial<User>) => void; 
  loadingAuth: boolean; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode; 
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true); 

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setToken(null);
    setIsAuthenticated(false);
    delete axios.defaults.headers.common['Authorization'];
    console.log("Người dùng đã được đăng xuất."); 
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const user: User = JSON.parse(storedUser); 
        setCurrentUser(user);
        setToken(storedToken);
        setIsAuthenticated(true);
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      } catch (error) {
        console.error("Failed to parse user from localStorage:", error);
        logout(); 
      }
    }
    setLoadingAuth(false);
  }, [logout]);

  const login = useCallback((newToken: string, user: User) => {
    localStorage.setItem('token', newToken); 
    localStorage.setItem('user', JSON.stringify(user)); 
    setCurrentUser(user); 
    setToken(newToken); 
    setIsAuthenticated(true); 
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`; 
  }, []);

  const updateUser = useCallback((updatedUserData: Partial<User>) => {
    setCurrentUser(prevUser => {
      if (!prevUser) return null;
      const newUser = { ...prevUser, ...updatedUserData };
      localStorage.setItem('user', JSON.stringify(newUser)); 
      return newUser;
    }); 
  }, []);

  useEffect(() => {
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response, 
      (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          console.error("Token invalid or expired. Logging out...", error.response);
          logout(); 
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [logout]); 

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated, token, login, logout, updateUser, loadingAuth }}>
      {!loadingAuth && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider'); 
  }
  return context;
};