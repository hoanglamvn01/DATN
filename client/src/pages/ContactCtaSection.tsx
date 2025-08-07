// chi tiet san pham, phan kham pha, de lien ket den lien he
// 📁 src/components/ContactCtaSection.tsx

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom'; // Dùng RouterLink để điều hướng

interface ContactCtaSectionProps {
  // Bạn có thể tùy chỉnh text và link nếu muốn
  headingText?: string;
  buttonText?: string;
  buttonLink?: string; // Link đến trang liên hệ
}

const ContactCtaSection: React.FC<ContactCtaSectionProps> = ({
  headingText = "Không tìm thấy được dòng sản phẩm mà bạn cần hoặc thích hợp với da của bạn?",
  buttonText = "LIÊN HỆ VỚI CHÚNG TÔI",
  buttonLink = "/contact" // ✅ Đặt link đến trang liên hệ của bạn
}) => {
  return (
    <Box
      sx={{
        bgcolor: '#f8f5f0', // Màu nền nhẹ nhàng từ ảnh
        py: { xs: 6, md: 10 }, // Padding trên dưới
        px: { xs: 2, md: 4 }, // Padding trái phải
        textAlign: 'center',
        borderRadius: 2, // Bo tròn góc nhẹ
        mt: { xs: 5, md: 10 }, // Margin top để cách các phần khác
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)', // Đổ bóng nhẹ
      }}
    >
      <Typography
        variant="h5" // Hoặc h4 tùy độ lớn bạn muốn
        sx={{
          fontFamily: 'serif', // Hoặc font chữ cụ thể của bạn để giống Cocoon
          fontStyle: 'italic', // Chữ nghiêng
          color: '#333333', // Màu chữ đậm
          mb: { xs: 4, md: 6 }, // Margin bottom cho nút
          maxWidth: 700, // Giới hạn chiều rộng của text
          mx: 'auto', // Căn giữa text
          lineHeight: 1.5,
        }}
      >
        {headingText}
      </Typography>
      <Button
        component={RouterLink} // Dùng RouterLink để điều hướng nội bộ
        to={buttonLink}
        variant="contained"
        sx={{
          bgcolor: '#333333', // Màu nền nút đậm
          color: '#ffffff', // Màu chữ nút trắng
          py: { xs: 1.5, md: 2 }, // Padding cho nút
          px: { xs: 4, md: 6 }, // Padding cho nút
          fontSize: { xs: '1rem', md: '1.1rem' }, // Kích thước chữ nút
          fontWeight: 'bold',
          textTransform: 'uppercase', // Chữ hoa
          borderRadius: '4px', // Bo tròn góc nút
          '&:hover': {
            bgcolor: '#555555', // Màu hover
          },
          boxShadow: 'none', // Xóa bỏ đổ bóng mặc định nếu không muốn
        }}
      >
        {buttonText}
      </Button>
    </Box>
  );
};

export default ContactCtaSection;