import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Rating, TextField, Button, Divider, List,
  ListItem, ListItemAvatar, Avatar, ListItemText, CircularProgress, Paper
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

interface Review {
  review_id: number;
  username: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface ProductReviewProps {
  productId: number;
}

const API_BASE_URL = 'http://localhost:3000/api';

const ProductReview: React.FC<ProductReviewProps> = ({ productId }) => {
  const { currentUser } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [userHasPurchased, setUserHasPurchased] = useState(false);
  const [rating, setRating] = useState<number | null>(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ useEffect đã được tối ưu
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const reviewPromise = axios.get(`${API_BASE_URL}/reviews/product/${productId}`);
        const purchasePromise = currentUser?.user_id
          ? axios.get(`${API_BASE_URL}/reviews/purchased/${currentUser.user_id}/${productId}`)
          : Promise.resolve({ data: { hasPurchased: false } });

        const [reviewResponse, purchaseResponse] = await Promise.all([reviewPromise, purchasePromise]);

        setReviews(reviewResponse.data);
        setUserHasPurchased(purchaseResponse.data.hasPurchased);

      } catch (error) {
        toast.error('Không thể tải dữ liệu đánh giá.');
      } finally {
        setLoading(false);
      }
    };
    
    // Chỉ chạy khi có productId
    if (productId) {
      fetchData();
    }
  }, [productId, currentUser]); // Chạy lại khi productId hoặc currentUser thay đổi

  const handleSubmitReview = async () => {
    if (!rating || rating < 1) {
      return toast.error("Vui lòng chọn số sao đánh giá.");
    }
    if (!comment.trim()) {
      return toast.error("Vui lòng nhập nội dung bình luận.");
    }
    if (!currentUser) return;

    setIsSubmitting(true);
    try {
      await axios.post(`${API_BASE_URL}/reviews`, {
        user_id: currentUser.user_id,
        product_id: productId,
        rating: rating,
        comment: comment,
      });
      toast.success("Cảm ơn chị đã gửi đánh giá!");
      
      // Tải lại dữ liệu sau khi gửi thành công
      const reviewResponse = await axios.get(`${API_BASE_URL}/reviews/product/${productId}`);
      setReviews(reviewResponse.data);
      setComment('');
      setRating(5);

    } catch (error) {
      toast.error("Gửi đánh giá thất bại. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>;
  }

  // JSX giữ nguyên
  return (
    <Box>
       <Typography variant="h6" gutterBottom>
        Các đánh giá hiện có ({reviews.length})
      </Typography>
      <Divider sx={{ mb: 2 }} />
      {reviews.length > 0 ? (
        <List>
          {reviews.map((review) => (
            <React.Fragment key={review.review_id}>
              <ListItem alignItems="flex-start">
                <ListItemAvatar>
                  <Avatar>{review.username?.charAt(0).toUpperCase()}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={ <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}> <Typography variant="subtitle1" fontWeight="bold" sx={{ mr: 1 }}> {review.username} </Typography> <Rating value={review.rating} readOnly size="small" /> </Box> }
                  secondary={ <> <Typography variant="body2" color="text.primary" sx={{ mb: 1 }}> {review.comment} </Typography> <Typography variant="caption" color="text.secondary"> {new Date(review.created_at).toLocaleDateString('vi-VN')} </Typography> </> }
                />
              </ListItem>
              <Divider variant="inset" component="li" />
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Typography sx={{ mt: 3, textAlign: 'center', color: 'text.secondary' }}>
          Chưa có đánh giá nào cho sản phẩm này.
        </Typography>
      )}
      {currentUser && userHasPurchased && (
        <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>Viết đánh giá của chị</Typography>
          <Rating name="product-rating" value={rating} onChange={(_event, newValue) => setRating(newValue)} sx={{ mb: 2 }}/>
          <TextField label="Bình luận của chị" multiline rows={4} fullWidth variant="outlined" value={comment} onChange={(e) => setComment(e.target.value)} sx={{ mb: 2 }}/>
          <Button variant="contained" onClick={handleSubmitReview} disabled={isSubmitting}>
            {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
          </Button>
        </Paper>
      )}
     
    </Box>
  );
};

export default ProductReview;