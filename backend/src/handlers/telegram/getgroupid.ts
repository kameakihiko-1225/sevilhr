import { Context } from 'grammy';

export async function handleGetGroupId(ctx: Context) {
  try {
    const chatId = ctx.chat?.id;
    const chatType = ctx.chat?.type;
    
    if (!chatId) {
      await ctx.reply('❌ Could not retrieve chat ID. Please use this command in a group or channel.');
      return;
    }

    let message = `📋 *Chat Information*\n\n`;
    message += `Chat ID: \`${chatId}\`\n`;
    message += `Chat Type: ${chatType || 'unknown'}\n`;
    
    if (ctx.chat?.title) {
      message += `Chat Title: ${ctx.chat.title}\n`;
    }
    
    if (ctx.chat?.username) {
      message += `Username: @${ctx.chat.username}\n`;
    }

    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error in getgroupid handler:', error);
    await ctx.reply('❌ An error occurred while retrieving the chat ID.');
  }
}

