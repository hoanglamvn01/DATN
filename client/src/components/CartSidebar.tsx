// src/components/CartSidebar.tsx

import { IconButton, Button } from '@mui/material'; // ✅ ĐÃ DỌN DẸP IMPORT
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

import '../css/CartSidebar.css';

// Interface này không cần thiết nữa vì ta dùng từ Context
// interface CartItem { ... }

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// ✅ ĐÃ XÓA HẰNG SỐ KHÔNG DÙNG
// const BASE_URL = 'http://localhost:3000/api';
// const UPLOADS_BASE_URL = 'http://localhost:3000/uploads/';

export default function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const { state, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();

  return (
    <>
      <div className={`cart-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}></div>

      <div className={`cart-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h3>Giỏ hàng ({state.itemCount})</h3>
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </div>

        <div className="cart-items">
          {state.items.length === 0 ? (
            <p className="empty-cart-message">Giỏ hàng của bạn đang trống.</p>
          ) : (
            state.items.map(item => (
              <div key={item.id} className="cart-item">
                <img src={item.image} alt={item.name} className="item-image" />
                <div className="item-details">
                  <div className="item-name">{item.name}</div>
                  <div className="item-price">
                    {((item.discount_price || item.price) * item.quantity).toLocaleString('vi-VN')} đ
                  </div>
                  <div className="quantity-controls">
                    <IconButton onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                    <span className="quantity-value">{item.quantity}</span>
                    <IconButton onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </div>
                </div>
                <div className="item-actions">
                  <IconButton onClick={() => removeItem(item.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart-footer">
          <div className="subtotal">
            <span>Tạm tính</span>
            <span className="subtotal-price">{state.total.toLocaleString('vi-VN')} đ</span>
          </div>
          <Button
            variant="contained"
            className="checkout-button"
            onClick={() => {
              onClose();
              navigate('/checkout');
            }}
          >
            Thanh toán
          </Button>
        </div>
      </div>
    </>
  );
}