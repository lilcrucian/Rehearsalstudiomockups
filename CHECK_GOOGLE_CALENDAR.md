# Проверка интеграции Google Calendar

## Что было исправлено:

1. **Добавлено детальное логирование** - теперь все ошибки Google Calendar записываются в логи
2. **Автоматическое создание события при подтверждении** - если при создании бронирования событие не создалось, оно будет создано при смене статуса на "подтверждено"

## Что нужно проверить:

### 1. Проверьте переменные окружения в Supabase

Откройте Supabase Dashboard: https://supabase.com/dashboard/project/drvrlhbqnmtfqfokwevd/settings/functions

Убедитесь, что установлены:
- `GOOGLE_SERVICE_ACCOUNT_JSON` - JSON с ключом Service Account
- `GOOGLE_CALENDAR_ID` - ID основного календаря (например: `abc123@group.calendar.google.com`)

**ВАЖНО:** Переменная должна называться именно `GOOGLE_CALENDAR_ID`, а не `GOOGLE_CALENDAR_HALL_1/2/3`

### 2. Проверьте логи Edge Function

1. Откройте Supabase Dashboard → **Edge Functions** → **Logs**
2. Создайте новое бронирование
3. Измените статус на "подтверждено"
4. Посмотрите в логах сообщения:

**Успешные:**
- `"Creating Google Calendar event for booking: <id>"`
- `"Google Calendar event created successfully: <event-id>"`
- `"Creating Google Calendar event on status change to confirmed"`

**Ошибки (если есть):**
- `"Google Calendar not configured"` - не установлены переменные окружения
- `"Google Calendar check error:"` - ошибка проверки доступности
- `"Google Calendar event creation error:"` - ошибка создания события

### 3. Частые проблемы:

**Если события не создаются:**

1. **Переменная GOOGLE_CALENDAR_ID не установлена**
   - Решение: Добавьте переменную в Supabase Edge Functions Secrets

2. **Service Account не имеет доступа к календарю**
   - Решение: В Google Calendar откройте настройки календаря → Share with specific people → добавьте email из Service Account JSON (поле `client_email`) с правами "Make changes to events"

3. **Неправильный Calendar ID**
   - Решение: Проверьте, что Calendar ID скопирован правильно из Google Calendar Settings → Integrate calendar

4. **Service Account JSON содержит ошибки**
   - Решение: Убедитесь, что скопирован весь JSON файл (от { до })

### 4. Тестирование:

1. Создайте новое бронирование через приложение
2. Проверьте логи Edge Function - должно быть сообщение о создании события
3. Откройте Google Calendar - должно появиться событие
4. Если события нет, измените статус на "подтверждено" - событие должно создаться

### 5. Проверка в базе данных:

После создания бронирования проверьте в Supabase Table Editor → bookings:
- Колонка `google_event_id` должна быть заполнена (например: `abc123xyz`)
- Если пусто - событие не создалось, смотрите логи
