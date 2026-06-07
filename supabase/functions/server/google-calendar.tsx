// Google Calendar API integration using REST API directly (no npm:googleapis)

const SCOPES = 'https://www.googleapis.com/auth/calendar';

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

// Create a JWT access token for Google API authentication
async function getAccessToken(): Promise<string> {
  const credentials = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
  if (!credentials) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON environment variable not set');
  }

  const serviceAccount: ServiceAccount = JSON.parse(credentials);

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: SCOPES,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const header = { alg: 'RS256', typ: 'JWT' };

  const encode = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const unsignedToken = `${encode(header)}.${encode(payload)}`;

  // Import the private key for signing
  const pemKey = serviceAccount.private_key;
  const keyData = pemKey
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');

  const binaryKey = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(unsignedToken)
  );

  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const jwt = `${unsignedToken}.${signatureBase64}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenResponse.json();
  if (!tokenData.access_token) {
    throw new Error(`Failed to get access token: ${JSON.stringify(tokenData)}`);
  }

  return tokenData.access_token;
}

// Проверка доступности времени в календаре
export async function checkAvailability(
  calendarId: string,
  startDateTime: string,
  endDateTime: string
): Promise<boolean> {
  const token = await getAccessToken();
  const encodedId = encodeURIComponent(calendarId);

  const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodedId}/events`);
  url.searchParams.set('timeMin', startDateTime);
  url.searchParams.set('timeMax', endDateTime);
  url.searchParams.set('singleEvents', 'true');

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();
  return (data.items?.length ?? 0) === 0;
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
  const token = await getAccessToken();
  const encodedId = encodeURIComponent(calendarId);

  const event = {
    summary: `Бронирование: ${hallName}`,
    description: `Клиент: ${userName}\nБронирование ID: ${bookingId}`,
    start: { dateTime: startDateTime, timeZone: 'Europe/Moscow' },
    end: { dateTime: endDateTime, timeZone: 'Europe/Moscow' },
    attendees: [{ email: userEmail, displayName: userName }],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 60 },
      ],
    },
  };

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodedId}/events?sendUpdates=all`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }
  );

  const data = await response.json();
  return data.id || '';
}

// Обновление события в календаре
export async function updateCalendarEvent(
  calendarId: string,
  eventId: string,
  startDateTime: string,
  endDateTime: string
): Promise<void> {
  const token = await getAccessToken();
  const encodedId = encodeURIComponent(calendarId);

  await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodedId}/events/${eventId}?sendUpdates=all`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        start: { dateTime: startDateTime, timeZone: 'Europe/Moscow' },
        end: { dateTime: endDateTime, timeZone: 'Europe/Moscow' },
      }),
    }
  );
}

// Удаление события из календаря
export async function deleteCalendarEvent(
  calendarId: string,
  eventId: string
): Promise<void> {
  const token = await getAccessToken();
  const encodedId = encodeURIComponent(calendarId);

  await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodedId}/events/${eventId}?sendUpdates=all`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }
  );
}

// Получить ID календаря для зала
export function getCalendarIdForHall(hallId: string): string {
  const mainCalendar = Deno.env.get('GOOGLE_CALENDAR_ID');
  if (mainCalendar) return mainCalendar;

  const hallCalendars: Record<string, string> = {
    'hall-1': Deno.env.get('GOOGLE_CALENDAR_HALL_1') || '',
    'hall-2': Deno.env.get('GOOGLE_CALENDAR_HALL_2') || '',
    'hall-3': Deno.env.get('GOOGLE_CALENDAR_HALL_3') || '',
  };

  return hallCalendars[hallId] || '';
}
