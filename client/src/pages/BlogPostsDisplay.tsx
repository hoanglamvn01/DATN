import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

interface Post {
  post_id: number;
  title: string;
  content: string;
  thumbnail: string | null;
  author_id: number;
  slug: string;
  created_at: string;
  updated_at: string | null;
}

const API_BASE_URL = 'http://localhost:3000/api/posts';
const UPLOADS_BASE_URL = 'http://localhost:3000/uploads/';

export default function BlogPostsDisplay() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

const fetchPosts = useCallback(async () => {
  try {
    const res = await axios.get(API_BASE_URL);
    const sortedPosts = res.data
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) // sắp xếp mới nhất
      .slice(0, 3) // chỉ lấy 3 bài viết
      .map((post: any) => ({
        ...post,
        post_id: Number(post.post_id),
        author_id: Number(post.author_id),
      }));
    setPosts(sortedPosts);
  } catch (err) {
    console.error('Lỗi tải bài viết:', err);
  } finally {
    setLoading(false);
  }
}, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear().toString().slice(-2);
    return `${d}.${m}.${y}`;
  };

  if (loading) return <div className="text-center my-5">Đang tải bài viết...</div>;

  return (
    <div className="container py-5" >
      <h2 className="text-center fw-bold text-uppercase mb-5" style={{ letterSpacing: '2px' }}>
        Câu chuyện về Cocoon
      </h2>
      <div className="text-end mb-3 mt-4">
  <Link to="/bai-viet" className="btn btn-outline-dark px-4 py-2">
    Xem tất cả bài viết
  </Link>
</div>
      <div className="row g-4">
        {posts.map(post => (
          <div className="col-12 col-sm-6 col-md-4" key={post.post_id}>
            <Link to={`/posts/${post.slug}`} className="text-decoration-none text-dark">
              <div className="card h-100 shadow-sm border-0">
                <div className="ratio ratio-4x3">
                  <img
                    src={`${UPLOADS_BASE_URL}${post.thumbnail}`}
                    className="card-img-top object-fit-cover"
                    alt={post.title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image';
                    }}
                  />
                </div>
                <div className="card-body d-flex flex-column">
                  <small className="text-muted text-uppercase mb-2">
                    Cocoon | {formatDate(post.created_at)}
                  </small>
                  <h5 className="card-title fw-bold mb-2">
                    {post.title}
                  </h5>
                  <p className="card-text text-muted mt-auto" style={{ fontSize: '0.95rem' }}>
                    {post.content
                      ? `${post.content.replace(/<[^>]*>?/gm, '').slice(0, 150)}...`
                      : ''}
                  </p>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
