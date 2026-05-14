import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Grid
} from "@mui/material";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, People, AttachMoney } from "@mui/icons-material";
import { reportsAPI, bookingAPI, type Statistics, type Booking } from "../../utils/api";
import { getCurrentUser } from "../../utils/auth";

export function LoadReport() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [period, setPeriod] = useState("week");
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (!currentUser) {
      navigate("/");
      return;
    }

    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [stats, allBookings] = await Promise.all([
        reportsAPI.getStatistics(),
        bookingAPI.getAllBookings()
      ]);
      setStatistics(stats);
      setBookings(allBookings);
    } catch (error) {
      console.error("Error loading statistics:", error);
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

  if (!statistics) {
    return <Typography>Нет данных для отображения</Typography>;
  }

  // Calculate weekly data
  const weeklyData = [
    { day: "Пн", bookings: 0 },
    { day: "Вт", bookings: 0 },
    { day: "Ср", bookings: 0 },
    { day: "Чт", bookings: 0 },
    { day: "Пт", bookings: 0 },
    { day: "Сб", bookings: 0 },
    { day: "Вс", bookings: 0 }
  ];

  // Calculate hall distribution
  const hallStats: Record<string, number> = {};
  bookings.forEach(booking => {
    hallStats[booking.hallName] = (hallStats[booking.hallName] || 0) + 1;
  });

  const hallData = Object.entries(hallStats).map(([name, value], index) => ({
    name,
    value,
    color: ['#616161', '#757575', '#9e9e9e'][index] || '#bdbdbd'
  }));

  return (
    <Box>
      <Box className="flex items-center justify-between mb-4">
        <Typography variant="h4" component="h1">
          Отчёт о загрузке
        </Typography>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Период</InputLabel>
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            label="Период"
          >
            <MenuItem key="period-week" value="week">Неделя</MenuItem>
            <MenuItem key="period-month" value="month">Месяц</MenuItem>
            <MenuItem key="period-year" value="year">Год</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        <Grid key="total-bookings" size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box className="flex items-center gap-2 mb-2">
                <TrendingUp sx={{ color: '#757575' }} />
                <Typography variant="body2" color="text.secondary">
                  Всего бронирований
                </Typography>
              </Box>
              <Typography variant="h3">{statistics.totalBookings}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Подтверждено: {statistics.confirmedBookings}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid key="total-revenue" size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box className="flex items-center gap-2 mb-2">
                <AttachMoney sx={{ color: '#757575' }} />
                <Typography variant="body2" color="text.secondary">
                  Общий доход
                </Typography>
              </Box>
              <Typography variant="h3">{statistics.totalRevenue.toLocaleString()} ₽</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                За весь период
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid key="average-price" size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box className="flex items-center gap-2 mb-2">
                <People sx={{ color: '#757575' }} />
                <Typography variant="body2" color="text.secondary">
                  Средний чек
                </Typography>
              </Box>
              <Typography variant="h3">{Math.round(statistics.averagePrice).toLocaleString()} ₽</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                На одно бронирование
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {hallData.length > 0 && (
          <Grid key="hall-distribution" size={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Распределение по залам
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={hallData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {hallData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        <Grid key="top-clients" size={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Топ клиентов
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Клиент</TableCell>
                      <TableCell align="right">Бронирований</TableCell>
                      <TableCell align="right">Общая сумма</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {statistics.topClients.map((client) => (
                      <TableRow key={client.name} hover>
                        <TableCell>{client.name}</TableCell>
                        <TableCell align="right">{client.count}</TableCell>
                        <TableCell align="right">{client.revenue.toLocaleString()} ₽</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
