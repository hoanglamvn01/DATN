// ma gianm gia
// 📁 src/components/CouponModal.tsx

import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  RadioGroup, FormControlLabel, Radio, Box, Typography, Divider
} from '@mui/material';

// Interface cho một mã giảm giá
interface Coupon {
  code: string;
  description: string;
  // Thêm các trường khác nếu cần
}

interface CouponModalProps {
  open: boolean;
  onClose: () => void;
  onApply: (couponCode: string) => void;
  coupons: Coupon[];
  currentAppliedCode: string; // Mã đang được áp dụng để hiển thị tick
}

export const CouponModal: React.FC<CouponModalProps> = ({
  open,
  onClose,
  onApply,
  coupons = [],
  currentAppliedCode,
}) => {
  // State để lưu trữ mã được chọn tạm thời trong modal
  const [selectedCode, setSelectedCode] = useState(currentAppliedCode);

  // Cập nhật lựa chọn khi modal được mở lại
  useEffect(() => {
    if (open) {
      setSelectedCode(currentAppliedCode);
    }
  }, [open, currentAppliedCode]);

  const handleApplyClick = () => {
    onApply(selectedCode); // Gọi hàm áp dụng từ component cha
    onClose(); // Đóng modal
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle fontWeight="bold">Chọn mã giảm giá</DialogTitle>
      <Divider />
      <DialogContent>
        {coupons.length > 0 ? (
          <RadioGroup
            value={selectedCode}
            onChange={(e) => setSelectedCode(e.target.value)}
          >
            {coupons.map((coupon) => (
              <Box key={coupon.code} sx={{ border: 1, borderColor: 'grey.300', borderRadius: 2, p: 2, mb: 1.5 }}>
                <FormControlLabel
                  value={coupon.code}
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight="bold">{coupon.code}</Typography>
                      <Typography variant="body2" color="text.secondary">{coupon.description}</Typography>
                    </Box>
                  }
                  sx={{ width: '100%' }}
                />
              </Box>
            ))}
          </RadioGroup>
        ) : (
          <Typography sx={{ textAlign: 'center', py: 4 }}>Không có mã giảm giá nào có sẵn.</Typography>
        )}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">Hủy</Button>
        <Button
          onClick={handleApplyClick}
          variant="contained"
          disabled={!selectedCode} // Chỉ cho phép bấm khi đã chọn
        >
          Áp dụng
        </Button>
      </DialogActions>
    </Dialog>
  );
};