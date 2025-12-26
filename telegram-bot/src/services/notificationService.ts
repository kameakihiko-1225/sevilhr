import { Bot } from 'grammy';
import { LeadStatus } from '@prisma/client';
import { prisma } from '../utils/prisma';

export async function notifyUserAboutDecision(
  bot: Bot,
  leadId: string,
  status: LeadStatus
) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { user: true },
  });

  if (!lead || !lead.user.telegramId) {
    return;
  }

  let message = '';
  if (status === LeadStatus.ACCEPTED) {
    message = '✅ Your application has been accepted! We will contact you soon.';
  } else if (status === LeadStatus.REJECTED) {
    const reason = lead.rejectionReason ? `\n\nReason: ${lead.rejectionReason}` : '';
    message = `❌ Your application has been rejected.${reason}`;
  }

  if (message) {
    try {
      await bot.api.sendMessage(lead.user.telegramId, message);
    } catch (error) {
      console.error('Error notifying user:', error);
    }
  }
}

