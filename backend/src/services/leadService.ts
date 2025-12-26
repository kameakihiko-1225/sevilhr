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
 * Uses database transaction to ensure atomicity when merging accounts
 */
export async function createLead(data: CreateLeadDto): Promise<LeadResponse> {
  const normalizedPhone = normalizePhoneNumber(data.phoneNumber);

  console.log(`[createLead] Starting lead creation for phone: ${normalizedPhone}, telegramId: ${data.telegramId || 'none'}`);

  // Use transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Check for duplicates (by phone and Telegram ID)
    const duplicateCheck = await checkDuplicateUser(normalizedPhone, data.telegramId);

    console.log(`[createLead] Duplicate check result:`, {
      existingUser: duplicateCheck.existingUser?.id || null,
      needsMerge: duplicateCheck.needsMerge,
      isReturning: duplicateCheck.isReturning,
    });

    let user;

    // Handle account merging if needed
    if (duplicateCheck.needsMerge && duplicateCheck.userByPhone && duplicateCheck.userByTelegram) {
      console.log(`[createLead] Accounts need merging: phone user=${duplicateCheck.userByPhone.id}, telegram user=${duplicateCheck.userByTelegram.id}`);
      
      // Determine which user to keep (prefer the one with more leads, or phone-based if equal)
      const phoneUserLeads = await tx.lead.findMany({
        where: { userId: duplicateCheck.userByPhone.id },
      });
      const telegramUserLeads = await tx.lead.findMany({
        where: { userId: duplicateCheck.userByTelegram.id },
      });

      const targetUserId = phoneUserLeads.length >= telegramUserLeads.length 
        ? duplicateCheck.userByPhone.id 
        : duplicateCheck.userByTelegram.id;
      const sourceUserId = targetUserId === duplicateCheck.userByPhone.id 
        ? duplicateCheck.userByTelegram.id 
        : duplicateCheck.userByPhone.id;

      console.log(`[createLead] Merging accounts: keeping ${targetUserId}, removing ${sourceUserId}`);

      // Merge accounts (this will be done outside transaction, so we need to handle it carefully)
      // Actually, we should do the merge inside the transaction using tx
      await mergeUserAccountsInTransaction(tx, sourceUserId, targetUserId);
      
      // After merge, the target user is the one to use
      user = await tx.user.findUnique({
        where: { id: targetUserId },
      });

      if (!user) {
        throw new Error(`Failed to find merged user ${targetUserId}`);
      }

      console.log(`[createLead] ✅ Accounts merged successfully. Using user: ${user.id}`);
    } else if (duplicateCheck.existingUser) {
      // Update existing user
      const updateData: {
        phoneNumber: string;
        locale?: string;
        telegramId?: string | null;
        telegramUsername?: string | null;
        firstName?: string | null;
        lastName?: string | null;
      } = {
        phoneNumber: normalizedPhone,
      };

      if (data.locale) {
        updateData.locale = data.locale;
      }

      // Add Telegram info if provided and not already set
      if (data.telegramId && !duplicateCheck.existingUser.telegramId) {
        updateData.telegramId = data.telegramId;
        updateData.telegramUsername = data.telegramUsername || null;
        updateData.firstName = data.firstName || null;
        updateData.lastName = data.lastName || null;
        console.log(`[createLead] Adding Telegram ID ${data.telegramId} to existing user ${duplicateCheck.existingUser.id}`);
      } else if (data.telegramId && duplicateCheck.existingUser.telegramId !== data.telegramId) {
        // Update Telegram info if different
        updateData.telegramId = data.telegramId;
        updateData.telegramUsername = data.telegramUsername || null;
        updateData.firstName = data.firstName || null;
        updateData.lastName = data.lastName || null;
        console.log(`[createLead] Updating Telegram info for user ${duplicateCheck.existingUser.id}`);
      }

      user = await tx.user.update({
        where: { id: duplicateCheck.existingUser.id },
        data: updateData,
      });

      console.log(`[createLead] Updated existing user ${user.id}`);
    } else {
      // Create new user
      const userData: {
        phoneNumber: string;
        locale: string;
        telegramId?: string | null;
        telegramUsername?: string | null;
        firstName?: string | null;
        lastName?: string | null;
      } = {
        phoneNumber: normalizedPhone,
        locale: data.locale || 'uz',
      };

      // Add Telegram info if provided
      if (data.telegramId) {
        userData.telegramId = data.telegramId;
        userData.telegramUsername = data.telegramUsername || null;
        userData.firstName = data.firstName || null;
        userData.lastName = data.lastName || null;
        console.log(`[createLead] Creating new user with Telegram ID ${data.telegramId}`);
      }

      user = await tx.user.create({
        data: userData as any,
      });

      console.log(`[createLead] Created new user ${user.id}`);
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
    const lead = await tx.lead.create({
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

    console.log(`[createLead] Created lead ${lead.id} with status ${status} for user ${user.id}`);

    return { user, lead, status };
  });

  const { user, lead, status } = result;

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

/**
 * Helper function to merge user accounts within a transaction
 */
async function mergeUserAccountsInTransaction(
  tx: any,
  sourceUserId: string,
  targetUserId: string
): Promise<void> {
  console.log(`[mergeUserAccountsInTransaction] Merging within transaction: source=${sourceUserId}, target=${targetUserId}`);

  // Get both users
  const sourceUser = await tx.user.findUnique({
    where: { id: sourceUserId },
    select: {
      id: true,
      phoneNumber: true,
      telegramId: true,
      telegramUsername: true,
      firstName: true,
      lastName: true,
      locale: true,
      channelJoined: true,
    },
  });

  const targetUser = await tx.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      phoneNumber: true,
      telegramId: true,
      telegramUsername: true,
      firstName: true,
      lastName: true,
      locale: true,
      channelJoined: true,
    },
  });

  if (!sourceUser || !targetUser) {
    throw new Error(`Cannot merge: source user ${sourceUserId} or target user ${targetUserId} not found`);
  }

  // Prepare update data for target user
  const updateData: {
    phoneNumber?: string;
    telegramId?: string | null;
    telegramUsername?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    locale?: string;
    channelJoined?: boolean;
  } = {};

  // Phone number: prefer target, but use source if target has temp phone
  if (targetUser.phoneNumber.startsWith('temp_')) {
    updateData.phoneNumber = sourceUser.phoneNumber;
  } else {
    updateData.phoneNumber = targetUser.phoneNumber;
  }

  // Telegram ID: prefer target, but use source if target doesn't have it
  if (!targetUser.telegramId && sourceUser.telegramId) {
    updateData.telegramId = sourceUser.telegramId;
    updateData.telegramUsername = sourceUser.telegramUsername;
  } else {
    updateData.telegramId = targetUser.telegramId;
    updateData.telegramUsername = targetUser.telegramUsername || sourceUser.telegramUsername;
  }

  // First name and last name: prefer non-null values
  updateData.firstName = targetUser.firstName || sourceUser.firstName;
  updateData.lastName = targetUser.lastName || sourceUser.lastName;

  // Locale: prefer target
  updateData.locale = targetUser.locale || sourceUser.locale || 'uz';

  // Channel joined: true if either is true
  updateData.channelJoined = targetUser.channelJoined || sourceUser.channelJoined;

  // If we're moving telegramId from source to target, clear it from source first
  // to avoid unique constraint violation
  if (updateData.telegramId && updateData.telegramId === sourceUser.telegramId) {
    await tx.user.update({
      where: { id: sourceUserId },
      data: { telegramId: null, telegramUsername: null },
    });
    console.log(`[mergeUserAccountsInTransaction] Cleared telegramId from source user ${sourceUserId}`);
  }

  // Update target user with merged data
  await tx.user.update({
    where: { id: targetUserId },
    data: updateData,
  });

  // Move all leads from source to target
  const leadsMoved = await tx.lead.updateMany({
    where: { userId: sourceUserId },
    data: { userId: targetUserId },
  });
  console.log(`[mergeUserAccountsInTransaction] Moved ${leadsMoved.count} leads from source to target`);

  // Move channel reminder if exists
  const sourceReminder = await tx.channelJoinReminder.findUnique({
    where: { userId: sourceUserId },
  });

  if (sourceReminder) {
    const targetReminder = await tx.channelJoinReminder.findUnique({
      where: { userId: targetUserId },
    });

    if (targetReminder) {
      // Both have reminders, merge them (prefer target's data)
      await tx.channelJoinReminder.update({
        where: { userId: targetUserId },
        data: {
          reminderCount: Math.max(targetReminder.reminderCount, sourceReminder.reminderCount),
          hasJoinedChannel: targetReminder.hasJoinedChannel || sourceReminder.hasJoinedChannel,
          lastReminderSentAt: targetReminder.lastReminderSentAt || sourceReminder.lastReminderSentAt,
          nextReminderAt: targetReminder.nextReminderAt || sourceReminder.nextReminderAt,
          joinedAt: targetReminder.joinedAt || sourceReminder.joinedAt,
        },
      });
      // Delete source reminder
      await tx.channelJoinReminder.delete({
        where: { userId: sourceUserId },
      });
    } else {
      // Only source has reminder, move it to target
      await tx.channelJoinReminder.update({
        where: { userId: sourceUserId },
        data: { userId: targetUserId },
      });
    }
  }

  // Delete source user (cascade will handle related data)
  await tx.user.delete({
    where: { id: sourceUserId },
  });
  console.log(`[mergeUserAccountsInTransaction] Deleted source user ${sourceUserId}`);
}

