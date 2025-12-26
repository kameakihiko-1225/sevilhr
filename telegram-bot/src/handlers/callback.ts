import { Context, Bot } from 'grammy';
import { LeadStatus } from '@prisma/client';
import { updateLeadStatus } from '../services/leadService';
import { notifyUserAboutDecision } from '../services/notificationService';
import { prisma } from '../utils/prisma';

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
          message += `💰 Annual Turnover: ${lead.annualTurnover}\n`;
        }
        if (lead.numberOfEmployees) {
          message += `👥 Employees: ${lead.numberOfEmployees}\n`;
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
    } catch (error) {
      console.error('Error accepting lead:', error);
      await ctx.reply('Error accepting lead. Please try again.');
    }
  } else if (data.startsWith('reject_')) {
    const leadId = data.replace('reject_', '');
    
    // Ask for rejection reason
    await ctx.reply('Please provide a reason for rejection:', {
      reply_markup: {
        force_reply: true,
      },
    });

    // Store the leadId in context for the next message
    // In a production app, you'd use a state management system
    // For now, we'll ask them to reply with the reason
    // This is a simplified version - you may want to implement a proper state machine
  }
}

