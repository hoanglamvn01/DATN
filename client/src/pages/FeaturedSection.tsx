import React from 'react';
import { Link } from 'react-router-dom';

// Interface cho Props của component
interface FeaturedSectionProps {
  isReversed?: boolean; 
  smallHeading?: string;
  largeHeading?: string;
  description?: string;
  buttonText?: string;
  // ✅ buttonLink: Đường dẫn cơ sở (ví dụ: "/products")
  buttonLink?: string; 
  mainImage?: string;
  smallImage1?: string;
  smallImage2?: string;
  // ✅ categorySlug: Slug của danh mục để thêm vào query string
  categorySlug?: string; 
}

export default function FeaturedSection({ 
    isReversed = false, 
    smallHeading = "What's new",
    largeHeading = "Limited Edition Refreshing Passionfruit",
    description = "Kickstart your summer with our Passionfruit Scrub, Shower Gel, Body Yogurt and Body Mist. Layer all four for a sensory experience that builds a gorgeous fragrance with each step. Your skin? Refreshed. Your mood? Lifted. Your summer? Truly tropical.",
    buttonText = "SHOP NOW", 
    buttonLink = "/products", // ✅ Đặt mặc định là "/products"
    mainImage = "/img/main-product.png", 
    smallImage1 = "/img/small-product-1.png", 
    smallImage2 = "/img/small-product-2.png",
    categorySlug, // ✅ Nhận categorySlug từ props
}: FeaturedSectionProps) {

  // ✅ Xây dựng URL đích: /products?category=sua-rua-mat
  const targetLink = categorySlug ? `${buttonLink}?category=${categorySlug}` : buttonLink;

  return (
    <>
      <style>{`
        /* --- CSS CHO COMPONENT FEATUREDSECTION --- */
        /* ... (CSS của bạn) ... */
        .featured-section-container {
            background-color: #fcf8f3;
            padding: 0px !important;
            overflow: hidden;
            font-family: 'Raleway', sans-serif;
        }
        .featured-content-wrapper {
            margin: 0 auto; 
            width: 100%; 
            height: 450px;
            display: flex;
            align-items: stretch;
            gap: 0px !important;
            flex-wrap: nowrap;
        }
        .featured-image-gallery {
            flex: 1;
            min-width: 350px;
            position: relative;
            display: flex;
            justify-content: flex-start;
            align-items: center;
            padding: 0px !important;
            overflow: hidden;
             border-radius: 20px !important;
        }
        .main-product-image {
            width: 100%;
            height: auto;
            border-radius: 0 !important;
            box-shadow: none !important;
            z-index: 2;
            position: relative;
            display: block;
            object-fit: cover;
        }
        /* ... (CSS cho smallImage và text content) ... */

        .featured-text-content {
            flex: 1;
            max-width: 50%;
            min-width: 350px;
            text-align: left;
            padding: 50px 40px !important;
        }
        .featured-small-heading {
            font-family: 'Raleway', sans-serif;
            font-size: 16px;
            font-weight: 600;
            text-transform: uppercase;
            color: #888;
            margin-bottom: 10px;
            letter-spacing: 1px;
        }
        .featured-large-heading {
            font-family: 'Playfair Display', serif;
            font-size: 40px;
            font-weight: 700;
            color: #1a2a4b;
            margin-bottom: 20px;
            line-height: 1.2;
        }
        .featured-description {
            font-family: 'Raleway', sans-serif;
            font-size: 18px;
            line-height: 1.6;
            color: #555;
            margin-bottom: 30px;
        }
        .featured-button {
            display: inline-block;
            padding: 12px 30px;
            border: 1px solid #1a2a4b;
            border-radius: 5px;
            background-color: #fff;
            color: #1a2a4b;
            font-family: 'Raleway', sans-serif;
            font-size: 16px;
            font-weight: 600;
            text-transform: uppercase;
            text-decoration: none;
            transition: all 0.3s ease;
            letter-spacing: 1px;
        }
        .featured-button:hover {
            background-color: #1a2a4b;
            color: #fff;
        }

        /* 6. Responsive adjustments */
        @media (max-width: 768px) {
            .featured-content-wrapper {
                flex-direction: column;
                text-align: center;
                gap: 0;
            }
            .featured-image-gallery {
                width: 100%;
                min-width: unset;
                margin-bottom: 0;
                padding: 0 !important;
            }
            .main-product-image {
                width: 100%;
                border-radius: 0 !important;
                box-shadow: none !important;
            }
            .small-product-image {
                position: static;
                width: 50%;
                transform: none;
                margin: 10px auto;
            }
            .featured-text-content {
                width: 100%;
                min-width: unset;
                padding: 40px 20px !important;
                max-width: 100% !important;
            }
        }
        .featured-content-wrapper.reversed {
            flex-direction: row-reverse;
        }
        .featured-content-wrapper.reversed .featured-text-content {
            text-align: left;
        }
        .featured-content-wrapper.reversed .featured-image-gallery {
                justify-content: flex-end;
            }
        @media (max-width: 768px) {
            .featured-content-wrapper.reversed {
                flex-direction: column;
            }
        }
      `}</style>

      <div className="featured-section-container">
        <div className={`featured-content-wrapper ${isReversed ? 'reversed' : ''}`}>
          {/* Cột hình ảnh */}
          <div className="featured-image-gallery">
            <img src={mainImage} alt={largeHeading} className="main-product-image" />
          </div>

          {/* Cột nội dung */}
          <div className="featured-text-content">
            <p className="featured-small-heading">{smallHeading}</p>
            <h2 className="featured-large-heading">{largeHeading}</h2>
            <p className="featured-description">{description}</p>
            
            {/* ✅ Sử dụng targetLink đã xây dựng */}
            <Link to={targetLink} className="featured-button">
              {buttonText}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}