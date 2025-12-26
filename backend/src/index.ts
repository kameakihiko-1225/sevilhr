import express from 'express';
import cors from 'cors';
import leadsRouter from './routes/leads';
import webhookRouter from './routes/webhook';
import { setWebhook, getWebhookInfo } from './utils/webhook';
import { bot, initializeBot } from './services/botService';
import { startChannelReminderJob } from './jobs/channelReminderJob';

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || process.env.CORS_ORIGIN || (process.env.NODE_ENV === 'production' ? '*' : 'http://localhost:3000'),
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', leadsRouter);
app.use('/api/webhook', webhookRouter);

// Initialize webhook on startup
async function initializeWebhook() {
  if (!bot) {
    console.log('⚠ Bot not initialized. Skipping webhook setup.');
    return;
  }

  const webhookUrl = process.env.WEBHOOK_URL;
  
  if (webhookUrl) {
    console.log('🔧 Initializing webhook from WEBHOOK_URL environment variable...');
    const success = await setWebhook(webhookUrl);
    if (success) {
      const info = await getWebhookInfo();
      if (info) {
        console.log(`✓ Webhook configured: ${info.url || 'N/A'}`);
        console.log(`  Pending updates: ${info.pending_update_count || 0}`);
      }
    } else {
      console.warn('⚠ Failed to set webhook. Bot will not receive updates via webhook.');
      console.warn('  Check your WEBHOOK_URL in .env file and ensure it is accessible.');
    }
  } else {
    console.warn('⚠ WEBHOOK_URL not set in environment variables.');
    console.warn('  Bot will not receive updates. Set WEBHOOK_URL in .env file to enable webhooks.');
  }
}

const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

app.listen(Number(PORT), HOST, async () => {
  console.log(`Backend API server running on ${HOST}:${PORT}`);
  
  // Initialize bot first
  try {
    await initializeBot();
  } catch (error) {
    console.error('Failed to initialize bot:', error);
    // Continue startup even if bot initialization fails
  }
  
  // Initialize webhook after bot is initialized
  await initializeWebhook();
  
  // Start channel reminder cron job
  startChannelReminderJob();
});

