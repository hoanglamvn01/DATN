// CheckoutSuccessPage.tsx
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
} from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import { useEffect } from "react";
import { useCart } from "../context/CartContext";

export default function CheckoutSuccessPage() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const orderCode = new URLSearchParams(search).get("order_code");

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Card
        elevation={0}
        sx={{
          maxWidth: 520,
          width: "100%",
          borderRadius: 4,
          boxShadow: "0 8px 32px rgba(0,0,0,.08)",
          textAlign: "center",
          p: 4,
        }}
      >
        <CheckCircleRoundedIcon sx={{ fontSize: 64, color: "success.main" }} />

        <Typography variant="h5" fontWeight={700} mt={2} mb={1}>
          Đặt hàng thành công!
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={1}>
          Cảm ơn bạn đã tin tưởng mua hàng. Chúng tôi sẽ gửi email xác nhận
          trong ít phút.
        </Typography>

        <CardContent
          sx={{
            backgroundColor: "#f6f8fa",
            borderRadius: 2,
            my: 2,
            px: 3,
            py: 2,
          }}
        >
          <Typography variant="body2" fontWeight={600}>
            Mã đơn hàng
          </Typography>
          <Typography variant="h6" fontWeight={700} color="primary">
            {orderCode}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {new Date().toLocaleDateString("vi-VN")}
          </Typography>
        </CardContent>

        <Stack direction="row" spacing={2} justifyContent="center" mt={3}>
          <Button
            variant="contained"
            startIcon={<HomeRoundedIcon />}
            onClick={() => navigate("/")}
            sx={{ borderRadius: 3, textTransform: "none" }}
          >
            Về trang chủ
          </Button>
          <Button
            variant="outlined"
            startIcon={<AssignmentRoundedIcon />}
            onClick={() => navigate("/orders")}
            sx={{ borderRadius: 3, textTransform: "none" }}
          >
            Đơn hàng của tôi
          </Button>
        </Stack>

        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          mt={3}
        >
          Cần hỗ trợ? Liên hệ <b>gmail</b>
        </Typography>
      </Card>
    </Box>
  );
}