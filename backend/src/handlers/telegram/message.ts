import { Context, Bot } from 'grammy';

/**
 * Handle text messages
 * Currently no special handling needed - messages are ignored
 */
export async function handleMessage(ctx: Context, bot: Bot) {
  // Messages are ignored (could be regular conversation)
  // Rejection flow has been simplified to direct button clicks
  return;
}


