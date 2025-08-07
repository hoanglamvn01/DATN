import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import axios from 'axios';

type Review = {
  review_id: number;
  product_id: number;
  user_id: number;
  rating: number;
  comment: string;
  created_at: string;
};

const ManageReviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);

  // Load danh sách đánh giá
  const fetchReviews = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/reviews');
      setReviews(response.data);
    } catch (error) {
      console.error('Lỗi khi tải đánh giá:', error);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // Hàm xóa đánh giá
  const handleDelete = async (review_id: number) => {
    const confirmDelete = window.confirm('Bạn có chắc chắn muốn xóa đánh giá này không?');
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:3001/api/reviews/${review_id}`);
      setReviews((prev) => prev.filter((r) => r.review_id !== review_id));
    } catch (error) {
      console.error('Lỗi khi xóa đánh giá:', error);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-6">Quản lý Đánh giá</h2>

      <div className="bg-white shadow-md rounded overflow-x-auto">
        <table className="min-w-full text-sm text-left border">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 border-b">ID</th>
              <th className="py-3 px-4 border-b">Sản phẩm</th>
              <th className="py-3 px-4 border-b">Người dùng</th>
              <th className="py-3 px-4 border-b">Số sao</th>
              <th className="py-3 px-4 border-b">Bình luận</th>
              <th className="py-3 px-4 border-b">Ngày đánh giá</th>
              <th className="py-3 px-4 border-b text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review.review_id} className="hover:bg-gray-50">
                <td className="py-3 px-4 border-b">{review.review_id}</td>
                <td className="py-3 px-4 border-b">{review.product_id}</td>
                <td className="py-3 px-4 border-b">{review.user_id}</td>
                <td className="py-3 px-4 border-b">{review.rating} ⭐</td>
                <td className="py-3 px-4 border-b">{review.comment}</td>
                <td className="py-3 px-4 border-b">{review.created_at}</td>
                <td className="py-3 px-4 border-b text-center">
                  <button
                    onClick={() => handleDelete(review.review_id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {reviews.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-6 text-gray-500">
                  Không có đánh giá nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageReviews;
