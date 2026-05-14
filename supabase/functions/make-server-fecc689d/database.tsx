// Database helpers for PostgreSQL
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

// Типы данных
export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface Hall {
  id: string;
  name: string;
  image_url: string;
  capacity: number;
  price_per_hour: number;
  area: number;
  description: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  hall_id: string;
  booking_date: string;
  start_time: string;
  duration_hours: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes: string | null;
  google_event_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingWithDetails extends Booking {
  user_name?: string;
  hall_name?: string;
}

// Создание клиента Supabase
export const getSupabaseClient = () => {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
};

// ============= USER FUNCTIONS =============

export async function createUser(data: {
  email: string;
  password: string;
  name: string;
  phone: string;
}): Promise<User> {
  const supabase = getSupabaseClient();

  const { data: user, error } = await supabase
    .from("users")
    .insert({
      email: data.email,
      name: data.name,
      phone: data.phone,
      password_hash: data.password, // TODO: hash password
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return user;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("users")
    .select()
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getUserById(id: string): Promise<User | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("users")
    .select()
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateUser(
  id: string,
  updates: Partial<Pick<User, "name" | "email" | "phone">>
): Promise<User> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// ============= HALL FUNCTIONS =============

export async function getAllHalls(): Promise<Hall[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("halls")
    .select()
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export async function getHallById(id: string): Promise<Hall | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("halls")
    .select()
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// ============= BOOKING FUNCTIONS =============

export async function createBooking(data: {
  user_id: string;
  hall_id: string;
  booking_date: string;
  start_time: string;
  duration_hours: number;
  total_price: number;
  notes?: string;
  google_event_id?: string;
}): Promise<BookingWithDetails> {
  const supabase = getSupabaseClient();

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      user_id: data.user_id,
      hall_id: data.hall_id,
      booking_date: data.booking_date,
      start_time: data.start_time,
      duration_hours: data.duration_hours,
      total_price: data.total_price,
      status: "pending",
      notes: data.notes || null,
      google_event_id: data.google_event_id || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  // Получаем дополнительную информацию
  const user = await getUserById(booking.user_id);
  const hall = await getHallById(booking.hall_id);

  return {
    ...booking,
    user_name: user?.name,
    hall_name: hall?.name,
  };
}

export async function getBookingById(id: string): Promise<BookingWithDetails | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      *,
      users(name),
      halls(name)
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return null;

  return {
    ...data,
    user_name: data.users?.name,
    hall_name: data.halls?.name,
  };
}

export async function getBookingsByUserId(userId: string): Promise<BookingWithDetails[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      *,
      users(name),
      halls(name)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((item: any) => ({
    ...item,
    user_name: item.users?.name,
    hall_name: item.halls?.name,
  }));
}

export async function getAllBookings(): Promise<BookingWithDetails[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      *,
      users(name),
      halls(name)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((item: any) => ({
    ...item,
    user_name: item.users?.name,
    hall_name: item.halls?.name,
  }));
}

export async function updateBooking(
  id: string,
  updates: Partial<Pick<Booking, "status" | "notes" | "booking_date" | "start_time" | "duration_hours" | "google_event_id">>
): Promise<BookingWithDetails> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("bookings")
    .update(updates)
    .eq("id", id)
    .select(`
      *,
      users(name),
      halls(name)
    `)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    ...data,
    user_name: data.users?.name,
    hall_name: data.halls?.name,
  };
}

export async function deleteBooking(id: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from("bookings")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

// ============= STATISTICS FUNCTIONS =============

export async function getStatistics() {
  const supabase = getSupabaseClient();

  // Получаем все бронирования
  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select(`
      *,
      users(name)
    `);

  if (bookingsError) {
    throw new Error(bookingsError.message);
  }

  const allBookings = bookings || [];
  const totalBookings = allBookings.length;
  const confirmedBookings = allBookings.filter((b: any) => b.status === "confirmed").length;
  const totalRevenue = allBookings.reduce((sum: number, b: any) => sum + (b.total_price || 0), 0);
  const averagePrice = totalBookings > 0 ? totalRevenue / totalBookings : 0;

  // Топ клиентов
  const clientStats: Record<string, { name: string; count: number; revenue: number }> = {};

  for (const booking of allBookings) {
    const userId = booking.user_id;
    if (!clientStats[userId]) {
      clientStats[userId] = {
        name: booking.users?.name || "Unknown",
        count: 0,
        revenue: 0,
      };
    }
    clientStats[userId].count++;
    clientStats[userId].revenue += booking.total_price;
  }

  const topClients = Object.values(clientStats)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalBookings,
    totalRevenue,
    confirmedBookings,
    averagePrice,
    topClients,
  };
}
