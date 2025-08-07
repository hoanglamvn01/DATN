import React from "react";
import { Link } from "react-router-dom";
import { FaChevronDown } from "react-icons/fa";

// Re-importing types and constants to avoid prop drilling complex objects
interface Category {
  category_id: number;
  category_name: string;
  slug: string;
}

interface Brand {
  brand_id: number;
  brand_name: string;
  slug: string;
}

const NAVBAR_STYLES = {
  dropdown: {
    position: "absolute" as const,
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    border: "1px solid #e9ecef",
    padding: "15px 0",
    marginTop: "8px",
    zIndex: 1000,
    transition: "all 0.3s ease",
  },
};

interface DropdownMenuProps {
  items: Array<{ id: number; name: string; slug: string }>;
  isVisible: boolean;
  linkPrefix: string;
  width?: string;
  position?: "left" | "right";
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({
  items,
  isVisible,
  linkPrefix,
  width = "280px",
  position = "left",
}) => (
  <div
    className="position-absolute bg-white rounded shadow-lg border"
    style={{
      ...NAVBAR_STYLES.dropdown,
      top: "100%",
      [position]: "0",
      width,
      opacity: isVisible ? 1 : 0,
      visibility: isVisible ? "visible" : "hidden",
      transform: isVisible ? "translateY(0)" : "translateY(-10px)",
    }}
  >
    {items.map((item) => (
      <Link
        key={item.id}
        to={`${linkPrefix}${item.slug}`}
        className="d-block px-4 py-2 text-dark text-decoration-none"
        style={{
          fontSize: "13px",
          fontWeight: 500,
          transition: "all 0.2s ease",
          textTransform: "none",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#f8f9fa";
          e.currentTarget.style.color = "#007bff";
          e.currentTarget.style.paddingLeft = "20px";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = "#000";
          e.currentTarget.style.paddingLeft = "16px";
        }}
      >
        {item.name}
      </Link>
    ))}
  </div>
);

interface ProductAndBrandDropdownsProps {
  categories: Category[];
  brands: Brand[];
  isOpen: DropdownState;
  handleMouseEnter: (dropdown: keyof DropdownState) => void;
  handleMouseLeave: (dropdown: keyof DropdownState) => void;
}

const ProductAndBrandDropdowns: React.FC<ProductAndBrandDropdownsProps> = ({
  categories,
  brands,
  isOpen,
  handleMouseEnter,
  handleMouseLeave,
}) => {
  return (
    <>
      {/* Products Dropdown */}
      <li
        className="nav-item mx-3 position-relative"
        onMouseEnter={() => handleMouseEnter("products")}
        onMouseLeave={() => handleMouseLeave("products")}
      >
        <Link
          className="nav-link text-dark d-flex align-items-center"
          to="/products"
          style={{
            transition: "all 0.3s ease",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#007bff";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#000";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          Sản phẩm
          <FaChevronDown
            className="ms-1"
            style={{
              fontSize: "10px",
              transition: "transform 0.3s ease",
              transform: isOpen.products ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        </Link>

        <DropdownMenu
          items={categories.map((cat) => ({
            id: cat.category_id,
            name: cat.category_name,
            slug: cat.slug,
          }))}
          isVisible={isOpen.products}
          linkPrefix="/danh-muc/"
        />
      </li>

      {/* Brands Dropdown */}
      <li
        className="nav-item mx-3 position-relative"
        onMouseEnter={() => handleMouseEnter("brands")}
        onMouseLeave={() => handleMouseLeave("brands")}
      >
        <span
          className="nav-link text-dark d-flex align-items-center"
          style={{
            cursor: "pointer",
            transition: "all 0.3s ease",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#007bff";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#000";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          Thương hiệu
          <FaChevronDown
            className="ms-1"
            style={{
              fontSize: "10px",
              transition: "transform 0.3s ease",
              transform: isOpen.brands ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        </span>

        <DropdownMenu
          items={brands.map((brand) => ({
            id: brand.brand_id,
            name: brand.brand_name,
            slug: brand.slug,
          }))}
          isVisible={isOpen.brands}
          linkPrefix="/thuong-hieu/"
        />
      </li>
    </>
  );
};

export default ProductAndBrandDropdowns;
