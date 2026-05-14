-- Добавление поддержки Google Calendar
-- Добавляем колонку для хранения ID события в Google Calendar
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS google_event_id TEXT;

-- Создаем индекс для быстрого поиска по google_event_id
CREATE INDEX IF NOT EXISTS idx_bookings_google_event_id ON bookings(google_event_id);
