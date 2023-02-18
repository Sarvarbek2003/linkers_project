import { PrismaClient } from '@prisma/client';
import { selectService, changeSteep, checkUser } from '../utils.js';

const prisma = new PrismaClient();

export default async (bot, msg) => {
  try {
    const text = msg?.text || msg?.data;
    const user = await checkUser(msg);
    const chat_id = msg.from.id;
    const steep = user.steep;
    const st = steep[steep?.length - 1];
    const msgId = msg?.message?.message_id;
    
    if (st == 'home') {
      await changeSteep(user, 'admin');
      bot.sendMessage(
        chat_id,
        " Admin Bo'limiga hush kelibsiz!\nKerakli bo'limni tanlang!",
        {
          reply_markup: {
            resize_keyboard: true,
            keyboard: [
              [
                { text: 'Xizmatlar ⚙️' },
                { text: 'Ustalar 👨🏻‍🔧' },
                { text: 'Mijozlar 👥' },
              ],
            ],
          },
        },
      );
    } else if (st == 'admin') {
      checkButton(bot,user, text);
    } else if (st == 'admin_services') {
      await changeSteep(user, 'edit-service');
      bot.editMessageText('Xizmatlar >', {
        chat_id,
        message_id: msgId,
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Delete ❌', callback_data: 'service-delete='+text }],
            [{ text: 'Edit ✏️', callback_data: 'service-edit'+text}],
          ],
        },
      });
    } else if (st == 'admin_masters') {
      bot.editMessageText('Xizmatlar', {
        chat_id,
        message_id: msgId,
        reply_markup: {
          inline_keyboard: [
            { text: 'Ism 👤', callback_data: 'master-by-name' },
            { text: 'Telefon ☎️', callback_data: 'master-by-phone' },
          ],
        },
      });
    } else if (st == 'admin_customers') {
      bot.editMessageText('Xizmatlar', {
        chat_id,
        message_id: msgId,
        reply_markup: {
          inline_keyboard: [
            { text: 'Ism 👤', callback_data: 'costomer-by-name' },
            { text: 'Telefon ☎️', callback_data: 'costomer-by-phone' },
          ],
        },
      });
    } else if (text.split('=')[0] == 'service-delete' && st == 'edit-service'){
        await prisma.services.delete({where:{id: +text.split('=')[1]}})
        await changeSteep(user, ['home', 'admin'], true)
        bot.deleteMessage(chat_id, msgId)
        bot.sendMessage(chat_id, "Muvoffaqyatli o`chirildi ✅",{
          reply_markup: {
            resize_keyboard: true,
            keyboard: [
              [
                { text: 'Xizmatlar ⚙️' },
                { text: 'Ustalar 👨🏻‍🔧' },
                { text: 'Mijozlar 👥' },
              ],
            ],
          },
        },)
    }
  } catch (e) {
    console.log(e);
  }
};

async function checkButton(bot, user, text) {
  if (text == 'Xizmatlar ⚙️') {
    await changeSteep(user, 'admin_services');

    const keyboard = await selectService();
    console.log(keyboard);
    bot.sendMessage(parseInt(user.user_id), 'Xizmatlar', {
      reply_markup: { inline_keyboard: keyboard },
    });
  } else if (text == 'Ustalar 👨🏻‍🔧') {
    await changeSteep(user, 'admin_masters');

    const keyboard = await selectService();

    bot.sendMessage(user.user_id, 'Xizmatlar', {
      reply_markup: { inline_keyboard: keyboard },
    });
  } else if (text == 'Mijozlar 👥') {
    await changeSteep(user, 'admin_customers');

    const keyboard = await selectService();

    bot.sendMessage(user.user_id, 'Xizmatlar', {
      reply_markup: { inline_keyboard: keyboard },
    });
  }
}
