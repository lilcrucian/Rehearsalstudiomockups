import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { AppBar, Toolbar, Typography, Button, Container, Box } from "@mui/material";
import { Home, CalendarMonth, ManageAccounts, Assessment } from "@mui/icons-material";
import { clearCurrentUser, getCurrentUser } from "../../utils/auth";

export function Root() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = getCurrentUser();

  const isAuthPage = location.pathname === "/" || location.pathname === "/registration";

  const handleLogout = () => {
    clearCurrentUser();
    navigate("/");
  };

  return (
    <Box className="min-h-screen bg-gray-50">
      {!isAuthPage && (
        <AppBar position="static" sx={{ bgcolor: '#757575' }}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Студия Репетиций
            </Typography>
            <Button key="nav-halls" color="inherit" startIcon={<Home />} onClick={() => navigate('/booking')}>
              Залы
            </Button>
            <Button key="nav-bookings" color="inherit" startIcon={<CalendarMonth />} onClick={() => navigate('/manage-bookings')}>
              Бронирования
            </Button>
            <Button key="nav-profile" color="inherit" startIcon={<ManageAccounts />} onClick={() => navigate('/profile')}>
              Профиль
            </Button>
            <Button key="nav-reports" color="inherit" startIcon={<Assessment />} onClick={() => navigate('/reports')}>
              Отчёты
            </Button>
            {currentUser && (
              <Typography key="user-name" variant="body2" sx={{ mx: 2 }}>
                {currentUser.name}
              </Typography>
            )}
            <Button key="nav-logout" color="inherit" onClick={handleLogout}>
              Выход
            </Button>
          </Toolbar>
        </AppBar>
      )}

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Outlet />
      </Container>
    </Box>
  );
}
