import { Router, Request, Response } from 'express';
import { bot } from '../services/botService';
import { setWebhook, getWebhookInfo, deleteWebhook } from '../utils/webhook';

const router = Router();
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

/**
 * Middleware to validate webhook secret if configured
 */
function validateWebhookSecret(req: Request, res: Response, next: Function) {
  if (WEBHOOK_SECRET) {
    const secretHeader = req.headers['x-telegram-bot-api-secret-token'];
    if (secretHeader !== WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }
  next();
}

/**
 * POST /api/webhook/telegram
 * Receives updates from Telegram
 */
router.post('/telegram', validateWebhookSecret, async (req: Request, res: Response) => {
  try {
    if (!bot) {
      return res.status(503).json({ error: 'Bot not initialized' });
    }

    // Ensure bot is initialized before handling update
    const { initializeBot } = await import('../services/botService');
    await initializeBot();

    // Pass the update to Grammy bot for processing
    await bot.handleUpdate(req.body);

    // Always return 200 OK to Telegram
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Error processing webhook update:', error);
    // Still return 200 to prevent Telegram from retrying
    res.status(200).json({ ok: false, error: 'Processing failed' });
  }
});

/**
 * POST /api/webhook/update
 * Update webhook URL dynamically
 */
router.post('/update', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL is required and must be a string' });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const success = await setWebhook(url);
    if (success) {
      const info = await getWebhookInfo();
      res.json({
        success: true,
        message: 'Webhook updated successfully',
        webhook: info,
      });
    } else {
      res.status(500).json({ error: 'Failed to update webhook' });
    }
  } catch (error) {
    console.error('Error updating webhook:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/webhook/info
 * Get current webhook information
 */
router.get('/info', async (req: Request, res: Response) => {
  try {
    const info = await getWebhookInfo();
    if (info) {
      res.json(info);
    } else {
      res.status(503).json({ error: 'Bot not initialized or webhook info unavailable' });
    }
  } catch (error) {
    console.error('Error getting webhook info:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /api/webhook
 * Delete webhook (useful for switching to polling)
 */
router.delete('/', async (req: Request, res: Response) => {
  try {
    const success = await deleteWebhook();
    if (success) {
      res.json({ success: true, message: 'Webhook deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete webhook' });
    }
  } catch (error) {
    console.error('Error deleting webhook:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

