import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { SigninSignupContent } from "./SigninSignupContent";
import { useSnackbar } from "../hooks/useSnackbar";

type Props = {
  onSignIn: () => void;
  error?: boolean;
};

type FieldValues = { email: string; password_hash: string };
const API_URL_LOGIN = "http://localhost:3000/api/auth/login";

export const SignInPage: React.FC<Props> = ({ onSignIn }) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FieldValues>({ defaultValues: { email: "", password_hash: "" } });
  const { openSnackbar } = useSnackbar();

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const onSubmit = async (data: FieldValues) => {
    const response = await fetch(API_URL_LOGIN, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    try {
      if (result) {
        const admin = result.user.role === "admin";
        if (admin) {
          localStorage.setItem("token", result.token);
        }
        onSignIn();
        openSnackbar({ severity: "success", text: "Đăng nhập thành công" });
      } else {
        openSnackbar({ severity: "error", text: "Đăng nhập thất bại" });
      }
    } catch (error) {
      console.error(error);
      openSnackbar({ severity: "error", text: result.message });
    }
  };

  return (
    <SigninSignupContent>
      <form style={{ height: "100%" }}>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="stretch"
          minHeight="100%"
          justifyContent="center"
        >
          <Box sx={{ height: { xs: 50, md: 72, sm: 50 } }} />
          <Typography
            variant="h5"
            align="center"
            sx={{ fontWeight: "bold", px: 4, wordBreak: "keep-all" }}
          >
            Đăng nhập
          </Typography>
          <Box height={32} />
          <Box
            width="60%"
            alignSelf="center"
            display="flex"
            flexDirection="column"
            alignItems="stretch"
          >
            <Box height={8} />
            <Controller
              name="email"
              control={control}
              rules={{
                required: "Email là bắt buộc",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Email không hợp lệ",
                },
              }}
              render={({ field }) => (
                <TextField
                  type="text"
                  variant="outlined"
                  error={!!errors.email}
                  label={
                    <Typography variant="caption">Tên đăng nhập</Typography>
                  }
                  fullWidth
                  helperText={errors.email?.message}
                  {...field}
                  slotProps={{
                    input: {
                      "aria-label": "email",
                    },
                  }}
                />
              )}
            />
            <Box height={12} />
            <Controller
              name="password_hash"
              rules={{
                required: "password required",
              }}
              control={control}
              render={({ field }) => (
                <TextField
                  error={!!errors.password_hash}
                  type={isPasswordVisible ? "text" : "password"}
                  fullWidth
                  helperText={errors.password_hash?.message}
                  label={<Typography variant="caption">Mật khẩu</Typography>}
                  slotProps={{
                    input: {
                      endAdornment: isClient ? (
                        <InputAdornment position="end">
                          <IconButton
                            name="password-visibility"
                            aria-label="パスワード表示/非表示"
                            size="small"
                            onClick={() =>
                              setIsPasswordVisible(!isPasswordVisible)
                            }
                            onMouseDown={(e) => e.preventDefault()}
                          >
                            {isPasswordVisible ? (
                              <VisibilityOffIcon />
                            ) : (
                              <VisibilityIcon />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ) : null,
                      "aria-label": "password_hash",
                    },
                  }}
                  {...field}
                />
              )}
            />
            <Box height={16} />

            <Button
              name="signin"
              aria-label="Login"
              variant="contained"
              color="primary"
              type="submit"
              disabled={isSubmitting}
              onClick={handleSubmit(onSubmit)}
            >
              Login
            </Button>

            <Box height={10} />

            <Button variant="text" color="primary">
              Forgot password?
            </Button>

            <Box height={28} />
          </Box>
        </Box>
      </form>
    </SigninSignupContent>
  );
};
