
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

export default function PostListPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await axios.get(API_BASE_URL);
      setPosts(res.data.map((post: any) => ({
        ...post,
        post_id: Number(post.post_id),
        author_id: Number(post.author_id),
      })));
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
    <div className="container py-5" style={{ backgroundColor: '#fbfbfb', marginTop: '100px'  }}>
      <h2 className="text-center fw-bold text-uppercase mb-5" style={{ letterSpacing: '2px' }}>
        Bạn muốn làm đẹp, tham khảo ngay
      </h2>

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
