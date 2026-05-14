// Google Calendar API integration
import { google } from "npm:googleapis";

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// Получаем JWT client для аутентификации
function getAuthClient() {
  const credentials = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');

  if (!credentials) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON environment variable not set');
  }

  const serviceAccount = JSON.parse(credentials);

  const auth = new google.auth.JWT(
    serviceAccount.client_email,
    undefined,
    serviceAccount.private_key,
    SCOPES
  );

  return auth;
}

// Проверка доступности времени в календаре
export async function checkAvailability(
  calendarId: string,
  startDateTime: string,
  endDateTime: string
): Promise<boolean> {
  const auth = getAuthClient();
  const calendar = google.calendar({ version: 'v3', auth });

  const response = await calendar.events.list({
    calendarId,
    timeMin: startDateTime,
    timeMax: endDateTime,
    singleEvents: true,
    orderBy: 'startTime',
  });

  // Если есть события в этом промежутке - время занято
  return response.data.items?.length === 0;
}

// Создание события в календаре
export async function createCalendarEvent(
  calendarId: string,
  hallName: string,
  userName: string,
  userEmail: string,
  startDateTime: string,
  endDateTime: string,
  bookingId: string
): Promise<string> {
  const auth = getAuthClient();
  const calendar = google.calendar({ version: 'v3', auth });

  const event = {
    summary: `Бронирование: ${hallName}`,
    description: `Клиент: ${userName}\nБронирование ID: ${bookingId}`,
    start: {
      dateTime: startDateTime,
      timeZone: 'Europe/Moscow',
    },
    end: {
      dateTime: endDateTime,
      timeZone: 'Europe/Moscow',
    },
    attendees: [
      { email: userEmail, displayName: userName }
    ],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 1 день до
        { method: 'popup', minutes: 60 }, // 1 час до
      ],
    },
  };

  const response = await calendar.events.insert({
    calendarId,
    requestBody: event,
    sendUpdates: 'all', // Отправить уведомления участникам
  });

  return response.data.id || '';
}

// Обновление события в календаре
export async function updateCalendarEvent(
  calendarId: string,
  eventId: string,
  startDateTime: string,
  endDateTime: string
): Promise<void> {
  const auth = getAuthClient();
  const calendar = google.calendar({ version: 'v3', auth });

  await calendar.events.patch({
    calendarId,
    eventId,
    requestBody: {
      start: {
        dateTime: startDateTime,
        timeZone: 'Europe/Moscow',
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'Europe/Moscow',
      },
    },
    sendUpdates: 'all',
  });
}

// Удаление события из календаря
export async function deleteCalendarEvent(
  calendarId: string,
  eventId: string
): Promise<void> {
  const auth = getAuthClient();
  const calendar = google.calendar({ version: 'v3', auth });

  await calendar.events.delete({
    calendarId,
    eventId,
    sendUpdates: 'all',
  });
}

// Получить ID календаря для зала (можно хранить в базе или в env)
export function getCalendarIdForHall(hallId: string): string {
  // Вариант 1: Один календарь для всех залов
  const mainCalendar = Deno.env.get('GOOGLE_CALENDAR_ID');
  if (mainCalendar) {
    return mainCalendar;
  }

  // Вариант 2: Отдельный календарь для каждого зала
  const hallCalendars: Record<string, string> = {
    'hall-1': Deno.env.get('GOOGLE_CALENDAR_HALL_1') || '',
    'hall-2': Deno.env.get('GOOGLE_CALENDAR_HALL_2') || '',
    'hall-3': Deno.env.get('GOOGLE_CALENDAR_HALL_3') || '',
  };

  return hallCalendars[hallId] || mainCalendar || '';
}
