import { LeadStatus } from '@prisma/client';
import { Bot } from 'grammy';
import { prisma } from '../../utils/prisma';

const GROUP_ID = process.env.TELEGRAM_GROUP_ID || '';

export async function sendLeadToGroup(
  bot: Bot,
  leadId: string
) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { user: true },
  });

  // Send FULL and RETURNING leads to the group
  if (!lead || (lead.status !== LeadStatus.FULL && lead.status !== LeadStatus.RETURNING)) {
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

  // Determine message prefix based on status
  const messagePrefix = lead.status === LeadStatus.RETURNING 
    ? `📋 *Returning Lead*` 
    : `📋 *New Lead*`;
  
  let message = `${messagePrefix}\n\n`;
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
    message += `💰 Annual Turnover: ${annualTurnoverMap[lead.annualTurnover] || lead.annualTurnover}\n`;
  }
  if (lead.numberOfEmployees) {
    message += `👥 Employees: ${numberOfEmployeesMap[lead.numberOfEmployees] || lead.numberOfEmployees}\n`;
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

/**
 * Format rejection message for group
 */
export function formatRejectionMessageForGroup(
  lead: any,
  rejectionReason: string,
  rejectedBy: string
): string {
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

  let message = `📋 *Lead - REJECTED*\n\n`;
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
  message += `❌ Rejected by: @${rejectedBy}\n`;
  message += `📝 Reason: ${rejectionReason}`;

  return message;
}

/**
 * Update lead message in Telegram group with Telegram contact information
 */
export async function updateLeadMessageWithTelegram(
  bot: Bot,
  leadId: string
) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { user: true },
  });

  if (!lead) {
    console.warn('updateLeadMessageWithTelegram: Lead not found');
    return;
  }

  if (!lead.telegramChatId || !lead.telegramMessageId) {
    console.warn(`updateLeadMessageWithTelegram: Lead ${leadId} missing telegramChatId or telegramMessageId`);
    return;
  }

  if (!lead.user.telegramId) {
    console.warn(`updateLeadMessageWithTelegram: Lead ${leadId} user does not have telegramId yet`);
    return;
  }

  const telegramContact = `\n📱 Telegram: @${lead.user.telegramUsername || lead.user.telegramId}`;

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

  // Determine message prefix based on status
  const messagePrefix = lead.status === LeadStatus.RETURNING 
    ? `📋 *Returning Lead*` 
    : lead.status === LeadStatus.ACCEPTED
    ? `📋 *Lead - ACCEPTED*`
    : lead.status === LeadStatus.REJECTED
    ? `📋 *Lead - REJECTED*`
    : `📋 *New Lead*`;

  let message = `${messagePrefix}\n\n`;
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
    message += `💰 Annual Turnover: ${annualTurnoverMap[lead.annualTurnover] || lead.annualTurnover}\n`;
  }
  if (lead.numberOfEmployees) {
    message += `👥 Employees: ${numberOfEmployeesMap[lead.numberOfEmployees] || lead.numberOfEmployees}\n`;
  }
  message += `👤 Name: ${lead.fullName}\n`;
  message += `📞 Phone: ${lead.phoneNumber}${telegramContact}\n`;
  if (lead.companyName) {
    message += `🏢 Company Name: ${lead.companyName}\n`;
  }
  message += `📊 Status: ${lead.status}`;

  // Add rejection/acceptance info if applicable
  if (lead.status === LeadStatus.REJECTED && lead.rejectedBy && lead.rejectionReason) {
    message += `\n❌ Rejected by: @${lead.rejectedBy}\n`;
    message += `📝 Reason: ${lead.rejectionReason}`;
  } else if (lead.status === LeadStatus.ACCEPTED && lead.acceptedBy) {
    message += `\n✅ Accepted by: @${lead.acceptedBy}`;
  }

  // Prepare keyboard - only show Accept/Reject if not already accepted/rejected
  const inlineKeyboard: any[] = [];
  if (lead.status !== LeadStatus.ACCEPTED && lead.status !== LeadStatus.REJECTED) {
    inlineKeyboard.push([
      { text: '✅ Accept', callback_data: `accept_${lead.id}` },
      { text: '❌ Reject', callback_data: `reject_${lead.id}` },
    ]);
  }

  // Always add Telegram contact button when Telegram info is available
  // This enables sales managers to directly chat with the user
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
    await bot.api.editMessageText(
      lead.telegramChatId,
      parseInt(lead.telegramMessageId),
      message,
      {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      }
    );
    console.log(`Successfully updated lead message ${lead.telegramMessageId} with Telegram contact info for lead ${leadId}`);
  } catch (error) {
    console.error(`Error updating lead message with Telegram info for lead ${leadId}:`, error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
    }
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

