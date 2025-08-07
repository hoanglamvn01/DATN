import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Divider,
  TextField,
  MenuItem,
  Pagination,
} from '@mui/material';

const API_URL = 'http://localhost:3000/api/posts';
const UPLOADS_URL = 'http://localhost:3000/uploads/';

const BlogPage = () => {
  const [posts, setPosts] = useState([]);
  const [sortOrder, setSortOrder] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 5;

  useEffect(() => {
    axios.get(API_URL).then((res) => setPosts(res.data));
  }, []);

  // Xử lý sắp xếp
  const sortedPosts = posts.sort((a, b) => {
    const dateA = new Date(a.created_at);
    const dateB = new Date(b.created_at);
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  // Xử lý phân trang
  const totalPages = Math.ceil(sortedPosts.length / postsPerPage);
  const paginatedPosts = sortedPosts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  );

  return (
    <Box
      sx={{
        maxWidth: '960px',
        mx: 'auto',
        px: { xs: 2, md: 4 },
        py: 6,
        bgcolor: '#fdfdfd',
      }}
    >
      <Typography variant="h4" fontWeight={700} mb={1}>
        📰 Tất cả bài viết
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" mb={3}>
        Cập nhật những thông tin và hoạt động mới nhất
      </Typography>
      <Divider sx={{ mb: 4 }} />

      {/* Bộ lọc sắp xếp */}
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
        }}
      >
        <TextField
          select
          size="small"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          label="Sắp xếp"
          sx={{ width: { xs: '100%', sm: 200 } }}
        >
          <MenuItem value="newest">Mới nhất</MenuItem>
          <MenuItem value="oldest">Cũ nhất</MenuItem>
        </TextField>
      </Box>

      {/* Danh sách bài viết */}
      <Grid container spacing={3}>
        {paginatedPosts.map((post) => (
          <Grid item xs={12} key={post.post_id}>
            <Card
              component={Link}
              to={`/posts/${post.slug}`}
              sx={{
                display: 'flex',
                flexDirection: 'row',
                textDecoration: 'none',
                color: 'inherit',
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow: 1,
                transition: '0.2s',
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <CardMedia
                component="img"
                image={UPLOADS_URL + post.thumbnail}
                alt={post.title}
                sx={{
                  width: { xs: 100, sm: 160 },
                  height: { xs: 100, sm: 160 },
                  objectFit: 'cover',
                }}
              />
              <CardContent
                sx={{
                  flex: 1,
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <Typography
                  variant="h6"
                  fontWeight={600}
                  sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    mb: 1,
                  }}
                >
                  {post.title}
                </Typography>
                <Typography variant="caption" color="text.secondary" mb={0.5}>
                  📅 {new Date(post.created_at).toLocaleDateString('vi-VN')}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {post.content.replace(/<[^>]+>/g, '').slice(0, 200)}...
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Phân trang */}
      {totalPages > 1 && (
        <Box mt={5} display="flex" justifyContent="center">
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(e, page) => setCurrentPage(page)}
            color="primary"
            shape="rounded"
          />
        </Box>
      )}
    </Box>
  );
};

export default BlogPage;
