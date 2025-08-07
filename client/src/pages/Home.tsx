import FeaturedSection from "./FeaturedSection"
import HeroSection from "./HeroSection"
import CocoonHeroSection from "./trietli"
import ProductsWeLove from './ProductsWeLove'
import ProductDisplayPage from "./ProductDisplayPage"

import BannerSlider from "../components/BannerSlider"
import BlogPostsDisplay from "./BlogPostsDisplay"

const Home = () => {
  return (
    <>
    <BannerSlider/>
      <HeroSection />
      <ProductsWeLove/>
    <FeaturedSection 
        smallHeading="Hôm nay có gì đặc biệt?"
        largeHeading="Phiên bản giới hạn hương chanh dây tươi mát"
        description="Bắt đầu mùa hè của bạn với Tẩy tế bào chết chanh dây, Gel tắm, Sữa chua dưỡng thể và Xịt dưỡng thể. Thoa cả bốn lớp để có trải nghiệm cảm giác tạo nên hương thơm tuyệt vời với mỗi bước. Làn da của bạn? Tươi mới. Tâm trạng của bạn? Phấn chấn. Mùa hè của bạn? Thực sự nhiệt đới."
        buttonText="MUA CHANH DƯƠNG"
        buttonLink="/products"
        categorySlug="sua-rua-mat" 
        mainImage="https://www.thebodyshop.com/cdn/shop/files/25Q3_SOL_PassionFruitGroup_CT10_af6e3d32-52fd-4252-91e0-9d34b0e38c9c.jpg?v=1747663358&width=1000"
       
      />
      <ProductDisplayPage/>
      <CocoonHeroSection />
      <BlogPostsDisplay />
    </>
  )
}
export default Home

