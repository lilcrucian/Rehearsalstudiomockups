import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  CircularProgress,
  Grid
} from "@mui/material";
import { People } from "@mui/icons-material";
import { hallAPI, type Hall } from "../../utils/api";
import { getCurrentUser } from "../../utils/auth";
import { InteractiveCalendar } from "./InteractiveCalendar";
import { projectId, publicAnonKey } from '/utils/supabase/info';

const WORK_START = 8;
const WORK_END = 22; // exclusive — последний слот 21:00

// Возвращает Set занятых часов для зала на дату
async function fetchOccupiedHours(hallId: string, date: string): Promise<Set<number>> {
  const res = await fetch(
    `https://${projectId}.supabase.co/rest/v1/bookings` +
    `?select=start_time,duration_hours&hall_id=eq.${hallId}&booking_date=eq.${date}&status=neq.cancelled`,
    { headers: { apikey: publicAnonKey, Authorization: `Bearer ${publicAnonKey}` } }
  );
  if (!res.ok) return new Set();
  const bookings: { start_time: string; duration_hours: number }[] = await res.json();
  const occupied = new Set<number>();
  for (const b of bookings) {
    const start = parseInt(b.start_time.split(':')[0]);
    for (let h = start; h < start + b.duration_hours; h++) occupied.add(h);
  }
  return occupied;
}

export function OnlineBooking() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [halls, setHalls] = useState<Hall[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHall, setSelectedHall] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState<string>("");
  const [duration, setDuration] = useState(2);
  const [occupiedHours, setOccupiedHours] = useState<Set<number>>(new Set());
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [people, setPeople] = useState(1);

  useEffect(() => {
    if (!currentUser) { navigate("/"); return; }
    loadHalls();
  }, []);

  // Перезагружаем занятые часы при смене зала или даты
  useEffect(() => {
    if (!selectedHall || !date) { setOccupiedHours(new Set()); setTime(""); return; }
    setSlotsLoading(true);
    setTime("");
    fetchOccupiedHours(selectedHall, date)
      .then(setOccupiedHours)
      .finally(() => setSlotsLoading(false));
  }, [selectedHall, date]);

  // Сбрасываем время если оно стало недоступным после смены длительности
  useEffect(() => {
    if (time && !isSlotAvailable(parseInt(time), duration)) setTime("");
  }, [duration]);

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

  // Слот доступен если все часы [hour … hour+duration-1] свободны и не выходят за рабочее время
  const isSlotAvailable = (hour: number, dur: number) => {
    if (hour + dur > WORK_END) return false;
    for (let h = hour; h < hour + dur; h++) {
      if (occupiedHours.has(h)) return false;
    }
    return true;
  };

  const handleBooking = () => {
    if (selectedHall && date && time && currentUser) {
      sessionStorage.setItem('pendingBooking', JSON.stringify({ hallId: selectedHall, date, time, duration, people }));
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

  const hours = Array.from({ length: WORK_END - WORK_START }, (_, i) => i + WORK_START);

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
                  <CardMedia component="img" height="140" image={hall.imageUrl} alt={hall.name} />
                  <CardContent>
                    <Typography variant="h6" gutterBottom>{hall.name}</Typography>
                    <Box className="flex justify-between items-center mb-2">
                      <Typography variant="body2" color="text.secondary">
                        {hall.pricePerHour} ₽/час
                      </Typography>
                      <Chip icon={<People />} label={`до ${hall.capacity} чел`} size="small" />
                    </Box>
                    {!hall.isAvailable && <Chip label="Недоступен" color="error" size="small" />}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        <Grid key="booking-details" size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Детали бронирования</Typography>

              {!selectedHall && (
                <Alert severity="info" sx={{ mb: 2 }}>Выберите зал для продолжения</Alert>
              )}

              <Box sx={{ mt: 2, mb: 1, opacity: selectedHall ? 1 : 0.4, pointerEvents: selectedHall ? 'auto' : 'none' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Выберите дату
                </Typography>
                <InteractiveCalendar selectedDate={date} onDateSelect={setDate} />
              </Box>

              <FormControl fullWidth margin="normal" disabled={!selectedHall}>
                <InputLabel>Количество человек</InputLabel>
                <Select
                  value={people}
                  onChange={(e) => setPeople(Number(e.target.value))}
                  label="Количество человек"
                >
                  {Array.from(
                    { length: halls.find(h => h.id === selectedHall)?.capacity || 10 },
                    (_, i) => i + 1
                  ).map(n => (
                    <MenuItem key={n} value={n}>{n} {n === 1 ? 'человек' : n < 5 ? 'человека' : 'человек'}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal" disabled={!selectedHall}>
                <InputLabel>Длительность</InputLabel>
                <Select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  label="Длительность"
                >
                  {[1, 2, 3, 4].map(d => (
                    <MenuItem key={d} value={d}>{d} {d === 1 ? 'час' : 'часа'}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal" disabled={!selectedHall || !date || slotsLoading}>
                <InputLabel>
                  Время начала{slotsLoading ? ' (загрузка...)' : ''}
                </InputLabel>
                <Select
                  value={time ?? ""}
                  onChange={(e) => setTime(e.target.value)}
                  label={slotsLoading ? 'Загрузка...' : 'Время начала'}
                >
                  {hours.map(hour => {
                    const label = `${String(hour).padStart(2, '0')}:00`;
                    const available = isSlotAvailable(hour, duration);
                    const endLabel = `${String(hour + duration).padStart(2, '0')}:00`;
                    return (
                      <MenuItem
                        key={label}
                        value={label}
                        disabled={!available}
                        sx={{ '&.Mui-disabled': { opacity: 0.5 } }}
                      >
                        <Box display="flex" alignItems="center" gap={1} width="100%">
                          <Box sx={{
                            width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                            bgcolor: available ? '#66bb6a' : '#ef5350',
                          }} />
                          {label}
                          <Typography variant="caption" color={available ? 'text.secondary' : 'error'} sx={{ ml: 'auto' }}>
                            {available ? `– ${endLabel}` : 'занято'}
                          </Typography>
                        </Box>
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>

              {!date && selectedHall && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  Сначала выберите дату
                </Typography>
              )}

              {selectedHall && date && time && (
                <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="body2" gutterBottom>Итого к оплате:</Typography>
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
