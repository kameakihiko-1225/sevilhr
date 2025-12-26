import { Bot } from 'grammy';
import { LeadStatus } from '@prisma/client';
import { prisma } from '../../utils/prisma';
import { scheduleInitialReminder } from './channelReminderService';
import { t, getUserLocale } from '../../utils/translations';

const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '';

export async function notifyUserAboutDecision(
  bot: Bot,
  leadId: string,
  status: LeadStatus
) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { user: true },
  });

  if (!lead || !lead.user.telegramId) {
    return;
  }

  // Get user's locale
  const locale = await getUserLocale(lead.userId);

  let message = '';
  if (status === LeadStatus.ACCEPTED) {
    message = t(locale, 'notification.accepted');
  } else if (status === LeadStatus.REJECTED) {
    const reason = lead.rejectionReason ? `\n\n${t(locale, 'start.reason')}: ${lead.rejectionReason}` : '';
    message = `${t(locale, 'notification.rejected')}${reason}`;
  }

  if (message) {
    try {
      // Add channel join message if user hasn't joined
      if (!lead.user.channelJoined && CHANNEL_ID) {
        message += `\n\n${t(locale, 'notification.channelReminder')}`;
      }

      // Prepare keyboard with channel join buttons
      const keyboard: any = {
        inline_keyboard: [],
      };

      if (!lead.user.channelJoined && CHANNEL_ID) {
        const channelUsername = CHANNEL_ID.replace('@', '');
        keyboard.inline_keyboard.push([
          { text: t(locale, 'channel.joinChannel'), url: `https://t.me/${channelUsername}` },
          { text: t(locale, 'channel.iveJoined'), callback_data: `channel_joined_${lead.userId}` },
        ]);
      }

      // Send message with or without keyboard
      if (keyboard.inline_keyboard.length > 0) {
        await bot.api.sendMessage(lead.user.telegramId, message, {
          reply_markup: keyboard,
        });
      } else {
        await bot.api.sendMessage(lead.user.telegramId, message);
      }

      // Schedule channel reminder if user hasn't joined
      if (!lead.user.channelJoined) {
        await scheduleInitialReminder(lead.userId);
      }
    } catch (error) {
      console.error('Error notifying user:', error);
    }
  }
}

