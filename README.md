# DevSync

**DevSync** — система автоматического сбора и визуализации GitHub-активности разработчика. Обновляйте портфолио актуальной статистикой без ручной работы.

---

<img width="1913" height="966" alt="Снимок экрана от 2026-01-30 00-14-42" src="https://github.com/user-attachments/assets/dc6d4f0f-aabc-4e69-a38c-1a80a31af4ab" />

<img width="1913" height="966" alt="Снимок экрана от 2026-01-30 00-13-48" src="https://github.com/user-attachments/assets/6beca0d8-fe63-471a-8f9d-4f2fd79d72c7" />

---

## Возможности

- **GitHub OAuth** — вход через GitHub
- **Статистика** — репозитории, звёзды, форки, контрибуции
- **Heatmap** — граф контрибуций в стиле GitHub
- **Языки** — круговая диаграмма языков программирования
- **Топ репозиториев** — список с звёздами и форками
- **Отчёты** — экспорт в PDF и Markdown
- **Период** — статистика за неделю / месяц / год (переключатель на дашборде)
- **WebSocket** — после синхронизации дашборд обновляется без перезагрузки
- **Фоновый worker** — раз в 24 часа синхронизирует всех пользователей с GitHub (пауза 3 с между пользователями)
- **Rate limit** — 100 запросов в минуту на IP для защищённых API
- **Ошибки синхронизации** — отображаются на дашборде с кнопкой «Повторить»

---

## Стек

| Часть     | Технологии                                                                 |
|-----------|----------------------------------------------------------------------------|
| Frontend  | React 18, TypeScript, Vite, Tailwind CSS, D3.js, Framer Motion, React Query, amCharts 5 |
| Backend   | Go, Gin, PostgreSQL, Redis, JWT, GitHub API                                |
| Worker    | Go (фоновые задачи)                                                        |
| Инфра     | Docker, Docker Compose, Nginx                                              |

---

## Быстрый старт

### Требования

- **Docker** и **Docker Compose**
- **GitHub OAuth App** — [создать](https://github.com/settings/developers). В настройках укажите:
  - **Authorization callback URL:** `http://localhost:8181/api/auth/github/callback` (локальный backend) или `http://localhost:8180/api/auth/github/callback` (Docker)

### 1. Клонирование и конфиг

```bash
git clone https://github.com/gerich15/DevSync.git
cd DevSync
cp .env.example .env
```

В `.env` укажите:

```env
GITHUB_CLIENT_ID=ваш_client_id
GITHUB_CLIENT_SECRET=ваш_client_secret
JWT_SECRET=случайная_строка_для_jwt
```

### 2. Запуск через Docker Compose

```bash
docker-compose up -d
```

| Сервис   | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:3101        |
| Backend  | http://localhost:8180/api    |
| Nginx    | http://localhost:8888 (HTTPS: 9443) |

### 3. Локальная разработка

**Postgres и Redis** (остальное — локально):

```bash
docker-compose up -d postgres redis
```

**Backend (Go):**

```bash
cd server
export DATABASE_URL=postgres://devsync:devsync123@localhost:5433/devsync?sslmode=disable
export REDIS_URL=redis://localhost:6380/0
export GITHUB_CLIENT_ID=...
export GITHUB_CLIENT_SECRET=...
export JWT_SECRET=...
export SERVER_PORT=8181
go run ./cmd/server
```

**Frontend (Vite):**

```bash
cd client
npm install
npm run dev
```

Откройте http://localhost:3100 — Vite проксирует `/api` и `/ws` на backend (порт 8181).

Миграции применяются автоматически при первом запуске Postgres (volume `./server/migrations`).


<img width="1913" height="966" alt="Снимок экрана от 2026-01-30 00-14-08" src="https://github.com/user-attachments/assets/fac582b9-3c3a-4f5c-9abd-81ff7e633694" />


---

## API

| Метод | Путь | Описание |
|-------|------|----------|
| GET | /api/auth/github/check | Проверка готовности OAuth (для фронта) |
| POST | /api/auth/confirm | Подтверждение JWT после OAuth |
| GET | /api/auth/github | Начало OAuth (редирект на GitHub) |
| GET | /api/auth/github/callback | Callback OAuth |
| GET | /api/user | Текущий пользователь (JWT) |
| POST | /api/user/sync | Принудительная синхронизация |
| GET | /api/user/stats | Статистика пользователя |
| GET | /api/user/repos | Список репозиториев |
| GET | /api/user/contributions | Контрибуции за период |
| GET | /api/reports/pdf | Скачать PDF-отчёт |
| GET | /api/reports/markdown | Скачать Markdown |
| WS | /ws/updates | WebSocket (query: token=JWT) |

---

## Структура проекта

```
DevSync/
├── client/                 # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/     # UI, layout, dashboard
│   │   ├── hooks/          # useGitHubAuth, useGitHubStats, useWebSocket
│   │   ├── pages/          # Login, Dashboard, Reports, Settings
│   │   ├── services/       # api.ts
│   │   └── types/          # github.ts
│   └── Dockerfile
├── server/                 # Go (Gin)
│   ├── cmd/server/         # main
│   ├── cmd/worker/         # фоновый worker
│   ├── internal/           # config, domain, infrastructure, transport
│   ├── pkg/                # github client, pdf
│   ├── migrations/         # SQL
│   ├── Dockerfile
│   └── Dockerfile.worker
├── docker-compose.yml
├── nginx.conf
└── README.md
```

---

## Лицензия

MIT
