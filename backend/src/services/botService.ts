import { Bot } from 'grammy';
import { handleStart } from '../handlers/telegram/start';
import { handleCallback } from '../handlers/telegram/callback';
import { handleGetGroupId } from '../handlers/telegram/getgroupid';
import { handleChannelJoined } from '../handlers/telegram/channelJoined';
import { handleMessage } from '../handlers/telegram/message';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

if (!BOT_TOKEN) {
  console.warn('Warning: TELEGRAM_BOT_TOKEN is not set. Bot functionality will be disabled.');
}

// Initialize bot instance
export const bot = BOT_TOKEN ? new Bot(BOT_TOKEN) : null;

// Initialize bot if it exists
let botInitialized = false;

export async function initializeBot(): Promise<void> {
  if (!bot) {
    console.warn('Bot not available. Skipping initialization.');
    return;
  }

  if (botInitialized) {
    return;
  }

  try {
    // Initialize the bot
    await bot.init();
    botInitialized = true;
    console.log('✓ Bot initialized successfully');
  } catch (error) {
    console.error('Error initializing bot:', error);
    throw error;
  }
}

if (bot) {
  // Register handlers
  bot.command('start', async (ctx) => {
    await handleStart(ctx);
  });

  bot.command('getgroupid', async (ctx) => {
    await handleGetGroupId(ctx);
  });

  // Handle accept/reject callbacks
  bot.callbackQuery(/accept_|reject_|reject_reason_/, async (ctx) => {
    if (bot) {
      await handleCallback(ctx, bot);
    }
  });

  // Handle channel joined callback
  bot.callbackQuery(/channel_joined_/, async (ctx) => {
    if (bot) {
      await handleChannelJoined(ctx, bot);
    }
  });

  // Handle text messages (for rejection flow)
  bot.on('message:text', async (ctx) => {
    if (bot) {
      await handleMessage(ctx, bot);
    }
  });

  // Error handling
  bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`);
    const e = err.error;
    if (e instanceof Error) {
      console.error('Error details:', e.message);
    }
  });
}

export function getBot(): Bot | null {
  return bot;
}

