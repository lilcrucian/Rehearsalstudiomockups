# Обновленная структура базы данных

## Обзор

База данных использует KV-хранилище Supabase (таблица `kv_store_fecc689d`) с JSON-значениями для хранения всех данных системы.

## Сущности и структура данных

### 1. Users (Пользователи)

**Key**: `user:{userId}`  
**Value**:
```json
{
  "id": "uuid",
  "email": "string",
  "name": "string",
  "phone": "string",
  "passwordHash": "string",
  "createdAt": "ISO8601 timestamp"
}
```

**Индексы**:
- `user_email:{email}` → `userId` (для поиска по email)
- `user_bookings:{userId}` → `["bookingId1", "bookingId2", ...]` (бронирования пользователя)

### 2. Halls (Залы)

**Key**: `hall:{hallId}`  
**Value**:
```json
{
  "id": "string",
  "name": "string",
  "imageUrl": "string",
  "capacity": "number",
  "pricePerHour": "number",
  "area": "number",
  "description": "string",
  "isAvailable": "boolean"
}
```

**Индексы**:
- `all_halls` → `["hallId1", "hallId2", "hallId3"]`

**Предустановленные данные**:
- Зал A: 1500 ₽/час, до 5 человек, 25 м²
- Зал B: 2000 ₽/час, до 8 человек, 40 м²
- Зал C: 1000 ₽/час, до 3 человек, 15 м²

### 3. Bookings (Бронирования)

**Key**: `booking:{bookingId}`  
**Value**:
```json
{
  "id": "uuid",
  "userId": "uuid",
  "userName": "string",
  "hallId": "string",
  "hallName": "string",
  "bookingDate": "YYYY-MM-DD",
  "startTime": "HH:MM",
  "durationHours": "number",
  "totalPrice": "number",
  "status": "pending | confirmed | cancelled",
  "notes": "string",
  "createdAt": "ISO8601 timestamp",
  "updatedAt": "ISO8601 timestamp"
}
```

**Индексы**:
- `all_bookings` → `["bookingId1", "bookingId2", ...]`
- `user_bookings:{userId}` → `["bookingId1", "bookingId2", ...]`

**Статусы бронирований**:
- `pending` - Ожидание подтверждения
- `confirmed` - Подтверждено
- `cancelled` - Отменено

## API Endpoints

### Authentication
```
POST /make-server-fecc689d/auth/register
POST /make-server-fecc689d/auth/login
```

### Users
```
GET    /make-server-fecc689d/users/:id
PUT    /make-server-fecc689d/users/:id
```

### Halls
```
GET    /make-server-fecc689d/halls
GET    /make-server-fecc689d/halls/:id
```

### Bookings
```
POST   /make-server-fecc689d/bookings
GET    /make-server-fecc689d/bookings/:id
GET    /make-server-fecc689d/bookings/user/:userId
GET    /make-server-fecc689d/bookings
PUT    /make-server-fecc689d/bookings/:id
DELETE /make-server-fecc689d/bookings/:id
```

### Reports
```
GET    /make-server-fecc689d/reports/statistics
```

**Возвращаемые данные**:
```json
{
  "totalBookings": "number",
  "totalRevenue": "number",
  "confirmedBookings": "number",
  "averagePrice": "number",
  "topClients": [
    {
      "name": "string",
      "count": "number",
      "revenue": "number"
    }
  ]
}
```

## Связи между сущностями

```
User (1) ──────< (N) Booking
Hall (1) ──────< (N) Booking
```

## Бизнес-правила

1. **Уникальность email**: Один email может быть зарегистрирован только один раз
2. **Расчет цены**: `totalPrice = hall.pricePerHour * durationHours`
3. **Статусы**: Бронирование создается со статусом `pending`
4. **Время**: Время хранится в формате 24 часа (HH:MM)
5. **Длительность**: Минимум 1 час, максимум не ограничен

## Индексирование

Для оптимизации производительности используются следующие индексы:

1. **Email lookup**: `user_email:{email}` для быстрой авторизации
2. **User bookings**: `user_bookings:{userId}` для истории пользователя
3. **All bookings**: `all_bookings` для административных панелей
4. **All halls**: `all_halls` для списка доступных залов

## Миграция и обновление данных

При инициализации сервера:
1. Проверяется наличие `all_halls`
2. Если отсутствует - создаются 3 стандартных зала
3. Данные залов сохраняются в KV-хранилище

## Расширение структуры (будущие возможности)

Возможные дополнения:
1. **Отзывы**: `review:{reviewId}` с рейтингом и комментариями
2. **Платежи**: `payment:{paymentId}` для онлайн-оплаты
3. **Расписание**: `schedule:{hallId}:{date}` для контроля занятости
4. **Админы**: `admin:{adminId}` с расширенными правами
5. **Настройки**: `settings:general` для конфигурации системы
