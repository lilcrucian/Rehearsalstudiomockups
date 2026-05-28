import React, { useEffect, useState } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { Root } from "./components/Root";
import { Registration } from "./components/Registration";
import { Login } from "./components/Login";
import { ClientProfile } from "./components/ClientProfile";
import { HallCard } from "./components/HallCard";
import { OnlineBooking } from "./components/OnlineBooking";
import { BookingManagement } from "./components/BookingManagement";
import { BookingConfirmation } from "./components/BookingConfirmation";
import { BookingConfirmationForm } from "./components/BookingConfirmationForm";
import { LoadReport } from "./components/LoadReport";
import { getCurrentUser, saveCurrentUser, fetchRoleFromDB } from "../utils/auth";
import { CircularProgress, Box } from "@mui/material";

function AdminRoute({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'ok' | 'denied'>('loading');

  useEffect(() => {
    const check = async () => {
      const user = getCurrentUser();
      if (!user) { setStatus('denied'); return; }
      if (user.role === 'admin') { setStatus('ok'); return; }
      // Role missing or not admin — re-fetch from DB
      const role = await fetchRoleFromDB(user.id);
      if (role === 'admin') {
        saveCurrentUser({ ...user, role });
        setStatus('ok');
      } else {
        setStatus('denied');
      }
    };
    check();
  }, []);

  if (status === 'loading') return (
    <Box display="flex" justifyContent="center" mt={10}>
      <CircularProgress sx={{ color: '#757575' }} />
    </Box>
  );
  if (status === 'denied') return <Navigate to="/profile" replace />;
  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Login },
      { path: "registration", Component: Registration },
      { path: "profile", Component: ClientProfile },
      { path: "hall/:id", Component: HallCard },
      { path: "booking", Component: OnlineBooking },
      { path: "booking-confirm", Component: BookingConfirmationForm },
      {
        path: "manage-bookings",
        element: <AdminRoute><BookingManagement /></AdminRoute>,
      },
      { path: "booking-confirmation/:id", Component: BookingConfirmation },
      {
        path: "reports",
        element: <AdminRoute><LoadReport /></AdminRoute>,
      },
    ],
  },
]);
