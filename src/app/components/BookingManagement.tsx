import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  CircularProgress
} from "@mui/material";
import { Edit, Delete, Visibility } from "@mui/icons-material";
import { bookingAPI, type Booking } from "../../utils/api";
import { getCurrentUser } from "../../utils/auth";

type BookingStatus = "confirmed" | "pending" | "cancelled";

const statusLabels: Record<BookingStatus, string> = {
  confirmed: "Подтверждено",
  pending: "Ожидание",
  cancelled: "Отменено"
};

const statusColors: Record<BookingStatus, "success" | "warning" | "error"> = {
  confirmed: "success",
  pending: "warning",
  cancelled: "error"
};

export function BookingManagement() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) {
      navigate("/");
      return;
    }

    loadBookings();
  }, [])

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await bookingAPI.getAllBookings();
      setBookings(data);
    } catch (error) {
      console.error("Error loading bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (tabValue === 0) return true;
    if (tabValue === 1) return booking.status === "confirmed";
    if (tabValue === 2) return booking.status === "pending";
    if (tabValue === 3) return booking.status === "cancelled";
    return true;
  });

  const handleDelete = async (id: string) => {
    try {
      await bookingAPI.deleteBooking(id);
      setBookings(bookings.filter(b => b.id !== id));
      setDeleteDialog(null);
    } catch (error) {
      console.error("Error deleting booking:", error);
    }
  };

  const handleStatusChange = async (id: string, newStatus: BookingStatus) => {
    try {
      await bookingAPI.updateBooking(id, { status: newStatus });
      setBookings(bookings.map(b => b.id === id ? { ...b, status: newStatus } : b));
    } catch (error) {
      console.error("Error updating booking:", error);
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
      <Box className="flex items-center justify-between mb-4">
        <Typography variant="h4" component="h1">
          Управление бронированиями
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate("/booking")}
          sx={{ bgcolor: '#757575', '&:hover': { bgcolor: '#616161' } }}
        >
          Новое бронирование
        </Button>
      </Box>

      <Card>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab key="tab-all" label="Все" />
          <Tab key="tab-confirmed" label="Подтверждённые" />
          <Tab key="tab-pending" label="Ожидание" />
          <Tab key="tab-cancelled" label="Отменённые" />
        </Tabs>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Зал</TableCell>
                <TableCell>Клиент</TableCell>
                <TableCell>Дата</TableCell>
                <TableCell>Время</TableCell>
                <TableCell>Длительность</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell>Сумма</TableCell>
                <TableCell align="right">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredBookings.map((booking) => (
                <TableRow key={booking.id} hover>
                  <TableCell>{booking.id.substring(0, 8)}</TableCell>
                  <TableCell>{booking.hallName}</TableCell>
                  <TableCell>{booking.userName}</TableCell>
                  <TableCell>{new Date(booking.bookingDate).toLocaleDateString('ru-RU')}</TableCell>
                  <TableCell>{booking.startTime}</TableCell>
                  <TableCell>{booking.durationHours} ч</TableCell>
                  <TableCell>
                    <Chip
                      label={statusLabels[booking.status]}
                      color={statusColors[booking.status]}
                      size="small"
                      onClick={() => {
                        const newStatus = booking.status === 'pending' ? 'confirmed' :
                                        booking.status === 'confirmed' ? 'cancelled' : 'pending';
                        handleStatusChange(booking.id, newStatus);
                      }}
                      sx={{ cursor: 'pointer' }}
                    />
                  </TableCell>
                  <TableCell>{booking.totalPrice} ₽</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/booking-confirmation/${booking.id}`)}
                    >
                      <Visibility />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteDialog(booking.id)}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={deleteDialog !== null} onClose={() => setDeleteDialog(null)}>
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить бронирование #{deleteDialog}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>Отмена</Button>
          <Button
            onClick={() => deleteDialog && handleDelete(deleteDialog)}
            color="error"
            variant="contained"
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
