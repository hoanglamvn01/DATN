import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, 
  Box, Typography, Paper, Chip, Divider, List, ListItem, ListItemText, ListItemSecondaryAction,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { format } from 'date-fns';

// --- INTERFACES DỮ LIỆU ---
// Interface cho dữ liệu Voucher hiển thị trên Frontend
interface VoucherDisplay {
  code_id: number;
  code: string;
  name: string; // Mô tả từ DB
  value: number; 
  type: 'percentage' | 'fixed_amount';
  expiryDate: string; // end_date từ DB
  status: 'Active' | 'Inactive' | 'Expired'; // Trạng thái tính toán
}

interface VoucherSelectorModalProps {
  open: boolean;
  onClose: () => void;
  vouchers: VoucherDisplay[];
  onApplyVoucher: (voucher: VoucherDisplay | null) => void;
  appliedVoucherId: number | null; 
}

const VoucherSelectorModal: React.FC<VoucherSelectorModalProps> = ({ 
  open, onClose, vouchers, onApplyVoucher, appliedVoucherId 
}) => {
  
  // Lọc các voucher chỉ còn hiệu lực hoặc chưa đến ngày hiệu lực
  const availableVouchers = vouchers.filter(v => v.status !== 'Expired');
  
  const getVoucherInfo = (voucher: VoucherDisplay) => {
    let valueText = '';
    if (voucher.type === 'percentage') {
      valueText = `Giảm ${voucher.value}%`;
    } else {
      valueText = `Giảm ${voucher.value.toLocaleString('vi-VN')} VND`;
    }
    return `${valueText} cho đơn hàng "${voucher.name}"`;
  };

  const handleSelectVoucher = (voucher: VoucherDisplay) => {
    // Chỉ cho phép chọn voucher đang ở trạng thái 'Active'
    if (voucher.status === 'Active') {
      onApplyVoucher(voucher);
      // Đóng modal tự động sau khi chọn, nếu cần
      // onClose(); 
    }
  };

  const handleRemoveAppliedVoucher = () => {
    onApplyVoucher(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Chọn mã giảm giá
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers sx={{ minHeight: 300 }}>
        {availableVouchers.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="body1" color="text.secondary">
              Hiện không có mã giảm giá khả dụng.
            </Typography>
          </Box>
        ) : (
          <List>
            {availableVouchers.map((voucher) => (
              <ListItem 
                key={voucher.code_id} 
                onClick={() => handleSelectVoucher(voucher)} 
                sx={{ 
                  cursor: voucher.status === 'Active' ? 'pointer' : 'default',
                  opacity: voucher.status !== 'Active' ? 0.6 : 1,
                  '&:hover': {
                    backgroundColor: voucher.status === 'Active' ? '#f5f5f5' : 'transparent',
                  },
                  // Hiển thị khung viền nếu mã đã được áp dụng
                  border: voucher.code_id === appliedVoucherId ? '2px solid #1976d2' : '1px solid #ccc',
                  mb: 1,
                  borderRadius: 2,
                }}
              >
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {voucher.code} 
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {getVoucherInfo(voucher)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Hết hạn: {format(new Date(voucher.expiryDate), 'dd/MM/yyyy')}
                  </Typography>
                </Box>
                
                <ListItemSecondaryAction>
                    {voucher.status === 'Active' ? (
                        voucher.code_id === appliedVoucherId ? (
                            <Chip 
                                label="Đã áp dụng" 
                                color="primary" 
                                size="small" 
                                icon={<CheckCircleOutlineIcon fontSize="small" />}
                            />
                        ) : (
                            <Button size="small" variant="outlined">
                                Chọn
                            </Button>
                        )
                    ) : (
                        <Chip label="Chưa HĐ" size="small" color="warning" />
                    )}
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      
      <DialogActions>
        {appliedVoucherId !== null && (
          <Button onClick={handleRemoveAppliedVoucher} color="error" sx={{ mr: 1 }}>
            Xóa mã giảm giá
          </Button>
        )}
        <Button onClick={onClose} color="primary" variant="outlined">
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VoucherSelectorModal;