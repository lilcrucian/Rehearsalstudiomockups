# 📅 Настройка Google Calendar интеграции

Для предотвращения двойного бронирования система интегрирована с Google Calendar.

## ✅ Что уже сделано

- ✅ Модуль для работы с Google Calendar API
- ✅ Проверка доступности времени перед бронированием
- ✅ Автоматическое создание событий в календаре
- ✅ Удаление событий при отмене бронирования
- ✅ Добавлено поле `google_event_id` в таблицу `bookings`

## 🔧 Настройка (30 минут)

### Шаг 1: Создайте проект в Google Cloud Console

1. Перейдите на https://console.cloud.google.com/
2. Создайте новый проект или выберите существующий
3. Запомните **Project ID**

### Шаг 2: Включите Google Calendar API

1. В меню слева выберите **APIs & Services** → **Library**
2. Найдите **Google Calendar API**
3. Нажмите **Enable**

### Шаг 3: Создайте Service Account

1. Перейдите в **APIs & Services** → **Credentials**
2. Нажмите **Create Credentials** → **Service Account**
3. Введите название (например, "rehearsal-booking-calendar")
4. Нажмите **Create and Continue**
5. В разделе **Role** выберите **Project** → **Editor**
6. Нажмите **Done**

### Шаг 4: Создайте JSON ключ

1. Найдите созданный Service Account в списке
2. Нажмите на него
3. Перейдите на вкладку **Keys**
4. Нажмите **Add Key** → **Create new key**
5. Выберите **JSON**
6. Нажмите **Create**
7. **Сохраните скачанный JSON файл** (не потеряйте его!)

### Шаг 5: Создайте Google Calendar

**Вариант A: Один календарь для всех залов (рекомендуется)**

1. Откройте https://calendar.google.com/
2. Слева нажмите **+** рядом с "Other calendars"
3. Выберите **Create new calendar**
4. Название: "Репетиционная студия - Бронирования"
5. Нажмите **Create calendar**
6. Перейдите в настройки этого календаря
7. Прокрутите вниз до **Integrate calendar**
8. Скопируйте **Calendar ID** (например: `abc123@group.calendar.google.com`)
9. В разделе **Share with specific people** нажмите **Add people**
10. Вставьте email вашего Service Account (из JSON файла, поле `client_email`)
11. Выберите права **Make changes to events**
12. Нажмите **Send**

**Вариант B: Отдельный календарь для каждого зала**

Повторите шаги выше для каждого зала:
- "Зал A - Бронирования"
- "Зал B - Бронирования"  
- "Зал C - Бронирования"

### Шаг 6: Настройте переменные окружения в Supabase

1. Откройте Supabase Dashboard: https://supabase.com/dashboard/project/drvrlhbqnmtfqfokwevd
2. Перейдите в **Settings** → **Edge Functions**
3. В разделе **Secrets** добавьте:

**Обязательные переменные:**

```
GOOGLE_SERVICE_ACCOUNT_JSON
```
Значение: **Вставьте весь содержимое скачанного JSON файла** (весь текст от { до })

```
GOOGLE_CALENDAR_ID
```
Значение: Calendar ID вашего основного календаря (из шага 5)

**Опциональные переменные (если используете отдельные календари для залов):**

```
GOOGLE_CALENDAR_HALL_1
GOOGLE_CALENDAR_HALL_2
GOOGLE_CALENDAR_HALL_3
```
Значения: Calendar ID для каждого зала

### Шаг 7: Примените SQL миграцию

В Supabase Dashboard → **SQL Editor**:

```sql
-- Добавление поддержки Google Calendar
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS google_event_id TEXT;

CREATE INDEX IF NOT EXISTS idx_bookings_google_event_id ON bookings(google_event_id);
```

### Шаг 8: Перезапустите Edge Function

После добавления переменных окружения Edge Function автоматически перезапустится.

## 🎯 Как это работает

1. **При создании бронирования:**
   - Проверяется доступность времени в Google Calendar
   - Если занято → возвращается ошибка "Это время уже занято в календаре"
   - Если свободно → создается бронирование в БД и событие в календаре

2. **При удалении бронирования:**
   - Удаляется запись из БД
   - Автоматически удаляется событие из Google Calendar

3. **События в календаре содержат:**
   - Название зала
   - Имя клиента
   - Email клиента (отправляется приглашение)
   - ID бронирования
   - Напоминания (за 1 день и за 1 час)

## ⚠️ Важно

- **Не делитесь JSON файлом Service Account!** Это секретные данные
- Calendar ID начинается с букв/цифр и заканчивается на `@group.calendar.google.com`
- Service Account email выглядит как `название@project-id.iam.gserviceaccount.com`
- Если интеграция не настроена (нет переменных окружения), система продолжит работать без календаря

## 🔍 Проверка работы

После настройки:

1. Создайте тестовое бронирование через приложение
2. Откройте Google Calendar
3. Вы должны увидеть новое событие с деталями бронирования

## 🐛 Решение проблем

**Ошибка: "GOOGLE_SERVICE_ACCOUNT_JSON environment variable not set"**
- Добавьте переменную окружения в Supabase Dashboard

**Ошибка: "Calendar not found"**
- Проверьте что Calendar ID правильный
- Убедитесь что вы поделились календарем с Service Account email

**Ошибка: "Insufficient permissions"**
- Проверьте что Service Account имеет права **Make changes to events** в календаре
- Убедитесь что Google Calendar API включен в проекте

**События не создаются, но ошибок нет**
- Проверьте логи в Supabase Dashboard → **Edge Functions** → **Logs**
- Система продолжит работать даже если календарь не настроен (предупреждения в логах)

## 📚 Дополнительно

Документация Google Calendar API: https://developers.google.com/calendar/api/guides/overview
