import { normalizePhoneNumber } from '../utils/phoneNormalizer';
import { prisma } from '../utils/prisma';

export interface DuplicateCheckResult {
  existingUser: { id: string; phoneNumber: string; telegramId?: string | null } | null;
  isReturning: boolean;
  // Account merging information
  needsMerge?: boolean;
  userByPhone?: { id: string; phoneNumber: string; telegramId?: string | null } | null;
  userByTelegram?: { id: string; phoneNumber: string; telegramId?: string | null } | null;
}

/**
 * Check for duplicate users by phone number (priority 1) and telegram ID (priority 2)
 * Also detects when accounts need to be merged (different users for phone and Telegram ID)
 */
export async function checkDuplicateUser(
  phoneNumber: string,
  telegramId?: string
): Promise<DuplicateCheckResult> {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);

  // Check by phone number
  const existingByPhone = await prisma.user.findUnique({
    where: { phoneNumber: normalizedPhone },
    select: { id: true, phoneNumber: true, telegramId: true },
  });

  // Check by Telegram ID (if available)
  let existingByTelegram = null;
  if (telegramId) {
    existingByTelegram = await prisma.user.findUnique({
      where: { telegramId },
      select: { id: true, phoneNumber: true, telegramId: true },
    });
  }

  // Case 1: Same user found by both phone and Telegram ID
  if (existingByPhone && existingByTelegram && existingByPhone.id === existingByTelegram.id) {
    const previousLeads = await prisma.lead.findMany({
      where: { userId: existingByPhone.id },
    });

    return {
      existingUser: existingByPhone,
      isReturning: previousLeads.length > 0,
      needsMerge: false,
      userByPhone: existingByPhone,
      userByTelegram: existingByTelegram,
    };
  }

  // Case 2: Different users found by phone and Telegram ID - needs merging
  if (existingByPhone && existingByTelegram && existingByPhone.id !== existingByTelegram.id) {
    // Check if returning user (check both users)
    const leadsByPhone = await prisma.lead.findMany({
      where: { userId: existingByPhone.id },
    });
    const leadsByTelegram = await prisma.lead.findMany({
      where: { userId: existingByTelegram.id },
    });
    const isReturning = leadsByPhone.length > 0 || leadsByTelegram.length > 0;

    // Prefer the user with more leads, or phone-based user if equal
    const preferredUser = leadsByPhone.length >= leadsByTelegram.length ? existingByPhone : existingByTelegram;

    return {
      existingUser: preferredUser,
      isReturning,
      needsMerge: true,
      userByPhone: existingByPhone,
      userByTelegram: existingByTelegram,
    };
  }

  // Case 3: User found by phone number only
  if (existingByPhone) {
    const previousLeads = await prisma.lead.findMany({
      where: { userId: existingByPhone.id },
    });

    return {
      existingUser: existingByPhone,
      isReturning: previousLeads.length > 0,
      needsMerge: false,
      userByPhone: existingByPhone,
      userByTelegram: null,
    };
  }

  // Case 4: User found by Telegram ID only
  if (existingByTelegram) {
    const previousLeads = await prisma.lead.findMany({
      where: { userId: existingByTelegram.id },
    });

    return {
      existingUser: existingByTelegram,
      isReturning: previousLeads.length > 0,
      needsMerge: false,
      userByPhone: null,
      userByTelegram: existingByTelegram,
    };
  }

  // Case 5: No existing user found
  return {
    existingUser: null,
    isReturning: false,
    needsMerge: false,
    userByPhone: null,
    userByTelegram: null,
  };
}

