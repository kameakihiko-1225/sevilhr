import { Bot } from 'grammy';
import { prisma } from '../../utils/prisma';
import { t, getUserLocale } from '../../utils/translations';

const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '';

/**
 * Get reminder intervals in days: [3, 5, 7, 9, 13, 19, 27, 39, 55...]
 * Each interval increases gradually
 */
export function getReminderIntervals(): number[] {
  const intervals: number[] = [3, 5, 7, 9, 13];
  let lastInterval = 13;
  let increment = 6;
  
  // Generate more intervals as needed (unlimited)
  for (let i = 0; i < 20; i++) {
    lastInterval += increment;
    intervals.push(lastInterval);
    increment += 2; // Increase increment gradually
  }
  
  return intervals;
}

/**
 * Schedule initial reminder (sends immediately)
 */
export async function scheduleInitialReminder(userId: string): Promise<void> {
  try {
    const reminder = await prisma.channelJoinReminder.upsert({
      where: { userId },
      create: {
        userId,
        reminderCount: 0,
        hasJoinedChannel: false,
        nextReminderAt: new Date(), // Send immediately
      },
      update: {
        // If already exists, don't reset, just ensure it's set up
        nextReminderAt: new Date(),
      },
    });

    console.log(`Scheduled initial channel reminder for user ${userId}`);
  } catch (error) {
    console.error(`Error scheduling initial reminder for user ${userId}:`, error);
  }
}

/**
 * Schedule next reminder based on current reminder count
 */
export async function scheduleNextReminder(userId: string): Promise<void> {
  try {
    const reminder = await prisma.channelJoinReminder.findUnique({
      where: { userId },
    });

    if (!reminder || reminder.hasJoinedChannel) {
      return; // User has joined or reminder doesn't exist
    }

    const intervals = getReminderIntervals();
    const currentCount = reminder.reminderCount;
    const nextIntervalDays = intervals[currentCount] || intervals[intervals.length - 1];

    const nextReminderAt = new Date();
    nextReminderAt.setDate(nextReminderAt.getDate() + nextIntervalDays);

    await prisma.channelJoinReminder.update({
      where: { userId },
      data: {
        reminderCount: currentCount + 1,
        lastReminderSentAt: new Date(),
        nextReminderAt,
      },
    });

    console.log(`Scheduled next channel reminder for user ${userId} in ${nextIntervalDays} days`);
  } catch (error) {
    console.error(`Error scheduling next reminder for user ${userId}:`, error);
  }
}

/**
 * Mark user as joined channel and cancel all future reminders
 */
export async function markChannelJoined(userId: string): Promise<void> {
  try {
    // Update reminder record
    await prisma.channelJoinReminder.updateMany({
      where: { userId },
      data: {
        hasJoinedChannel: true,
        joinedAt: new Date(),
        nextReminderAt: null, // Cancel future reminders
      },
    });

    // Also update User model for quick checks
    await prisma.user.updateMany({
      where: { id: userId },
      data: {
        channelJoined: true,
      },
    });

    console.log(`Marked user ${userId} as joined channel`);
  } catch (error) {
    console.error(`Error marking user ${userId} as joined:`, error);
  }
}

/**
 * Check if reminder should be sent for a user
 */
export async function shouldSendReminder(userId: string): Promise<boolean> {
  try {
    const reminder = await prisma.channelJoinReminder.findUnique({
      where: { userId },
    });

    if (!reminder || reminder.hasJoinedChannel) {
      return false;
    }

    if (!reminder.nextReminderAt) {
      return false;
    }

    return reminder.nextReminderAt <= new Date();
  } catch (error) {
    console.error(`Error checking reminder for user ${userId}:`, error);
    return false;
  }
}

/**
 * Send channel join reminder message to user
 */
export async function sendChannelJoinReminder(userId: string, bot: Bot): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { telegramId: true },
    });

    if (!user || !user.telegramId) {
      console.warn(`User ${userId} has no telegramId, skipping reminder`);
      return;
    }

    const channelUsername = CHANNEL_ID.replace('@', '');
    const channelUrl = `https://t.me/${channelUsername}`;

    // Get user's locale
    const locale = await getUserLocale(userId);
    const message = t(locale, 'channel.reminder');

    const keyboard = {
      inline_keyboard: [
        [
          { text: t(locale, 'channel.joinChannel'), url: channelUrl },
          { text: t(locale, 'channel.iveJoined'), callback_data: `channel_joined_${userId}` },
        ],
      ],
    };

    await bot.api.sendMessage(user.telegramId, message, {
      reply_markup: keyboard,
    });

    console.log(`Sent channel join reminder to user ${userId}`);
  } catch (error) {
    console.error(`Error sending channel reminder to user ${userId}:`, error);
  }
}

/**
 * Get users who should receive reminders
 */
export async function getUsersDueForReminder(): Promise<string[]> {
  try {
    const reminders = await prisma.channelJoinReminder.findMany({
      where: {
        hasJoinedChannel: false,
        nextReminderAt: {
          lte: new Date(),
        },
      },
      select: {
        userId: true,
      },
    });

    return reminders.map(r => r.userId);
  } catch (error) {
    console.error('Error getting users due for reminder:', error);
    return [];
  }
}

