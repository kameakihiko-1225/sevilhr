# HRSEVIL ATS

A modern landing page with Telegram bot integration for HRSEVIL ATS (Applicant Tracking System).

## Features

- 🌐 Multi-language support (Uzbek, English, Russian)
- 📱 Telegram bot integration for lead management
- 📊 Lead tracking and status management
- 🤖 Automated channel join reminders
- 💬 Real-time notifications via Telegram
- 📝 Multi-stage application form with session management

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS v4, Shadcn UI
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Bot**: Grammy.js for Telegram Bot API
- **Deployment**: Docker, Replit-ready

## Quick Start

### Development (Docker)

```bash
# Start all services
docker compose up

# Backend: http://localhost:3001
# Frontend: http://localhost:3000
# Database: localhost:5432
```

### Development (Local)

```bash
# Install all dependencies
npm run install:all

# Start all services in development mode
npm run dev
```

### Production Build

```bash
# Build everything
npm run build

# Start in production mode
npm run start:prod
```

## Project Structure

```
HRSEVIL/
├── backend/          # Express API server
│   ├── src/
│   │   ├── handlers/    # Telegram bot handlers
│   │   ├── services/    # Business logic
│   │   ├── routes/      # API routes
│   │   └── utils/       # Utilities
│   └── prisma/          # Prisma schema
├── frontend/         # Next.js application
│   ├── app/             # Next.js app router
│   ├── components/      # React components
│   └── lib/             # Utilities and i18n
├── prisma/           # Shared Prisma schema
├── scripts/          # Deployment scripts
└── package.json      # Root package.json with scripts
```

## Environment Variables

See `DEPLOYMENT.md` for detailed environment variable configuration.

## Deployment

For Replit deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## License

Private - All rights reserved
