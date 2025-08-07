import React from 'react';
import { Trash2 } from 'lucide-react';

type Review = {
  review_id: number;
  product_id: number;
  user_id: number;
  rating: number;
  comment: string;
  created_at: string;
};

const dummyReviews: Review[] = [
  {
    review_id: 1,
    product_id: 101,
    user_id: 2001,
    rating: 5,
    comment: 'Sản phẩm rất tốt, giao hàng nhanh!',
    created_at: '2024-06-01',
  },
  {
    review_id: 2,
    product_id: 102,
    user_id: 2002,
    rating: 3,
    comment: 'Chất lượng ổn nhưng giao hàng chậm.',
    created_at: '2024-06-03',
  },
];

const ManageReviews: React.FC = () => {
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
            {dummyReviews.map((review) => (
              <tr key={review.review_id} className="hover:bg-gray-50">
                <td className="py-3 px-4 border-b">{review.review_id}</td>
                <td className="py-3 px-4 border-b">{review.product_id}</td>
                <td className="py-3 px-4 border-b">{review.user_id}</td>
                <td className="py-3 px-4 border-b">{review.rating} ⭐</td>
                <td className="py-3 px-4 border-b">{review.comment}</td>
                <td className="py-3 px-4 border-b">{review.created_at}</td>
                <td className="py-3 px-4 border-b text-center">
                  <button className="text-red-600 hover:text-red-800">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageReviews;
