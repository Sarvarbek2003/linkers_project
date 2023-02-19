import { PrismaClient } from '@prisma/client';
import { adminMenuKeyboard } from '../keyboards/keyboards.js';
import { selectService, changeSteep, checkUser } from '../utils.js';

const prisma = new PrismaClient();
let service_id;

export default async (bot, msg) => {
  try {
    const text = msg?.text || msg?.data || msg?.query;

    // console.log('text',text);
    const user = await checkUser(msg);
    const chat_id = msg.from.id;
    const steep = user.steep;
    const st = steep[steep?.length - 1];
    const msgId = msg?.message?.message_id;
    // console.log(msg);
    // console.log('st', st);
    // console.log('data', text);

    // console.log(msg);

    const byName = /^#by_name\s(.+)/;
    const byPhone = /^#by_phone\s(.+)/;
    const byRaiting = /^#by_raiting\s(.+)/;
    if (byName.test(text)) {
      const queryText = text.match(byName)[1];
      const masters = await prisma.masters.findMany({
        where: {
          service_id: +user.action['service_id'],
          name: { mode: 'insensitive', startsWith: queryText },
        },
      });

      const result = await createMasterContent(masters, user);

      bot.answerInlineQuery(msg.id, result);
    } else if (byPhone.test(text)) {
      const queryText = text.match(byPhone)[1];

      const masters = await prisma.masters.findMany({
        where: {
          service_id: +user.action['service_id'],
          phone_number: { contains: queryText },
        },
      });

      const result = await createMasterContent(masters, user);

      bot.answerInlineQuery(query.id, result);
    } else if (byRaiting.test(text)) {
      const queryText = text.match(byRaiting)[1];

      let masters = await prisma.masters.findMany({
        where: {
          service_id: +user.action['service_id'],
        },
      });

      let filteredMasters = masters.filter((master) => {
        if (master.rating / master.rating_count >= +queryText) {
          return master;
        }
      });

      const result = await createMasterContent(filteredMasters, user);

      bot.answerInlineQuery(query.id, result);
    }

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
      changeSteep(user, 'admin-search-master');
      await prisma.users.updateMany({
        where: { user_id: chat_id },
        data: { action: { service_id: text } },
      });
      bot.editMessageText('Xizmatlar', {
        chat_id,
        message_id: msgId,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Ism 👤',
                switch_inline_query_current_chat: '#by_name ',
              },
            ],
            [
              {
                text: 'Telefon ☎️',
                switch_inline_query_current_chat: '#by_phone ',
              },
            ],
            [
              {
                text: 'Reyting 🏆',
                switch_inline_query_current_chat: '#by_raiting ',
              },
            ],
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
    } else if (
      st == 'admin-search-master' &&
      text.split('=')[0] == 'master-disactive'
    ) {
      const id = +text.split('=')[1];

      await prisma.masters.update({
        where: { id },
        data: { is_verified: false },
      });

      // bot.deleteMessage(chat_id, msg.id);
      bot.sendMessage(chat_id, 'Muvoffaqyatli nofaolashtirildi ✅', {
        reply_markup: adminMenuKeyboard,
      });
    } else if (
      st == 'admin-search-master' &&
      text.split('=')[0] == 'master-dismissal'
    ) {
    }
  } catch (e) {
    // master - dismissal;
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

async function getServiceName(user) {
  const service = await prisma.services.findFirst({
    where: { id: +user.action['service_id'] },
  });

  return service.service_name;
}

async function createMasterContent(arr, user) {
  let results = [];

  arr.forEach((master) => {
    let reyting = (master.rating / master.rating_count).toFixed(2);
    let stars = [];
    for (let i = 0; i < reyting; i++) {
      stars.push('⭐️');
    }
    let txt = stars.join('') + ' ' + reyting;

    const content = {
      id: `${master.id}`,
      type: 'article',
      title: `${master.name}`,
      thumb_url:
        'https://rosstroystandart.ru/images/icon/BuildersLabourer_Icon.png',
      thumb_width: 50,
      thumb_height: 50,
      description: 'descriipton',
      input_message_content: {
        message_text: `👤 Ismi: ${master.name}\n☎️ Telefon raqami: ${
          master.phone_number
        }\n⚙️ Xizmat turi: ${getServiceName(user)}\n🏢 Muassasa nomi: ${
          master.workshop_name
        }\n📍 Mo'ljal: ${master.landmark}\n🕐 Ish vaqti: ${
          master.start_time
        } - ${master.end_time}\nO'rtacha hizmat ko'rsatish vaqti: ${
          master.time_per_cutomer
        }\nBAN: ${master.is_banned ? '✅' : '❌'}\nBan qilingan muddati: ${
          master.ban_expiration_time
        }\nTasdiqlanganmi: ${
          master.is_verified ? '✅' : '❌'
        }\n🎖 Sizning darajangiz\n🏆 Reyting: ${txt}`,

        parse_mode: 'HTML',
      },
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Nofaol qilish',
              callback_data: 'master-disactive=' + master.id,
            },
          ],
          [
            {
              text: "Ishdan bo'shatish",
              callback_data: 'master-dismissal=' + master.id,
            },
          ],
          [
            {
              text: 'Xabar yuborish',
              callback_data: 'master-send-msg=' + master.user_id,
            },
          ],
        ],
      },
      hide_url: true,
    };

    results.push(content);
  });

  return results;
}
