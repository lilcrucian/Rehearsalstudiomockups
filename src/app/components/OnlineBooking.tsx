import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  CircularProgress,
  Grid
} from "@mui/material";
import { CalendarMonth, AccessTime, People } from "@mui/icons-material";
import { hallAPI, type Hall } from "../../utils/api";
import { getCurrentUser } from "../../utils/auth";

export function OnlineBooking() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [halls, setHalls] = useState<Hall[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHall, setSelectedHall] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(2);

  useEffect(() => {
    if (!currentUser) {
      navigate("/");
      return;
    }

    loadHalls();
  }, []);

  const loadHalls = async () => {
    try {
      setLoading(true);
      const data = await hallAPI.getAllHalls();
      setHalls(data);
    } catch (error) {
      console.error("Error loading halls:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = () => {
    if (selectedHall && date && time && currentUser) {
      sessionStorage.setItem('pendingBooking', JSON.stringify({
        hallId: selectedHall,
        date,
        time,
        duration
      }));
      navigate("/booking-confirm");
    }
  };

  if (loading) {
    return (
      <Box className="flex items-center justify-center min-h-[60vh]">
        <CircularProgress sx={{ color: '#757575' }} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Онлайн-бронирование
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Выберите зал и удобное время для репетиции
      </Typography>

      <Grid container spacing={3}>
        <Grid key="halls-list" size={{ xs: 12, md: 8 }}>
          <Grid container spacing={2}>
            {halls.map((hall) => (
              <Grid size={{ xs: 12, sm: 6 }} key={hall.id}>
                <Card
                  sx={{
                    cursor: hall.isAvailable ? 'pointer' : 'not-allowed',
                    opacity: hall.isAvailable ? 1 : 0.6,
                    border: selectedHall === hall.id ? '2px solid #757575' : 'none',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => hall.isAvailable && setSelectedHall(hall.id)}
                >
                  <CardMedia
                    component="img"
                    height="140"
                    image={hall.imageUrl}
                    alt={hall.name}
                  />
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {hall.name}
                    </Typography>
                    <Box className="flex justify-between items-center mb-2">
                      <Typography variant="body2" color="text.secondary">
                        {hall.pricePerHour} ₽/час
                      </Typography>
                      <Chip
                        icon={<People />}
                        label={`до ${hall.capacity} чел`}
                        size="small"
                      />
                    </Box>
                    {!hall.isAvailable && (
                      <Chip label="Недоступен" color="error" size="small" />
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        <Grid key="booking-details" size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Детали бронирования
              </Typography>

              {!selectedHall && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Выберите зал для продолжения
                </Alert>
              )}

              <TextField
                fullWidth
                type="date"
                label="Дата"
                margin="normal"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: <CalendarMonth sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                disabled={!selectedHall}
              />

              <TextField
                fullWidth
                type="time"
                label="Время начала"
                margin="normal"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: <AccessTime sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                disabled={!selectedHall}
              />

              <FormControl fullWidth margin="normal" disabled={!selectedHall}>
                <InputLabel>Длительность</InputLabel>
                <Select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  label="Длительность"
                >
                  <MenuItem key="duration-1" value={1}>1 час</MenuItem>
                  <MenuItem key="duration-2" value={2}>2 часа</MenuItem>
                  <MenuItem key="duration-3" value={3}>3 часа</MenuItem>
                  <MenuItem key="duration-4" value={4}>4 часа</MenuItem>
                </Select>
              </FormControl>

              {selectedHall && date && time && (
                <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="body2" gutterBottom>
                    Итого к оплате:
                  </Typography>
                  <Typography variant="h5" sx={{ color: '#616161' }}>
                    {((halls.find(h => h.id === selectedHall)?.pricePerHour || 0) * duration).toLocaleString()} ₽
                  </Typography>
                </Box>
              )}

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleBooking}
                disabled={!selectedHall || !date || !time}
                sx={{ mt: 3, bgcolor: '#757575', '&:hover': { bgcolor: '#616161' } }}
              >
                Забронировать
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
