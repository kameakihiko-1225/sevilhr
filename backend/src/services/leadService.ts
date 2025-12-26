import { LeadStatus } from '@prisma/client';
import { CreateLeadDto } from '../types';
import { checkDuplicateUser } from './duplicateService';
import { normalizePhoneNumber } from '../utils/phoneNormalizer';
import { prisma } from '../utils/prisma';
import { bot } from './botService';
import { sendLeadToGroup } from './bot/leadService';

interface LeadResponse {
  id: string;
  status: LeadStatus;
  telegramBotUrl?: string;
}

/**
 * Create or update a lead
 */
export async function createLead(data: CreateLeadDto): Promise<LeadResponse> {
  const normalizedPhone = normalizePhoneNumber(data.phoneNumber);

  // Check for duplicates
  const duplicateCheck = await checkDuplicateUser(normalizedPhone);

  let user;
  if (duplicateCheck.existingUser) {
    // Update existing user (update locale if provided)
    const updateData: { phoneNumber: string; locale?: string } = {
      phoneNumber: normalizedPhone,
    };
    if (data.locale) {
      updateData.locale = data.locale;
    }
    user = await prisma.user.update({
      where: { id: duplicateCheck.existingUser.id },
      data: updateData,
    });
  } else {
    // Create new user
    const userData: { phoneNumber: string; locale?: string } = {
      phoneNumber: normalizedPhone,
    };
    if (data.locale) {
      userData.locale = data.locale;
    } else {
      userData.locale = 'uz';
    }
    user = await prisma.user.create({
      data: userData as any, // Type assertion needed until Prisma Client is regenerated
    });
  }

  // Determine status
  let status: LeadStatus = data.status === 'FULL' ? LeadStatus.FULL : LeadStatus.PARTIAL;
  if (duplicateCheck.isReturning) {
    status = LeadStatus.RETURNING;
  }

  // Create lead
  const lead = await prisma.lead.create({
    data: {
      userId: user.id,
      location: data.location,
      companyType: data.companyType || null,
      roleInCompany: data.roleInCompany || null,
      interests: data.interests || [],
      companyDescription: data.companyDescription || null,
      annualTurnover: data.annualTurnover || null,
      numberOfEmployees: data.numberOfEmployees || null,
      fullName: data.fullName,
      phoneNumber: normalizedPhone,
      companyName: data.companyName || null,
      status,
    },
  });

  // If FULL or RETURNING status, send to Telegram bot
  let telegramBotUrl: string | undefined;
  if (status === LeadStatus.FULL || status === LeadStatus.RETURNING) {
    const botUrl = process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL || process.env.TELEGRAM_BOT_URL;
    if (botUrl) {
      // Append lead ID to the bot URL so we can track it when user clicks /start
      telegramBotUrl = `${botUrl}?start=${lead.id}`;
    }
    
    // Send lead to Telegram group via bot
    if (bot) {
      try {
        await sendLeadToGroup(bot, lead.id);
      } catch (error) {
        console.error('Error sending lead to Telegram group:', error);
        // Don't fail the lead creation if bot fails
      }
    }
  }

  return {
    id: lead.id,
    status: lead.status,
    telegramBotUrl,
  };
}

