# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tweak is a full-stack weekly task/schedule planner with a NestJS backend and Angular 13 frontend. Users manage daily todos on a week calendar view with drag-drop reordering, color coding, rich notes, and a "Someday" bucket for unscheduled tasks.

## Commands

### Development (from repo root)
```bash
npm run dev              # Run client + server concurrently
npm run start:client     # Angular dev server only (port 4200)
npm run start:server     # NestJS dev server only (port 1337)
```

### Backend (from tweak-backend/)
```bash
npm run start:dev        # NestJS watch mode
npm run build            # Compile to dist/
npm run lint             # ESLint
npm test                 # Jest unit tests
npm run test:e2e         # End-to-end tests
```

### Frontend (from tweak-client/)
```bash
npm start                # ng serve (port 4200, proxied to backend)
npm run build            # Production build to dist/tweak-client
npm test                 # Karma unit tests
npm run lint             # ESLint
```

## Architecture

### Backend — NestJS + MongoDB (tweak-backend/)
- **API prefix**: `/api`, runs on port 1337
- **Two feature modules**: `AuthModule` (JWT auth, user settings) and `ScheduleModule` (todo CRUD)
- **Auth flow**: Passport JWT strategy, 1-day expiry, secret from `JWT_TOKEN` env var
- **Database**: MongoDB via Mongoose, connection URI from `DATABASE_URL` env var
- **Schemas**: `User` (username, password/bcrypt, language, weekStartsOn, dateFormat) and `Schedule` (todo, notes, date, colorCode, finished, order, isSomeday)
- **Validation**: class-validator on DTOs with global ValidationPipe

### Frontend — Angular 13 + Material (tweak-client/)
- **Lazy-loaded routes**: `/auth` → AuthModule, `/dashboard` → DashboardModule (guarded)
- **Auth**: JWT stored in localStorage, injected via `AuthInterceptorService` on all HTTP requests
- **State**: BehaviorSubject-based services (AuthService, CalendarService, DragDropShareService) — no NgRx
- **i18n**: @ngx-translate with JSON files in `src/assets/i18n/` (en, es). Language persisted to user settings and localStorage
- **Week calendar**: CalendarService generates 7-day arrays, supports configurable week start (Monday/Sunday)
- **Material modules**: Centralized in `MaterialModule` (`src/app/material/material.module.ts`)
- **Proxy**: `proxy.conf.js` forwards `/api` requests to backend during development

### Key Directories
```
tweak-backend/src/auth/          # Auth controller, service, JWT strategy, user schema, DTOs
tweak-backend/src/schedule/      # Schedule controller, service, schema, DTOs
tweak-client/src/app/dashboard/  # Main UI: header, week-calender, daily-todo, dialogs
tweak-client/src/app/shared/     # Guards, interceptors, services, date adapter
tweak-client/src/app/auth/       # Login/signup components
```

## Environment Variables (backend .env)
- `DATABASE_URL` — MongoDB connection string
- `JWT_TOKEN` — JWT signing secret
