// File: BannerSlider.tsx
import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import '../css/BannerSlider.css'; // Nếu cần style thêm

const banners = [
  { id: 1, image: '/img/banner.png', alt: 'Banner 1' },
  { id: 2, image: '/img/banner1.png', alt: 'Banner 2' },
];

export default function BannerSlider() {
  return (
    <div style={{ marginTop: '120px' }}> 
    <Swiper
      modules={[Autoplay, Pagination]}
      autoplay={{
        delay: 5000, // ⏱️ Chờ 5 giây rồi mới chuyển slide
        disableOnInteraction: false
      }}
      speed={1200} // 🐢 Tốc độ chuyển slide: 1200ms (mặc định là 300ms)
      pagination={{ clickable: true }}
      loop={true}
      spaceBetween={0}
    >
      {banners.map((banner) => (
        <SwiperSlide key={banner.id}>
          <img
            src={banner.image}
            alt={banner.alt}
            style={{
              width: '100%',
              height: '400px',
              objectFit: 'cover',
              display: 'block'
            }}
          />
        </SwiperSlide>
      ))}
    </Swiper>
</div>
  );
}
