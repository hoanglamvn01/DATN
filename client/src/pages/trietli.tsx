import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useTheme } from '@mui/material/styles';       
import { Link } from 'react-router-dom';

// Vui lòng đặt các file ảnh của bạn vào thư mục 'public/images/'
// hoặc 'src/assets/images/' và import chúng như ví dụ dưới đây.
// Sau đó thay thế URL tương ứng bên dưới.

// Ví dụ nếu bạn đặt ảnh trong public/images:
const BACKGROUND_IMAGE_URL = 'https://image.cocoonvietnam.com/uploads/bg_brand_cf39014_2_9e67c4813e.jpg'; // Đổi tên file cho dễ nhớ
const CONTACT_BUTTON_BG_URL = '/images/cocoon-contact-button-bg.png'; // Nếu có ảnh nền riêng cho nút Liên hệ

// Hoặc nếu bạn đặt ảnh trong src/assets/images và import:
// import BACKGROUND_IMAGE from './assets/images/cocoon-background.jpg';
// import PUMPKIN_LEFT from './assets/images/cocoon-pumpkin-left.png';
// ... và sử dụng trực tiếp biến import như src={BACKGROUND_IMAGE}

export default function CocoonHeroSection() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        minHeight: '300px', // Điều chỉnh chiều cao theo ý muốn
        backgroundImage: `url(${BACKGROUND_IMAGE_URL})`, // Sử dụng URL ảnh nền
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        pt: 8,
        pb: 8,
        // Để đạt được giao diện 100% giống hình, bạn cần tinh chỉnh font chữ
        // Thêm font chữ Cocoon đang dùng vào dự án của bạn và thiết lập fontFamily
        fontFamily: 'serif', // Đây là ví dụ, bạn cần thay bằng font thực tế
      }}
    >

      {/* Nội dung chính giữa trang */}
      <Container maxWidth="md" sx={{
        position: 'relative',
        zIndex: 10,
        textAlign: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)', // Nền trắng mờ cho box nội dung
        borderRadius: 0, // Đã chỉnh thành vuông góc
        p: { xs: 3, md: 6 },
        boxShadow: theme.shadows[5],

        // CHỈNH SỬA CHIỀU RỘNG VÀ CHIỀU CAO TẠI ĐÂY ĐỂ TẠO HÌNH VUÔNG
        width: { xs: '90%', sm: '60%', md: '500px' }, // Ví dụ: đặt chiều rộng responsive
        height: { xs: '400px', sm: '250px', md: '370px' }, // Đặt chiều cao bằng chiều rộng tương ứng
        // Quan trọng: Nếu muốn đảm bảo nội dung không tràn ra ngoài, bạn có thể cần thêm overflow: 'auto'
        // hoặc điều chỉnh padding và kích thước font của nội dung bên trong.
        display: 'flex', // Để căn giữa nội dung bên trong
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    }}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 'bold',
            color: '#333',
            mb: { xs: 2, md: 4 },
            fontSize: { xs: '1rem', sm: '1.5rem', md: '2rem' },
            fontFamily: 'inherit', // Kế thừa font từ Box cha nếu đã thiết lập
          }}
        >
          TRIẾT LÝ THƯƠNG HIỆU
        </Typography>
        <Typography
          variant="h6"
          sx={{
            color: '#555',
            lineHeight: 1.6,
            mb: { xs: 3, md: 5 },
            fontSize: { xs: '1rem', sm: '1rem', md: '1rem' },
          }}
        >
          Là những người yêu thiên nhiên và đam mê khám phá các nguồn nguyên liệu đặc hữu của Việt Nam, chúng tôi luôn kiến định những triết lý trên hành trình tìm về đẹp thật sự của làn da.
        </Typography>


        <Link to="/posts/triet-li-thuong-hieu">
          <Button
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            sx={{
              backgroundColor: '#000',
              color: '#fff',
              py: { xs: 1, md: 1.5 },
              px: { xs: 3, md: 4 },
              fontSize: { xs: '0.9rem', md: '1rem' },
              '&:hover': {
                backgroundColor: '#333',
              },
              borderRadius: '50px',
              textTransform: 'uppercase',
            }}
          >
            Tìm hiểu thêm
          </Button>
        </Link>

      </Container>
    </Box>
  );
}