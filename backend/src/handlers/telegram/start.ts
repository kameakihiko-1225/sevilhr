import { Context } from 'grammy';
import { LeadStatus } from '@prisma/client';
import { findOrCreateUser, getUserLeads } from '../../services/bot/userService';
import { scheduleInitialReminder } from '../../services/bot/channelReminderService';
import { prisma } from '../../utils/prisma';
import { t, getUserLocale } from '../../utils/translations';
import { bot } from '../../services/botService';
import { retrievePendingSubmission } from '../../utils/pendingSubmissions';
import { normalizePhoneNumber } from '../../utils/phoneNormalizer';

const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '';

export async function handleStart(ctx: Context) {
  try {
    const telegramId = ctx.from?.id?.toString();
    const telegramUsername = ctx.from?.username || null;
    const firstName = ctx.from?.first_name || null;
    const lastName = ctx.from?.last_name || null;

    if (!telegramId) {
      await ctx.reply('Error: Telegram ID not found.');
      return;
    }

    // Extract start parameter if present
    const startParam = ctx.message?.text?.split(' ')[1] || ctx.update.message?.text?.split(' ')[1];
    
    let leadUser = null;
    
    // Check if start parameter is a session ID (new flow)
    if (startParam && startParam.startsWith('session_')) {
      const sessionId = startParam;
      console.log(`[handleStart] Detected session ID: ${sessionId}`);
      
      try {
        // Retrieve pending form data
        const formData = retrievePendingSubmission(sessionId);
        
        if (!formData) {
          console.error(`[handleStart] Pending form data not found or expired for session ${sessionId}`);
          const locale = await getUserLocale((await findOrCreateUser(ctx)).id);
          await ctx.reply(t(locale, 'start.error') + '\n\nForm data not found or expired. Please submit the form again.');
          return;
        }
        
        console.log(`[handleStart] Retrieved form data for session ${sessionId}`);
        
        // Extract Telegram info from context
        const telegramId = ctx.from?.id?.toString();
        const telegramUsername = ctx.from?.username || null;
        const firstName = ctx.from?.first_name || null;
        const lastName = ctx.from?.last_name || null;
        
        console.log(`[handleStart] Telegram info: id=${telegramId}, username=${telegramUsername || 'none'}`);
        
        // Create lead with Telegram info - createLead will handle user creation/merging
        const { createLead } = await import('../../services/leadService');
        const leadResult = await createLead({
          ...formData,
          telegramId: telegramId,
          telegramUsername: telegramUsername,
          firstName: firstName,
          lastName: lastName,
        });
        
        console.log(`[handleStart] ✅ Created lead ${leadResult.id} with status ${leadResult.status}`);
        
        // Get the user that was created/updated by createLead
        // Query by both phone and Telegram ID to find the correct user
        const normalizedPhone = normalizePhoneNumber(formData.phoneNumber);
        
        const finalUser = await prisma.user.findFirst({
          where: {
            OR: [
              { phoneNumber: normalizedPhone },
              ...(telegramId ? [{ telegramId: telegramId }] : []),
            ],
          },
        });
        
        if (!finalUser) {
          console.error(`[handleStart] Failed to find user after lead creation. Phone: ${normalizedPhone}, TelegramId: ${telegramId || 'none'}`);
          throw new Error('Failed to find user after lead creation');
        }
        
        leadUser = finalUser;
        
        console.log(`[handleStart] ✅ Final user: ${leadUser.id}, phone: ${leadUser.phoneNumber}, telegramId: ${leadUser.telegramId || 'none'}`);
        
        // Lead is already sent to group with Telegram info via createLead
        // No need to update message as it's sent with Telegram info from the start
        
        const locale = await getUserLocale(leadUser.id);
        await ctx.reply(t(locale, 'start.welcome'));
        
        // Continue with channel join flow
        if (CHANNEL_ID) {
          const channelUsername = CHANNEL_ID.replace('@', '');
          await ctx.reply(t(locale, 'start.channelJoin'), {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: t(locale, 'start.joinChannel'), url: `https://t.me/${channelUsername}` },
                  { text: t(locale, 'start.iveJoined'), callback_data: `channel_joined_${leadUser.id}` },
                ],
              ],
            },
          });
          
          // Schedule initial channel reminder if user hasn't joined
          const fullUser = await prisma.user.findUnique({
            where: { id: leadUser.id },
          });
          if (!(fullUser as any)?.channelJoined) {
            await scheduleInitialReminder(leadUser.id);
          }
        }
        
        // Show application status
        const leads = await getUserLeads(leadUser.id);
        if (leads.length > 0) {
          const latestLead = leads[0];
          let statusMessage = `${t(locale, 'start.applicationStatus')}: ${latestLead.status}`;

          if (latestLead.status === LeadStatus.ACCEPTED) {
            statusMessage += `\n${t(locale, 'start.accepted')}`;
          } else if (latestLead.status === LeadStatus.REJECTED) {
            statusMessage += `\n${t(locale, 'start.rejected')}`;
            if (latestLead.rejectionReason) {
              statusMessage += `\n${t(locale, 'start.reason')}: ${latestLead.rejectionReason}`;
            }
          } else {
            statusMessage += `\n${t(locale, 'start.pending')}`;
          }

          await ctx.reply(statusMessage);
        }
        
        return; // Exit early, don't process as regular lead ID
      } catch (error) {
        console.error(`[handleStart] Error processing session ${sessionId}:`, error);
        const locale = await getUserLocale((await findOrCreateUser(ctx)).id);
        await ctx.reply(t(locale, 'start.error') + '\n\nError processing form submission. Please try again.');
        return;
      }
    }
    
    // Legacy flow: If start parameter contains a lead ID, update the lead's user with telegram data
    if (startParam) {
      try {
        const lead = await prisma.lead.findUnique({
          where: { id: startParam },
          include: { user: true },
        });

        if (lead) {
          // Check if there's already a user with this Telegram ID
          const existingTelegramUser = await prisma.user.findUnique({
            where: { telegramId: telegramId },
          });

          if (existingTelegramUser && existingTelegramUser.id !== lead.userId) {
            // Different user with this Telegram ID - merge accounts
            console.log(`[handleStart] Telegram ID ${telegramId} already linked to user ${existingTelegramUser.id}, but lead ${startParam} belongs to user ${lead.userId}. Merging accounts.`);
            
            try {
              const { mergeUserAccounts } = await import('../../services/userMergeService');
              
              // Determine which user to keep (prefer the one with the lead)
              const targetUserId = lead.userId;
              const sourceUserId = existingTelegramUser.id;
              
              console.log(`[handleStart] Merging: keeping user ${targetUserId} (has lead), removing user ${sourceUserId}`);
              
              const mergedUser = await mergeUserAccounts(sourceUserId, targetUserId);
              
              // Get the merged user
              leadUser = await prisma.user.findUnique({
                where: { id: mergedUser.id },
              });
              
              if (!leadUser) {
                throw new Error(`Failed to find merged user ${mergedUser.id}`);
              }
              
              console.log(`[handleStart] ✅ Successfully merged accounts. Final user: ${leadUser.id}, telegramId: ${leadUser.telegramId || 'none'}`);
            } catch (mergeError) {
              console.error(`[handleStart] ❌ Error merging accounts:`, mergeError);
              // Fallback: use lead's user
              leadUser = lead.user;
            }
          } else {
            // Safe to update: either no existing user with this Telegram ID, or it's the same user
            try {
              leadUser = await prisma.user.update({
                where: { id: lead.userId },
                data: {
                  telegramId: telegramId,
                  telegramUsername: telegramUsername,
                  firstName: firstName,
                  lastName: lastName,
                },
              });
              console.log(`[handleStart] ✅ Updated user ${leadUser.id} with Telegram ID ${telegramId}`);
            } catch (error: any) {
              // Handle unique constraint violation gracefully
              if (error?.code === 'P2002') {
                console.warn(`[handleStart] Failed to update user ${lead.userId} with Telegram ID ${telegramId}: unique constraint violation`);
                // Try to find the user that has this Telegram ID and merge
                const conflictingUser = await prisma.user.findUnique({
                  where: { telegramId: telegramId },
                });
                
                if (conflictingUser && conflictingUser.id !== lead.userId) {
                  console.log(`[handleStart] Attempting to merge conflicting users: ${conflictingUser.id} and ${lead.userId}`);
                  try {
                    const { mergeUserAccounts } = await import('../../services/userMergeService');
                    const mergedUser = await mergeUserAccounts(conflictingUser.id, lead.userId);
                    leadUser = await prisma.user.findUnique({
                      where: { id: mergedUser.id },
                    });
                    
                    if (!leadUser) {
                      throw new Error(`Failed to find merged user ${mergedUser.id}`);
                    }
                    
                    console.log(`[handleStart] ✅ Merged conflicting users successfully. Final user: ${leadUser.id}, telegramId: ${leadUser.telegramId || 'none'}`);
                  } catch (mergeError) {
                    console.error(`[handleStart] ❌ Error merging conflicting users:`, mergeError);
                    leadUser = lead.user; // Use the lead's user as-is
                  }
                } else {
                  leadUser = lead.user; // Use the lead's user as-is
                }
              } else {
                throw error; // Re-throw other errors
              }
            }
          }

          // Update lead status to FULL if it was PARTIAL
          if (lead.status === LeadStatus.PARTIAL) {
            await prisma.lead.update({
              where: { id: startParam },
              data: { status: LeadStatus.FULL },
            });
          }

          // Refetch the lead with updated user to ensure we have the latest data
          // This is important because the user was just updated with Telegram info
          // Add a small delay to ensure database transaction is committed
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const updatedLead = await prisma.lead.findUnique({
            where: { id: startParam },
            include: { user: true },
          });

          if (!updatedLead) {
            console.warn(`[handleStart] Lead ${startParam} not found after refetch`);
          } else {
            // Log user update status
            console.log(`[handleStart] Refetched lead ${updatedLead.id}`);
            console.log(`[handleStart] Lead user ID: ${updatedLead.userId}`);
            console.log(`[handleStart] User from database - Telegram ID: ${updatedLead.user.telegramId || 'NOT SET'}, Username: ${updatedLead.user.telegramUsername || 'NOT SET'}`);
            
            if (leadUser && leadUser.telegramId) {
              console.log(`[handleStart] leadUser object - Telegram ID: ${leadUser.telegramId}, Username: ${leadUser.telegramUsername || 'N/A'}`);
            }

            // Verify user has Telegram info before attempting to update message
            if (!updatedLead.user.telegramId) {
              console.warn(`[handleStart] User ${updatedLead.userId} does not have telegramId after update. User update may have failed.`);
              console.warn(`[handleStart] Attempting to verify user update...`);
              
              // Try to refetch user directly to verify
              const verifyUser = await prisma.user.findUnique({
                where: { id: updatedLead.userId },
                select: { id: true, telegramId: true, telegramUsername: true },
              });
              
              if (verifyUser) {
                console.log(`[handleStart] Verified user - Telegram ID: ${verifyUser.telegramId || 'NOT SET'}, Username: ${verifyUser.telegramUsername || 'NOT SET'}`);
                
                if (verifyUser.telegramId) {
                  // User has Telegram ID, refetch lead again
                  const reFetchedLead = await prisma.lead.findUnique({
                    where: { id: startParam },
                    include: { user: true },
                  });
                  
                  if (reFetchedLead && reFetchedLead.user.telegramId) {
                    console.log(`[handleStart] After re-fetch, user has Telegram ID: ${reFetchedLead.user.telegramId}`);
                    // Update message with re-fetched lead
                    if (reFetchedLead.telegramChatId && reFetchedLead.telegramMessageId && bot) {
                      try {
                        const { updateLeadMessageWithTelegram } = await import('../../services/bot/leadService');
                        console.log(`[handleStart] Attempting to update lead message ${reFetchedLead.telegramMessageId} with Telegram contact info for lead ${reFetchedLead.id}`);
                        await updateLeadMessageWithTelegram(bot, reFetchedLead.id);
                        console.log(`[handleStart] ✅ Successfully updated lead message with Telegram contact info for lead ${reFetchedLead.id}`);
                      } catch (error) {
                        console.error(`[handleStart] ❌ Error updating lead message with Telegram info for lead ${reFetchedLead.id}:`, error);
                        if (error instanceof Error) {
                          console.error('[handleStart] Error details:', error.message, error.stack);
                        }
                      }
                    }
                  }
                }
              }
            } else {
              // User has Telegram ID, proceed with message update
              // Update the Telegram group message with Telegram contact info if message exists
              if (updatedLead.telegramChatId && updatedLead.telegramMessageId && bot) {
                try {
                  const { updateLeadMessageWithTelegram } = await import('../../services/bot/leadService');
                  console.log(`[handleStart] Attempting to update lead message ${updatedLead.telegramMessageId} with Telegram contact info for lead ${updatedLead.id}`);
                  console.log(`[handleStart] User Telegram ID: ${updatedLead.user.telegramId}, Username: ${updatedLead.user.telegramUsername || 'N/A'}`);
                  await updateLeadMessageWithTelegram(bot, updatedLead.id);
                  console.log(`[handleStart] ✅ Successfully updated lead message with Telegram contact info for lead ${updatedLead.id}`);
                } catch (error) {
                  console.error(`[handleStart] ❌ Error updating lead message with Telegram info for lead ${updatedLead.id}:`, error);
                  if (error instanceof Error) {
                    console.error('[handleStart] Error details:', error.message, error.stack);
                  }
                  // Don't fail the flow if message update fails
                }
              } else {
                if (!updatedLead.telegramChatId || !updatedLead.telegramMessageId) {
                  console.warn(`[handleStart] Cannot update lead message: lead ${updatedLead.id} missing telegramChatId (${updatedLead.telegramChatId || 'missing'}) or telegramMessageId (${updatedLead.telegramMessageId || 'missing'})`);
                }
                if (!bot) {
                  console.warn('[handleStart] Cannot update lead message: bot is not initialized');
                }
              }
            }

            console.log(`Lead ${startParam} updated with Telegram data for user ${updatedLead.userId}`);
          }
        } else {
          console.warn(`Lead ${startParam} not found`);
        }
      } catch (error) {
        console.error('Error updating lead with telegram data:', error);
      }
    }

    // Find or create user by Telegram ID (for showing their leads)
    // Use the updated user if we just updated one, otherwise find/create
    const user = leadUser || await findOrCreateUser(ctx);

    // Get user's locale
    const locale = await getUserLocale(user.id);

    // Welcome message
    await ctx.reply(t(locale, 'start.welcome'));

    // Suggest joining channel
    if (CHANNEL_ID) {
      const channelUsername = CHANNEL_ID.replace('@', '');
      await ctx.reply(t(locale, 'start.channelJoin'), {
        reply_markup: {
          inline_keyboard: [
            [
              { text: t(locale, 'start.joinChannel'), url: `https://t.me/${channelUsername}` },
              { text: t(locale, 'start.iveJoined'), callback_data: `channel_joined_${user.id}` },
            ],
          ],
        },
      });

      // Schedule initial channel reminder if user hasn't joined
      // Get full user data to check channelJoined
      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      if (!(fullUser as any)?.channelJoined) {
        await scheduleInitialReminder(user.id);
      }
    }

    // Show application status if user has leads
    const leads = await getUserLeads(user.id);
    if (leads.length > 0) {
      const latestLead = leads[0];
      let statusMessage = `${t(locale, 'start.applicationStatus')}: ${latestLead.status}`;

      if (latestLead.status === LeadStatus.ACCEPTED) {
        statusMessage += `\n${t(locale, 'start.accepted')}`;
      } else if (latestLead.status === LeadStatus.REJECTED) {
        statusMessage += `\n${t(locale, 'start.rejected')}`;
        if (latestLead.rejectionReason) {
          statusMessage += `\n${t(locale, 'start.reason')}: ${latestLead.rejectionReason}`;
        }
      } else {
        statusMessage += `\n${t(locale, 'start.pending')}`;
      }

      await ctx.reply(statusMessage);
    }
  } catch (error) {
    console.error('Error in start handler:', error);
    // Try to get locale from user if available
    let locale: 'uz' | 'en' | 'ru' = 'uz';
    try {
      const telegramId = ctx.from?.id?.toString();
      if (telegramId) {
        // Find user by telegramId to get userId, then get locale
        const user = await prisma.user.findUnique({
          where: { telegramId },
          select: { id: true },
        });
        if (user) {
          locale = await getUserLocale(user.id);
        }
      }
    } catch {
      // Use default locale
    }
    await ctx.reply(t(locale, 'start.error'));
  }
}

