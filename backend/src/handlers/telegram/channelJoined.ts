import { Context, Bot } from 'grammy';
import { markChannelJoined } from '../../services/bot/channelReminderService';
import { t, getUserLocale } from '../../utils/translations';

const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '';

/**
 * Handle channel joined confirmation callback
 */
export async function handleChannelJoined(ctx: Context, bot: Bot) {
  try {
    if (!ctx.callbackQuery || !ctx.callbackQuery.data || !ctx.from) {
      return;
    }

    const data = ctx.callbackQuery.data;
    const userId = data.replace('channel_joined_', '');
    const telegramUserId = ctx.from.id.toString();

    await ctx.answerCallbackQuery();

    // Verify user is actually a member of the channel
    try {
      const member = await bot.api.getChatMember(CHANNEL_ID, parseInt(telegramUserId));
      
      const isMember = member.status === 'member' || 
                       member.status === 'administrator' || 
                       member.status === 'creator';

      // Get user's locale
      const locale = await getUserLocale(userId);

      if (isMember) {
        // User has joined, mark as joined
        await markChannelJoined(userId);
        
        await ctx.reply(t(locale, 'channel.thankYou'));
      } else {
        // User hasn't joined yet
        const channelUsername = CHANNEL_ID.replace('@', '');
        await ctx.reply(
          t(locale, 'channel.pleaseJoin', { channel: channelUsername }),
          {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: t(locale, 'channel.joinChannel'), url: `https://t.me/${channelUsername}` },
                  { text: t(locale, 'channel.iveJoined'), callback_data: `channel_joined_${userId}` },
                ],
              ],
            },
          }
        );
      }
    } catch (error: any) {
      console.error('Error verifying channel membership:', error);
      
      // Get user's locale
      const locale = await getUserLocale(userId);

      // If bot cannot access member list (private channels) or doesn't have admin rights,
      // trust the user's confirmation and mark as joined
      if (
        error.error_code === 403 || 
        error.error_code === 400 ||
        error.description?.includes('not enough rights') ||
        error.description?.includes('member list is inaccessible')
      ) {
        console.warn('Bot cannot verify channel membership (member list inaccessible or insufficient permissions). Trusting user confirmation and marking as joined.');
        await markChannelJoined(userId);
        await ctx.reply(t(locale, 'channel.recorded'));
      } else {
        await ctx.reply(t(locale, 'channel.error'));
      }
    }
  } catch (error) {
    console.error('Error in handleChannelJoined:', error);
    // Try to get locale
    let locale: 'uz' | 'en' | 'ru' = 'uz';
    try {
      if (ctx.callbackQuery?.data) {
        const userId = ctx.callbackQuery.data.replace('channel_joined_', '');
        locale = await getUserLocale(userId);
      }
    } catch {
      // Use default
    }
    await ctx.reply(t(locale, 'message.error'));
  }
}

