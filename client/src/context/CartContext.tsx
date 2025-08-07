import React, { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext'; // Giả định bạn có AuthContext để lấy thông tin người dùng

// ---
// CẤU HÌNH BIẾN MÔI TRƯỜNG
// ---
const BASE_URL = 'http://localhost:3000/api';
const CART_API_BASE_URL = `${BASE_URL}/cart`;
const UPLOADS_BASE_URL = 'http://localhost:3000/uploads/';

// ---
// CÁC INTERFACE (TYPESCRIPT)
// ---

// Định nghĩa cấu trúc sản phẩm khi thêm vào giỏ hàng
export interface ProductForCart {
  product_id: number;
  name: string;
  price: number;
  discount_price?: number;
  thumbnail: string;
  brand?: string;
}

// Định nghĩa cấu trúc một item trong giỏ hàng
export interface CartItem {
  id: string; // ID duy nhất của item trong giỏ (String(product_id) từ backend)
  product_id: number;
  name: string;
  price: number;
  discount_price?: number;
  quantity: number;
  image: string; // Đường dẫn ảnh đầy đủ được xây dựng ở frontend
  thumbnail: string;
  brand?: string;
}

// Định nghĩa cấu trúc state của giỏ hàng
interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  isLoading: boolean;
  error: string | null;
}

// Định nghĩa cấu trúc của Context
interface CartContextType {
  state: CartState;
  addItem: (product: ProductForCart, quantity?: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  fetchCart: () => Promise<void>;
  getItemCount: () => number;
}

// ---
// KHỞI TẠO CONTEXT
// ---
const CartContext = createContext<CartContextType | null>(null);

// ---
// REDUCER ĐỂ QUẢN LÝ STATE
// ---
type CartAction =
  | { type: 'SET_CART'; payload: CartItem[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_LOCAL_STATE' };

// Hàm tính toán các giá trị phát sinh từ state (tổng tiền, số lượng)
const calculateDerivedState = (items: CartItem[]): Pick<CartState, 'items' | 'total' | 'itemCount'> => {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => {
    const itemPrice = item.discount_price ?? item.price; // Ưu tiên giá khuyến mãi
    return sum + (itemPrice * item.quantity);
  }, 0);
  return { items, total, itemCount };
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'SET_CART':
      return { ...state, ...calculateDerivedState(action.payload), isLoading: false, error: null };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'CLEAR_LOCAL_STATE':
      return { items: [], total: 0, itemCount: 0, isLoading: false, error: null };
    default:
      throw new Error(`Unhandled action type in cartReducer`);
  }
};

// ---
// COMPONENT PROVIDER
// ---
export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, { 
    items: [], 
    total: 0, 
    itemCount: 0, 
    isLoading: true, // Bắt đầu với isLoading = true
    error: null 
  });
  const { currentUser } = useAuth();

  // Hàm lấy dữ liệu giỏ hàng từ API Backend
  const fetchCart = useCallback(async () => {
    const userId = currentUser?.user_id;
    if (!userId) {
      dispatch({ type: 'CLEAR_LOCAL_STATE' }); // Xóa giỏ hàng nếu không có người dùng
      return;
    }
    
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await axios.get(`${CART_API_BASE_URL}/${userId}`);
        console.log('DỮ LIỆU TỪ API:', response.data); 
      const normalizedItems: CartItem[] = response.data.map((item: any) => ({
        id: String(item.product_id),
        product_id: Number(item.product_id),
        name: item.name,
        price: Number(item.price),
        discount_price: item.discount_price ? Number(item.discount_price) : undefined,
        quantity: Number(item.quantity),
        thumbnail: item.thumbnail || '',
        image: `${UPLOADS_BASE_URL}${item.thumbnail}`,
        brand: item.brand || '',
      }));

  console.log('DỮ LIỆU SAU KHI XỬ LÝ:', normalizedItems); 
      dispatch({ type: 'SET_CART', payload: normalizedItems });
    } catch (err: any) {
      console.error('Lỗi khi fetch giỏ hàng từ API:', err);
      dispatch({ type: 'SET_ERROR', payload: err.response?.data?.error || 'Không thể tải giỏ hàng.' });
    }
  }, [currentUser]);

  // useEffect để tải giỏ hàng khi provider mount hoặc người dùng thay đổi
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Hàm xử lý chung cho các thao tác với API
  const handleApiRequest = async (request: () => Promise<any>, errorMessage: string) => {
    const userId = currentUser?.user_id;
    if (!userId) {
        alert('Vui lòng đăng nhập để thực hiện thao tác này.');
        return;
    }
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
        await request();
        await fetchCart(); // Tải lại giỏ hàng sau khi thao tác thành công
    } catch (err: any) {
        console.error(errorMessage, err);
        dispatch({ type: 'SET_ERROR', payload: err.response?.data?.error || errorMessage });
    }
  };

  // Thêm sản phẩm vào giỏ hàng
  const addItem = useCallback(async (product: ProductForCart, quantity: number = 1) => {
    await handleApiRequest(
      () => axios.post(`${CART_API_BASE_URL}/add`, {
        user_id: currentUser!.user_id,
        product_id: product.product_id,
        quantity: quantity,
        // Backend có thể tự lấy thông tin sản phẩm từ product_id
      }),
      'Không thể thêm sản phẩm vào giỏ hàng.'
    );
  }, [currentUser, fetchCart]);

  // Xóa sản phẩm khỏi giỏ hàng
  const removeItem = useCallback(async (id: string) => {
    await handleApiRequest(
      () => axios.delete(`${CART_API_BASE_URL}/${currentUser!.user_id}/${Number(id)}`),
      'Không thể xóa sản phẩm.'
    );
  }, [currentUser, fetchCart]);

  // Cập nhật số lượng sản phẩm
  const updateQuantity = useCallback(async (id: string, quantity: number) => {
    if (quantity <= 0) {
      return;
    }
    await handleApiRequest(
      () => axios.put(`${CART_API_BASE_URL}/${currentUser!.user_id}/${Number(id)}`, { quantity }),
      'Không thể cập nhật số lượng.'
    );
  }, [currentUser, fetchCart, removeItem]);

  // Xóa toàn bộ giỏ hàng
  const clearCart = useCallback(async () => {
    await handleApiRequest(
      () => axios.delete(`${CART_API_BASE_URL}/${currentUser!.user_id}`),
      'Không thể xóa giỏ hàng.'
    );
  }, [currentUser, fetchCart]);

  // Trả về số lượng item đã được tính trong state
  const getItemCount = useCallback(() => {
    return state.itemCount;
  }, [state.itemCount]);

  // Cung cấp state và các hàm cho các component con
  const value = {
    state,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    fetchCart,
    getItemCount
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// ---
// CUSTOM HOOK ĐỂ SỬ DỤNG CONTEXT
// ---
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === null) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};