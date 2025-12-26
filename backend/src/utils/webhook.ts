import { bot, initializeBot } from '../services/botService';

const WEBHOOK_URL = process.env.WEBHOOK_URL || '';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

/**
 * Validate webhook URL format
 */
function validateWebhookUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'https:' && urlObj.hostname.length > 0;
  } catch {
    return false;
  }
}

/**
 * Set webhook URL with Telegram API
 */
export async function setWebhook(url?: string): Promise<boolean> {
  if (!bot) {
    console.warn('Bot not initialized. Cannot set webhook.');
    return false;
  }

  // Ensure bot is initialized
  await initializeBot();

  const webhookUrl = url || WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.warn('WEBHOOK_URL is not set. Cannot configure webhook.');
    return false;
  }

  // Validate URL format
  if (!validateWebhookUrl(webhookUrl)) {
    console.error(`Invalid webhook URL format: ${webhookUrl}. Must be a valid HTTPS URL.`);
    return false;
  }

  // Ensure URL includes the full path if not already present
  let finalUrl = webhookUrl;
  if (!finalUrl.includes('/api/webhook/telegram')) {
    // If the URL doesn't have the path, add it (assuming base URL was provided)
    finalUrl = finalUrl.endsWith('/') 
      ? `${finalUrl}api/webhook/telegram`
      : `${finalUrl}/api/webhook/telegram`;
  }

  try {
    const secretToken = WEBHOOK_SECRET || undefined;
    
    console.log(`Setting webhook to: ${finalUrl}`);
    const result = await bot.api.setWebhook(finalUrl, {
      secret_token: secretToken,
      allowed_updates: ['message', 'callback_query'],
    });

    if (result) {
      console.log(`✓ Webhook set successfully: ${finalUrl}`);
      return true;
    }
    
    console.error('Failed to set webhook: Telegram API returned false');
    return false;
  } catch (error) {
    console.error('Error setting webhook:', error);
    return false;
  }
}

/**
 * Delete webhook (useful for development or switching to polling)
 */
export async function deleteWebhook(): Promise<boolean> {
  if (!bot) {
    console.warn('Bot not initialized. Cannot delete webhook.');
    return false;
  }

  // Ensure bot is initialized
  await initializeBot();

  try {
    const result = await bot.api.deleteWebhook();
    if (result) {
      console.log('Webhook deleted successfully');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting webhook:', error);
    return false;
  }
}

/**
 * Get current webhook information
 */
export async function getWebhookInfo() {
  if (!bot) {
    console.warn('Bot not initialized. Cannot get webhook info.');
    return null;
  }

  // Ensure bot is initialized
  await initializeBot();

  try {
    const info = await bot.api.getWebhookInfo();
    return info;
  } catch (error) {
    console.error('Error getting webhook info:', error);
    return null;
  }
}

