## TradieDr – Workforce Scheduling & Job Management (POC)

TradieDr is a proof-of-concept back-office web application for organising daily work for tradespeople (plumbers, tilers, carpenters, etc.). It manages staff, clients, jobs, and half-day scheduling, and visualises allocations via grid and Gantt-style views.

This is a POC, not production-ready, but it has a clean structure, realistic data models, and working role-based permissions.

---

## Tech Stack

- **Frontend**
  - React Native (via `react-native-web`) + TypeScript
  - Vite
  - React Query (`@tanstack/react-query`)
  - React Router
  - PNPM

- **Backend**
  - Node.js
  - Express.js
  - PostgreSQL
  - Prisma ORM
  - JSON Web Tokens (JWT) authentication

---

## Project Structure

- `backend` – Express API, Prisma schema, JWT auth, seeding
- `frontend` – Vite + React Native Web app (Back Office UI)

---

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- PNPM
- PostgreSQL database

Create a PostgreSQL database and note the connection URL, e.g.:

`postgresql://user:password@localhost:5432/tradiedr`

---

### Backend Setup (`backend`)

```bash
cd backend
pnpm install
```

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and set:

- `DATABASE_URL` – your PostgreSQL connection string
- `JWT_SECRET` – a long random secret

Run Prisma migrations and seed data:

```bash
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
```

Start the backend:

```bash
pnpm dev
```

By default the API runs on `http://localhost:4000`.

---

### Frontend Setup (`frontend`)

```bash
cd frontend
pnpm install
pnpm dev
```

The app should be available on `http://localhost:3000` (configured in `vite.config.ts`).

> The frontend is configured to proxy API requests to `http://localhost:4000` via Vite's proxy. Ensure the backend is running on port 4000.

---

## Roles & Permissions

There are three roles with strict hierarchy:

- **SystemAdmin**
  - Full access to all features
  - Can add / edit / soft delete:
    - `OfficeStaff`
    - `TradePerson`
    - Other `SystemAdmin` users

- **OfficeStaff**
  - Can do everything **except** manage `SystemAdmin` users
  - Can add / edit / soft delete:
    - `TradePerson`
  - Can manage Clients, Jobs, Tradies, Scheduling

- **TradePerson**
  - Cannot manage users
  - Can view **their own** schedule only
  - Can add notes to their own allocations

Soft delete is modelled with a `deletedAt` timestamp (null = active).

---

## Seeded Demo Accounts

After running `pnpm prisma:seed` in `backend`, you will have demo users:

- **System Admin**
  - Email: `admin@tradiedr.com`
  - Password: `password123`

- **Office Staff**
  - Email: `office@tradiedr.com`
  - Password: `password123`

- **Trade Person (Plumber)**
  - Email: `john.plumber@tradiedr.com`
  - Password: `password123`

- **Trade Person (Tiler)**
  - Email: `sarah.tiler@tradiedr.com`
  - Password: `password123`

- **Trade Person (Carpenter)**
  - Email: `mike.carpenter@tradiedr.com`
  - Password: `password123`

- **Trade Person (Electrician)**
  - Email: `lisa.electrician@tradiedr.com`
  - Password: `password123`

Use these accounts to explore role-based behaviour in the UI and API.

---

## High-Level Features

- **User Management**
  - CRUD users with soft delete
  - Assign roles
  - Role-based access control at API and UI levels

- **Client Management**
  - CRUD clients (SystemAdmin + OfficeStaff only)

- **Tradie Management**
  - CRUD trade people
  - Assign trade roles (Plumber, Tiler, Carpenter, etc.)
  - (SystemAdmin + OfficeStaff only)

- **Job Management**
  - CRUD jobs, including:
    - Client
    - Required trade roles
    - Required materials/resources (text)
    - Required number of half-day periods per role
  - (SystemAdmin + OfficeStaff only)

- **Scheduling & Allocation**
  - Time broken into half-day periods:
    - AM
    - PM
  - Allocate trade people to jobs per half-day period
  - Prevent double-booking per tradie / date / period

- **Views**
  - Gantt-style per-employee view (week-based)
  - Weekly grid (Y: employees, X: Mon AM → Fri PM)

- **Notes**
  - Notes against specific half-day periods, linked to client and/or employee
  - Created by:
    - SystemAdmin
    - OfficeStaff
    - TradePerson (for their own allocations)

---

## Non-Goals

- Mobile deployment
- Payroll / invoicing
- Push notifications
- Advanced optimisation
- Offline support

---

## Development Notes

- Backend and frontend both use **TypeScript**.
- Authentication is implemented with **JWT**:
  - `/auth/login` issues a token
  - Subsequent requests send `Authorization: Bearer <token>`
- Role-based guards are implemented on both:
  - API routes (Express middleware)
  - UI (conditional rendering & protected routes)

This repository is intended as a learning and demonstration project, not as a production-ready system.


