// 📁 src/pages/PostDetailPage.tsx

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  Typography,
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';

const API_BASE_URL = 'http://localhost:3000/api/posts';
const UPLOADS_BASE_URL = 'http://localhost:3000/uploads/';
const POPULAR_POSTS_LIMIT = 5;

interface Post {
  post_id: number;
  title: string;
  content: string;
  thumbnail: string | null;
  slug: string;
  created_at: string;
  author_name?: string;     // ✅ Thêm trường tác giả
  category_name?: string;   // ✅ Thêm trường danh mục
}

const PostDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [popularPosts, setPopularPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // ✅ Sửa lỗi: Sử dụng Promise.all để lấy dữ liệu hiệu quả hơn
      const [postRes, popularPostsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/slug/${slug}`),
        axios.get(`${API_BASE_URL}?limit=${POPULAR_POSTS_LIMIT}`),
      ]);

      const fetchedPost = postRes.data;
      setPost(fetchedPost);

      const filteredPopularPosts = popularPostsRes.data.filter(
        (p: Post) => p.post_id !== fetchedPost.post_id
      );
      setPopularPosts(filteredPopularPosts.slice(0, 5));
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu bài viết:', err);
      setError('Không thể tải chi tiết bài viết. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) {
      fetchData();
    }
  }, [slug, fetchData]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Đang tải bài viết...</Typography>
      </Box>
    );
  }

  if (error || !post) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', color: 'error.main' }}>
        <Typography variant="h6">{error || 'Không tìm thấy bài viết này.'}</Typography>
        <Button variant="outlined" sx={{ mt: 2 }} component={Link} to="/bai-viet">
          Quay lại danh sách bài viết
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '800px', mx: 'auto', p: { xs: 2, md: 6 }, mt: 10 }}>
      <Grid container spacing={6}>
        {/* ✅ Cột trái: Nội dung bài viết chính */}
        <Grid item xs={12} md={8}>
          <Typography variant="caption" color="text.secondary">
          {dayjs(post.created_at).format('DD.MM.YYYY')}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, mb: 2 }}>
            {post.title}
          </Typography>

          <Box
  component="img"
  src={post.thumbnail ? `${UPLOADS_BASE_URL}${post.thumbnail}` : 'https://via.placeholder.com/800x450?text=No+Image'}
  alt={post.title}
  sx={{
    width: '100%',
    borderRadius: 2,
    mb: 3,
    display: 'block',
    mx: 'auto' // ✅ canh giữa
  }}
/>

          <Divider sx={{ mb: 3 }} />
          <Box dangerouslySetInnerHTML={{ __html: post.content }} />
        </Grid>

        {/* ✅ Cột phải: Bài viết phổ biến */}
        <Grid item xs={12} md={4}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Bài viết phổ biến
          </Typography>
          {popularPosts.map((p) => (
            <React.Fragment key={p.post_id}>
              {/* ✅ Sửa lỗi: Bọc mỗi post trong một Link có thể click được */}
              <Box
                component={Link}
                to={`/posts/${p.slug}`}
                sx={{
                  display: 'flex',
                  mb: 2,
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'background-color 0.2s',
                  '&:hover': {
                    bgcolor: '#ecececff',
                  },
                }}
              >
                <Box
                  component="img"
                  src={p.thumbnail ? `${UPLOADS_BASE_URL}${p.thumbnail}` : 'https://via.placeholder.com/80x80?text=No+Image'}
                  alt={p.title}
                  sx={{ width: 100, height: 100, objectFit: 'cover', mr: 2, borderRadius: 1 }}
                />
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} noWrap sx={{mt:3}}>
                
                     {p.title?.replace(/<[^>]+>/g, '').slice(0, 70)}...
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {p.content?.replace(/<[^>]+>/g, '').slice(0, 60)}...
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ mb: 2 }} />
            </React.Fragment>
          ))}
        </Grid>
      </Grid>
    </Box>
  );
};

export default PostDetailPage;