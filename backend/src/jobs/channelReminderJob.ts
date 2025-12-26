import cron from 'node-cron';
import { bot } from '../services/botService';
import { getUsersDueForReminder, sendChannelJoinReminder, scheduleNextReminder } from '../services/bot/channelReminderService';

/**
 * Channel reminder cron job
 * Runs every hour to check for users who need reminders
 */
export function startChannelReminderJob() {
  if (!bot) {
    console.warn('Bot not initialized. Channel reminder job will not start.');
    return;
  }

  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('🕐 Running channel reminder job...');
      
      const userIds = await getUsersDueForReminder();
      
      if (userIds.length === 0) {
        console.log('  No users due for reminders.');
        return;
      }

      console.log(`  Found ${userIds.length} user(s) due for reminders.`);

      for (const userId of userIds) {
        try {
          if (bot) {
            await sendChannelJoinReminder(userId, bot);
          }
          await scheduleNextReminder(userId);
        } catch (error) {
          console.error(`Error processing reminder for user ${userId}:`, error);
        }
      }

      console.log('✓ Channel reminder job completed.');
    } catch (error) {
      console.error('Error in channel reminder job:', error);
    }
  });

  console.log('✅ Channel reminder cron job started (runs every hour).');
}

