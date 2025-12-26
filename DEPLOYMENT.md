# HRSEVIL ATS Deployment Guide

This guide covers deploying the HRSEVIL ATS application to Replit.

## Prerequisites

- Replit account
- PostgreSQL database (Replit provides this via the Database tool)
- Telegram Bot Token
- Environment variables configured

## Deployment Steps

### 1. Create a New Replit Project

1. Log in to Replit
2. Click "Create" and select "Node.js" template
3. Import this repository

### 2. Set Up PostgreSQL Database

1. In Replit, click on the "Tools" tab (right sidebar)
2. Select "Database" → "PostgreSQL"
3. Replit will provide connection details:
   - Host (usually `localhost`)
   - Port (usually `5432`)
   - Database name
   - Username
   - Password

### 3. Configure Environment Variables

Set the following environment variables in Replit's "Secrets" tab (🔒 icon):

#### Required Variables:

```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Backend
BACKEND_PORT=3001
PORT=3001

# Frontend API URL (use your Replit app URL)
NEXT_PUBLIC_API_URL=https://your-app-name.your-username.repl.co

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_GROUP_ID=@your_group_id
TELEGRAM_CHANNEL_ID=@your_channel_id
NEXT_PUBLIC_TELEGRAM_BOT_URL=https://t.me/your_bot_username

# Webhook
WEBHOOK_URL=https://your-app-name.your-username.repl.co/api/webhook/telegram
WEBHOOK_SECRET=your_webhook_secret
```

### 4. Install Dependencies

Run this command once in the Replit shell:

```bash
npm run install:all
```

### 5. Initialize Database

Run Prisma migrations:

```bash
npm run prisma:push
```

Or if you have migrations:

```bash
cd backend && npx prisma migrate deploy
```

### 6. Build the Application

```bash
npm run build
```

This will:
- Build the backend TypeScript code
- Generate Prisma Client
- Build the Next.js frontend

### 7. Start the Application

For production:

```bash
npm run start:prod
```

For development:

```bash
npm run dev
```

The universal start script (`scripts/start.js`) will:
1. Generate Prisma Client
2. Run database migrations (production only)
3. Start the backend server
4. Start the frontend server

### 8. Configure Replit Run Command

In `.replit` file, the run command is set to:

```
run = "npm run start:prod"
```

This ensures Replit runs the production build when you click "Run".

### 9. Deploy (Optional)

If you want to deploy to a permanent URL:

1. Click the "Deploy" button in Replit
2. Configure deployment settings
3. The app will be accessible at a permanent URL

## Project Structure

```
HRSEVIL/
├── backend/          # Node.js/Express backend
│   ├── src/
│   ├── prisma/
│   └── package.json
├── frontend/         # Next.js frontend
│   ├── app/
│   ├── components/
│   └── package.json
├── prisma/           # Shared Prisma schema
├── scripts/          # Deployment scripts
│   └── start.js      # Universal start script
├── package.json      # Root package.json
├── .replit           # Replit configuration
└── replit.nix        # Nix package configuration
```

## Available Scripts

### Root Level:

- `npm run install:all` - Install dependencies for all services
- `npm run build` - Build both backend and frontend
- `npm run start` - Start in development mode (with watch)
- `npm run start:prod` - Start in production mode
- `npm run dev` - Run both backend and frontend in dev mode
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:push` - Push Prisma schema to database
- `npm run prisma:migrate` - Run Prisma migrations

### Backend:

- `cd backend && npm run build` - Build TypeScript
- `cd backend && npm run start` - Start production server
- `cd backend && npm run dev` - Start dev server with watch

### Frontend:

- `cd frontend && npm run build` - Build Next.js app
- `cd frontend && npm run start` - Start production server
- `cd frontend && npm run dev` - Start dev server

## Environment Variables Reference

### Database
- `DATABASE_URL` - PostgreSQL connection string

### Backend
- `BACKEND_PORT` or `PORT` - Backend server port (default: 3001)

### Frontend
- `BACKEND_URL` - Backend URL for Next.js server-side rewrites (used to proxy `/api/*` requests). In Docker, use `http://backend:3001` (service name). In local dev, defaults to `http://localhost:3001` if not set.
- `NEXT_PUBLIC_API_URL` - Backend API URL (for client-side usage if needed)
- `NEXT_PUBLIC_TELEGRAM_BOT_URL` - Telegram bot URL
- `NEXT_PUBLIC_DEFAULT_LOCALE` - Default locale (uz/en/ru)

### Telegram Bot
- `TELEGRAM_BOT_TOKEN` - Bot token from @BotFather
- `TELEGRAM_GROUP_ID` - Group/channel ID for leads
- `TELEGRAM_CHANNEL_ID` - Channel ID for announcements
- `WEBHOOK_URL` - Webhook URL for Telegram updates
- `WEBHOOK_SECRET` - Secret token for webhook verification

## Troubleshooting

### Database Connection Issues

If you get database connection errors:
1. Verify `DATABASE_URL` is correct in Secrets
2. Ensure PostgreSQL is running in Replit
3. Check if database exists: `psql -l`

### Port Conflicts

Replit assigns a port automatically. Use `process.env.PORT` for the backend in production.

### Prisma Client Not Generated

Run manually:
```bash
cd backend && npx prisma generate
```

### Frontend Can't Connect to Backend

1. Ensure `NEXT_PUBLIC_API_URL` is set correctly
2. Check CORS settings in backend
3. Verify backend is running on the correct port

### Telegram Webhook Issues

1. Verify `WEBHOOK_URL` is accessible from internet
2. Check `WEBHOOK_SECRET` matches in both places
3. Use the API endpoint to update webhook: `POST /api/webhook/update`

## Production Checklist

- [ ] All environment variables set in Replit Secrets
- [ ] Database migrations run successfully
- [ ] Prisma Client generated
- [ ] Backend builds without errors
- [ ] Frontend builds without errors
- [ ] Both services start correctly
- [ ] Database connection works
- [ ] Telegram bot connects
- [ ] Webhook URL is accessible
- [ ] CORS configured correctly
- [ ] API endpoints respond correctly

## Support

For issues or questions, check:
- Backend logs in Replit console
- Frontend logs in Replit console
- Database logs in Replit Database tool
- Telegram Bot API logs

