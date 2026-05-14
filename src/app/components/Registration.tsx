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
import { PersonAdd } from "@mui/icons-material";
import { authAPI } from "../../utils/api";
import { saveCurrentUser } from "../../utils/auth";

export function Registration() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      setError("Заполните все поля");
      return;
    }

    try {
      setLoading(true);
      const user = await authAPI.register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone
      });

      saveCurrentUser(user);
      navigate("/booking");
    } catch (err: any) {
      setError(err.message || "Ошибка при регистрации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="flex items-center justify-center min-h-[80vh]">
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Box className="flex flex-col items-center mb-6">
            <PersonAdd sx={{ fontSize: 48, color: '#757575', mb: 2 }} />
            <Typography variant="h5" component="h1" gutterBottom>
              Регистрация
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Создайте аккаунт для бронирования
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
              label="Имя"
              margin="normal"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            <TextField
              fullWidth
              label="Email"
              type="email"
              margin="normal"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            <TextField
              fullWidth
              label="Телефон"
              margin="normal"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />

            <TextField
              fullWidth
              label="Пароль"
              type="password"
              margin="normal"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />

            <TextField
              fullWidth
              label="Подтвердите пароль"
              type="password"
              margin="normal"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3, mb: 2, bgcolor: '#757575', '&:hover': { bgcolor: '#616161' } }}
            >
              {loading ? <CircularProgress size={24} /> : "Зарегистрироваться"}
            </Button>

            <Box className="text-center">
              <Typography variant="body2">
                Уже есть аккаунт?{" "}
                <Link
                  component="button"
                  type="button"
                  onClick={() => navigate("/")}
                  sx={{ cursor: 'pointer' }}
                >
                  Войти
                </Link>
              </Typography>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
