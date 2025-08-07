import { useRef } from "react";
import "../css/HeroSection.css"; 
import { useInView } from "react-intersection-observer";
import { motion } from "framer-motion";



const HeroSection = () => {
  const { ref, inView } = useInView({
    triggerOnce: false, // chạy mỗi lần cuộn vào
    threshold: 0.3,      // khi 30% phần tử vào view thì chạy
  });

  return (
    <section className="bg-light py-5" style={{ backgroundColor: "#fefaf3" }}>
      <div className="container">
        <div className="row align-items-center text-dark">
          {/* Cột trái - Tiêu đề */}
          <div className="col-md-4 mb-4 mb-md-0">
            <h1
              className="display-5 fw-normal"
              style={{ fontFamily: "serif", color: "#1c1c1c" }}
            >
              Gel tắm <br /> đường thốt nốt <br /> An Giang
            </h1>
          </div>

          {/* Cột giữa - Ảnh sản phẩm */}
          <div className="col-md-4 text-center mb-4 mb-md-0">
                    <motion.div
                    ref={ref}
                    className="composite-image-container"
                    initial={{ opacity: 0, y: 60}}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 1, ease: [0.17, 0.55, 0.55, 1] }}
                    whileHover={{ scale: 1.02 }}
                >
                    {/* Layer ảnh với parallax */}
                    <motion.img
                    src="./public/img/img3.png"
                    alt=""
                    className="layer img1"
                    style={{ willChange: "transform, opacity" }}
                    initial={{ opacity: 0, y: 60 }}
                    animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    />
                    <motion.img
                    src="./public/img/img1.png"
                    alt=""
                    className="layer img2"
            initial={{ opacity: 0, y: 60 }}
                    animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    />
                    <motion.img
                    src="./public/img/img2.png"
                    alt=""
                    className="layer img3"
                    initial={{ opacity: 0, y: 60 }}
                    animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    />
                </motion.div>
          </div>
          {/* Cột phải - Mô tả và nút */}
          <div className="col-md-4">
            <p style={{ color: "#5f5f5f", fontSize: "15px", lineHeight: "1.7" }}>
              Từ những tinh thể đường thốt nốt An Giang nhuyễn mịn, giàu chất
              ngăn ngừa oxy hóa và khoáng chất, kết hợp cùng vitamin B5 và B3,
              gel tắm nhẹ nhàng làm sạch, bổ sung độ ẩm, giúp làn da luôn mềm
              mại, sáng mịn và tràn đầy sức sống. Hương thơm tươi mát, thư giãn
              mang lại cảm giác bừng tỉnh, như được thiên nhiên vỗ về sau một
              ngày dài.
            </p>
            <a
              href="products?category=sua-tam"
              className="btn rounded-pill px-4 py-2 mt-2"
              style={{
                backgroundColor: "#f3e7da",
                color: "#5f5f5f",
                fontWeight: 600,
                fontSize: "14px",
              }}
            >
              MUA NGAY →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
