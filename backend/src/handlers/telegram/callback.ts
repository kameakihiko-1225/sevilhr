import { Context, Bot } from 'grammy';
import { LeadStatus } from '@prisma/client';
import { updateLeadStatus, formatRejectionMessageForGroup } from '../../services/bot/leadService';
import { notifyUserAboutDecision } from '../../services/bot/notificationService';
import { scheduleInitialReminder } from '../../services/bot/channelReminderService';
import { setRejectionState } from '../../utils/rejectionState';
import { prisma } from '../../utils/prisma';
import { t, getUserLocale } from '../../utils/translations';

export async function handleCallback(ctx: Context, bot: Bot) {
  if (!ctx.callbackQuery || !ctx.callbackQuery.data || !ctx.from) {
    return;
  }

  const data = ctx.callbackQuery.data;
  const userId = ctx.from.id.toString();

  await ctx.answerCallbackQuery();

  if (data.startsWith('accept_')) {
    const leadId = data.replace('accept_', '');
    
    try {
      // Update lead status
      const lead = await updateLeadStatus(
        leadId,
        LeadStatus.ACCEPTED,
        userId
      );

      // Update group message
      if (lead.telegramChatId && lead.telegramMessageId) {
        const companyTypeMap: Record<string, string> = {
          service: 'Xizmat ko\'rsatish',
          trade: 'Savdo-sotiq',
          education: 'Ta\'lim',
          it: 'IT',
          construction: 'Qurilish',
          other: 'Boshqa',
        };

        const roleMap: Record<string, string> = {
          founder: 'Yakka ta\'sischiman',
          cofounder: 'Hamta\'sischiman',
          director: 'Ijrochi direktorman',
          other: 'Boshqa',
        };

        const interestsMap: Record<string, string> = {
          hiring: 'Xodim yollash xizmati',
          customerFlow: 'Mijozlar oqimini yaratish xizmati',
          salesSystem: 'Savdo bo\'limini tizimlashtirish xizmati',
        };

        const annualTurnoverMap: Record<string, string> = {
          range1: '$0 - $100,000',
          range2: '$100,000 - $500,000',
          range3: '$500,000 - $1,000,000',
          range4: '$1,000,000 - $5,000,000',
          range5: '$5,000,000 - $10,000,000',
          range6: '$10,000,000+',
        };

        const numberOfEmployeesMap: Record<string, string> = {
          range1: '0-15',
          range2: '15-30',
          range3: '30-70',
          range4: '70-100',
          range5: '100+',
        };

        let message = `📋 *Lead - ACCEPTED*\n\n`;
        message += `📍 Location: ${lead.location}\n`;
        if (lead.companyType) {
          message += `🏢 Company Type: ${companyTypeMap[lead.companyType as string] || lead.companyType}\n`;
        }
        if (lead.roleInCompany) {
          message += `👔 Role: ${roleMap[lead.roleInCompany as string] || lead.roleInCompany}\n`;
        }
        if (lead.interests && lead.interests.length > 0) {
          message += `🎯 Interests: ${lead.interests.map((i: string) => interestsMap[i] || i).join(', ')}\n`;
        }
        if (lead.companyDescription) {
          message += `📝 Description: ${lead.companyDescription}\n`;
        }
        if (lead.annualTurnover) {
          message += `💰 Annual Turnover: ${annualTurnoverMap[lead.annualTurnover as string] || lead.annualTurnover}\n`;
        }
        if (lead.numberOfEmployees) {
          message += `👥 Employees: ${numberOfEmployeesMap[lead.numberOfEmployees as string] || lead.numberOfEmployees}\n`;
        }
        message += `👤 Name: ${lead.fullName}\n`;
        message += `📞 Phone: ${lead.phoneNumber}\n`;
        if (lead.companyName) {
          message += `🏢 Company Name: ${lead.companyName}\n`;
        }
        if (lead.user.telegramId) {
          message += `📱 Telegram: @${lead.user.telegramUsername || lead.user.telegramId}\n`;
        }
        message += `✅ Accepted by: @${ctx.from.username || userId}`;

        await bot.api.editMessageText(
          lead.telegramChatId,
          parseInt(lead.telegramMessageId),
          message,
          { parse_mode: 'Markdown' }
        );
      }

      // Notify user
      await notifyUserAboutDecision(bot, leadId, LeadStatus.ACCEPTED);

      // Schedule channel reminder if user hasn't joined
      const userWithChannel = await prisma.user.findUnique({
        where: { id: lead.userId },
      });
      if (!(userWithChannel as any)?.channelJoined) {
        await scheduleInitialReminder(lead.userId);
      }
    } catch (error) {
      console.error('Error accepting lead:', error);
      await ctx.reply('Error accepting lead. Please try again.');
    }
  } else if (data.startsWith('reject_')) {
    const leadId = data.replace('reject_', '');
    
    // Get user's locale from lead
    let locale: 'uz' | 'en' | 'ru' = 'uz';
    try {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: { user: true },
      });
      if (lead) {
        locale = await getUserLocale(lead.userId);
      }
    } catch {
      // Use default
    }
    
    // Show predefined rejection reasons
    const keyboard = {
      inline_keyboard: [
        [
          { text: t(locale, 'callback.incompleteInfo'), callback_data: `reject_reason_${leadId}_incomplete` },
        ],
        [
          { text: t(locale, 'callback.notQualified'), callback_data: `reject_reason_${leadId}_not_qualified` },
        ],
        [
          { text: t(locale, 'callback.duplicate'), callback_data: `reject_reason_${leadId}_duplicate` },
        ],
        [
          { text: t(locale, 'callback.other'), callback_data: `reject_reason_${leadId}_other` },
        ],
      ],
    };

    await ctx.reply(t(locale, 'callback.rejectReason'), {
      reply_markup: keyboard,
    });
  } else if (data.startsWith('reject_reason_')) {
    // Handle rejection reason selection
    // Format: reject_reason_{leadId}_{reasonCode}
    // Since leadId is a UUID (no underscores), we can safely split on the last underscore
    const parts = data.replace('reject_reason_', '').split('_');
    const reasonCode = parts[parts.length - 1]; // Last part is always the reason code
    const leadId = parts.slice(0, -1).join('_'); // Everything before last underscore is leadId
    
    const reasonMap: Record<string, string> = {
      incomplete: 'Incomplete information',
      not_qualified: 'Not qualified',
      duplicate: 'Duplicate application',
    };

    try {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: { user: true },
      });

      if (!lead) {
        await ctx.reply(t('uz', 'callback.leadNotFound'));
        return;
      }

      // Get user's locale
      const locale = await getUserLocale(lead.userId);

      if (reasonCode === 'other') {
        // Store rejection state and ask for custom reason
        setRejectionState(userId, leadId);
        await ctx.reply(t(locale, 'callback.pleaseProvideReason'), {
          reply_markup: {
            force_reply: true,
          },
        });
      } else {
        // Use predefined reason (translated)
        const rejectionReason = t(locale, `callback.${reasonCode === 'incomplete' ? 'incompleteInfo' : reasonCode === 'not_qualified' ? 'notQualified' : reasonCode === 'duplicate' ? 'duplicate' : 'other'}`) || 'Not specified';
        
        // Update lead status and get updated lead
        const updatedLead = await updateLeadStatus(
          leadId,
          LeadStatus.REJECTED,
          undefined,
          userId,
          rejectionReason
        );

        // Update group message
        if (updatedLead.telegramChatId && updatedLead.telegramMessageId) {
          const rejectionMessage = formatRejectionMessageForGroup(
            updatedLead,
            rejectionReason,
            ctx.from.username || userId
          );

          try {
            await bot.api.editMessageText(
              updatedLead.telegramChatId,
              parseInt(updatedLead.telegramMessageId),
              rejectionMessage,
              { parse_mode: 'Markdown' }
            );
          } catch (error) {
            console.error('Error updating group message with rejection:', error);
          }
        }

        // Notify user
        await notifyUserAboutDecision(bot, leadId, LeadStatus.REJECTED);

        // Schedule channel reminder if user hasn't joined
        const userWithChannel = await prisma.user.findUnique({
          where: { id: updatedLead.userId },
        });
        if (!(userWithChannel as any)?.channelJoined) {
          await scheduleInitialReminder(updatedLead.userId);
        }

        await ctx.reply(t(locale, 'callback.rejectedSuccess'));
      }
    } catch (error) {
      console.error('Error processing rejection:', error);
      // Try to get locale
      let locale: 'uz' | 'en' | 'ru' = 'uz';
      try {
        const parts = data.replace('reject_reason_', '').split('_');
        const leadId = parts.slice(0, -1).join('_');
        const lead = await prisma.lead.findUnique({
          where: { id: leadId },
          include: { user: true },
        });
        if (lead) {
          locale = await getUserLocale(lead.userId);
        }
      } catch {
        // Use default
      }
      await ctx.reply(t(locale, 'callback.errorProcessing'));
    }
  }
}

