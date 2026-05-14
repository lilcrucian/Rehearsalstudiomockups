# Миграция на PostgreSQL - Инструкции

## 🎯 Обзор

Система успешно мигрирована с KV-хранилища на PostgreSQL для улучшенной производительности и надежности.

## 📋 Что изменилось

### До миграции (KV Store)
```
kv_store_fecc689d
├── user:{userId} → JSON
├── hall:{hallId} → JSON
├── booking:{bookingId} → JSON
└── индексы в виде массивов
```

### После миграции (PostgreSQL)
```
PostgreSQL Database
├── users (таблица)
├── halls (таблица)
├── bookings (таблица с FK)
└── индексы, constraints, triggers
```

## 🚀 Применение миграции

### Шаг 1: Открыть Supabase Dashboard

1. Перейдите: https://supabase.com/dashboard/project/drvrlhbqnmtfqfokwevd
2. Войдите в свой аккаунт Supabase

### Шаг 2: Выполнить SQL миграцию

1. В левом меню выберите **SQL Editor**
2. Нажмите **New query**
3. Скопируйте весь код из файла: `/supabase/migrations/20260512_initial_schema.sql`
4. Вставьте в редактор SQL
5. Нажмите **Run** (или Ctrl+Enter)

### Шаг 3: Проверить результат

Выполните в SQL Editor:
```sql
-- Проверка таблиц
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Проверка данных
SELECT * FROM halls;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM bookings;
```

Должны увидеть:
- ✅ 3 таблицы: users, halls, bookings
- ✅ 3 зала в таблице halls
- ✅ 0 пользователей (пока)
- ✅ 0 бронирований (пока)

## 📊 Структура базы данных

### Таблица: users
```sql
id              UUID PRIMARY KEY
email           TEXT UNIQUE NOT NULL
name            TEXT NOT NULL
phone           TEXT NOT NULL
password_hash   TEXT NOT NULL
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
```

### Таблица: halls
```sql
id              TEXT PRIMARY KEY
name            TEXT NOT NULL
image_url       TEXT NOT NULL
capacity        INTEGER NOT NULL
price_per_hour  INTEGER NOT NULL
area            INTEGER NOT NULL
description     TEXT NOT NULL
is_available    BOOLEAN DEFAULT true
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
```

### Таблица: bookings
```sql
id              UUID PRIMARY KEY
user_id         UUID FK→users(id) CASCADE
hall_id         TEXT FK→halls(id) CASCADE
booking_date    DATE NOT NULL
start_time      TIME NOT NULL
duration_hours  INTEGER NOT NULL CHECK > 0
total_price     INTEGER NOT NULL
status          TEXT CHECK IN (pending, confirmed, cancelled)
notes           TEXT
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
```

## 🔧 Обновленный Backend

### Новые файлы:

1. **database.tsx** - Хелперы для работы с PostgreSQL
   - Функции CRUD для всех таблиц
   - Типизация данных
   - JOIN запросы для получения связанных данных

2. **index.tsx** - Обновлен для использования PostgreSQL
   - Убраны все KV операции
   - Используются SQL запросы
   - Улучшенная обработка ошибок

### Что удалено:
- ❌ Все функции работы с KV-хранилищем
- ❌ Ручное управление индексами
- ❌ JSON документы

### Что добавлено:
- ✅ Реляционные запросы с JOIN
- ✅ Foreign keys для целостности
- ✅ Автоматические timestamps
- ✅ Database constraints
- ✅ Индексы для производительности

## 📈 Преимущества миграции

### Производительность
- **Было**: O(n) сканирование всех записей
- **Стало**: O(log n) с индексами B-tree

### Целостность данных
- **Было**: Orphan records возможны
- **Стало**: CASCADE удаление, FK constraints

### Запросы
- **Было**: Множественные запросы для JOIN
- **Стало**: Один SQL запрос с JOIN

### Пример:
```typescript
// Было (KV)
const booking = await kv.get(`booking:${id}`);
const user = await kv.get(`user:${booking.userId}`);
const hall = await kv.get(`hall:${booking.hallId}`);

// Стало (PostgreSQL)
const booking = await supabase
  .from('bookings')
  .select('*, users(name), halls(name)')
  .eq('id', id)
  .single();
```

## 🧪 Тестирование после миграции

### 1. Регистрация пользователя
```bash
curl -X POST https://drvrlhbqnmtfqfokwevd.supabase.co/functions/v1/make-server-fecc689d/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123456",
    "name": "Test User",
    "phone": "+7 999 123 45 67"
  }'
```

### 2. Проверить в БД
```sql
SELECT * FROM users WHERE email = 'test@example.com';
```

### 3. Создать бронирование
```bash
curl -X POST https://drvrlhbqnmtfqfokwevd.supabase.co/functions/v1/make-server-fecc689d/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id-from-step-1",
    "hallId": "hall-1",
    "bookingDate": "2026-05-20",
    "startTime": "14:00",
    "durationHours": 2,
    "notes": "Test booking"
  }'
```

### 4. Проверить в БД
```sql
SELECT b.*, u.name as user_name, h.name as hall_name 
FROM bookings b
JOIN users u ON b.user_id = u.id
JOIN halls h ON b.hall_id = h.id;
```

## 🔐 Безопасность (опционально)

После тестирования можно включить Row Level Security:

```sql
-- Включить RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Политики
CREATE POLICY "Users can view own data" 
ON users FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can view own bookings" 
ON bookings FOR SELECT 
USING (auth.uid() = user_id);
```

## ❌ Откат (если нужно)

Если что-то пошло не так:

```sql
-- Удалить все таблицы
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS halls CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
```

## ✅ Чеклист миграции

- [ ] Открыт Supabase Dashboard
- [ ] Выполнен SQL из `20260512_initial_schema.sql`
- [ ] Проверено наличие 3 таблиц
- [ ] Проверено наличие 3 залов
- [ ] Протестирована регистрация
- [ ] Протестировано создание бронирования
- [ ] Frontend работает корректно
- [ ] Все API endpoints отвечают

## 📞 Что делать после миграции

1. ✅ Перезапустить Edge Function (автоматически при деплое)
2. ✅ Протестировать все функции через UI
3. ✅ Проверить логи в Supabase Dashboard
4. ✅ (Опционально) Настроить RLS
5. ✅ (Опционально) Удалить старую KV-таблицу

## 🎉 Готово!

После применения миграции:
- База данных PostgreSQL готова к использованию
- Все API endpoints работают с новой БД
- Frontend автоматически использует новую структуру
- Данные хранятся надежно с FK constraints

---

**Следующий шаг**: Примените миграцию через SQL Editor в Supabase Dashboard!
