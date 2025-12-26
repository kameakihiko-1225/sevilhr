import { Context } from 'grammy';
import { LeadStatus } from '@prisma/client';
import { findOrCreateUser, getUserLeads } from '../../services/bot/userService';
import { scheduleInitialReminder } from '../../services/bot/channelReminderService';
import { prisma } from '../../utils/prisma';
import { t, getUserLocale } from '../../utils/translations';
import { bot } from '../../services/botService';

const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '';

export async function handleStart(ctx: Context) {
  try {
    const telegramId = ctx.from?.id?.toString();
    const telegramUsername = ctx.from?.username || null;
    const firstName = ctx.from?.first_name || null;
    const lastName = ctx.from?.last_name || null;

    if (!telegramId) {
      await ctx.reply('Error: Telegram ID not found.');
      return;
    }

    // Extract lead ID from start parameter if present
    const startParam = ctx.message?.text?.split(' ')[1] || ctx.update.message?.text?.split(' ')[1];
    
    // If start parameter contains a lead ID, update the lead's user with telegram data
    let leadUser = null;
    if (startParam) {
      try {
        const lead = await prisma.lead.findUnique({
          where: { id: startParam },
          include: { user: true },
        });

        if (lead) {
          // Check if there's already a user with this Telegram ID
          const existingTelegramUser = await prisma.user.findUnique({
            where: { telegramId: telegramId },
          });

          if (existingTelegramUser && existingTelegramUser.id !== lead.userId) {
            // If there's a different user with this Telegram ID, we can't update
            // because telegramId is unique. Log the situation.
            console.warn(`Telegram ID ${telegramId} already linked to user ${existingTelegramUser.id}, but lead ${startParam} belongs to user ${lead.userId}. Skipping Telegram update.`);
            leadUser = lead.user; // Use the lead's user as-is
          } else {
            // Safe to update: either no existing user with this Telegram ID, or it's the same user
            try {
              leadUser = await prisma.user.update({
                where: { id: lead.userId },
                data: {
                  telegramId: telegramId,
                  telegramUsername: telegramUsername,
                  firstName: firstName,
                  lastName: lastName,
                },
              });
            } catch (error: any) {
              // Handle unique constraint violation gracefully
              if (error?.code === 'P2002') {
                console.warn(`Failed to update user ${lead.userId} with Telegram ID ${telegramId}: unique constraint violation`);
                leadUser = lead.user; // Use the lead's user as-is
              } else {
                throw error; // Re-throw other errors
              }
            }
          }

          // Update lead status to FULL if it was PARTIAL
          if (lead.status === LeadStatus.PARTIAL) {
            await prisma.lead.update({
              where: { id: startParam },
              data: { status: LeadStatus.FULL },
            });
          }

          // Update the Telegram group message with Telegram contact info if message exists
          if (lead.telegramChatId && lead.telegramMessageId && bot) {
            try {
              const { updateLeadMessageWithTelegram } = await import('../../services/bot/leadService');
              console.log(`Updating lead message ${lead.telegramMessageId} with Telegram contact info for lead ${lead.id}`);
              await updateLeadMessageWithTelegram(bot, lead.id);
              console.log(`Successfully updated lead message with Telegram contact info for lead ${lead.id}`);
            } catch (error) {
              console.error(`Error updating lead message with Telegram info for lead ${lead.id}:`, error);
              if (error instanceof Error) {
                console.error('Error details:', error.message, error.stack);
              }
              // Don't fail the flow if message update fails
            }
          } else {
            if (!lead.telegramChatId || !lead.telegramMessageId) {
              console.warn(`Cannot update lead message: lead ${lead.id} missing telegramChatId or telegramMessageId`);
            }
            if (!bot) {
              console.warn('Cannot update lead message: bot is not initialized');
            }
          }

          console.log(`Lead ${startParam} updated with Telegram data for user ${lead.userId}`);
        } else {
          console.warn(`Lead ${startParam} not found`);
        }
      } catch (error) {
        console.error('Error updating lead with telegram data:', error);
      }
    }

    // Find or create user by Telegram ID (for showing their leads)
    // Use the updated user if we just updated one, otherwise find/create
    const user = leadUser || await findOrCreateUser(ctx);

    // Get user's locale
    const locale = await getUserLocale(user.id);

    // Welcome message
    await ctx.reply(t(locale, 'start.welcome'));

    // Suggest joining channel
    if (CHANNEL_ID) {
      const channelUsername = CHANNEL_ID.replace('@', '');
      await ctx.reply(t(locale, 'start.channelJoin'), {
        reply_markup: {
          inline_keyboard: [
            [
              { text: t(locale, 'start.joinChannel'), url: `https://t.me/${channelUsername}` },
              { text: t(locale, 'start.iveJoined'), callback_data: `channel_joined_${user.id}` },
            ],
          ],
        },
      });

      // Schedule initial channel reminder if user hasn't joined
      // Get full user data to check channelJoined
      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      if (!(fullUser as any)?.channelJoined) {
        await scheduleInitialReminder(user.id);
      }
    }

    // Show application status if user has leads
    const leads = await getUserLeads(user.id);
    if (leads.length > 0) {
      const latestLead = leads[0];
      let statusMessage = `${t(locale, 'start.applicationStatus')}: ${latestLead.status}`;

      if (latestLead.status === LeadStatus.ACCEPTED) {
        statusMessage += `\n${t(locale, 'start.accepted')}`;
      } else if (latestLead.status === LeadStatus.REJECTED) {
        statusMessage += `\n${t(locale, 'start.rejected')}`;
        if (latestLead.rejectionReason) {
          statusMessage += `\n${t(locale, 'start.reason')}: ${latestLead.rejectionReason}`;
        }
      } else {
        statusMessage += `\n${t(locale, 'start.pending')}`;
      }

      await ctx.reply(statusMessage);
    }
  } catch (error) {
    console.error('Error in start handler:', error);
    // Try to get locale from user if available
    let locale: 'uz' | 'en' | 'ru' = 'uz';
    try {
      const telegramId = ctx.from?.id?.toString();
      if (telegramId) {
        // Find user by telegramId to get userId, then get locale
        const user = await prisma.user.findUnique({
          where: { telegramId },
          select: { id: true },
        });
        if (user) {
          locale = await getUserLocale(user.id);
        }
      }
    } catch {
      // Use default locale
    }
    await ctx.reply(t(locale, 'start.error'));
  }
}

