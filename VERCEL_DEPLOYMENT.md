# Deployment Guide

## Unified Deployment — One Command

Both frontend (Next.js) and backend (Express API) deploy as a **single project**.

### Vercel (Primary)

```bash
npm i -g vercel    # install CLI (once)
vercel login       # authenticate (once)
npm run deploy     # deploy to production
```

That's it. The root `vercel.json` uses a `builds` array to deploy both services:
- **Frontend** → `@vercel/next` (builds `frontend/`)
- **Backend API** → `@vercel/node` (builds `backend/api/index.ts` as a serverless function)

Routing is automatic:
- `/api/*` → Express backend (serverless)
- `/health` → Express backend (serverless)
- `/*` → Next.js frontend (SSR)

### Netlify (Alternative)

```bash
npm i -g netlify-cli
netlify login
npm run deploy:netlify
```

Uses `netlify.toml` + `netlify/functions/api.mts` for the same unified approach.

---

## Environment Variables

Set these in your Vercel/Netlify project dashboard:

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather | Yes |
| `TELEGRAM_GROUP_ID` | Leads notification group | Yes |
| `TELEGRAM_CHANNEL_ID` | Announcement channel | Yes |
| `WEBHOOK_URL` | `https://<your-domain>/api/webhook/telegram` | Yes |
| `WEBHOOK_SECRET` | Random secret for webhook verification | Yes |
| `CORS_ORIGIN` | `https://<your-domain>` | Yes |
| `FRONTEND_URL` | `https://<your-domain>` | Yes |
| `NEXT_PUBLIC_TELEGRAM_BOT_URL` | `https://t.me/your_bot` | Yes |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | `uz` / `en` / `ru` | No |
| `NODE_ENV` | `production` | Yes |

Since frontend and backend share the same domain, `CORS_ORIGIN`, `FRONTEND_URL`, and webhook URLs all use the same base URL.

---

## Database Setup

Use any PostgreSQL provider:
- **Vercel Postgres** — Dashboard > Storage > Create Database
- **Neon** — [neon.tech](https://neon.tech) (serverless Postgres)
- **Supabase** — [supabase.com](https://supabase.com)

After setting `DATABASE_URL`, run migrations:
```bash
cd backend && DATABASE_URL="your_prod_url" npx prisma migrate deploy
```

---

## Preview Deployments

```bash
npm run deploy:preview   # creates a preview URL
```

---

## Troubleshooting

**Prisma binary issues** — Already configured with `binaryTargets = ["native", "rhel-openssl-3.0.x"]` in the schema.

**CORS errors** — Ensure `CORS_ORIGIN` matches your deployment URL exactly (including `https://`).

**Cold starts** — First request after inactivity may be slow. This is normal for serverless functions.
