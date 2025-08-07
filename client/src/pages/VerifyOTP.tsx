// Trang nhap va xac minh ma otp
import React, { useState } from 'react';
import axios from 'axios';
import { Box, Button, TextField, Typography, Alert } from '@mui/material';

const VerifyOTP = ({
  email,
  onVerified,
}: {
  email: string;
  onVerified: () => void;
}) => {
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    try {
      setMessage(null);
      setError(null);
      const res = await axios.post('http://localhost:3000/api/auth/verify-otp', { email, otp });
      setMessage(res.data.message);
      onVerified(); // chuyển sang form đăng ký khi OTP đúng
    } catch (err: any) {
      setError(err.response?.data?.message || 'Xác thực thất bại');
    }
  };

  return (
    <Box maxWidth={400} mx="auto" mt={8}>
      <Typography variant="h5" fontWeight="bold" mb={2}>Nhập mã OTP</Typography>
      <Typography variant="body2" mb={2}>Mã đã được gửi đến <strong>{email}</strong></Typography>
      <TextField
        fullWidth
        label="Mã OTP"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        sx={{ mb: 2 }}
      />
      <Button variant="contained" color="primary" fullWidth onClick={handleVerify}>
        Xác minh
      </Button>
      {message && <Alert severity="success" sx={{ mt: 2 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    </Box>
  );
};

export default VerifyOTP;
