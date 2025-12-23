# PickRoute

A pickup-first, route-aware food ordering platform that enables users to pre-order food and pick it up themselves, either on their daily route or nearby.

## Architecture

- **Frontend**: React Native + TypeScript
- **Backend**: Node.js + NestJS
- **Database**: PostgreSQL + PostGIS + Redis
- **Infrastructure**: Docker + Managed DB (Supabase)

## Project Structure

```
pickroute/
├── backend/          # NestJS backend
├── frontend/         # React Native app
├── docker-compose.yml
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- React Native development environment

### Setup

1. Clone the repository
2. Configure environment variables (see `.env.example`)
3. Run `docker-compose up` for infrastructure
4. Start backend: `cd backend && npm install && npm run start:dev`
5. Start frontend: `cd frontend && npm install && npm run ios/android`

## Features

- Route-aware restaurant discovery
- Real-time order tracking
- OTP-based pickup verification
- Role-based access (User, Restaurant, Admin)
