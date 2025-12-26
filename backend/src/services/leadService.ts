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
  let status: LeadStatus;
  if (data.status === 'DID_NOT_CLICK_SUBMIT_BUTTON') {
    status = LeadStatus.DID_NOT_CLICK_SUBMIT_BUTTON;
  } else if (data.status === 'FULL_WITHOUT_TELEGRAM') {
    status = LeadStatus.FULL_WITHOUT_TELEGRAM;
  } else if (duplicateCheck.isReturning) {
    // If returning user, keep RETURNING status even if they submit FULL
    status = LeadStatus.RETURNING;
  } else {
    status = data.status === 'FULL' ? LeadStatus.FULL : LeadStatus.PARTIAL;
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

  // If FULL, FULL_WITHOUT_TELEGRAM, RETURNING, or DID_NOT_CLICK_SUBMIT_BUTTON status, send to Telegram bot
  let telegramBotUrl: string | undefined;
  if (status === LeadStatus.FULL || status === LeadStatus.FULL_WITHOUT_TELEGRAM || status === LeadStatus.RETURNING || status === LeadStatus.DID_NOT_CLICK_SUBMIT_BUTTON) {
    console.log(`[createLead] Lead ${lead.id} has status ${status}, preparing to send to Telegram group`);
    
    // Only generate bot URL for FULL and RETURNING (not for FULL_WITHOUT_TELEGRAM or DID_NOT_CLICK_SUBMIT_BUTTON)
    if (status === LeadStatus.FULL || status === LeadStatus.RETURNING) {
      const botUrl = process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL || process.env.TELEGRAM_BOT_URL;
      if (botUrl) {
        // Append lead ID to the bot URL so we can track it when user clicks /start
        telegramBotUrl = `${botUrl}?start=${lead.id}`;
        console.log(`[createLead] Generated Telegram bot URL: ${telegramBotUrl}`);
      } else {
        console.warn(`[createLead] TELEGRAM_BOT_URL not set, cannot generate bot URL for lead ${lead.id}`);
      }
    }
    
    // Send lead to Telegram group via bot
    if (bot) {
      console.log(`[createLead] Bot is initialized, attempting to send lead ${lead.id} to group`);
      try {
        await sendLeadToGroup(bot, lead.id);
        console.log(`[createLead] ✅ Successfully sent lead ${lead.id} to Telegram group`);
      } catch (error) {
        console.error(`[createLead] ❌ Error sending lead ${lead.id} to Telegram group:`, error);
        if (error instanceof Error) {
          console.error(`[createLead] Error details: ${error.message}`);
        }
        // Don't fail the lead creation if bot fails
      }
    } else {
      console.error(`[createLead] ❌ Bot is not initialized, cannot send lead ${lead.id} to Telegram group`);
      console.error(`[createLead] Make sure TELEGRAM_BOT_TOKEN is set and bot service is properly initialized`);
    }
  } else {
    console.log(`[createLead] Lead ${lead.id} has status ${status}, skipping Telegram group send (only FULL, FULL_WITHOUT_TELEGRAM, RETURNING, and DID_NOT_CLICK_SUBMIT_BUTTON leads are sent)`);
  }

  return {
    id: lead.id,
    status: lead.status,
    telegramBotUrl,
  };
}

