// // CategoryManager.tsx
// import React, { useEffect, useState } from 'react';

// // Định nghĩa interface cho Category
// interface Category {
//   category_id: number;
//   category_name: string;
//   slug: string;
//   description: string;
//   image_url: string;
// }

// export default function CategoryManager() {
//   // State để lưu trữ danh sách các danh mục
//   const [categories, setCategories] = useState<Category[]>([]);
//   // State để quản lý dữ liệu trong form thêm/sửa
//   const [formData, setFormData] = useState({ category_name: '', slug: '', description: '', image_url: ''});
//   // State để lưu trữ ID của danh mục đang được chỉnh sửa (null nếu đang thêm mới)
//   const [editingId, setEditingId] = useState<number | null>(null);

//   // Hàm để tải danh sách danh mục từ API
//   const fetchCategories = async () => {
//     try {
//       const res = await fetch('http://localhost:3000/api/categories');
//       const data = await res.json();
//       setCategories(data);
//     } catch (err) {
//       console.error('Lỗi khi tải danh mục:', err);
//       // Có thể hiển thị thông báo lỗi cho người dùng ở đây
//     }
//   };

//   // useEffect để tải danh mục khi component được mount
//   useEffect(() => {
//     fetchCategories();
//   }, []); // [] đảm bảo hàm chỉ chạy một lần sau khi render đầu tiên

//   // Xử lý thay đổi dữ liệu trong input/textarea của form
//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//     const { name, value } = e.target;
//     setFormData({ ...formData, [name]: value });
//   };

//   // Xử lý gửi form (thêm mới hoặc cập nhật danh mục)
//   const handleSubmit = async () => {
//     const url = editingId
//       ? `http://localhost:3000/api/categories/update/${editingId}`
//       : 'http://localhost:3000/api/categories/add';
//     const method = editingId ? 'PUT' : 'POST';

//     try {
//       await fetch(url, {
//         method,
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(formData),
//       });
//       // Sau khi thêm/cập nhật thành công, tải lại danh sách, reset form và trạng thái editing
//       fetchCategories();
//       setFormData({ category_name: '', slug: '', description: '',  image_url: '' });
//       setEditingId(null);
//     } catch (err) {
//       console.error('Lỗi khi gửi dữ liệu:', err);
//       // Hiển thị lỗi cho người dùng
//     }
//   };

//   // Xử lý khi người dùng nhấn nút "Sửa"
//   const handleEdit = (cat: Category) => {
//     setFormData({ category_name: cat.category_name, slug: cat.slug, description: cat.description,   image_url: cat.image_url });
//     setEditingId(cat.category_id);
//   };

//   // Xử lý khi người dùng nhấn nút "Xoá"
//   const handleDelete = async (id: number) => {
//     if (confirm('Xác nhận xoá danh mục này?')) {
//       try {
//         await fetch(`http://localhost:3000/api/categories/delete/${id}`, { method: 'DELETE' });
//         fetchCategories(); // Tải lại danh sách sau khi xoá
//       } catch (err) {
//         console.error('Lỗi khi xoá:', err);
//         // Hiển thị lỗi cho người dùng
//       }
//     }
//   };

//   return (
//     <div className="category-manager-container">
//       <h2 className="category-manager-title">Quản lý danh mục</h2>

//       {/* Form thêm/sửa danh mục */}
//       <div className="form-section">
//         <input
//           className="form-input"
//           placeholder="Tên danh mục"
//           name="category_name"
//           value={formData.category_name}
//           onChange={handleChange}
//         />
//         <input
//           className="form-input"
//           placeholder="Slug"
//           name="slug"
//           value={formData.slug}
//           onChange={handleChange}
//         />
//         <textarea
//           className="form-input form-textarea"
//           placeholder="Mô tả"
//           name="description"
//           value={formData.description}
//           onChange={handleChange}
//         />
//         <input
//           className="form-input"
//           placeholder="Link ảnh (image_url)"
//           name="image_url"
//           value={formData.image_url}
//           onChange={handleChange}
//         />
//         <button
//           className="submit-button"
//           onClick={handleSubmit}
//         >
//           {editingId ? 'Cập nhật danh mục' : 'Thêm mới danh mục'}
//         </button>
//         {editingId && (
//           <button
//             className="submit-button cancel-button"
//             onClick={() => {
//               setEditingId(null);
//               setFormData({ category_name: '', slug: '', description: '',  image_url: '' });
//             }}
//             style={{ marginTop: '0.5rem', backgroundColor: '#6c757d' }} // Thêm style tạm cho nút hủy
//           >
//             Hủy bỏ
//           </button>
//         )}
//       </div>

//       {/* Danh sách các danh mục */}
//       {categories.length > 0 ? (
//         <ul className="category-list">
//           {categories.map((cat) => (
//              <li
//       key={cat.category_id}
//       className="category-item"
//       style={{
//         display: 'flex',
//         alignItems: 'flex-start',
//         padding: '1rem',
//         marginBottom: '1rem',
//         border: '1px solid #ddd',
//         borderRadius: '8px',
//         backgroundColor: '#f9f9f9',
//         gap: '1rem',
//         flexWrap: 'wrap',
//       }}
//     >
//       <img
//         src={cat.image_url}
//         alt={cat.category_name}
//         style={{
//           width: '100px',
//           height: '100px',
//           objectFit: 'cover',
//           borderRadius: '8px',
//           flexShrink: 0,
//         }}
//       />
//       <div style={{ flex: 1 }}>
//         <h3 style={{ margin: 0 }}>{cat.category_name}</h3>
//         <p style={{ marginTop: '0.5rem', color: '#555' }}>{cat.description}</p>
//         <small style={{ color: '#999' }}>Slug: {cat.slug}</small>
//       </div>
//       <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
//         <button
//           className="action-button edit-button"
//           onClick={() => handleEdit(cat)}
//           style={{ padding: '0.4rem 0.8rem' }}
//         >
//           Sửa
//         </button>
//         <button
//           className="action-button delete-button"
//           onClick={() => handleDelete(cat.category_id)}
//           style={{ padding: '0.4rem 0.8rem', backgroundColor: '#dc3545', color: '#fff' }}
//         >
//           Xoá
//         </button>
//       </div>
//     </li>
//           ))}
//         </ul>
//       ) : (
//         <p className="text-center text-gray-500">Chưa có danh mục nào được thêm.</p>
//       )}
//     </div>
//   );
// }