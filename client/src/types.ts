// src/types.ts

export interface Product {
  product_id: string; // Hoặc number nếu bạn chắc chắn backend trả về số
  name: string;
  description: string | null;
  short_description: string | null;
  price: string; // Vẫn giữ là string vì MySQL DECIMAL có thể trả về string
  discount_price: string | null; // Vẫn giữ là string
  quantity: number;
  sold: number;
  category_id: string; 
  brand_id: string; 
  thumbnail: string | null;
  created_at: string; 
  updated_at: string; 
}