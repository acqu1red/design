# Инструкции по развертыванию на Timeweb

## Настройка Backend на Timeweb

### 1. Создание приложения
- **Тип**: Backend
- **Фреймворк**: Node.js 22
- **Регион**: Санкт-Петербург (SPB-3)

### 2. Подключение репозитория
- **Аккаунт**: acqu1red
- **Репозиторий**: acqu1red/design
- **Ветка**: main

### 3. Настройки приложения
- **Команда сборки**: `cd server && npm install`
- **Команда запуска**: `cd server && npm start`
- **Порт**: 4000 (автоматически)

### 4. Переменные окружения
Добавьте следующие переменные:
- `COMET_API_KEY` - ваш API ключ от Comet API
- `BASE_URL` - URL вашего приложения (например: https://your-app.timeweb.cloud)
- `PORT` - 4000

### 5. Структура файлов
```
/
├── server/          # Backend код
│   ├── src/
│   │   └── index.js # Основной файл сервера
│   ├── package.json
│   └── uploads/     # Папка для загруженных файлов
└── web/             # Frontend код (не используется на сервере)
```

### 6. После развертывания
1. Получите URL вашего приложения от Timeweb
2. Обновите `web/src/config.js` с правильным URL
3. Загрузите изменения в репозиторий
4. GitHub Pages автоматически обновится

## Настройка Frontend на GitHub Pages

Frontend автоматически развертывается через GitHub Actions при каждом push в main ветку.

### Доступ к приложению
- Frontend: https://acqu1red.github.io/design/
- Backend: https://your-app.timeweb.cloud (после настройки)
