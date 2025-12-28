import { LeadStatus } from '@prisma/client';
import { Bot } from 'grammy';
import { prisma } from '../../utils/prisma';

const GROUP_ID = process.env.TELEGRAM_GROUP_ID || '';

/**
 * Escape Markdown special characters to prevent parsing errors
 */
function escapeMarkdown(text: string): string {
  if (!text) return '';
  // Escape Markdown special characters: _ * [ ] ( ) ~ ` > # + - = | { } . !
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

export async function sendLeadToGroup(
  bot: Bot,
  leadId: string
) {
  console.log(`[sendLeadToGroup] Starting to send lead ${leadId} to group`);
  
  // Validate GROUP_ID is set
  if (!GROUP_ID || GROUP_ID.trim() === '') {
    console.error('[sendLeadToGroup] ❌ TELEGRAM_GROUP_ID environment variable is not set or is empty');
    console.error('[sendLeadToGroup] Cannot send lead to group without GROUP_ID');
    return;
  }
  
  console.log(`[sendLeadToGroup] GROUP_ID is set: ${GROUP_ID}`);

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { user: true },
  });

  if (!lead) {
    console.warn(`[sendLeadToGroup] Lead ${leadId} not found in database`);
    return;
  }

  console.log(`[sendLeadToGroup] Lead found: ${lead.id}, Status: ${lead.status}`);

  // Send FULL, FULL_WITHOUT_TELEGRAM, RETURNING, and DID_NOT_CLICK_SUBMIT_BUTTON leads to the group
  if (lead.status !== LeadStatus.FULL && lead.status !== LeadStatus.FULL_WITHOUT_TELEGRAM && lead.status !== LeadStatus.RETURNING && lead.status !== LeadStatus.DID_NOT_CLICK_SUBMIT_BUTTON) {
    console.log(`[sendLeadToGroup] Lead ${leadId} has status ${lead.status}, skipping (only FULL, FULL_WITHOUT_TELEGRAM, RETURNING, and DID_NOT_CLICK_SUBMIT_BUTTON leads are sent)`);
    return;
  }
  
  console.log(`[sendLeadToGroup] Lead status is ${lead.status}, proceeding to send full data to group`);

  // Create clickable Telegram contact link for initial message
  const telegramContact = (() => {
    if (lead.user.telegramId) {
      // Use contact link (opens message interface) when telegramId is available
      const telegramUserId = lead.user.telegramId;
      // Normalize username: remove @ if present, then add @ for display
      const normalizedUsername = lead.user.telegramUsername?.replace(/^@/, '') || '';
      const displayName = normalizedUsername
        ? `@${normalizedUsername.replace(/[_\*\[\]\(\)~`>#\+\-=\|\{\}\.\\!]/g, '\\$&')}` 
        : `User ${escapeMarkdown(telegramUserId)}`;
      // Use tg://user?id= format for clickable user links in Telegram Markdown
      return `\n📱 Telegram: [${displayName}](tg://user?id=${telegramUserId})`;
    } else if (lead.user.telegramUsername) {
      // Use profile link (opens profile page) when only username is available
      const username = lead.user.telegramUsername.replace(/^@/, ''); // Remove @ if present for URL
      const displayName = `@${username.replace(/[_\*\[\]\(\)~`>#\+\-=\|\{\}\.\\!]/g, '\\$&')}`;
      return `\n📱 Telegram: [${displayName}](https://t.me/${username})`;
    }
    return '';
  })();

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
    : lead.status === LeadStatus.FULL_WITHOUT_TELEGRAM
    ? `📋 *New Lead \\- Without Telegram*`
    : lead.status === LeadStatus.DID_NOT_CLICK_SUBMIT_BUTTON
    ? `📋 *Lead \\- Did Not Click Submit Button*`
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
  if (lead.user.telegramId || lead.user.telegramUsername) {
    const usernameOrId = lead.user.telegramId 
      ? (lead.user.telegramUsername?.replace(/^@/, '') || lead.user.telegramId)
      : (lead.user.telegramUsername?.replace(/^@/, '') || '');
    inlineKeyboard.push([
      { 
        text: `💬 Contact on Telegram`, 
        url: `https://t.me/${usernameOrId}` 
      },
    ]);
  }

  const keyboard = {
    inline_keyboard: inlineKeyboard,
  };

  console.log(`[sendLeadToGroup] Preparing to send message to group ${GROUP_ID}`);
  console.log(`[sendLeadToGroup] Message length: ${message.length} characters`);
  console.log(`[sendLeadToGroup] Message preview: ${message.substring(0, 100)}...`);

  try {
    const sentMessage = await bot.api.sendMessage(GROUP_ID, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });

    console.log(`[sendLeadToGroup] ✅ Successfully sent lead message to group. Message ID: ${sentMessage.message_id}`);

    // Update lead with message ID
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        telegramMessageId: sentMessage.message_id.toString(),
        telegramChatId: GROUP_ID,
      },
    });
    
    console.log(`[sendLeadToGroup] ✅ Updated lead ${lead.id} with telegramMessageId: ${sentMessage.message_id}, telegramChatId: ${GROUP_ID}`);
  } catch (error) {
    console.error(`[sendLeadToGroup] ❌ Error sending lead ${leadId} to group ${GROUP_ID}:`, error);
    
    if (error instanceof Error) {
      console.error(`[sendLeadToGroup] Error type: ${error.constructor.name}`);
      console.error(`[sendLeadToGroup] Error message: ${error.message}`);
      
      // Provide specific error messages for common Telegram API errors
      if (error.message.includes('chat not found')) {
        console.error(`[sendLeadToGroup] The group/chat ${GROUP_ID} may not exist or the bot is not a member of the group`);
        console.error(`[sendLeadToGroup] Make sure the bot is added to the group and has permission to send messages`);
      } else if (error.message.includes('bot was blocked')) {
        console.error(`[sendLeadToGroup] The bot was blocked by the group or user`);
      } else if (error.message.includes('not enough rights')) {
        console.error(`[sendLeadToGroup] The bot does not have enough rights to send messages to the group`);
      } else if (error.message.includes('parse_mode')) {
        console.error(`[sendLeadToGroup] Markdown parsing error - check message format`);
      } else {
        console.error(`[sendLeadToGroup] Unknown Telegram API error`);
      }
      
      if (error.stack) {
        console.error(`[sendLeadToGroup] Stack trace:`, error.stack);
      }
    } else {
      console.error(`[sendLeadToGroup] Unknown error type:`, error);
    }
    
    // Re-throw to allow caller to handle if needed, but don't fail lead creation
    throw error;
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

  let message = `📋 *Lead \\- REJECTED*\n\n`;
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
    message += `📱 Telegram: @${escapeMarkdown(lead.user.telegramUsername || lead.user.telegramId)}\n`;
  }
  message += `❌ Rejected by: @${escapeMarkdown(rejectedBy)}\n`;
  message += `📝 Reason: ${escapeMarkdown(rejectionReason)}`;

  return message;
}

/**
 * Update lead message in Telegram group with Telegram contact information
 */
export async function updateLeadMessageWithTelegram(
  bot: Bot,
  leadId: string
) {
  console.log(`[updateLeadMessageWithTelegram] Starting update for lead ${leadId}`);
  
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { user: true },
  });

  if (!lead) {
    console.warn(`[updateLeadMessageWithTelegram] Lead ${leadId} not found in database`);
    return;
  }

  console.log(`[updateLeadMessageWithTelegram] Lead found: ${lead.id}, Status: ${lead.status}`);
  console.log(`[updateLeadMessageWithTelegram] User ID: ${lead.userId}, User Telegram ID: ${lead.user.telegramId || 'NOT SET'}, Username: ${lead.user.telegramUsername || 'NOT SET'}`);

  // Validate required data
  if (!lead.telegramChatId || !lead.telegramMessageId) {
    console.warn(`[updateLeadMessageWithTelegram] Lead ${leadId} missing required message identifiers:`);
    console.warn(`  - telegramChatId: ${lead.telegramChatId || 'MISSING'}`);
    console.warn(`  - telegramMessageId: ${lead.telegramMessageId || 'MISSING'}`);
    console.warn(`[updateLeadMessageWithTelegram] Cannot update message without these identifiers. Lead may not have been sent to group yet.`);
    return;
  }

  // Create clickable Telegram contact link
  // Use tg://user?id=USER_ID format when telegramId is available, or https://t.me/username when only username exists
  let telegramContact = '';
  if (lead.user.telegramId) {
    // Use contact link (opens message interface) when telegramId is available
    const telegramUserId = lead.user.telegramId;
    // Normalize username: remove @ if present, then add @ for display
    const normalizedUsername = lead.user.telegramUsername?.replace(/^@/, '') || '';
    const displayName = normalizedUsername
      ? `@${normalizedUsername.replace(/[_\*\[\]\(\)~`>#\+\-=\|\{\}\.\\!]/g, '\\$&')}` 
      : `User ${escapeMarkdown(telegramUserId)}`;
    // Use tg://user?id= format for clickable user links in Telegram Markdown
    telegramContact = `\n📱 Telegram: [${displayName}](tg://user?id=${telegramUserId})`;
  } else if (lead.user.telegramUsername) {
    // Use profile link (opens profile page) when only username is available
    const username = lead.user.telegramUsername.replace(/^@/, ''); // Remove @ if present for URL
    const displayName = `@${username.replace(/[_\*\[\]\(\)~`>#\+\-=\|\{\}\.\\!]/g, '\\$&')}`;
    telegramContact = `\n📱 Telegram: [${displayName}](https://t.me/${username})`;
  } else {
    console.warn(`[updateLeadMessageWithTelegram] Lead ${leadId} user (${lead.userId}) does not have telegramId or telegramUsername`);
    // Don't return early - still update the message without Telegram contact info
  }
  
  console.log(`[updateLeadMessageWithTelegram] Will add Telegram contact: ${telegramContact.trim()}`);
  console.log(`[updateLeadMessageWithTelegram] Telegram User ID: ${lead.user.telegramId || 'N/A'}, Username: ${lead.user.telegramUsername || 'N/A'}`);

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
    ? `📋 *Lead \\- ACCEPTED*`
    : lead.status === LeadStatus.REJECTED
    ? `📋 *Lead \\- REJECTED*`
    : lead.status === LeadStatus.FULL_WITHOUT_TELEGRAM
    ? `📋 *New Lead \\- Without Telegram*`
    : lead.status === LeadStatus.DID_NOT_CLICK_SUBMIT_BUTTON
    ? `📋 *Lead \\- Did Not Click Submit Button*`
    : `📋 *New Lead*`;

  let message = `${messagePrefix}\n\n`;
  message += `📍 Location: ${escapeMarkdown(lead.location)}\n`;
  if (lead.companyType) {
    const companyTypeText = companyTypeMap[lead.companyType] || lead.companyType;
    message += `🏢 Company Type: ${escapeMarkdown(companyTypeText)}\n`;
  }
  if (lead.roleInCompany) {
    const roleText = roleMap[lead.roleInCompany] || lead.roleInCompany;
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
    const turnoverText = annualTurnoverMap[lead.annualTurnover] || lead.annualTurnover;
    message += `💰 Annual Turnover: ${escapeMarkdown(turnoverText)}\n`;
  }
  if (lead.numberOfEmployees) {
    const employeesText = numberOfEmployeesMap[lead.numberOfEmployees] || lead.numberOfEmployees;
    message += `👥 Employees: ${escapeMarkdown(employeesText)}\n`;
  }
  message += `👤 Name: ${escapeMarkdown(lead.fullName)}\n`;
  message += `📞 Phone: ${escapeMarkdown(lead.phoneNumber)}${telegramContact}\n`;
  if (lead.companyName) {
    message += `🏢 Company Name: ${escapeMarkdown(lead.companyName)}\n`;
  }
  message += `📊 Status: ${escapeMarkdown(lead.status)}`;

  // Add rejection/acceptance info if applicable
  if (lead.status === LeadStatus.REJECTED && lead.rejectedBy && lead.rejectionReason) {
    message += `\n❌ Rejected by: @${escapeMarkdown(lead.rejectedBy)}\n`;
    message += `📝 Reason: ${escapeMarkdown(lead.rejectionReason)}`;
  } else if (lead.status === LeadStatus.ACCEPTED && lead.acceptedBy) {
    message += `\n✅ Accepted by: @${escapeMarkdown(lead.acceptedBy)}`;
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
  if (lead.user.telegramId || lead.user.telegramUsername) {
    const usernameOrId = lead.user.telegramId 
      ? (lead.user.telegramUsername?.replace(/^@/, '') || lead.user.telegramId)
      : (lead.user.telegramUsername?.replace(/^@/, '') || '');
    inlineKeyboard.push([
      { 
        text: `💬 Contact on Telegram`, 
        url: `https://t.me/${usernameOrId}` 
      },
    ]);
  }

  const keyboard = {
    inline_keyboard: inlineKeyboard,
  };

  console.log(`[updateLeadMessageWithTelegram] Preparing to update message in chat ${lead.telegramChatId}, message ID ${lead.telegramMessageId}`);
  console.log(`[updateLeadMessageWithTelegram] Message length: ${message.length} characters`);
  console.log(`[updateLeadMessageWithTelegram] Keyboard buttons: ${inlineKeyboard.length} rows`);

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
    console.log(`[updateLeadMessageWithTelegram] ✅ Successfully updated lead message ${lead.telegramMessageId} with Telegram contact info for lead ${leadId}`);
    console.log(`[updateLeadMessageWithTelegram] Message now includes Telegram contact: @${lead.user.telegramUsername || lead.user.telegramId}`);
  } catch (error) {
    console.error(`[updateLeadMessageWithTelegram] ❌ Error updating lead message with Telegram info for lead ${leadId}`);
    
    if (error instanceof Error) {
      console.error(`[updateLeadMessageWithTelegram] Error type: ${error.constructor.name}`);
      console.error(`[updateLeadMessageWithTelegram] Error message: ${error.message}`);
      
      // Provide specific error messages for common Telegram API errors
      if (error.message.includes('message to edit not found')) {
        console.error(`[updateLeadMessageWithTelegram] The message may have been deleted or the message ID is incorrect`);
      } else if (error.message.includes('chat not found')) {
        console.error(`[updateLeadMessageWithTelegram] The chat/group may not exist or the bot is not a member`);
      } else if (error.message.includes('message is not modified')) {
        console.warn(`[updateLeadMessageWithTelegram] Message content is the same - this is not a critical error`);
      } else if (error.message.includes('parse_mode')) {
        console.error(`[updateLeadMessageWithTelegram] Markdown parsing error - check message format`);
      } else {
        console.error(`[updateLeadMessageWithTelegram] Unknown Telegram API error`);
      }
      
      if (error.stack) {
        console.error(`[updateLeadMessageWithTelegram] Stack trace:`, error.stack);
      }
    } else {
      console.error(`[updateLeadMessageWithTelegram] Unknown error type:`, error);
    }
    // Error is logged but not re-thrown to avoid breaking the flow
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

