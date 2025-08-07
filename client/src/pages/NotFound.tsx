import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import {
  Box,
  Button,
  Container,
  Typography,
  useTheme,
  Grid,
  Paper,
  Divider
} from "@mui/material";
import {
  SentimentVeryDissatisfied,
  Home,
  ArrowBack,
  Public,
  ReportProblem
} from "@mui/icons-material";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );

    // Create a subtle confetti effect for visual feedback
    confetti({
      particleCount: 30,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ff9a9e', '#fad0c4', '#a18cd1', '#fbc2eb'],
      disableForReducedMotion: true
    });
  }, [location.pathname]);

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 6,
            borderRadius: 4,
            textAlign: "center",
            background: "linear-gradient(135deg, #f5f7fa 0%, #f8f9fd 100%)",
            border: "1px solid rgba(0, 0, 0, 0.05)",
            position: "relative",
            overflow: "hidden",
            "&:before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 6,
              background: "linear-gradient(90deg, #ff9a9e 0%, #a18cd1 100%)",
            }
          }}
        >
          <Box sx={{ mb: 4 }}>
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              <SentimentVeryDissatisfied
                sx={{
                  fontSize: 100,
                  color: theme.palette.error.main,
                  mb: 2,
                  filter: "drop-shadow(0 4px 8px rgba(244, 67, 54, 0.3))"
                }}
              />
            </motion.div>
          </Box>

          <Typography
            variant="h1"
            sx={{
              fontWeight: "bold",
              mb: 2,
              fontSize: { xs: "4rem", sm: "5rem" },
              background: "linear-gradient(135deg, #ff9a9e 0%, #a18cd1 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "0 2px 4px rgba(0,0,0,0.05)"
            }}
          >
            404
          </Typography>

          <Typography
            variant="h4"
            sx={{
              fontWeight: "bold",
              mb: 2,
              color: theme.palette.text.primary
            }}
          >
            Oops! Page Not Found
          </Typography>

          <Typography
            variant="body1"
            sx={{
              mb: 4,
              color: theme.palette.text.secondary,
              maxWidth: 500,
              mx: "auto"
            }}
          >
            The page you're looking for doesn't exist or has been moved. Here are
            some helpful links instead:
          </Typography>

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 2,
              mb: 4,
              flexWrap: "wrap"
            }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="contained"
                startIcon={<Home />}
                onClick={() => navigate("/")}
                sx={{
                  background: "linear-gradient(135deg, #ff9a9e 0%, #a18cd1 100%)",
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  fontWeight: "bold",
                  textTransform: "none",
                  boxShadow: "0 4px 14px rgba(161, 140, 209, 0.3)",
                  "&:hover": {
                    boxShadow: "0 6px 20px rgba(161, 140, 209, 0.4)",
                  }
                }}
              >
                Return Home
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={() => navigate(-1)}
                sx={{
                  borderColor: "#a18cd1",
                  color: "#a18cd1",
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  fontWeight: "bold",
                  textTransform: "none",
                  "&:hover": {
                    borderColor: "#8e7cc3",
                    backgroundColor: "rgba(161, 140, 209, 0.08)",
                  }
                }}
              >
                Go Back
              </Button>
            </motion.div>
          </Box>

          <Divider sx={{ my: 3, borderColor: "rgba(0, 0, 0, 0.05))" }} />

          <Grid container spacing={2} justifyContent="center">
            <Grid item xs={12} sm={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  bgcolor: "rgba(161, 140, 209, 0.05)",
                  border: "1px solid rgba(161, 140, 209, 0.1)"
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Public color="primary" />
                  <Typography variant="body2" color="text.secondary">
                    You tried to access: <br />
                    <strong>{location.pathname}</strong>
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  bgcolor: "rgba(255, 154, 158, 0.05)",
                  border: "1px solid rgba(255, 154, 158, 0.1)"
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <ReportProblem color="error" />
                  <Typography variant="body2" color="text.secondary">
                    This error has been logged and our team has been notified.
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Paper>
      </motion.div>
    </Container>
  );
};

export default NotFound;
