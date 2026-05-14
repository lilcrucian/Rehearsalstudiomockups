import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Grid
} from "@mui/material";
import { CheckCircle, ArrowBack, Print, Email } from "@mui/icons-material";
import { bookingAPI, userAPI, type Booking, type User } from "../../utils/api";
import { getCurrentUser } from "../../utils/auth";

export function BookingConfirmation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser || !id) {
      navigate("/");
      return;
    }

    loadBooking();
  }, [id]);

  const loadBooking = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const bookingData = await bookingAPI.getBooking(id);
      setBooking(bookingData);

      const userData = await userAPI.getUser(bookingData.userId);
      setUser(userData);
    } catch (error) {
      console.error("Error loading booking:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box className="flex items-center justify-center min-h-[60vh]">
        <CircularProgress sx={{ color: '#757575' }} />
      </Box>
    );
  }

  if (!booking || !user) {
    return (
      <Box className="max-w-2xl mx-auto">
        <Typography variant="h5" color="error">
          Бронирование не найдено
        </Typography>
        <Button onClick={() => navigate("/manage-bookings")} sx={{ mt: 2 }}>
          К бронированиям
        </Button>
      </Box>
    );
  }

  const endTime = `${parseInt(booking.startTime.split(':')[0]) + booking.durationHours}:${booking.startTime.split(':')[1]}`;

  return (
    <Box className="max-w-2xl mx-auto">
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate("/manage-bookings")}
        sx={{ mb: 3 }}
      >
        К бронированиям
      </Button>

      <Card>
        <CardContent sx={{ p: 4 }}>
          <Box className="flex flex-col items-center mb-4">
            <CheckCircle sx={{ fontSize: 64, color: '#757575', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Бронирование подтверждено
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Номер бронирования: #{booking.id}
            </Typography>
          </Box>

          <Box sx={{ mb: 4, p: 2, bgcolor: '#f5f5f5', borderRadius: 1, border: '1px solid #e0e0e0' }}>
            <Typography variant="body2" sx={{ color: '#616161' }}>
              Письмо с подтверждением отправлено на {user.email}
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Grid container spacing={3}>
            <Grid key="booking-details" size={{ xs: 12, sm: 6 }}>
              <Typography variant="h6" gutterBottom>
                Детали бронирования
              </Typography>
              <List dense>
                <ListItem key="hall" sx={{ px: 0 }}>
                  <ListItemText primary="Зал" secondary={booking.hallName} />
                </ListItem>
                <ListItem key="date" sx={{ px: 0 }}>
                  <ListItemText primary="Дата" secondary={new Date(booking.bookingDate).toLocaleDateString('ru-RU')} />
                </ListItem>
                <ListItem key="time" sx={{ px: 0 }}>
                  <ListItemText primary="Время" secondary={`${booking.startTime} - ${endTime}`} />
                </ListItem>
                <ListItem key="duration" sx={{ px: 0 }}>
                  <ListItemText primary="Длительность" secondary={`${booking.durationHours} ${booking.durationHours === 1 ? 'час' : 'часа'}`} />
                </ListItem>
              </List>
            </Grid>

            <Grid key="client-info" size={{ xs: 12, sm: 6 }}>
              <Typography variant="h6" gutterBottom>
                Информация о клиенте
              </Typography>
              <List dense>
                <ListItem key="name" sx={{ px: 0 }}>
                  <ListItemText primary="Имя" secondary={user.name} />
                </ListItem>
                <ListItem key="email" sx={{ px: 0 }}>
                  <ListItemText primary="Email" secondary={user.email} />
                </ListItem>
                <ListItem key="phone" sx={{ px: 0 }}>
                  <ListItemText primary="Телефон" secondary={user.phone} />
                </ListItem>
              </List>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Box className="flex justify-between items-center mb-4">
            <Typography variant="h6">
              Итого к оплате:
            </Typography>
            <Typography variant="h4" sx={{ color: '#616161' }}>
              {booking.totalPrice.toLocaleString()} ₽
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" paragraph>
            Оплата производится на месте. Пожалуйста, приходите за 10 минут до начала.
          </Typography>

          <Grid container spacing={2}>
            <Grid key="print-button" size={{ xs: 12, sm: 6 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Print />}
              >
                Распечатать
              </Button>
            </Grid>
            <Grid key="email-button" size={{ xs: 12, sm: 6 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Email />}
              >
                Отправить на email
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
