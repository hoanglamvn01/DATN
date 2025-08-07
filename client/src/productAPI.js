// src/api/productApi.ts

import { Product } from '../types'; // Import interface Product

const API_BASE_URL = 'http://localhost:3000/api'; 

/**
 * Lấy tất cả sản phẩm từ backend.
 * @returns {Promise<Product[]>} Mảng các đối tượng Product.
 * @throws {Error} Nếu có lỗi HTTP hoặc lỗi từ API.
 */
export const getAllProducts = async (): Promise<Product[]> => {
  const url = `${API_BASE_URL}/products/all`; 
  console.log(`Fetching all products from: ${url}`);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP error! Status: ${response.status}`;
      try {
          const errorJson = JSON.parse(errorText);
          errorMessage += ` - ${errorJson.error || 'Unknown API error'}`;
      } catch (parseError) {
          errorMessage += ` - ${errorText.substring(0, 100)}...`; 
      }
      throw new Error(errorMessage);
    }

    const data: Product[] = await response.json(); // Ép kiểu dữ liệu nhận được thành Product[]
    console.log("Fetched products:", data);
    return data; 
  } catch (error) {
    console.error("Lỗi khi lấy tất cả sản phẩm:", error);
    throw error;
  }
};