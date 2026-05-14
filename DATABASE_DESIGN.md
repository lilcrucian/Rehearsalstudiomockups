# Проектирование базы данных для системы бронирования репетиционной студии

## Анализ экранных форм

### 1. Регистрация / Вход
- Имя пользователя
- Email (уникальный)
- Телефон
- Пароль

### 2. Профиль клиента
- Информация о пользователе
- История бронирований

### 3. Карточка зала
- Название зала
- Изображение
- Вместимость
- Цена за час
- Площадь
- Описание
- Доступность

### 4. Онлайн-бронирование
- Выбор зала
- Дата бронирования
- Время начала
- Длительность (часы)
- Итоговая цена

### 5. Форма подтверждения бронирования
- Детали бронирования
- Дополнительные пожелания
- Согласие с условиями

### 6. Управление бронированиями
- Список всех бронирований
- Статус (подтверждено, ожидание, отменено)
- Фильтрация по статусу

### 7. Отчёты
- Статистика по бронированиям
- Доход
- Топ клиентов

## Структура данных в KV-хранилище

Поскольку Figma Make использует KV-таблицу, структура данных организована следующим образом:

### Users (Пользователи)
**Key**: `user:{userId}`  
**Value**:
```json
{
  "id": "uuid",
  "email": "string",
  "name": "string",
  "phone": "string",
  "passwordHash": "string",
  "createdAt": "timestamp"
}
```

### Email Index (Индекс по email)
**Key**: `user_email:{email}`  
**Value**: `userId`

### Halls (Залы)
**Key**: `hall:{hallId}`  
**Value**:
```json
{
  "id": "uuid",
  "name": "string",
  "imageUrl": "string",
  "capacity": "number",
  "pricePerHour": "number",
  "area": "number",
  "description": "string",
  "isAvailable": "boolean"
}
```

### Bookings (Бронирования)
**Key**: `booking:{bookingId}`  
**Value**:
```json
{
  "id": "uuid",
  "userId": "uuid",
  "userName": "string",
  "hallId": "uuid",
  "hallName": "string",
  "bookingDate": "date",
  "startTime": "time",
  "durationHours": "number",
  "totalPrice": "number",
  "status": "confirmed | pending | cancelled",
  "notes": "string",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### Indexes (Индексы)
**Key**: `user_bookings:{userId}`  
**Value**: `["bookingId1", "bookingId2", ...]`

**Key**: `hall_bookings:{hallId}:{date}`  
**Value**: `["bookingId1", "bookingId2", ...]`

**Key**: `all_bookings`  
**Value**: `["bookingId1", "bookingId2", ...]`

**Key**: `all_halls`  
**Value**: `["hallId1", "hallId2", ...]`

## API Endpoints

### Authentication
- `POST /make-server-fecc689d/auth/register` - Регистрация пользователя
- `POST /make-server-fecc689d/auth/login` - Вход в систему

### Users
- `GET /make-server-fecc689d/users/:id` - Получить профиль пользователя
- `PUT /make-server-fecc689d/users/:id` - Обновить профиль

### Halls
- `GET /make-server-fecc689d/halls` - Список всех залов
- `GET /make-server-fecc689d/halls/:id` - Информация о зале

### Bookings
- `POST /make-server-fecc689d/bookings` - Создать бронирование
- `GET /make-server-fecc689d/bookings/:id` - Получить бронирование
- `GET /make-server-fecc689d/bookings/user/:userId` - Бронирования пользователя
- `GET /make-server-fecc689d/bookings` - Все бронирования (для админа)
- `PUT /make-server-fecc689d/bookings/:id` - Обновить бронирование
- `DELETE /make-server-fecc689d/bookings/:id` - Удалить бронирование

### Reports
- `GET /make-server-fecc689d/reports/statistics` - Статистика и отчёты
