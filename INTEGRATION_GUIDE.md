# Руководство по интеграции с базой данных

## Обзор

Система бронирования репетиционной студии теперь подключена к Supabase через KV-хранилище. 

## Архитектура

```
Frontend (React) → API Client (/src/utils/api.ts) → Supabase Edge Function → KV Store
```

## База данных

### Структура KV-хранилища

Данные хранятся в таблице `kv_store_fecc689d` в формате ключ-значение:

1. **Пользователи**: `user:{userId}` → User объект
2. **Залы**: `hall:{hallId}` → Hall объект  
3. **Бронирования**: `booking:{bookingId}` → Booking объект
4. **Индексы**: 
   - `user_email:{email}` → userId
   - `user_bookings:{userId}` → массив bookingIds
   - `all_bookings` → массив всех bookingIds
   - `all_halls` → массив всех hallIds

### Типы данных

См. файл `/src/utils/api.ts` для полного описания типов `User`, `Hall`, `Booking`, `Statistics`.

## API Endpoints

Все эндпоинты доступны по адресу: `https://drvrlhbqnmtfqfokwevd.supabase.co/functions/v1/make-server-fecc689d`

### Аутентификация
- `POST /auth/register` - Регистрация пользователя
- `POST /auth/login` - Вход в систему

### Пользователи
- `GET /users/:id` - Получить профиль пользователя
- `PUT /users/:id` - Обновить профиль

### Залы
- `GET /halls` - Список всех залов
- `GET /halls/:id` - Информация о зале

### Бронирования
- `POST /bookings` - Создать бронирование
- `GET /bookings/:id` - Получить бронирование
- `GET /bookings/user/:userId` - Бронирования пользователя
- `GET /bookings` - Все бронирования
- `PUT /bookings/:id` - Обновить бронирование
- `DELETE /bookings/:id` - Удалить бронирование

### Отчёты
- `GET /reports/statistics` - Статистика и отчёты

## Использование в компонентах

### Пример: Регистрация пользователя

\`\`\`typescript
import { authAPI } from "../../utils/api";
import { saveCurrentUser } from "../../utils/auth";

const user = await authAPI.register({
  email: "user@example.com",
  password: "password123",
  name: "Иван Петров",
  phone: "+7 999 123 45 67"
});

saveCurrentUser(user);
\`\`\`

### Пример: Создание бронирования

\`\`\`typescript
import { bookingAPI } from "../../utils/api";
import { getCurrentUser } from "../../utils/auth";

const currentUser = getCurrentUser();

const booking = await bookingAPI.createBooking({
  userId: currentUser.id,
  hallId: "hall-1",
  bookingDate: "2026-05-15",
  startTime: "14:00",
  durationHours: 2,
  notes: "Особые пожелания"
});
\`\`\`

### Пример: Получение списка залов

\`\`\`typescript
import { hallAPI } from "../../utils/api";

const halls = await hallAPI.getAllHalls();
\`\`\`

## Управление сессией

Текущий пользователь сохраняется в localStorage:

- `saveCurrentUser(user)` - Сохранить пользователя
- `getCurrentUser()` - Получить текущего пользователя
- `clearCurrentUser()` - Выйти из системы
- `isAuthenticated()` - Проверить авторизацию

## Следующие шаги для интеграции

1. **OnlineBooking.tsx** - Подключить загрузку списка залов из API
2. **BookingConfirmationForm.tsx** - Подключить создание бронирования через API
3. **BookingManagement.tsx** - Подключить загрузку бронирований из API
4. **ClientProfile.tsx** - Подключить загрузку профиля и истории бронирований
5. **LoadReport.tsx** - Подключить загрузку статистики из API

## Инициализация данных

При первом запуске сервер автоматически создает 3 зала:
- Зал A (1500 ₽/час, до 5 человек, 25 м²)
- Зал B (2000 ₽/час, до 8 человек, 40 м²)
- Зал C (1000 ₽/час, до 3 человек, 15 м²)

## Безопасность

⚠️ **Важно**: В текущей реализации пароли хранятся в открытом виде. Для продакшена необходимо:
- Добавить хеширование паролей (bcrypt)
- Реализовать JWT токены для авторизации
- Добавить проверку прав доступа

## Отладка

Все запросы к API логируются в консоль сервера. Для просмотра логов используйте панель Supabase:
https://supabase.com/dashboard/project/drvrlhbqnmtfqfokwevd/logs/edge-functions
