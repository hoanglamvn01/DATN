// 📁 src/pages/DashboardPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, CircularProgress, Alert, Card, CardMedia,
  Button, List, ListItem, ListItemText, Avatar, Rating // ✅ Import thêm List, ListItem, ListItemText, Avatar, Rating
} from '@mui/material';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/vi';

// Configuration URLs
const API_BASE_URL = 'http://localhost:3000/api';
const UPLOADS_BASE_URL = 'http://localhost:3000/uploads/';

// --- Interfaces định nghĩa cấu trúc dữ liệu ---

interface OverallStats {
  total_revenue: number;
  total_orders: number;
  total_products: number;
  total_users: number;
}

interface TopSellingProduct {
  product_id: number;
  product_name: string;
  thumbnail: string;
  total_sold_quantity: number;
}

interface TimeSeriesRevenue {
  date: string;
  revenue: number;
}

// ✅ NEW INTERFACE: Đánh giá mới
interface NewReview {
  review_id: number;
  user_name: string;
  product_name: string;
  rating: number;
  comment: string;
  created_at: string; // Ngày đánh giá
  product_thumbnail?: string; // Ảnh sản phẩm liên quan (tùy chọn)
}


// --- Main Component: DashboardPage ---

export default function DashboardPage() {
  // --- State quản lý dữ liệu và trạng thái UI ---
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [topSellingProducts, setTopSellingProducts] = useState<TopSellingProduct[]>([]);
  const [timeSeriesRevenue, setTimeSeriesRevenue] = useState<TimeSeriesRevenue[]>([]);
  // ✅ NEW STATE: Đánh giá mới
  const [newReviews, setNewReviews] = useState<NewReview[]>([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mặc định là 30 ngày gần nhất (như bạn đã cấu hình)
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs().subtract(29, 'day').startOf('day'));
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs().endOf('day'));

  // --- Hàm lấy dữ liệu Dashboard ---
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const formattedStartDate = startDate ? startDate.format('YYYY-MM-DD') : null;
    const formattedEndDate = endDate ? endDate.endOf('day').format('YYYY-MM-DD HH:mm:ss') : null;

    try {
      // Build common query parameters for all API calls
      const commonQueryParams = new URLSearchParams();
      if (formattedStartDate) {
        commonQueryParams.append('startDate', formattedStartDate);
      }
      if (formattedEndDate) {
        commonQueryParams.append('endDate', formattedEndDate);
      } else {
        commonQueryParams.append('endDate', dayjs().endOf('day').format('YYYY-MM-DD HH:mm:ss'));
      }

      // Send API requests concurrently for performance
      const [statsRes, topSellingRes, timeSeriesRes, newReviewsRes] = await Promise.all([ // ✅ Thêm newReviewsRes
        axios.get(`${API_BASE_URL}/stats/overall?${commonQueryParams.toString()}`),
        axios.get(`${API_BASE_URL}/stats/top-selling?limit=5&${commonQueryParams.toString()}`),
        axios.get(`${API_BASE_URL}/stats/time-series-revenue?${commonQueryParams.toString()}`),
        axios.get(`${API_BASE_URL}/stats/new-reviews?limit=5&${commonQueryParams.toString()}`), // ✅ Thêm API call mới cho đánh giá
      ]);

      setOverallStats(statsRes.data);
      setTopSellingProducts(topSellingRes.data);
      setTimeSeriesRevenue(timeSeriesRes.data);
      setNewReviews(newReviewsRes.data); // ✅ Cập nhật state đánh giá mới
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu dashboard:', err);
      setError('Không thể tải dữ liệu thống kê. Vui lòng kiểm tra kết nối mạng và đảm bảo máy chủ API đang chạy.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleClearFilters = () => {
    setStartDate(dayjs().subtract(1, 'month').startOf('month'));
    setEndDate(dayjs());
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', mt: 10 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Đang tải dữ liệu thống kê...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', mt: 10 }}>
        <Alert severity="error">{error}</Alert>
        <Button variant="contained" onClick={fetchDashboardData} sx={{ mt: 2 }}>
          Thử lại
        </Button>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
      <Box sx={{ p: { xs: 2, md: 4 }, mt: 0, maxWidth: '1200px', mx: 'auto' }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
          Dashboard Thống kê
        </Typography>

        {/* --- Date Filter Section --- */}
        <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="h6" sx={{ minWidth: { xs: '100%', sm: 'auto' }, textAlign: { xs: 'center', sm: 'left' } }}>Lọc theo ngày:</Typography>
          <DatePicker
            label="Từ ngày"
            value={startDate}
            onChange={(newValue) => setStartDate(newValue)}
            format="DD/MM/YYYY"
            slotProps={{ textField: { size: 'small', sx: { minWidth: '150px' } } }}
          />
          <DatePicker
            label="Đến ngày"
            value={endDate}
            onChange={(newValue) => setEndDate(newValue)}
            format="DD/MM/YYYY"
            slotProps={{ textField: { size: 'small', sx: { minWidth: '150px' } } }}
          />
          <Button
            variant="outlined"
            onClick={handleClearFilters}
            disabled={!startDate && !endDate}
            sx={{ height: '40px' }}
          >
            Xóa lọc
          </Button>
        </Paper>

        {/* --- Overall Stats --- */}
        <Grid container spacing={3} mb={5}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2, boxShadow: 3, bgcolor: '#e0f7fa' }}>
              <Typography variant="h6" color="text.secondary">Tổng doanh thu</Typography>
              <Typography variant="h5" fontWeight="bold" color="primary.main">
                {overallStats?.total_revenue?.toLocaleString('vi-VN')}₫
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2, boxShadow: 3, bgcolor: '#e8f5e9' }}>
              <Typography variant="h6" color="text.secondary">Đơn hàng mới</Typography>
              <Typography variant="h5" fontWeight="bold" color="success.main">
                {overallStats?.total_orders?.toLocaleString('vi-VN')}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2, boxShadow: 3, bgcolor: '#fffde7' }}>
              <Typography variant="h6" color="text.secondary">Sản phẩm mới</Typography>
              <Typography variant="h5" fontWeight="bold" color="warning.main">
                {overallStats?.total_products?.toLocaleString('vi-VN')}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2, boxShadow: 3, bgcolor: '#e3f2fd' }}>
              <Typography variant="h6" color="text.secondary">Người dùng mới</Typography>
              <Typography variant="h5" fontWeight="bold" color="info.main">
                {overallStats?.total_users?.toLocaleString('vi-VN')}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* --- Daily Revenue Chart (Time Series) --- */}
        <Paper sx={{ p: 3, mb: 5, borderRadius: 2, boxShadow: 3 }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
            Doanh thu {startDate && endDate ? `từ ${startDate.format('DD/MM/YYYY')} đến ${endDate.format('DD/MM/YYYY')}` : '6 tháng gần nhất'}
          </Typography>
          {timeSeriesRevenue.length === 0 ? (
            <Alert severity="info">Không có dữ liệu doanh thu cho khoảng thời gian này.</Alert>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart
                data={timeSeriesRevenue}
                margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value: string) => dayjs(value).format('DD/MM')}
                />
                <YAxis tickFormatter={(value: number) => `${value.toLocaleString('vi-VN')}₫`} />
                <Tooltip
                  formatter={(value: number, name: string, props: any) => [`${value.toLocaleString('vi-VN')}₫`, `Doanh thu ngày ${dayjs(props.payload.date).format('DD/MM/YYYY')}`]}
                  labelFormatter={(label: string) => `Ngày ${dayjs(label).format('DD/MM/YYYY')}`}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#d81b60"
                  activeDot={{ r: 8 }}
                  name="Doanh thu"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Paper>

        {/* --- Top Selling Products --- */}
        <Paper sx={{ p: 3, mb: 5, borderRadius: 2, boxShadow: 3 }}> {/* ✅ Thêm mb={5} để có khoảng cách với phần Đánh giá mới */}
          <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
            Top 5 sản phẩm bán chạy {startDate && endDate ? `từ ${startDate.format('DD/MM/YYYY')} đến ${endDate.format('DD/MM/YYYY')}` : ''}
          </Typography>
          <Grid container spacing={2}>
            {topSellingProducts.length === 0 ? (
              <Grid item xs={12}>
                <Alert severity="info">Chưa có dữ liệu sản phẩm bán chạy cho khoảng thời gian này.</Alert>
              </Grid>
            ) : (
              topSellingProducts.map((product) => (
                <Grid item xs={12} sm={6} md={4} lg={2.4} key={product.product_id}>
                  <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 2, boxShadow: 1 }}>
                    <CardMedia
                      component="img"
                      height="120"
                      image={`${UPLOADS_BASE_URL}${product.thumbnail}`}
                      alt={product.product_name}
                      sx={{ objectFit: 'contain', p: 1 }}
                      onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => { e.currentTarget.src = 'https://via.placeholder.com/120x120?text=No+Image'; }}
                    />
                    <Box sx={{ p: 1.5, flexGrow: 1 }}>
                      <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>
                        {product.product_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Đã bán: {product.total_sold_quantity}
                      </Typography>
                    </Box>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        </Paper>

        {/* ✅ NEW SECTION: Đánh giá mới */}
        <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
            Đánh giá mới nhất {startDate && endDate ? `từ ${startDate.format('DD/MM/YYYY')} đến ${endDate.format('DD/MM/YYYY')}` : ''}
          </Typography>
          {newReviews.length === 0 ? (
            <Alert severity="info">Không có đánh giá mới nào trong khoảng thời gian này.</Alert>
          ) : (
            <List>
              {newReviews.map((review) => (
                <ListItem 
                  key={review.review_id} 
                  alignItems="flex-start" 
                  sx={{ 
                    borderBottom: '1px solid #eee', 
                    py: 1.5, 
                    '&:last-child': { borderBottom: 'none' },
                    display: 'flex', // Để flexbox hoạt động
                    alignItems: 'center', // Căn giữa theo chiều dọc
                    gap: 2 // Khoảng cách giữa các item
                  }}
                >
                  {review.product_thumbnail && (
                    <CardMedia
                      component="img"
                      sx={{ width: 60, height: 60, borderRadius: 1, objectFit: 'cover', flexShrink: 0 }}
                      image={`${UPLOADS_BASE_URL}${review.product_thumbnail}`}
                      alt={review.product_name}
                      onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => { e.currentTarget.src = 'https://via.placeholder.com/60x60?text=No+Img'; }}
                    />
                  )}
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" flexWrap="wrap" gap={1}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {review.user_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
                          đánh giá
                        </Typography>
                        <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
                          {review.product_name}
                        </Typography>
                        <Rating value={review.rating} precision={0.5} readOnly size="small" sx={{ ml: 1, flexShrink: 0 }} />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography
                          sx={{ display: 'block' }}
                          component="span"
                          variant="body2"
                          color="text.primary"
                        >
                          "{review.comment}"
                        </Typography>
                        <Typography
                          sx={{ display: 'block', mt: 0.5 }}
                          component="span"
                          variant="caption"
                          color="text.secondary"
                        >
                          Ngày: {dayjs(review.created_at).format('DD/MM/YYYY HH:mm')}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </Box>
    </LocalizationProvider>
  );
}