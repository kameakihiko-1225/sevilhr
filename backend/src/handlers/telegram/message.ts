import { Context, Bot } from 'grammy';
import { LeadStatus } from '@prisma/client';
import { getRejectionState, clearRejectionState } from '../../utils/rejectionState';
import { updateLeadStatus } from '../../services/bot/leadService';
import { notifyUserAboutDecision } from '../../services/bot/notificationService';
import { scheduleInitialReminder } from '../../services/bot/channelReminderService';
import { prisma } from '../../utils/prisma';
import { t, getUserLocale } from '../../utils/translations';

/**
 * Handle text messages (primarily for rejection flow)
 */
export async function handleMessage(ctx: Context, bot: Bot) {
  try {
    if (!ctx.message || !ctx.message.text || !ctx.from) {
      return;
    }

    const userId = ctx.from.id.toString();
    const rejectionState = getRejectionState(userId);

    // Check if user is in rejection flow (waiting for custom reason)
    if (rejectionState) {
      const { leadId, rejectedBy } = rejectionState;
      const rejectionReason = ctx.message.text.trim();

      if (!rejectionReason || rejectionReason.length === 0) {
        await ctx.reply(t('uz', 'callback.pleaseProvideReason'));
        return;
      }

      // Get the lead to check if it exists and get user locale
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: { user: true },
      });

      if (!lead) {
        await ctx.reply(t('uz', 'callback.leadNotFound'));
        clearRejectionState(userId);
        return;
      }

      // Get user's locale
      const locale = await getUserLocale(lead.userId);

      // Update lead with rejection reason (use stored rejectedBy)
      const updatedLead = await updateLeadStatus(
        leadId,
        LeadStatus.REJECTED,
        undefined,
        rejectedBy,
        rejectionReason
      );

      // Refetch the lead to get updated data
      const refetchedLead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: { user: true },
      });

      if (!refetchedLead) {
        await ctx.reply(t(locale, 'callback.leadNotFound'));
        clearRejectionState(userId);
        return;
      }

      // Update group message with rejection details
      if (refetchedLead.telegramChatId && refetchedLead.telegramMessageId) {
        // Format rejection message for group
        const { formatRejectionMessageForGroup } = await import('../../services/bot/leadService');
        const rejectionMessage = formatRejectionMessageForGroup(
          refetchedLead,
          rejectionReason,
          ctx.from.username || rejectedBy
        );
        
        try {
          await bot.api.editMessageText(
            refetchedLead.telegramChatId,
            parseInt(refetchedLead.telegramMessageId),
            rejectionMessage,
            { parse_mode: 'MarkdownV2' }
          );
        } catch (error) {
          console.error('Error updating group message with rejection:', error);
        }
      }

      // Notify user about rejection
      await notifyUserAboutDecision(bot, leadId, LeadStatus.REJECTED);

      // Schedule channel reminder if user hasn't joined
      const userWithChannel = await prisma.user.findUnique({
        where: { id: lead.userId },
      });
      if (!(userWithChannel as any)?.channelJoined) {
        await scheduleInitialReminder(lead.userId);
      }

      // Clear rejection state
      clearRejectionState(userId);

      await ctx.reply(t(locale, 'callback.rejectedSuccess'));
    }
    // If not in rejection flow, message is ignored (could be regular conversation)
  } catch (error) {
    console.error('Error handling message:', error);
    // Try to get locale
    let locale: 'uz' | 'en' | 'ru' = 'uz';
    try {
      const telegramId = ctx.from?.id?.toString();
      if (telegramId) {
        const user = await prisma.user.findUnique({
          where: { telegramId },
          select: { locale: true },
        });
        if (user?.locale && ['uz', 'en', 'ru'].includes(user.locale)) {
          locale = user.locale as 'uz' | 'en' | 'ru';
        }
      }
    } catch {
      // Use default
    }
    await ctx.reply(t(locale, 'message.error'));
  }
}


