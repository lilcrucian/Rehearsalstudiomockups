// Supabase Edge Function with PostgreSQL
import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as db from "./database.tsx";
import * as gcal from "./google-calendar.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-fecc689d/health", (c) => {
  return c.json({ status: "ok", database: "postgresql" });
});

// ============= AUTH ENDPOINTS =============

app.post("/make-server-fecc689d/auth/register", async (c) => {
  try {
    const { email, password, name, phone } = await c.req.json();

    // Check if user already exists
    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      return c.json({ error: "Пользователь с таким email уже существует" }, 400);
    }

    const user = await db.createUser({ email, password, name, phone });

    return c.json({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return c.json({ error: error?.message || "Ошибка при регистрации" }, 500);
  }
});

app.post("/make-server-fecc689d/auth/login", async (c) => {
  try {
    const { email, password } = await c.req.json();

    const user = await db.getUserByEmail(email);
    if (!user || user.password_hash !== password) {
      return c.json({ error: "Неверный email или пароль" }, 401);
    }

    return c.json({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return c.json({ error: error?.message || "Ошибка при входе" }, 500);
  }
});

// ============= USER ENDPOINTS =============

app.get("/make-server-fecc689d/users/:id", async (c) => {
  try {
    const userId = c.req.param("id");
    const user = await db.getUserById(userId);

    if (!user) {
      return c.json({ error: "Пользователь не найден" }, 404);
    }

    return c.json({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    });
  } catch (error: any) {
    console.error("Get user error:", error);
    return c.json({ error: error?.message || "Ошибка при получении пользователя" }, 500);
  }
});

app.put("/make-server-fecc689d/users/:id", async (c) => {
  try {
    const userId = c.req.param("id");
    const updates = await c.req.json();

    const user = await db.updateUser(userId, updates);

    return c.json({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    });
  } catch (error: any) {
    console.error("Update user error:", error);
    return c.json({ error: error?.message || "Ошибка при обновлении пользователя" }, 500);
  }
});

// ============= HALL ENDPOINTS =============

app.get("/make-server-fecc689d/halls", async (c) => {
  try {
    const halls = await db.getAllHalls();
    return c.json(halls.map(h => ({
      id: h.id,
      name: h.name,
      imageUrl: h.image_url,
      capacity: h.capacity,
      pricePerHour: h.price_per_hour,
      area: h.area,
      description: h.description,
      isAvailable: h.is_available,
      createdAt: h.created_at,
      updatedAt: h.updated_at,
    })));
  } catch (error: any) {
    console.error("Get halls error:", error);
    return c.json({ error: error?.message || "Ошибка при получении залов" }, 500);
  }
});

app.get("/make-server-fecc689d/halls/:id", async (c) => {
  try {
    const hallId = c.req.param("id");
    const hall = await db.getHallById(hallId);

    if (!hall) {
      return c.json({ error: "Зал не найден" }, 404);
    }

    return c.json({
      id: hall.id,
      name: hall.name,
      imageUrl: hall.image_url,
      capacity: hall.capacity,
      pricePerHour: hall.price_per_hour,
      area: hall.area,
      description: hall.description,
      isAvailable: hall.is_available,
      createdAt: hall.created_at,
      updatedAt: hall.updated_at,
    });
  } catch (error: any) {
    console.error("Get hall error:", error);
    return c.json({ error: error?.message || "Ошибка при получении зала" }, 500);
  }
});

// ============= BOOKING ENDPOINTS =============

app.post("/make-server-fecc689d/bookings", async (c) => {
  try {
    const { userId, hallId, bookingDate, startTime, durationHours, notes } = await c.req.json();

    // Проверяем существование пользователя и зала
    const user = await db.getUserById(userId);
    const hall = await db.getHallById(hallId);

    if (!user || !hall) {
      return c.json({ error: "Пользователь или зал не найден" }, 404);
    }

    // Формируем даты/время для Google Calendar
    const [hours, minutes] = startTime.split(':');
    const startDateTime = new Date(bookingDate);
    startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const endDateTime = new Date(startDateTime);
    endDateTime.setHours(startDateTime.getHours() + durationHours);

    const startISO = startDateTime.toISOString();
    const endISO = endDateTime.toISOString();

    // Проверяем доступность в Google Calendar (если настроен)
    let googleEventId: string | null = null;
    const calendarId = gcal.getCalendarIdForHall(hallId);

    if (calendarId && Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON')) {
      try {
        const isAvailable = await gcal.checkAvailability(calendarId, startISO, endISO);
        if (!isAvailable) {
          return c.json({ error: "Это время уже занято в календаре" }, 409);
        }
      } catch (calError: any) {
        console.log("Google Calendar check error:", calError?.message || calError);
        console.log("Calendar ID:", calendarId);
      }
    } else {
      console.log("Google Calendar not configured:", {
        hasCalendarId: !!calendarId,
        hasServiceAccount: !!Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON')
      });
    }

    const totalPrice = hall.price_per_hour * durationHours;

    // Создаем бронирование в БД
    const booking = await db.createBooking({
      user_id: userId,
      hall_id: hallId,
      booking_date: bookingDate,
      start_time: startTime,
      duration_hours: durationHours,
      total_price: totalPrice,
      notes,
    });

    // Создаем событие в Google Calendar (если настроен)
    if (calendarId && Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON')) {
      try {
        console.log("Creating Google Calendar event for booking:", booking.id);
        googleEventId = await gcal.createCalendarEvent(
          calendarId,
          hall.name,
          user.name,
          user.email,
          startISO,
          endISO,
          booking.id
        );

        // Обновляем бронирование с ID события
        if (googleEventId) {
          await db.updateBooking(booking.id, { google_event_id: googleEventId });
          console.log("Google Calendar event created successfully:", googleEventId);
        }
      } catch (calError: any) {
        console.log("Google Calendar event creation error:", calError?.message || calError);
        console.log("Error stack:", calError?.stack);
      }
    }

    return c.json({
      id: booking.id,
      userId: booking.user_id,
      userName: booking.user_name,
      hallId: booking.hall_id,
      hallName: booking.hall_name,
      bookingDate: booking.booking_date,
      startTime: booking.start_time,
      durationHours: booking.duration_hours,
      totalPrice: booking.total_price,
      status: booking.status,
      notes: booking.notes,
      googleEventId: googleEventId,
      createdAt: booking.created_at,
      updatedAt: booking.updated_at,
    });
  } catch (error: any) {
    console.error("Create booking error:", error);
    return c.json({ error: error?.message || "Ошибка при создании бронирования" }, 500);
  }
});

app.get("/make-server-fecc689d/bookings/:id", async (c) => {
  try {
    const bookingId = c.req.param("id");
    const booking = await db.getBookingById(bookingId);

    if (!booking) {
      return c.json({ error: "Бронирование не найдено" }, 404);
    }

    return c.json({
      id: booking.id,
      userId: booking.user_id,
      userName: booking.user_name,
      hallId: booking.hall_id,
      hallName: booking.hall_name,
      bookingDate: booking.booking_date,
      startTime: booking.start_time,
      durationHours: booking.duration_hours,
      totalPrice: booking.total_price,
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.created_at,
      updatedAt: booking.updated_at,
    });
  } catch (error: any) {
    console.error("Get booking error:", error);
    return c.json({ error: error?.message || "Ошибка при получении бронирования" }, 500);
  }
});

app.get("/make-server-fecc689d/bookings/user/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const bookings = await db.getBookingsByUserId(userId);

    return c.json(bookings.map(b => ({
      id: b.id,
      userId: b.user_id,
      userName: b.user_name,
      hallId: b.hall_id,
      hallName: b.hall_name,
      bookingDate: b.booking_date,
      startTime: b.start_time,
      durationHours: b.duration_hours,
      totalPrice: b.total_price,
      status: b.status,
      notes: b.notes,
      createdAt: b.created_at,
      updatedAt: b.updated_at,
    })));
  } catch (error: any) {
    console.error("Get user bookings error:", error);
    return c.json({ error: error?.message || "Ошибка при получении бронирований" }, 500);
  }
});

app.get("/make-server-fecc689d/bookings", async (c) => {
  try {
    const bookings = await db.getAllBookings();

    return c.json(bookings.map(b => ({
      id: b.id,
      userId: b.user_id,
      userName: b.user_name,
      hallId: b.hall_id,
      hallName: b.hall_name,
      bookingDate: b.booking_date,
      startTime: b.start_time,
      durationHours: b.duration_hours,
      totalPrice: b.total_price,
      status: b.status,
      notes: b.notes,
      createdAt: b.created_at,
      updatedAt: b.updated_at,
    })));
  } catch (error: any) {
    console.error("Get all bookings error:", error);
    return c.json({ error: error?.message || "Ошибка при получении бронирований" }, 500);
  }
});

app.put("/make-server-fecc689d/bookings/:id", async (c) => {
  try {
    const bookingId = c.req.param("id");
    const updates = await c.req.json();

    // Получаем текущее бронирование
    const existingBooking = await db.getBookingById(bookingId);
    if (!existingBooking) {
      return c.json({ error: "Бронирование не найдено" }, 404);
    }

    // Обновляем бронирование
    const booking = await db.updateBooking(bookingId, updates);

    // Если меняется статус на confirmed и еще нет события в календаре, создаем его
    if (updates.status === 'confirmed' && !existingBooking.google_event_id && Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON')) {
      try {
        const calendarId = gcal.getCalendarIdForHall(booking.hall_id);
        if (calendarId) {
          const user = await db.getUserById(booking.user_id);
          const hall = await db.getHallById(booking.hall_id);

          if (user && hall) {
            // Формируем даты/время для Google Calendar
            const [hours, minutes] = booking.start_time.split(':');
            const startDateTime = new Date(booking.booking_date);
            startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            const endDateTime = new Date(startDateTime);
            endDateTime.setHours(startDateTime.getHours() + booking.duration_hours);

            const startISO = startDateTime.toISOString();
            const endISO = endDateTime.toISOString();

            console.log("Creating Google Calendar event on status change to confirmed");
            const googleEventId = await gcal.createCalendarEvent(
              calendarId,
              hall.name,
              user.name,
              user.email,
              startISO,
              endISO,
              booking.id
            );

            if (googleEventId) {
              await db.updateBooking(booking.id, { google_event_id: googleEventId });
              console.log("Google Calendar event created on confirmation:", googleEventId);
            }
          }
        }
      } catch (calError: any) {
        console.log("Google Calendar event creation error on confirmation:", calError?.message || calError);
      }
    }

    return c.json({
      id: booking.id,
      userId: booking.user_id,
      userName: booking.user_name,
      hallId: booking.hall_id,
      hallName: booking.hall_name,
      bookingDate: booking.booking_date,
      startTime: booking.start_time,
      durationHours: booking.duration_hours,
      totalPrice: booking.total_price,
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.created_at,
      updatedAt: booking.updated_at,
    });
  } catch (error: any) {
    console.error("Update booking error:", error);
    return c.json({ error: error?.message || "Ошибка при обновлении бронирования" }, 500);
  }
});

app.delete("/make-server-fecc689d/bookings/:id", async (c) => {
  try {
    const bookingId = c.req.param("id");

    // Получаем бронирование чтобы удалить событие из календаря
    const booking = await db.getBookingById(bookingId);
    if (booking && booking.google_event_id && Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON')) {
      try {
        const calendarId = gcal.getCalendarIdForHall(booking.hall_id);
        if (calendarId) {
          await gcal.deleteCalendarEvent(calendarId, booking.google_event_id);
        }
      } catch (calError: any) {
        // Игнорируем ошибки календаря - удаление из БД продолжится
        console.log("Google Calendar event not deleted:", calError?.message || calError);
      }
    }

    await db.deleteBooking(bookingId);

    return c.json({ success: true });
  } catch (error: any) {
    console.error("Delete booking error:", error);
    return c.json({ error: error?.message || "Ошибка при удалении бронирования" }, 500);
  }
});

// ============= REPORTS ENDPOINTS =============

app.get("/make-server-fecc689d/reports/statistics", async (c) => {
  try {
    const statistics = await db.getStatistics();
    return c.json(statistics);
  } catch (error: any) {
    console.error("Get statistics error:", error);
    return c.json({ error: error?.message || "Ошибка при получении статистики" }, 500);
  }
});

Deno.serve(app.fetch);
