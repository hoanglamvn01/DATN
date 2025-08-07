import "../css/Footer.css"
import { Link } from 'react-router-dom';
const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Cột 1 - Thương hiệu */}
        <div className="footer-column">
          <h3 className="brand">
            <span className="dot"></span> Night Owls
          </h3>
          <p>Địa chỉ uy tín hàng đầu về mỹ phẩm chính hãng tại Việt Nam</p>
          <div className="social-icons">
            <a href="/contact"><i className="fab fa-facebook"></i>Liên hệ ngay</a>
            <a href="#"><i className="fab fa-instagram"></i></a>
            <a href="#"><i className="fab fa-youtube"></i></a>
          </div>
        </div>

        {/* Cột 2 - Danh mục sản phẩm */}
        <div className="footer-column">
          <h4>Danh mục sản phẩm</h4>
          <ul>
              <li><Link to="/products?category=cham-soc-da">Chăm sóc da</Link></li>
              <li><Link to="/products?category=serum">Serum</Link></li>
              <li><Link to="/products?category=cham-soc-toc">Chăm sóc tóc</Link></li>
              <li><Link to="/products?category=serum">Serum</Link></li>
              <li><Link to="/products?category=serum">Serum</Link></li>
          </ul>
        </div>

        {/* Cột 3 - Hỗ trợ khách hàng */}
        <div className="footer-column">
          <h4>Hỗ trợ khách hàng</h4>
          <ul>
             <li><Link to="/chinh-sach-ban-hang">Chính sách bán hàng</Link></li>
            <li><Link to="/chinh-sach-bao-mat">Chính sách bảo mật</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>Đồ án tốt nghiệp</p>
      </div>
    </footer>
  );
};

export default Footer;
