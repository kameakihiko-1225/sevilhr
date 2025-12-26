import { Bot } from 'grammy';
import { handleStart } from './handlers/start';
import { handleCallback } from './handlers/callback';
import { handleGetGroupId } from './handlers/getgroupid';

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN || '');

// Register handlers
bot.command('start', async (ctx) => {
  await handleStart(ctx);
});

bot.command('getgroupid', async (ctx) => {
  await handleGetGroupId(ctx);
});

bot.callbackQuery(/accept_|reject_/, async (ctx) => {
  await handleCallback(ctx, bot);
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

console.log('Starting Telegram bot...');
bot.start();

