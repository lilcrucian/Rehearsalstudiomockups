import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Grid
} from "@mui/material";
import { Person, Email, Phone, Edit, Save } from "@mui/icons-material";
import { userAPI, bookingAPI, type Booking } from "../../utils/api";
import { getCurrentUser, saveCurrentUser } from "../../utils/auth";

export function ClientProfile() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    memberSince: ""
  });
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (!currentUser) {
      navigate("/");
      return;
    }

    loadProfile();
    loadBookings();
  }, []);

  const loadProfile = async () => {
    if (!currentUser) return;

    try {
      const userData = await userAPI.getUser(currentUser.id);
      setProfile({
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        memberSince: userData.createdAt ? new Date(userData.createdAt).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }) : ''
      });
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const loadBookings = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const data = await bookingAPI.getUserBookings(currentUser.id);
      setRecentBookings(data.slice(0, 5));
    } catch (error) {
      console.error("Error loading bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;

    try {
      const updatedUser = await userAPI.updateUser(currentUser.id, {
        name: profile.name,
        email: profile.email,
        phone: profile.phone
      });

      saveCurrentUser(updatedUser);
      setEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  return (
    <Box className="max-w-2xl mx-auto">
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Box className="flex items-center justify-between mb-6">
            <Box className="flex items-center gap-4">
              <Avatar sx={{ width: 80, height: 80, bgcolor: '#757575' }}>
                <Person sx={{ fontSize: 48 }} />
              </Avatar>
              <Box>
                <Typography variant="h5">{profile.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Участник с {profile.memberSince}
                </Typography>
              </Box>
            </Box>

            <Button
              variant={editing ? "contained" : "outlined"}
              startIcon={editing ? <Save /> : <Edit />}
              onClick={editing ? handleSave : () => setEditing(true)}
              sx={editing ? { bgcolor: '#757575', '&:hover': { bgcolor: '#616161' } } : {}}
            >
              {editing ? "Сохранить" : "Редактировать"}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Личная информация
          </Typography>

          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid key="profile-name" size={12}>
              <TextField
                fullWidth
                label="Имя"
                value={profile.name}
                disabled={!editing}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                InputProps={{
                  startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>

            <Grid key="profile-email" size={12}>
              <TextField
                fullWidth
                label="Email"
                value={profile.email}
                disabled={!editing}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                InputProps={{
                  startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>

            <Grid key="profile-phone" size={12}>
              <TextField
                fullWidth
                label="Телефон"
                value={profile.phone}
                disabled={!editing}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                InputProps={{
                  startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h6" gutterBottom>
            Последние бронирования
          </Typography>

          {loading ? (
            <Box className="flex justify-center py-4">
              <CircularProgress sx={{ color: '#757575' }} size={32} />
            </Box>
          ) : recentBookings.length > 0 ? (
            <List>
              {recentBookings.map((booking) => (
                <ListItem key={booking.id} sx={{ px: 0 }}>
                  <ListItemText
                    primary={booking.hallName}
                    secondary={`${new Date(booking.bookingDate).toLocaleDateString('ru-RU')} • ${booking.startTime} (${booking.durationHours}ч)`}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              У вас пока нет бронирований
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
