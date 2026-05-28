import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  CircularProgress
} from "@mui/material";
import { Login as LoginIcon } from "@mui/icons-material";
import { authAPI } from "../../utils/api";
import { saveCurrentUser, fetchRoleFromDB } from "../../utils/auth";

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);
      const user = await authAPI.login(email, password);
      // Fetch role directly from Supabase DB (bypasses Edge Function caching)
      const role = await fetchRoleFromDB(user.id);
      saveCurrentUser({ ...user, role });
      navigate("/booking");
    } catch (err: any) {
      setError(err.message || "Ошибка при входе");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="flex items-center justify-center min-h-[80vh]">
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Box className="flex flex-col items-center mb-6">
            <LoginIcon sx={{ fontSize: 48, color: '#757575', mb: 2 }} />
            <Typography variant="h5" component="h1" gutterBottom>
              Вход в систему
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Войдите для бронирования залов
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <TextField
              fullWidth
              label="Пароль"
              type="password"
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3, mb: 2, bgcolor: '#757575', '&:hover': { bgcolor: '#616161' } }}
            >
              {loading ? <CircularProgress size={24} /> : "Войти"}
            </Button>

            <Box className="text-center">
              <Typography variant="body2">
                Нет аккаунта?{" "}
                <Link
                  component="button"
                  type="button"
                  onClick={() => navigate("/registration")}
                  sx={{ cursor: 'pointer' }}
                >
                  Зарегистрироваться
                </Link>
              </Typography>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
