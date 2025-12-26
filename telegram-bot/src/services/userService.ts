import { Context } from 'grammy';
import { prisma } from '../utils/prisma';

export async function findOrCreateUser(
  ctx: Context
): Promise<{ id: string; telegramId: string | null }> {
  const telegramId = ctx.from?.id.toString();
  const telegramUsername = ctx.from?.username || null;

  if (!telegramId) {
    throw new Error('Telegram ID not found');
  }

  // Check if user exists by Telegram ID
  const existingUser = await prisma.user.findUnique({
    where: { telegramId },
    select: { id: true, telegramId: true },
  });

  if (existingUser) {
    // Update username if changed
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { telegramUsername },
    });

    return existingUser;
  }

  // Create new user (phone number will be linked later when they submit form)
  const newUser = await prisma.user.create({
    data: {
      telegramId,
      telegramUsername,
      phoneNumber: `temp_${telegramId}`, // Temporary, will be updated when form is submitted
    },
  });

  return { id: newUser.id, telegramId: newUser.telegramId };
}

export async function getUserLeads(userId: string) {
  return await prisma.lead.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

