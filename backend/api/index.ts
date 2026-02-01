import express from 'express';
import cors from 'cors';
import leadsRouter from '../src/routes/leads';
import webhookRouter from '../src/routes/webhook';
import { initializeBot } from '../src/services/botService';

// Create Express app for Vercel serverless
const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || process.env.CORS_ORIGIN || '*',
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Initialize bot on cold start
let botInitialized = false;

const ensureBotInitialized = async () => {
  if (!botInitialized) {
    try {
      await initializeBot();
      botInitialized = true;
    } catch (error) {
      console.error('Failed to initialize bot:', error);
    }
  }
};

// Middleware to ensure bot is initialized (must be before routes)
app.use(async (_req, _res, next) => {
  await ensureBotInitialized();
  next();
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), platform: 'vercel' });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), platform: 'vercel' });
});

// API routes
app.use('/api', leadsRouter);
app.use('/api/webhook', webhookRouter);

// Export for Vercel
export default app;
