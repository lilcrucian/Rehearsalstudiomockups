import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemText,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert
} from "@mui/material";
import { CheckCircle, ArrowBack } from "@mui/icons-material";
import { bookingAPI, hallAPI, type Hall } from "../../utils/api";
import { getCurrentUser } from "../../utils/auth";

export function BookingConfirmationForm() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [agreed, setAgreed] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hall, setHall] = useState<Hall | null>(null);
  const [bookingData, setBookingData] = useState<any>(null);

  useEffect(() => {
    if (!currentUser) {
      navigate("/");
      return;
    }

    const pendingBooking = sessionStorage.getItem('pendingBooking');
    if (!pendingBooking) {
      navigate("/booking");
      return;
    }

    const data = JSON.parse(pendingBooking);
    setBookingData(data);

    // Загружаем информацию о зале
    loadHall(data.hallId);
  }, []);

  const loadHall = async (hallId: string) => {
    try {
      const hallData = await hallAPI.getHall(hallId);
      setHall(hallData);
    } catch (error) {
      console.error("Error loading hall:", error);
      setError("Ошибка загрузки информации о зале");
    }
  };

  const handleConfirm = async () => {
    if (!agreed || !currentUser || !bookingData || !hall) return;

    try {
      setLoading(true);
      setError("");

      const booking = await bookingAPI.createBooking({
        userId: currentUser.id,
        hallId: bookingData.hallId,
        bookingDate: bookingData.date,
        startTime: bookingData.time,
        durationHours: bookingData.duration,
        notes
      });

      sessionStorage.removeItem('pendingBooking');
      navigate(`/booking-confirmation/${booking.id}`);
    } catch (err: any) {
      setError(err.message || "Ошибка при создании бронирования");
    } finally {
      setLoading(false);
    }
  };

  if (!hall || !bookingData) {
    return (
      <Box className="flex items-center justify-center min-h-[60vh]">
        <CircularProgress sx={{ color: '#757575' }} />
      </Box>
    );
  }

  const totalPrice = hall.pricePerHour * bookingData.duration;
  const endTime = `${parseInt(bookingData.time.split(':')[0]) + bookingData.duration}:${bookingData.time.split(':')[1]}`;

  return (
    <Box className="max-w-2xl mx-auto">
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate("/booking")}
        sx={{ mb: 3, color: '#757575' }}
      >
        Назад
      </Button>

      <Card>
        <CardContent sx={{ p: 4 }}>
          <Box className="flex flex-col items-center mb-4">
            <CheckCircle sx={{ fontSize: 48, color: '#757575', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Подтверждение бронирования
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Проверьте детали перед подтверждением
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Детали бронирования
          </Typography>

          <List>
            <ListItem key="confirm-hall" sx={{ px: 0, py: 1 }}>
              <ListItemText
                primary="Зал"
                secondary={hall.name}
                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
              />
            </ListItem>
            <ListItem key="confirm-date" sx={{ px: 0, py: 1 }}>
              <ListItemText
                primary="Дата"
                secondary={new Date(bookingData.date).toLocaleDateString('ru-RU')}
                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
              />
            </ListItem>
            <ListItem key="confirm-time" sx={{ px: 0, py: 1 }}>
              <ListItemText
                primary="Время"
                secondary={`${bookingData.time} - ${endTime}`}
                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
              />
            </ListItem>
            <ListItem key="confirm-duration" sx={{ px: 0, py: 1 }}>
              <ListItemText
                primary="Длительность"
                secondary={`${bookingData.duration} ${bookingData.duration === 1 ? 'час' : 'часа'}`}
                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
              />
            </ListItem>
          </List>

          <Divider sx={{ my: 3 }} />

          <Box className="flex justify-between items-center mb-4">
            <Typography variant="h6">
              Итого к оплате:
            </Typography>
            <Typography variant="h4" sx={{ color: '#616161' }}>
              {totalPrice.toLocaleString()} ₽
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="body2" gutterBottom>
            Дополнительные пожелания
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Укажите особые требования или пожелания..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            sx={{ mb: 3 }}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                sx={{
                  color: '#757575',
                  '&.Mui-checked': {
                    color: '#757575',
                  },
                }}
              />
            }
            label={
              <Typography variant="body2">
                Я согласен с условиями бронирования и правилами студии
              </Typography>
            }
          />

          <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              • Отмена бронирования возможна за 24 часа
            </Typography>
            <br />
            <Typography variant="caption" color="text.secondary">
              • Оплата производится на месте
            </Typography>
            <br />
            <Typography variant="caption" color="text.secondary">
              • Приходите за 10 минут до начала
            </Typography>
          </Box>

          <Box className="flex gap-3 mt-4">
            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate("/booking")}
              sx={{ color: '#757575', borderColor: '#757575' }}
            >
              Отменить
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={handleConfirm}
              disabled={!agreed || loading}
              sx={{
                bgcolor: '#757575',
                '&:hover': { bgcolor: '#616161' },
                '&:disabled': { bgcolor: '#e0e0e0' }
              }}
            >
              {loading ? <CircularProgress size={24} /> : "Подтвердить бронирование"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
