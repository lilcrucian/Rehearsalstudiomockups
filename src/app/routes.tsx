import { createBrowserRouter } from "react-router-dom";
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
      { path: "manage-bookings", Component: BookingManagement },
      { path: "booking-confirmation/:id", Component: BookingConfirmation },
      { path: "reports", Component: LoadReport },
    ],
  },
]);
