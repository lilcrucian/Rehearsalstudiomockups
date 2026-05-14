# Руководство по миграции базы данных

## Обзор

Миграция от KV-хранилища к PostgreSQL для лучшей производительности, целостности данных и возможностей запросов.

## Структура PostgreSQL

### Таблицы

#### 1. users
```sql
- id: UUID (PK)
- email: TEXT UNIQUE
- name: TEXT
- phone: TEXT
- password_hash: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 2. halls
```sql
- id: TEXT (PK)
- name: TEXT
- image_url: TEXT
- capacity: INTEGER
- price_per_hour: INTEGER
- area: INTEGER
- description: TEXT
- is_available: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 3. bookings
```sql
- id: UUID (PK)
- user_id: UUID (FK -> users)
- hall_id: TEXT (FK -> halls)
- booking_date: DATE
- start_time: TIME
- duration_hours: INTEGER
- total_price: INTEGER
- status: TEXT (pending|confirmed|cancelled)
- notes: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

## Применение миграции через Supabase Dashboard

### Способ 1: SQL Editor в Dashboard

1. Откройте Supabase Dashboard: https://supabase.com/dashboard/project/drvrlhbqnmtfqfokwevd
2. Перейдите в SQL Editor (левое меню)
3. Создайте новый запрос
4. Скопируйте содержимое файла `20260512_initial_schema.sql`
5. Вставьте в редактор
6. Нажмите "Run" для выполнения

### Способ 2: Через Supabase CLI (если установлен)

```bash
# В корне проекта
supabase db push
```

## Проверка миграции

### 1. Проверка таблиц
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

Должны появиться:
- users
- halls
- bookings

### 2. Проверка данных залов
```sql
SELECT * FROM halls;
```

Должны быть 3 зала (A, B, C).

### 3. Проверка индексов
```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public';
```

## Отличия от KV-хранилища

| Аспект | KV Store | PostgreSQL |
|--------|----------|------------|
| Структура | JSON документы | Реляционные таблицы |
| Связи | Вручную через ID | Foreign Keys |
| Запросы | Полное сканирование | SQL с индексами |
| Транзакции | Нет | ACID |
| Валидация | В коде | Constraints в БД |
| Производительность | O(n) для списков | O(log n) с индексами |

## Преимущества PostgreSQL

1. **Целостность данных**: Foreign keys предотвращают orphan records
2. **Производительность**: Индексы для быстрых запросов
3. **Мощные запросы**: JOIN, агрегации, подзапросы
4. **Транзакции**: ACID гарантии
5. **Constraints**: Валидация на уровне БД
6. **Аудит**: Автоматические timestamps
7. **Масштабируемость**: Оптимизация запросов

## Row Level Security (RLS)

После миграции рекомендуется настроить RLS для безопасности:

```sql
-- Включить RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Политика: пользователи видят только свои данные
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Политика: пользователи видят только свои бронирования
CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## Откат миграции (если нужно)

```sql
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS halls CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
```

## Следующие шаги

1. Применить миграцию
2. Обновить backend код (index.tsx)
3. Тестировать все функции
4. Настроить RLS (опционально)
5. Удалить старый KV код
