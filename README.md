# Design App - Interior Design Generator

Приложение для генерации дизайна интерьера на основе планов помещений с использованием AI.

## Структура проекта

- `server/` - Backend API (Node.js + Express)
- `web/` - Frontend приложение (React + Vite)

## Развертывание

### Backend (Timeweb)
- Используйте Node.js 22
- Установите переменную окружения `COMET_API_KEY`
- Команда запуска: `npm start`

### Frontend (GitHub Pages)
- Автоматически развертывается через GitHub Actions
- Доступен по адресу: https://acqu1red.github.io/design/

## Использование

1. Загрузите план помещения
2. Выберите материалы (стены, пол, двери, ткани)
3. Сгенерируйте дизайн поверх плана
4. Создайте визуализацию комнат

## Доступные материалы

- Стены: `wall_paint_deep_green`, `wall_stripes_green_black`, `wall_marble_dark_green`
- Полы: `floor_planks_linear_olive`, `floor_hex_black_green`, `floor_terrazzo_black_green`
- Двери: `door_paint_dark_graphite`, `door_paint_deep_green`
- Ткани: `fabric_velvet_deep_green`