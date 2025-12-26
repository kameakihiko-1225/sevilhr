# HRSEVIL ATS

## Overview
HRSEVIL ATS is a landing page and Telegram bot application for an ATS (Applicant Tracking System). It consists of:
- **Frontend**: Next.js 16 application with React 19, Tailwind CSS, and Shadcn UI components
- **Backend**: Express.js API with Prisma ORM and Grammy (Telegram bot framework)
- **Database**: PostgreSQL

## Project Structure
```
├── frontend/           # Next.js 16 frontend (port 5000)
│   ├── app/           # Next.js app router
│   ├── components/    # React components (UI, sections, layout)
│   ├── lib/           # Utilities and translations
│   └── public/        # Static assets
├── backend/           # Express.js backend (port 3001)
│   ├── src/
│   │   ├── handlers/  # Telegram bot handlers
│   │   ├── routes/    # API routes
│   │   ├── services/  # Business logic
│   │   └── utils/     # Utilities
│   └── prisma/        # Database schema
├── prisma/            # Root migrations
├── scripts/           # Startup scripts
└── telegram-bot/      # Standalone telegram bot (not used in main app)
```

## Running the Application
The application runs via `npm run dev` which uses concurrently to start both:
- Frontend on port 5000 (http://0.0.0.0:5000)
- Backend on port 3001 (localhost)

## Environment Variables
Required:
- `DATABASE_URL` - PostgreSQL connection string (auto-configured by Replit)
- `TELEGRAM_BOT_TOKEN` - Telegram bot token (optional, for bot functionality)
- `WEBHOOK_URL` - Webhook URL for Telegram (optional)

## Tech Stack
- **Frontend**: Next.js 16.1.1, React 19, Tailwind CSS v4, Shadcn UI
- **Backend**: Express.js, Prisma 5.7.1, Grammy, Node.js 20
- **Database**: PostgreSQL (Neon-backed via Replit)
- **Languages**: TypeScript

## User Preferences
- Multilingual support (Uzbek, Russian, English)
- Mobile responsive design
