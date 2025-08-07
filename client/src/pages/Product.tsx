// 📁 src/pages/CartPage.tsx

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import CartSummary from '../components/CartSummary';
import { CouponModal, type Coupon } from '../components/CouponModal';
import { AddressSelector, type SavedAddress } from '../components/AddressSelector';
import CustomerForm, { type CustomerFormData } from '../components/CustomerForm';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import { Box, Grid, Button, Typography, Paper, RadioGroup, FormControlLabel, Radio, CircularProgress } from '@mui/material'; // ✅ Thêm CircularProgress
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PaymentIcon from '@mui/icons-material/Payment';

const PAYMENT_METHODS = [
  { id: 'cod', name: 'Thanh toán khi nhận hàng (COD)', icon: <AccountBalanceWalletIcon /> },
  { id: 'momo', name: 'Thanh toán qua Ví MoMo', icon: <PaymentIcon /> },
];

export default function CartPage() {
  const { state: cartState, updateQuantity, removeItem, clearCart } = useCart();
  const { currentUser, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [shippingFee, setShippingFee] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false); // ✅ Thêm loading cho phí ship

  const [selectedAddress, setSelectedAddress] = useState<SavedAddress | CustomerFormData | null>(null);
  
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<string | null>(null);
  const [newAddressFormData, setNewAddressFormData] = useState<CustomerFormData | null>(null);

  const [useSavedAddress, setUseSavedAddress] = useState(true);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [appliedCouponCode, setAppliedCouponCode] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cod');
  
  // Debugging:
  useEffect(() => {
    console.log("CartPage - Current User:", currentUser);
    console.log("CartPage - Authenticated:", isAuthenticated);
    console.log("CartPage - selectedAddress (FINAL):", selectedAddress);
    console.log("CartPage - selectedPaymentMethod:", selectedPaymentMethod);
  }, [currentUser, isAuthenticated, selectedAddress, selectedPaymentMethod]);

  const handleSavedAddressSelect = useCallback((addressData: SavedAddress | null) => {
    setSelectedAddress(addressData);
    if (addressData) {
        setSelectedSavedAddressId(String(addressData.address_id));
        setUseSavedAddress(true);
    } else {
        setSelectedSavedAddressId(null);
        setUseSavedAddress(false); 
    }
  }, []);

  const handleNewAddressFormChange = useCallback((formData: CustomerFormData) => {
    setNewAddressFormData(formData);
    setSelectedAddress(formData);
    setUseSavedAddress(false);
    setSelectedSavedAddressId(null);
  }, []);

  // Lấy danh sách coupon khi component mount
  useEffect(() => {
    axios.get('http://localhost:3000/api/discounts')
      .then(res => setAvailableCoupons(res.data))
      .catch(() => toast.error("Lỗi: Không thể tải danh sách mã giảm giá."));
  }, []);

  // Tính phí vận chuyển mỗi khi địa chỉ thay đổi
  useEffect(() => {
    if (selectedAddress?.province) {
      setIsLoadingShipping(true); // Bắt đầu loading
      axios.post('http://localhost:3000/api/shipping/calculate-fee', { province_name: selectedAddress.province })
        .then(res => setShippingFee(res.data.shippingFee))
        .catch(() => toast.error("Lỗi: Không thể tính phí vận chuyển."))
        .finally(() => setIsLoadingShipping(false)); // Kết thúc loading
    } else {
      setShippingFee(0);
    }
  }, [selectedAddress?.province]);

  // Tính lại tổng tiền cuối cùng khi có bất kỳ thay đổi nào
  useEffect(() => {
    const finalTotal = cartState.total + shippingFee - discount;
    setTotal(finalTotal > 0 ? finalTotal : 0);
  }, [cartState.total, shippingFee, discount]);

  const handleApplyCoupon = async (couponCode: string) => {
    if (!couponCode) {
      setDiscount(0);
      setAppliedCouponCode('');
      return toast.info("Đã gỡ mã giảm giá.");
    }
    try {
      const response = await axios.post('http://localhost:3000/api/discounts/apply', {
        code: couponCode,
        order_value: cartState.total,
      });
      setDiscount(response.data.discounted_by);
      setAppliedCouponCode(couponCode);
      toast.success(response.data.message);
    } catch (error: any) {
      setDiscount(0);
      setAppliedCouponCode('');
      toast.error(error.response?.data?.error || 'Có lỗi xảy ra.');
    }
  };

  const handlePlaceOrder = async () => {
    console.log("--- Bắt đầu handlePlaceOrder ---");

    if (cartState.items.length === 0) {
        toast.error("Giỏ hàng của bạn đang trống.");
        return;
    }

    if (!selectedAddress ||
        !((selectedAddress as SavedAddress).full_name || (selectedAddress as CustomerFormData).name) ||
        !selectedAddress.phone_number ||
        !((selectedAddress as SavedAddress).address_line || (selectedAddress as CustomerFormData).address) ||
        !selectedAddress.province ||
        !selectedAddress.district ||
        !selectedAddress.ward) {
        console.error("Lỗi: Vui lòng điền đầy đủ thông tin giao hàng.");
        return toast.error("Vui lòng điền đầy đủ thông tin giao hàng (tên, SĐT, địa chỉ, tỉnh, huyện, xã).");
    }

    if (!isAuthenticated || !currentUser || !token) {
        console.error("Lỗi: Người dùng chưa đăng nhập hoặc thiếu token.");
        return toast.error("Vui lòng đăng nhập để đặt hàng.");
    }

    try {
        let addressId: string;
        let recipientNameToSend: string;
        let recipientPhoneToSend: string;

        if (useSavedAddress && 'address_id' in selectedAddress && selectedAddress.address_id !== undefined && selectedAddress.address_id !== null) {
            addressId = String(selectedAddress.address_id);
            recipientNameToSend = (selectedAddress as SavedAddress).full_name || '';
            recipientPhoneToSend = (selectedAddress as SavedAddress).phone_number || '';
            console.log("Sử dụng địa chỉ đã lưu với ID:", addressId);
        } else {
            console.log("Địa chỉ mới, đang cố gắng lưu vào backend...");

            recipientNameToSend = (selectedAddress as CustomerFormData).name || '';
            recipientPhoneToSend = (selectedAddress as CustomerFormData).phone_number || '';

            const addressToSave = {
                user_id: currentUser.user_id,
                full_name: (selectedAddress as CustomerFormData).name || '',
                phone_number: (selectedAddress as CustomerFormData).phone_number || '',
                province: (selectedAddress as CustomerFormData).province || '',
                district: (selectedAddress as CustomerFormData).district || '',
                ward: (selectedAddress as CustomerFormData).ward || '',
                address_line: (selectedAddress as CustomerFormData).address || '',
                is_default: (selectedAddress as CustomerFormData).save_info_for_next_time || false,
            };

            const addressResponse = await axios.post('http://localhost:3000/api/addresses', addressToSave, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            addressId = addressResponse.data.address_id;
            console.log("Địa chỉ mới đã được lưu với ID:", addressId);
            toast.success("Địa chỉ giao hàng đã được lưu.");
        }

        const orderData = {
            userId: currentUser.user_id,
            addressId: addressId,
            items: cartState.items.map(item => ({
                productId: item.product_id,
                quantity: item.quantity,
                price: item.discount_price || item.price
            })),
            shippingFee: shippingFee,
            discount: discount,
            totalAmount: total,
            paymentMethod: selectedPaymentMethod,
            couponCode: appliedCouponCode,
            recipientName: recipientNameToSend,
            recipientPhone: recipientPhoneToSend,
        };

        const response = await axios.post('http://localhost:3000/api/orders', orderData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const orderId = response.data.orderId;
        const orderCode = response.data.orderCode;
        console.log("Đơn hàng đã được tạo thành công với ID:", orderId, "và Mã đơn hàng:", orderCode);

        if (selectedPaymentMethod === 'cod') {
            toast.success("Đặt hàng thành công! Đơn hàng của bạn đang được xử lý.");
            await clearCart();
            navigate('/checkout-success', { state: { orderId: orderId, orderCode: orderCode } });
            window.location.reload();
        } else if (selectedPaymentMethod === 'momo') {
            toast.info("Đang tạo yêu cầu thanh toán MoMo...");
            const momoResponse = await axios.post('http://localhost:3000/api/payments/create-momo', {
                amount: total,
                orderId: orderId,
                orderInfo: `Thanh toan don hang ${orderId}`,
                redirectUrl: `http://localhost:5173/order-management/${orderId}`,
                ipnUrl: "YOUR_BACKEND_IPN_URL"
            });

            const { payUrl } = momoResponse.data;
            if (payUrl) {
                await clearCart();
                console.log("Đang chuyển hướng đến MoMo:", payUrl);
                window.location.href = payUrl;
            } else {
                toast.error("Không nhận được link thanh toán từ MoMo.");
            }
        }
    } catch (error: any) {
        console.error("Lỗi trong quá trình đặt hàng - TOÀN BỘ LỖI:", error);
        toast.error(error.response?.data?.error || error.response?.data?.message || "Đặt hàng thất bại. Vui lòng thử lại.");
    }
    console.log("--- Kết thúc handlePlaceOrder ---");
  };

  const paymentMethodName = PAYMENT_METHODS.find(p => p.id === selectedPaymentMethod)?.name;

  return (
    // ✅ SỬA LỖI LỆCH FORM: Xóa thuộc tính `width` không hợp lệ
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh', mt: 12 }}>
      <Grid container spacing={4} sx={{ maxWidth: '1200px', mx: 'auto' }}>
        {/* ✅ Bọc nội dung của cột bên trái trong một Paper để có giao diện đẹp và nhất quán */}
        <Grid item xs={12} lg={7}>
          <Paper sx={{ p: 3, boxShadow: 3 }}>
            <Box>
                <Typography variant="h5" gutterBottom fontWeight="bold">Thông tin liên hệ của bạn</Typography>
                <RadioGroup
                    row
                    value={useSavedAddress ? "saved" : "new"}
                    onChange={(e) => {
                        const value = e.target.value === "saved";
                        setUseSavedAddress(value);
                        if (value) {
                            setSelectedAddress(null);
                            setNewAddressFormData(null);
                        } else {
                            setSelectedAddress(newAddressFormData);
                            setSelectedSavedAddressId(null);
                        }
                    }}
                >
                    <FormControlLabel value="saved" control={<Radio />} label="Sử dụng địa chỉ đã lưu" />
                    <FormControlLabel value="new" control={<Radio />} label="Nhập địa chỉ mới" />
                </RadioGroup>
            </Box>

            {useSavedAddress ? (
                <AddressSelector 
                    onAddressSelect={handleSavedAddressSelect} 
                    selectedAddressId={selectedSavedAddressId}
                    onSetSelectedAddressId={setSelectedSavedAddressId}
                />
            ) : (
                <CustomerForm onFormChange={handleNewAddressFormChange} initialData={newAddressFormData} />
            )}

            <Box sx={{ mt: 4 }}>
                <Typography variant="h5" gutterBottom fontWeight="bold">Phương thức thanh toán</Typography>
                <RadioGroup
                    value={selectedPaymentMethod}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                >
                    {PAYMENT_METHODS.map((method) => (
                        <Paper key={method.id} variant="outlined" sx={{ p: 2, mb: 2, cursor: 'pointer', borderRadius: 2 }}>
                            <FormControlLabel
                                value={method.id}
                                control={<Radio />}
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        {method.icon}
                                        <Typography fontWeight="medium">{method.name}</Typography>
                                    </Box>
                                }
                                sx={{ width: '100%' }}
                            />
                        </Paper>
                    ))}
                </RadioGroup>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={5}>
          {/* ✅ THAY ĐỔI: Sử dụng một Paper bọc CartSummary để có khoảng cách và bóng đổ */}

            <CartSummary
                items={cartState.items}
                subtotal={cartState.total}
                shippingFee={shippingFee}
                discount={discount}
                total={total}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeItem}
                onOpenCouponModal={() => setIsCouponModalOpen(true)}
                appliedCouponCode={appliedCouponCode}
                paymentMethodName={paymentMethodName}
                isLoadingShipping={isLoadingShipping}
            />
            <Button
                fullWidth
                variant="contained"
                size="large"
                sx={{ mt: 3, py: 1.5, fontSize: '1.1rem' }}
                onClick={handlePlaceOrder}
                disabled={cartState.items.length === 0 ||
                          !selectedAddress ||
                          !((selectedAddress as SavedAddress).full_name || (selectedAddress as CustomerFormData).name) ||
                          !selectedAddress.phone_number ||
                          !((selectedAddress as SavedAddress).address_line || (selectedAddress as CustomerFormData).address) ||
                          !selectedAddress.province ||
                          !selectedAddress.district ||
                          !selectedAddress.ward
                        }
                type="button"
            >
              Hoàn tất đặt hàng
            </Button>
        </Grid>
      </Grid>

      <CouponModal
        open={isCouponModalOpen}
        onClose={() => setIsCouponModalOpen(false)}
        onApply={handleApplyCoupon}
        coupons={availableCoupons}
        currentAppliedCode={appliedCouponCode}
      />
    </Box>
  );
}