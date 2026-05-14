// API client for Supabase backend
import { projectId, publicAnonKey } from '/utils/supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-fecc689d`;
const API_KEY = publicAnonKey;

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
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
    return fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async login(email: string, password: string): Promise<User> {
    return fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
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

// ============= Reports API =============

export const reportsAPI = {
  async getStatistics(): Promise<Statistics> {
    return fetchAPI('/reports/statistics');
  },
};
