import { prisma } from '../utils/prisma';

/**
 * Merge two user accounts into one.
 * Moves all leads and related data from source user to target user.
 * 
 * @param sourceUserId - User ID to merge from (will be deleted)
 * @param targetUserId - User ID to merge into (will be kept)
 * @returns The merged user (target user with updated data)
 */
export async function mergeUserAccounts(
  sourceUserId: string,
  targetUserId: string
): Promise<{ id: string; phoneNumber: string; telegramId: string | null }> {
  console.log(`[mergeUserAccounts] Starting merge: source=${sourceUserId}, target=${targetUserId}`);

  // Get both users to check their data
  const sourceUser = await prisma.user.findUnique({
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

  const targetUser = await prisma.user.findUnique({
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

  if (sourceUserId === targetUserId) {
    console.log(`[mergeUserAccounts] Source and target are the same user, no merge needed`);
    return {
      id: targetUser.id,
      phoneNumber: targetUser.phoneNumber,
      telegramId: targetUser.telegramId,
    };
  }

  // Use transaction to ensure atomicity
  const mergedUser = await prisma.$transaction(async (tx) => {
    // Prepare update data for target user
    // Prefer target user's data, but fill in missing fields from source
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

    // Update target user with merged data
    const updatedTarget = await tx.user.update({
      where: { id: targetUserId },
      data: updateData,
    });

    // Move all leads from source to target
    const leadsMoved = await tx.lead.updateMany({
      where: { userId: sourceUserId },
      data: { userId: targetUserId },
    });
    console.log(`[mergeUserAccounts] Moved ${leadsMoved.count} leads from source to target`);

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
    console.log(`[mergeUserAccounts] Deleted source user ${sourceUserId}`);

    return updatedTarget;
  });

  console.log(`[mergeUserAccounts] ✅ Successfully merged accounts. Final user: ${mergedUser.id}, phone: ${mergedUser.phoneNumber}, telegramId: ${mergedUser.telegramId || 'null'}`);

  return {
    id: mergedUser.id,
    phoneNumber: mergedUser.phoneNumber,
    telegramId: mergedUser.telegramId,
  };
}

