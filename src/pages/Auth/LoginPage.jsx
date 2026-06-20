import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  CircularProgress,
  InputAdornment,
  IconButton,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Tüm alanları doldurun");

    setLoading(true);
    try {
      const { data } = await authService.login({ email, password });
      const token = data.data?.token;
      if (!token) throw new Error("Authentication failed: no token received");
      login(data.data?.user ?? { name: "Admin", email }, token);
      toast.success("Tekrar hoş geldiniz!");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Geçersiz bilgiler");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1A1A2E 0%, #E8272A 100%)",
        p: 2,
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 420 }}>
        <CardContent sx={{ p: 4 }}>
          {/* Logo */}
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 3,
                mx: "auto",
                mb: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "primary.main",
              }}
            >
              <LockOutlinedIcon sx={{ color: "white", fontSize: 28 }} />
            </Box>
            <Typography variant="h5" fontWeight={800}>
              🍣 Sushi Time
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Yönetim Paneli — Devam etmek için giriş yapın
            </Typography>
          </Box>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Şifre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPw(!showPw)}
                      edge="end"
                      size="small"
                    >
                      {showPw ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ py: 1.5, fontWeight: 700, fontSize: 15 }}
            >
              {loading ? (
                <CircularProgress size={22} color="inherit" />
              ) : (
                "Giriş Yap"
              )}
            </Button>
          </form>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 3, textAlign: "center" }}
          >
            Sushi Time Yönetim Paneli
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
