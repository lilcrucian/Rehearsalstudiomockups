-- Миграция для системы бронирования репетиционной студии
-- Дата: 2026-05-12

-- Включаем расширение для UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Таблица залов
CREATE TABLE IF NOT EXISTS halls (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  price_per_hour INTEGER NOT NULL,
  area INTEGER NOT NULL,
  description TEXT NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица бронирований
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hall_id TEXT NOT NULL REFERENCES halls(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration_hours INTEGER NOT NULL CHECK (duration_hours > 0),
  total_price INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для bookings
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_hall_id ON bookings(hall_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_halls_updated_at BEFORE UPDATE ON halls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Вставка начальных данных для залов
INSERT INTO halls (id, name, image_url, capacity, price_per_hour, area, description, is_available) VALUES
  ('hall-1', 'Зал A', 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800', 5, 1500, 25, 'Идеальный зал для рок групп.', true),
  ('hall-2', 'Зал B', 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=800', 8, 2000, 40, 'Премиум зал с роялем и студией звукозаписи.', true),
  ('hall-3', 'Зал C', 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400', 3, 1000, 15, 'Компактный зал для небольших групп.', true)
ON CONFLICT (id) DO NOTHING;

-- Комментарии к таблицам
COMMENT ON TABLE users IS 'Пользователи системы (клиенты студии)';
COMMENT ON TABLE halls IS 'Репетиционные залы';
COMMENT ON TABLE bookings IS 'Бронирования залов';

-- Комментарии к колонкам
COMMENT ON COLUMN bookings.status IS 'Статус бронирования: pending, confirmed, cancelled';
COMMENT ON COLUMN bookings.duration_hours IS 'Длительность бронирования в часах';
COMMENT ON COLUMN bookings.total_price IS 'Общая стоимость в рублях';
