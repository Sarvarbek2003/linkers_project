import { PrismaClient } from '@prisma/client';
import { adminMenuKeyboard } from '../keyboards/keyboards.js';
import { selectService, changeSteep, checkUser } from '../utils.js';

const prisma = new PrismaClient();
let service_id;

export default async (bot, msg) => {
  try {
    const text = msg?.text || msg?.data || msg?.query;

    const user = await checkUser(msg);
    const chat_id = msg.from.id;
    const steep = user.steep;
    const st = steep[steep?.length - 1];
    const msgId = msg?.message?.message_id;

    const masterByName = /^#mby_name\s(.+)/;
    const masterByPhone = /^#mby_phone\s(.+)/;
    const masterByRating = /^#mby_raiting\s(.+)/;
    const customerByName = /^#cby_name\s(.+)/;
    const customerByPhone = /^#cby_phone\s(.+)/;

    if (masterByName.test(text)) {
      const queryText = text.match(masterByName)[1];
      const masters = await prisma.masters.findMany({
        where: {
          service_id: +user.action['service_id'],
          name: { mode: 'insensitive', startsWith: queryText },
        },
      });

      const result = await createMasterContent(masters, user);

      bot.answerInlineQuery(msg.id, result);
    } else if (masterByPhone.test(text)) {
      const queryText = text.match(masterByPhone)[1];

      const masters = await prisma.masters.findMany({
        where: {
          service_id: +user.action['service_id'],

          phone_number: { contains: queryText },
        },
      });

      const result = await createMasterContent(masters, user);

      bot.answerInlineQuery(msg.id, result);
    } else if (masterByRating.test(text)) {
      const queryText = text.match(masterByRating)[1];

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

      bot.answerInlineQuery(msg.id, result);
    } else if (customerByName.test(text)) {
      const queryText = text.match(customerByName)[1];

      let results = [];

      const customer = await prisma.users.findMany({
        where: {
          is_customer: { equals: true },
          is_admin: { equals: false },
          first_name: { mode: 'insensitive', startsWith: queryText },
        },
      });

      customer.forEach((customer) => {
        const content = {
          id: `${customer.id}`,
          type: 'article',
          title: `${customer.first_name}`,
          thumb_url:
            'https://rosstroystandart.ru/images/icon/BuildersLabourer_Icon.png',
          thumb_width: 50,
          thumb_height: 50,
          description: 'descriipton',
          input_message_content: {
            message_text: `👤 Ismi: ${
              customer.first_name
            }\n☎️ Telefon raqami: ${customer.phone_number}\n Adminmi: ${
              customer.is_admin ? '✅' : '❌'
            }\n BAN: ${customer.is_banned ? '✅' : '❌'}\n`,

            parse_mode: 'HTML',
          },
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'BAN qilish',
                  callback_data: 'customer-ban=' + customer.id,
                },
              ],
              [
                {
                  text: 'Xabar yuborish',
                  callback_data: 'customer-send-msg=' + customer.user_id,
                },
              ],
            ],
          },
          hide_url: true,
        };

        results.push(content);
      });
      bot.answerInlineQuery(msg.id, results);
    } else if (customerByPhone.test(text)) {
      const queryText = text.match(customerByPhone)[1];

      let results = [];

      const customer = await prisma.users.findMany({
        where: {
          is_customer: { equals: true },
          is_admin: { equals: false },
          phone_number: { contains: queryText },
        },
      });

      customer.forEach((customer) => {
        const content = {
          id: `${customer.id}`,
          type: 'article',
          title: `${customer.first_name}`,
          thumb_url:
            'https://rosstroystandart.ru/images/icon/BuildersLabourer_Icon.png',
          thumb_width: 50,
          thumb_height: 50,
          description: 'descriipton',
          input_message_content: {
            message_text: `👤 Ismi: ${
              customer.first_name
            }\n☎️ Telefon raqami: ${customer.phone_number}\n Adminmi: ${
              customer.is_admin ? '✅' : '❌'
            }\n BAN: ${customer.is_banned ? '✅' : '❌'}\n`,

            parse_mode: 'HTML',
          },
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'BAN qilish',
                  callback_data: 'customer-ban=' + customer.id,
                },
              ],
              [
                {
                  text: 'Xabar yuborish',
                  callback_data: 'customer-send-msg=' + customer.user_id,
                },
              ],
            ],
          },
          hide_url: true,
        };

        results.push(content);
      });
      bot.answerInlineQuery(msg.id, results);
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
            [
              {
                text: 'Tahrirlash ✏️',
                callback_data: 'service-edit=' + text,
              },
            ],
            [
              {
                text: "O'chirish ❌",
                callback_data: 'service-delete=' + text,
              },
            ],
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
                switch_inline_query_current_chat: '#mby_name ',
              },
            ],
            [
              {
                text: 'Telefon ☎️',
                switch_inline_query_current_chat: '#mby_phone ',
              },
            ],
            [
              {
                text: 'Reyting 🏆',
                switch_inline_query_current_chat: '#mby_raiting ',
              },
            ],
          ],
        },
      });
    } else if (st == 'admin_customers') {
      changeSteep(user, 'admin-search-customer');

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
                switch_inline_query_current_chat: '#cby_name ',
              },
            ],
            [
              {
                text: 'Telefon ☎️',
                switch_inline_query_current_chat: '#cby_phone ',
              },
            ],
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

      console.log(id);

      await prisma.masters.update({
        where: { id: id },
        data: { is_verified: false },
      });

      bot.sendMessage(chat_id, 'Muvoffaqyatli nofaolashtirildi ✅', {
        reply_markup: adminMenuKeyboard,
      });
    } else if (
      st == 'admin-search-master' &&
      text.split('=')[0] == 'master-dismissal'
    ) {
    } else if (
      st == 'admin-search-master' &&
      text.split('=')[0] == 'master-dismissal'
    ) {
      const id = +text.split('=')[1];

      await prisma.masters.update({
        where: { id },
        data: { is_banned: false },
      });

      bot.sendMessage(chat_id, 'Muvoffaqyatli bushatildi ✅', {
        reply_markup: adminMenuKeyboard,
      });
    } else if (
      st == 'admin-search-master' &&
      text.split('=')[0] == 'customer-ban'
    ) {
      const id = +text.split('=')[1];

      await prisma.users.update({
        where: { id },
        data: { is_banned: false },
      });

      bot.sendMessage(chat_id, 'Muvoffaqyatli bushatildi ✅', {
        reply_markup: adminMenuKeyboard,
      });
    }
  } catch (e) {
    console.log(e);
    // master-dismissal
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
