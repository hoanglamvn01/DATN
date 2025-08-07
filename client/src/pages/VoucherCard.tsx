import React from 'react';
import { 
  Box, Card, CardContent, Typography, Button, Divider, Chip, CardActions, 
  LinearProgress
} from '@mui/material';
import { format } from 'date-fns';
import StoreIcon from '@mui/icons-material/Store';
import DiscountIcon from '@mui/icons-material/Discount';

// Interface dữ liệu voucher (sử dụng lại VoucherDisplay)
interface VoucherDisplay {
    code_id: number;
    code: string;
    name: string; // Mô tả voucher
    value: number;
    type: 'percentage' | 'fixed_amount';
    expiryDate: string;
    status: 'Active' | 'Inactive' | 'Expired';
}

interface VoucherCardProps {
    voucher: VoucherDisplay;
    // Hàm xử lý khi người dùng nhấn nút "Lưu" (thực tế: lưu vào state hoặc DB)
    onSaveVoucher: (voucherId: number) => void; 
    isSaved: boolean; // Trạng thái đã lưu hay chưa
}

const VoucherCard: React.FC<VoucherCardProps> = ({ voucher, onSaveVoucher, isSaved }) => {
    
    // Hàm xác định thông tin giảm giá
    const getDiscountText = () => {
        if (voucher.type === 'percentage') {
            return `Giảm ${voucher.value}%`;
        }
        return `Giảm ${voucher.value.toLocaleString('vi-VN')} VND`;
    };

    // Hàm xác định điều kiện
    const getConditionText = () => {
        // Giả lập điều kiện (ví dụ: "Áp dụng cho đơn từ 0 VND")
        return `Áp dụng cho đơn hàng tối thiểu 0 VND`;
    };
    
    // Màu sắc và trạng thái dựa trên status
    const cardColor = voucher.status === 'Active' ? '#fde4e4' : '#e0e0e0';
    const buttonColor = voucher.status === 'Active' ? 'success' : 'error';
    const buttonText = voucher.status === 'Active' ? (isSaved ? 'Đã lưu' : 'Lưu') : 'Hết hạn';

    return (
        <Card 
            sx={{ 
                display: 'flex', 
                mb: 2, 
                borderRadius: 2, 
                boxShadow: 2,
                opacity: voucher.status === 'Expired' ? 0.6 : 1,
            }}
        >
            {/* Phần Icon/Giảm giá */}
            <Box 
                sx={{ 
                    minWidth: 100, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    bgcolor: cardColor,
                    borderRight: 'dashed 2px #f0f0f0',
                    p: 1
                }}
            >
                <DiscountIcon color="error" sx={{ fontSize: 40 }} />
                <Typography variant="caption" color="text.secondary" fontWeight="bold" mt={0.5}>
                    {getDiscountText()}
                </Typography>
            </Box>

            {/* Phần nội dung Voucher */}
            <CardContent sx={{ flexGrow: 1, p: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" color="text.primary" sx={{ mb: 0.5 }}>
                    {voucher.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                    <StoreIcon fontSize="small" sx={{ mr: 0.5 }} />
                    {/* Giả lập tên cửa hàng hoặc loại voucher */}
                    Cửa hàng | Mã: <Chip label={voucher.code} size="small" sx={{ ml: 1, bgcolor: '#f0f0f0' }} />
                </Typography>
                
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {getConditionText()}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    HSD: {format(new Date(voucher.expiryDate), 'dd/MM/yyyy')}
                </Typography>
            </CardContent>

            {/* Phần Nút Lưu */}
            <CardActions sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', p: 2 }}>
                <Button 
                    variant="contained" 
                    color={buttonColor}
                    disabled={voucher.status !== 'Active' || isSaved}
                    onClick={() => onSaveVoucher(voucher.code_id)}
                    sx={{ width: '100px' }}
                >
                    {buttonText}
                </Button>
            </CardActions>
        </Card>
    );
};

export default VoucherCard;