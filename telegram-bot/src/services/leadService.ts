import { LeadStatus } from '@prisma/client';
import { Bot } from 'grammy';
import { prisma } from '../utils/prisma';

const GROUP_ID = process.env.TELEGRAM_GROUP_ID || '';

export async function sendLeadToGroup(
  bot: Bot,
  leadId: string
) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { user: true },
  });

  if (!lead || lead.status !== LeadStatus.FULL) {
    return;
  }

  const telegramContact = lead.user.telegramId 
    ? `\n📱 Telegram: @${lead.user.telegramUsername || lead.user.telegramId}`
    : '';

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

  let message = `📋 *New Lead*\n\n`;
  message += `📍 Location: ${lead.location}\n`;
  if (lead.companyType) {
    message += `🏢 Company Type: ${companyTypeMap[lead.companyType] || lead.companyType}\n`;
  }
  if (lead.roleInCompany) {
    message += `👔 Role: ${roleMap[lead.roleInCompany] || lead.roleInCompany}\n`;
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
  message += `📞 Phone: ${lead.phoneNumber}${telegramContact}\n`;
  if (lead.companyName) {
    message += `🏢 Company Name: ${lead.companyName}\n`;
  }
  message += `📊 Status: ${lead.status}`;

  // Send message with inline keyboard
  const inlineKeyboard: any[] = [
    [
      { text: '✅ Accept', callback_data: `accept_${lead.id}` },
      { text: '❌ Reject', callback_data: `reject_${lead.id}` },
    ],
  ];

  // Add Telegram contact button if user has telegram
  if (lead.user.telegramId) {
    inlineKeyboard.push([
      { 
        text: `💬 Contact on Telegram`, 
        url: `https://t.me/${lead.user.telegramUsername || lead.user.telegramId}` 
      },
    ]);
  }

  const keyboard = {
    inline_keyboard: inlineKeyboard,
  };

  try {
    const sentMessage = await bot.api.sendMessage(GROUP_ID, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });

    // Update lead with message ID
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        telegramMessageId: sentMessage.message_id.toString(),
        telegramChatId: GROUP_ID,
      },
    });
  } catch (error) {
    console.error('Error sending lead to group:', error);
  }
}

export async function updateLeadStatus(
  leadId: string,
  status: LeadStatus,
  acceptedBy?: string,
  rejectedBy?: string,
  rejectionReason?: string
) {
  const updateData: any = { status };

  if (acceptedBy) {
    updateData.acceptedBy = acceptedBy;
  }

  if (rejectedBy) {
    updateData.rejectedBy = rejectedBy;
    if (rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }
  }

  return await prisma.lead.update({
    where: { id: leadId },
    data: updateData,
    include: { user: true },
  });
}

