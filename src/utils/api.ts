// API client for Supabase backend
import { projectId, publicAnonKey } from '/utils/supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-fecc689d`;
const API_KEY = publicAnonKey;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  // Guard: only block /bookings/{id} where id is not a UUID and not a known sub-path
  const bookingMatch = endpoint.match(/\/bookings\/([^/?]+)$/);
  if (bookingMatch) {
    const seg = bookingMatch[1];
    const knownPaths = ['user', 'availability'];
    if (!knownPaths.includes(seg) && !UUID_RE.test(seg)) {
      throw new Error('Бронирование не найдено');
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Ошибка сервера' }));
    throw new Error(error.error || 'Ошибка при выполнении запроса');
  }

  return response.json();
}

// ============= Types =============

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'client' | 'admin';
  createdAt?: string;
}

export interface Hall {
  id: string;
  name: string;
  imageUrl: string;
  capacity: number;
  pricePerHour: number;
  area: number;
  description: string;
  isAvailable: boolean;
}

export interface Booking {
  id: string;
  userId: string;
  userName: string;
  hallId: string;
  hallName: string;
  bookingDate: string;
  startTime: string;
  durationHours: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes: string;
  googleEventId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Statistics {
  totalBookings: number;
  totalRevenue: number;
  confirmedBookings: number;
  averagePrice: number;
  topClients: Array<{
    name: string;
    count: number;
    revenue: number;
  }>;
}

// ============= Auth API =============

export const authAPI = {
  async register(data: { email: string; password: string; name: string; phone: string }): Promise<User> {
    // Direct Supabase REST API call to bypass Edge Function cache
    const response = await fetch(
      `https://${projectId}.supabase.co/rest/v1/users?select=*`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': publicAnonKey,
          'Authorization': `Bearer ${publicAnonKey}`,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          email: data.email,
          password_hash: data.password,
          name: data.name,
          phone: data.phone,
          role: 'client',
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Ошибка при регистрации' }));
      throw new Error(error.message || error.hint || 'Ошибка при регистрации');
    }

    const [user] = await response.json();
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      createdAt: user.created_at,
    };
  },

  async login(email: string, password: string): Promise<User> {
    // Direct Supabase REST API call to bypass Edge Function cache
    const response = await fetch(
      `https://${projectId}.supabase.co/rest/v1/users?select=*&email=eq.${encodeURIComponent(email)}&password_hash=eq.${encodeURIComponent(password)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': publicAnonKey,
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Ошибка при входе');
    }

    const users = await response.json();
    if (!users || users.length === 0) {
      throw new Error('Неверный email или пароль');
    }

    const user = users[0];
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      createdAt: user.created_at,
    };
  },
};

// ============= User API =============

export const userAPI = {
  async getUser(userId: string): Promise<User> {
    return fetchAPI(`/users/${userId}`);
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    return fetchAPI(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async uploadAvatar(_userId: string, _base64: string, _mimeType: string): Promise<{ url: string }> {
    return { url: '' }; // handled via localStorage
  },

  async getAvatarUrl(_userId: string): Promise<{ url: string | null }> {
    return { url: null }; // handled via localStorage
  },
};

// ============= Hall API =============

export const hallAPI = {
  async getAllHalls(): Promise<Hall[]> {
    return fetchAPI('/halls');
  },

  async getHall(hallId: string): Promise<Hall> {
    return fetchAPI(`/halls/${hallId}`);
  },
};

// ============= Booking API =============

export const bookingAPI = {
  async createBooking(data: {
    userId: string;
    hallId: string;
    bookingDate: string;
    startTime: string;
    durationHours: number;
    notes?: string;
  }): Promise<Booking> {
    return fetchAPI('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getBooking(bookingId: string): Promise<Booking> {
    return fetchAPI(`/bookings/${bookingId}`);
  },

  async getUserBookings(userId: string): Promise<Booking[]> {
    return fetchAPI(`/bookings/user/${userId}`);
  },

  async getAllBookings(): Promise<Booking[]> {
    return fetchAPI('/bookings');
  },

  async updateBooking(bookingId: string, updates: Partial<Booking>): Promise<Booking> {
    return fetchAPI(`/bookings/${bookingId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteBooking(bookingId: string): Promise<{ success: boolean }> {
    return fetchAPI(`/bookings/${bookingId}`, {
      method: 'DELETE',
    });
  },
};

// ============= Availability API =============

export interface DayAvailability {
  booked: number;
  capacity: number;
  status: 'free' | 'partial' | 'full';
}

export const availabilityAPI = {
  async getMonthAvailability(month: string): Promise<Record<string, DayAvailability>> {
    return fetchAPI(`/availability?month=${month}`);
  },
};

// ============= Reports API =============

export const reportsAPI = {
  async getStatistics(): Promise<Statistics> {
    return fetchAPI('/reports/statistics');
  },
};
