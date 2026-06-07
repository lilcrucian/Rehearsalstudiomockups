import { useState, useEffect, useRef } from "react";
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
  Grid,
  IconButton,
  Tooltip
} from "@mui/material";
import { Person, Email, Phone, Edit, Save, CameraAlt } from "@mui/icons-material";
import { userAPI, bookingAPI, type Booking } from "../../utils/api";
import { getCurrentUser, saveCurrentUser } from "../../utils/auth";

export function ClientProfile() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    role: "" as string,
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
    loadAvatar();
  }, []);

  const avatarKey = `avatar_${currentUser?.id}`;

  const loadAvatar = () => {
    const saved = localStorage.getItem(avatarKey);
    if (saved) setAvatarUrl(saved);
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    if (!file.type.startsWith('image/')) return;

    setAvatarUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      // Resize to max 256px to keep localStorage size manageable
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 256;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        const resized = canvas.toDataURL('image/jpeg', 0.85);
        localStorage.setItem(avatarKey, resized);
        setAvatarUrl(resized);
        setAvatarUploading(false);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const loadProfile = async () => {
    if (!currentUser) return;

    try {
      const userData = await userAPI.getUser(currentUser.id);
      // Preserve role from stored user if server doesn't return it
      saveCurrentUser({ ...userData, role: userData.role ?? currentUser.role });
      setProfile({
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
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

      saveCurrentUser({ ...updatedUser, role: updatedUser.role ?? currentUser.role });
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
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <Avatar
                  src={avatarUrl ?? undefined}
                  sx={{ width: 80, height: 80, bgcolor: '#757575', cursor: 'pointer' }}
                  onClick={handleAvatarClick}
                >
                  {!avatarUrl && <Person sx={{ fontSize: 48 }} />}
                </Avatar>
                <Tooltip title="Загрузить фото">
                  <IconButton
                    size="small"
                    onClick={handleAvatarClick}
                    disabled={avatarUploading}
                    sx={{
                      position: 'absolute', bottom: -4, right: -4,
                      bgcolor: '#757575', color: '#fff', width: 28, height: 28,
                      '&:hover': { bgcolor: '#616161' },
                      '&.Mui-disabled': { bgcolor: '#bdbdbd' },
                    }}
                  >
                    {avatarUploading
                      ? <CircularProgress size={14} sx={{ color: '#fff' }} />
                      : <CameraAlt sx={{ fontSize: 16 }} />}
                  </IconButton>
                </Tooltip>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </Box>
              <Box>
                <Typography variant="h5">{profile.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Участник с {profile.memberSince}
                </Typography>
                <Typography variant="caption" sx={{
                  display: 'inline-block',
                  mt: 0.5, px: 1, py: 0.25, borderRadius: 1,
                  bgcolor: profile.role === 'admin' ? '#424242' : '#e0e0e0',
                  color: profile.role === 'admin' ? '#fff' : '#616161',
                  fontWeight: 600, letterSpacing: 0.5,
                  textTransform: 'uppercase', fontSize: '0.65rem',
                }}>
                  {profile.role || 'загрузка...'}
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
