import { normalizePhoneNumber } from '../utils/phoneNormalizer';
import { prisma } from '../utils/prisma';

export interface DuplicateCheckResult {
  existingUser: { id: string; phoneNumber: string; telegramId?: string | null } | null;
  isReturning: boolean;
}

/**
 * Check for duplicate users by phone number (priority 1) and telegram ID (priority 2)
 */
export async function checkDuplicateUser(
  phoneNumber: string,
  telegramId?: string
): Promise<DuplicateCheckResult> {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);

  // Priority 1: Check by phone number
  const existingByPhone = await prisma.user.findUnique({
    where: { phoneNumber: normalizedPhone },
    select: { id: true, phoneNumber: true, telegramId: true },
  });

  if (existingByPhone) {
    // Check if returning user (has previous leads)
    const previousLeads = await prisma.lead.findMany({
      where: { userId: existingByPhone.id },
    });

    return {
      existingUser: existingByPhone,
      isReturning: previousLeads.length > 0,
    };
  }

  // Priority 2: Check by Telegram ID (if available)
  if (telegramId) {
    const existingByTelegram = await prisma.user.findUnique({
      where: { telegramId },
      select: { id: true, phoneNumber: true, telegramId: true },
    });

    if (existingByTelegram) {
      // Check if returning user
      const previousLeads = await prisma.lead.findMany({
        where: { userId: existingByTelegram.id },
      });

      return {
        existingUser: existingByTelegram,
        isReturning: previousLeads.length > 0,
      };
    }
  }

  return {
    existingUser: null,
    isReturning: false,
  };
}

