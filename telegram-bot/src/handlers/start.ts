import { Context } from 'grammy';
import { LeadStatus } from '@prisma/client';
import { findOrCreateUser, getUserLeads } from '../services/userService';
import { prisma } from '../utils/prisma';

const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '';

export async function handleStart(ctx: Context) {
  try {
    // Extract lead ID from start parameter if present
    const startParam = ctx.message?.text?.split(' ')[1] || ctx.update.message?.text?.split(' ')[1];
    
    // Find or create user
    const user = await findOrCreateUser(ctx);

    // If start parameter contains a lead ID, update the lead with telegram data
    if (startParam) {
      try {
        const lead = await prisma.lead.findUnique({
          where: { id: startParam },
          include: { user: true },
        });

        if (lead && lead.userId === user.id) {
          // Update user with telegram data if not already set
          await prisma.user.update({
            where: { id: user.id },
            data: {
              telegramId: ctx.from?.id?.toString() || null,
              telegramUsername: ctx.from?.username || null,
              firstName: ctx.from?.first_name || null,
              lastName: ctx.from?.last_name || null,
            },
          });

          // Update lead status to FULL if it was PARTIAL
          if (lead.status === 'PARTIAL') {
            await prisma.lead.update({
              where: { id: startParam },
              data: { status: LeadStatus.FULL },
            });
          }
        }
      } catch (error) {
        console.error('Error updating lead with telegram data:', error);
      }
    }

    // Welcome message
    await ctx.reply('👋 Welcome! Your application has been received.');

    // Suggest joining channel
    if (CHANNEL_ID) {
      await ctx.reply('Join our channel for updates:', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📢 Join Channel', url: `https://t.me/${CHANNEL_ID.replace('@', '')}` }],
          ],
        },
      });
    }

    // Show application status if user has leads
    const leads = await getUserLeads(user.id);
    if (leads.length > 0) {
      const latestLead = leads[0];
      let statusMessage = `📊 Your Application Status: ${latestLead.status}`;

      if (latestLead.status === LeadStatus.ACCEPTED) {
        statusMessage += '\n✅ Accepted!';
      } else if (latestLead.status === LeadStatus.REJECTED) {
        statusMessage += '\n❌ Rejected';
        if (latestLead.rejectionReason) {
          statusMessage += `\nReason: ${latestLead.rejectionReason}`;
        }
      } else {
        statusMessage += '\n⏳ Pending review';
      }

      await ctx.reply(statusMessage);
    }
  } catch (error) {
    console.error('Error in start handler:', error);
    await ctx.reply('An error occurred. Please try again later.');
  }
}

