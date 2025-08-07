import { FaHeart, FaSearch, FaShoppingCart, FaUser } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext'; 
import { FaClipboardList } from 'react-icons/fa';

import { Box, Button, Menu, MenuItem, Typography, CircularProgress } from '@mui/material';

interface Category {
  category_id: number;
  category_name: string;
  slug: string;
}

interface Brand {
  brand_id: number;
  brand_name: string;
  slug: string;
}

interface NavBarProps {
  onCartIconClick: () => void;
}

const NavBar = ({ onCartIconClick }: NavBarProps) => {
  const { isAuthenticated, currentUser, logout, loadingAuth } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  const [isProductHovered, setIsProductHovered] = useState(false);
  const [isBrandHovered, setIsBrandHovered] = useState(false);

  const [searchTerm, setSearchTerm] = useState(''); 

  // ✅ XÓA: Không cần state cho Menu tài khoản nữa vì không dùng dropdown
  // const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null); 


  // --- XỬ LÝ TÌM KIẾM ---
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleSearchSubmit = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && searchTerm.trim() !== '') {
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
    }
  }, [searchTerm, navigate]);

  // ✅ XÓA: Không cần các hàm xử lý Menu tài khoản nữa vì không dùng dropdown
  // const handleOpenAccountMenu = (event: React.MouseEvent<HTMLElement>) => { ... };
  // const handleCloseAccountMenu = () => { ... };


  // ✅ CẬP NHẬT: Hàm xử lý Đăng xuất
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ✅ CẬP NHẬT: Hàm xử lý đi đến trang tài khoản
  const handleGoToAccount = () => {
    navigate('/account'); // Điều hướng đến trang quản lý tài khoản
  };

 

  useEffect(() => {
    fetch('http://localhost:3000/api/categories')
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error('❌ Lỗi fetch categories:', err));

    fetch('http://localhost:3000/api/brands')
      .then((res) => res.json())
      .then((data) => setBrands(data))
      .catch((err) => console.error('❌ Lỗi fetch brands:', err));
  }, []);

  return (
<div className="px-4 text-dark font-sans" style={{
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 999,
  backgroundColor: '#fffefb',
  fontFamily: 'Raleway, sans-serif',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '1px',
  fontSize: '16px',
}}>

      <div className="d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-2">
          <Link className="navbar-brand" to="/">
            <img src="/img/Night owls.jpg" alt="logo" width="120" height="120" />
          </Link>
        </div>

        <div className="d-flex gap-4 small nav-links">
          <ul className="navbar-nav d-flex flex-row">
            <li className="nav-item mx-2">
              <Link className="nav-link" to="/">Trang chủ</Link>
            </li>

            {/* Dropdown Sản phẩm */}
            <li
              className="nav-item mx-2"
              onMouseEnter={() => setIsProductHovered(true)}
              onMouseLeave={() => setIsProductHovered(false)}
              style={{ position: 'relative' }}
            >
              <Link className="nav-link" to="/products">Sản phẩm</Link>
              {isProductHovered && (
                <div className="shadow-sm rounded" style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  backgroundColor: '#fffefb',
                  border: '1px solid #eee',
                  zIndex: 999,
                  width: '240px',
                  padding: '12px 16px',
                }}>
                  <ul className="list-unstyled mb-0">
                    {categories.map((cat) => (
                      <li key={cat.category_id} className="mb-2">
                        <Link
                          to={`/products?category=${cat.slug}`} 
                          className="d-block text-dark"
                          style={{ fontSize: '15px', fontWeight: 500, textDecoration: 'none' }}
                          onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#5EAB5A')}
                          onMouseLeave={(e) => ((e.target as HTMLElement).style.color = '#000')}
                        >
                          {cat.category_name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
             <li className="nav-item mx-2">
              <Link className="nav-link" to="/bai-viet">Bài viết</Link>
            </li>
            <li className="nav-item mx-2">
              <Link className="nav-link" to="/contact">Liên hệ</Link>
            </li>
          </ul>
        </div>

        {/* Search & Icons */}
        <div className="d-flex align-items-center gap-4">
          <div className="d-flex align-items-center px-3 py-2 bg-light rounded-pill border">
            <FaSearch className="me-2 text-muted" />
            <input
              type="text"
              className="form-control border-0 bg-light shadow-none"
              placeholder="Tìm kiếm sản phẩm..."
              style={{ width: '200px' }}
              value={searchTerm} 
              onChange={handleSearchChange}
              onKeyDown={handleSearchSubmit} 
            />
          </div>

          <Link to="/favorites" className="text-dark"><FaHeart size={20} /></Link>
          <span className="text-dark" onClick={onCartIconClick} style={{ cursor: 'pointer' }}>
            <FaShoppingCart size={20} />
          </span>
          <Link to="/my-orders" className="text-dark">
  <FaClipboardList size={20} />
</Link>

          {/* ✅ PHẦN TÀI KHOẢN NGƯỜI DÙNG (CHUYỂN HƯỚNG TRỰC TIẾP) */}
          {loadingAuth ? ( 
            <CircularProgress size={20} color="inherit" sx={{ color: '#333' }} /> 
          ) : isAuthenticated ? (
            // Nếu đã đăng nhập: Là một Link trực tiếp đến trang tài khoản
            <Link 
                to="/account" 
                className="text-dark" 
                style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}
            >
              <FaUser size={20} className="me-1" />
              <Typography
                variant="body2"
                sx={{
                  fontSize: '16px',
                  textTransform: 'uppercase',
                  color: '#333',
                  '&:hover': { color: '#5EAB5A' },
                  ml: 0.5 // Khoảng cách giữa icon và text
                }}
              >
                {currentUser?.full_name || currentUser?.email?.split('@')[0] || "Tài khoản"}
              </Typography>
            </Link>

          ) : (
            // Nếu chưa đăng nhập: Link đến trang đăng nhập
            <Link to="/login" className="text-dark"><FaUser size={20} /></Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default NavBar;