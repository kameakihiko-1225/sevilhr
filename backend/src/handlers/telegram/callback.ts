import { Context, Bot } from 'grammy';
import { LeadStatus } from '@prisma/client';
import { updateLeadStatus, formatRejectionMessageForGroup } from '../../services/bot/leadService';
import { notifyUserAboutDecision } from '../../services/bot/notificationService';
import { scheduleInitialReminder } from '../../services/bot/channelReminderService';
import { setRejectionState } from '../../utils/rejectionState';
import { prisma } from '../../utils/prisma';
import { t, getUserLocale } from '../../utils/translations';

// Escape Markdown V2 special characters
function escapeMarkdown(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/_/g, '\\_')
    .replace(/\*/g, '\\*')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/~/g, '\\~')
    .replace(/`/g, '\\`')
    .replace(/>/g, '\\>')
    .replace(/#/g, '\\#')
    .replace(/\+/g, '\\+')
    .replace(/-/g, '\\-')
    .replace(/=/g, '\\=')
    .replace(/\|/g, '\\|')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\./g, '\\.')
    .replace(/!/g, '\\!');
}

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
        message += `📍 Location: ${escapeMarkdown(lead.location)}\n`;
        if (lead.companyType) {
          const companyTypeText = companyTypeMap[lead.companyType as string] || lead.companyType;
          message += `🏢 Company Type: ${escapeMarkdown(companyTypeText)}\n`;
        }
        if (lead.roleInCompany) {
          const roleText = roleMap[lead.roleInCompany as string] || lead.roleInCompany;
          message += `👔 Role: ${escapeMarkdown(roleText)}\n`;
        }
        if (lead.interests && lead.interests.length > 0) {
          const interestsText = lead.interests.map((i: string) => interestsMap[i] || i).join(', ');
          message += `🎯 Interests: ${escapeMarkdown(interestsText)}\n`;
        }
        if (lead.companyDescription) {
          message += `📝 Description: ${escapeMarkdown(lead.companyDescription)}\n`;
        }
        if (lead.annualTurnover) {
          const turnoverText = annualTurnoverMap[lead.annualTurnover as string] || lead.annualTurnover;
          message += `💰 Annual Turnover: ${escapeMarkdown(turnoverText)}\n`;
        }
        if (lead.numberOfEmployees) {
          const employeesText = numberOfEmployeesMap[lead.numberOfEmployees as string] || lead.numberOfEmployees;
          message += `👥 Employees: ${escapeMarkdown(employeesText)}\n`;
        }
        message += `👤 Name: ${escapeMarkdown(lead.fullName)}\n`;
        message += `📞 Phone: ${escapeMarkdown(lead.phoneNumber)}\n`;
        if (lead.companyName) {
          message += `🏢 Company Name: ${escapeMarkdown(lead.companyName)}\n`;
        }
        if (lead.user.telegramId) {
          const telegramDisplay = lead.user.telegramUsername || lead.user.telegramId;
          message += `📱 Telegram: @${escapeMarkdown(telegramDisplay)}\n`;
        }
        message += `✅ Accepted by: @${escapeMarkdown(ctx.from.username || userId)}`;

        await bot.api.editMessageText(
          lead.telegramChatId,
          parseInt(lead.telegramMessageId),
          message,
          { parse_mode: 'MarkdownV2' }
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
    // Use | as delimiter to avoid issues with UUID format
    const keyboard = {
      inline_keyboard: [
        [
          { text: t(locale, 'callback.incompleteInfo'), callback_data: `reject_reason_${leadId}|incomplete` },
        ],
        [
          { text: t(locale, 'callback.notQualified'), callback_data: `reject_reason_${leadId}|not_qualified` },
        ],
        [
          { text: t(locale, 'callback.duplicate'), callback_data: `reject_reason_${leadId}|duplicate` },
        ],
        [
          { text: t(locale, 'callback.other'), callback_data: `reject_reason_${leadId}|other` },
        ],
      ],
    };

    await ctx.reply(t(locale, 'callback.rejectReason'), {
      reply_markup: keyboard,
    });
  } else if (data.startsWith('reject_reason_')) {
    // Handle rejection reason selection
    // Format: reject_reason_{leadId}|{reasonCode}
    // Use | as delimiter to avoid issues with UUID format
    const parts = data.replace('reject_reason_', '').split('|');
    if (parts.length !== 2) {
      console.error(`[handleCallback] Invalid reject_reason format: ${data}`);
      await ctx.reply('Error: Invalid rejection reason format.');
      return;
    }
    const leadId = parts[0];
    const reasonCode = parts[1];
    
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
        // Store rejection state (including rejectedBy) and ask for custom reason
        setRejectionState(userId, leadId, userId);
        await ctx.reply(t(locale, 'callback.pleaseProvideReason'), {
          reply_markup: {
            force_reply: true,
          },
        });
      } else {
        // Use predefined reason (translated)
        const rejectionReason = t(locale, `callback.${reasonCode === 'incomplete' ? 'incompleteInfo' : reasonCode === 'not_qualified' ? 'notQualified' : reasonCode === 'duplicate' ? 'duplicate' : 'other'}`) || 'Not specified';
        
        // Update lead status
        await updateLeadStatus(
          leadId,
          LeadStatus.REJECTED,
          undefined,
          userId,
          rejectionReason
        );

        // Refetch the lead to get updated data
        const refetchedLead = await prisma.lead.findUnique({
          where: { id: leadId },
          include: { user: true },
        });

        if (!refetchedLead) {
          await ctx.reply(t(locale, 'callback.leadNotFound'));
          return;
        }

        // Update group message
        if (refetchedLead.telegramChatId && refetchedLead.telegramMessageId) {
          const rejectionMessage = formatRejectionMessageForGroup(
            refetchedLead,
            rejectionReason,
            ctx.from.username || userId
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

        // Notify user
        await notifyUserAboutDecision(bot, leadId, LeadStatus.REJECTED);

        // Schedule channel reminder if user hasn't joined
        const userWithChannel = await prisma.user.findUnique({
          where: { id: refetchedLead.userId },
        });
        if (!(userWithChannel as any)?.channelJoined) {
          await scheduleInitialReminder(refetchedLead.userId);
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

