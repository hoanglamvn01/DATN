// 📁 client/src/pages/ProductByCategory.tsx Thư
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';

const UPLOADS_BASE_URL = 'http://localhost:3000/uploads/';

interface Product {
  product_id: number;
  name: string;
  thumbnail: string;
  price: number;
  short_description: string;
}

export default function ProductByCategory() {
  const { slug } = useParams();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (slug) {
      axios.get(`http://localhost:3000/api/products/category/${slug}`)
        .then(res => {
          console.log('Đã lấy thành công dữ liệu sản phẩm:', res.data);
          setProducts(res.data);
        })
        .catch(err => {
          console.error('Lỗi khi lấy dữ liệu:', err);
        });
    }
  }, [slug]);

  return (
    <div className="container py-4">
      <h3 className="mb-4">Sản phẩm thuộc danh mục: {slug}</h3>
      <div className="row">
        {products.length === 0 ? (
          <p>Không có sản phẩm nào.</p>
        ) : (
          products.map((product) => (
            <div key={product.product_id} className="col-md-3 mb-4">
              <div className="card h-100">
                <img
                  src={`${UPLOADS_BASE_URL}${product.thumbnail}`}
                  className="card-img-top"
                  alt={product.name}
                  style={{ height: '200px', objectFit: 'cover' }}
                />
                <div className="card-body">
                  <h5 className="card-title">{product.name}</h5>
                  <p className="card-text text-muted">{product.short_description}</p>
                  <p className="card-text fw-bold">{product.price.toLocaleString()} đ</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}