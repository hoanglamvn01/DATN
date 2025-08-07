import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';

type Post = {
  post_id: number;
  title: string;
  content: string;
  thumbnail: string;
  author_id: number;
  slug: string;
  created_at: string;
  updated_at: string;
};

const dummyPosts: Post[] = [
  {
    post_id: 1,
    title: '10 mẹo chăm sóc da ban đêm',
    content: 'Nội dung bài viết...',
    thumbnail: '/images/skincare1.jpg',
    author_id: 101,
    slug: '10-meo-cham-soc-da',
    created_at: '2024-06-01',
    updated_at: '2024-06-02',
  },
  {
    post_id: 2,
    title: 'Top sản phẩm dưỡng ẩm 2024',
    content: 'Nội dung bài viết...',
    thumbnail: '/images/skincare2.jpg',
    author_id: 102,
    slug: 'top-san-pham-duong-am',
    created_at: '2024-06-10',
    updated_at: '2024-06-11',
  },
];

const ManagePosts: React.FC = () => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Quản lý Bài viết</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
          + Thêm bài viết
        </button>
      </div>

      <div className="bg-white shadow-md rounded overflow-x-auto">
        <table className="min-w-full text-sm text-left border">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 border-b">ID</th>
              <th className="py-3 px-4 border-b">Tiêu đề</th>
              <th className="py-3 px-4 border-b">Thumbnail</th>
              <th className="py-3 px-4 border-b">Author ID</th>
              <th className="py-3 px-4 border-b">Slug</th>
              <th className="py-3 px-4 border-b">Ngày tạo</th>
              <th className="py-3 px-4 border-b">Ngày cập nhật</th>
              <th className="py-3 px-4 border-b text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {dummyPosts.map((post) => (
              <tr key={post.post_id} className="hover:bg-gray-50">
                <td className="py-3 px-4 border-b">{post.post_id}</td>
                <td className="py-3 px-4 border-b">{post.title}</td>
                <td className="py-3 px-4 border-b">
                  <img src={post.thumbnail} alt="Thumbnail" className="w-16 h-10 object-cover rounded" />
                </td>
                <td className="py-3 px-4 border-b">{post.author_id}</td>
                <td className="py-3 px-4 border-b">{post.slug}</td>
                <td className="py-3 px-4 border-b">{post.created_at}</td>
                <td className="py-3 px-4 border-b">{post.updated_at}</td>
                <td className="py-3 px-4 border-b text-center space-x-3">
                  <button className="text-blue-600 hover:text-blue-800">
                    <Pencil size={18} />
                  </button>
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

export default ManagePosts;
