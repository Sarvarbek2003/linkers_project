import { PrismaClient } from '@prisma/client';
import { adminMenuKeyboard } from '../keyboards/keyboards.js';
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
          reply_markup: adminMenuKeyboard,
        },
      );
    } else if (text == 'Xizmatlar ⚙️') {
      await changeSteep(user, 'admin_services');

      const keyboard = await selectService();

      keyboard.unshift([
        {
          text: "✳️ Yangi xizmat qo'shish ✳️",
          callback_data: 'add-new-service',
        },
      ]);

      bot.sendMessage(chat_id, 'Xizmatlar', {
        reply_markup: {
          inline_keyboard: keyboard,
        },
      });
    } else if (text == 'Ustalar 👨🏻‍🔧') {
      await changeSteep(user, 'admin_masters');

      servicePagination(bot, user, 'Ustalar');
    } else if (text == 'Mijozlar 👥') {
      await changeSteep(user, 'admin_customers');

      servicePagination(bot, user, 'Mijozlar');
    } else if (st == 'admin_services' && text == 'add-new-service') {
      await changeSteep(user, 'new-service');

      bot.sendMessage(chat_id, 'Yangi xizmat nomini kiriting 👇');
    } else if (st == 'new-service') {
      await prisma.services.create({ data: { service_name: text } });

      await changeSteep(user, ['home', 'admin'], true);
      bot.sendMessage(chat_id, "Muvoffaqyatli qo'shildi ✅", {
        reply_markup: adminMenuKeyboard,
      });
    } else if (st == 'admin_services') {
      await changeSteep(user, 'edit-service');
      bot.editMessageText('Xizmatlar >', {
        chat_id,
        message_id: msgId,
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Tahrirlash ✏️', callback_data: 'service-edit=' + text }],
            [{ text: "O'chirish ❌", callback_data: 'service-delete=' + text }],
          ],
        },
      });
    } else if (st == 'admin_masters') {
      bot.editMessageText('Xizmatlar', {
        chat_id,
        message_id: msgId,
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Ism 👤', callback_data: 'master-by-name' }],
            [{ text: 'Telefon ☎️', callback_data: 'master-by-phone' }],
          ],
        },
      });
    } else if (st == 'admin_customers') {
      bot.editMessageText('Xizmatlar', {
        chat_id,
        message_id: msgId,
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Ism 👤', callback_data: 'costomer-by-name' }],
            [{ text: 'Telefon ☎️', callback_data: 'costomer-by-phone' }],
          ],
        },
      });
    } else if (text.split('=')[0] == 'service-delete' && st == 'edit-service') {
      await prisma.services.delete({ where: { id: +text.split('=')[1] } });
      await changeSteep(user, ['home', 'admin'], true);
      bot.deleteMessage(chat_id, msgId);
      bot.sendMessage(chat_id, 'Muvoffaqyatli o`chirildi ✅', {
        reply_markup: adminMenuKeyboard,
      });
    } else if (text.split('=')[0] == 'service-edit' && st == 'edit-service') {
      await changeSteep(user, 'edit-service-text=' + text.split('=')[1]);
      bot.sendMessage(chat_id, 'Yangi xizmat nomini kiriting 👇');
    } else if (st.split('=')[0] == 'edit-service-text') {
      await prisma.services.update({
        where: { id: +st.split('=')[1] },
        data: { service_name: text },
      });

      await changeSteep(user, ['home', 'admin'], true);
      bot.sendMessage(chat_id, "Muvoffaqyatli o'zgartirildi ✅", {
        reply_markup: adminMenuKeyboard,
      });
    }
  } catch (e) {
    console.log(e);
  }
};

async function servicePagination(bot, user, text) {
  const keyboard = await selectService();

  bot.sendMessage(parseInt(user.user_id), text, {
    reply_markup: {
      inline_keyboard: keyboard,
    },
  });
}
