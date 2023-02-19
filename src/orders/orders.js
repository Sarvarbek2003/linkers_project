import {
  changeSteep,
  checkUser,
  selectMaster,
  selectMasterByService,
} from "../utils.js";
import { PrismaClient } from "@prisma/client";
import { userSelected, userSelectMasters } from "../keyboards/keyboards.js";

const prisma = new PrismaClient();
export const mastersData = async (bot, msg) => {
  const text = msg.text;
  const chat_id = msg.from.id;
  const user = await checkUser(msg);
  const steep = user?.steep || [];
  const st = steep[(steep?.length || 1) - 1];
  const data = msg.data;
  if (st === "select_service_user" || data !== "user_back_home") {
    await changeSteep("service_selected");
    const masters = await prisma.masters.findMany({
      where: {
        service_id: +data,
      },
    });
    if (masters.length === 0) {
      return await bot.answerCallbackQuery(msg.id, {
        text: "Afsuski, bu xizmatda hozircha mutaxasislar topilmadi!",
      });
    } else {
      const keyboard = await selectMasterByService(+data);
      const service = await prisma.services.findUnique({
        where: { id: +data },
      });
      console.log(service);
      await bot.sendMessage(
        chat_id,
        "Nima bo'yicha qidirmoqchisiz?",
        userSelectMasters
      );
      await changeSteep(user, "user_search_master");
    }
  }
};

export const getMastersDataByName = async (query) => {
  // console.log(query.query)
  // const user = await checkUser(query);
  const results = await prisma.masters.findMany({
    where: {
      name: { mode: "insensitive", startsWith: query },
    },
  });
  console.log(results)
  return results.map((result) => ({
    type: "article",
    id: result.id,
    title: result.name,
    description: "Usta",
    input_message_content: {
      thumb_url:
        "https://rosstroystandart.ru/images/icon/BuildersLabourer_Icon.png",
      thumb_width: 50,
      thumb_height: 50,
      message_text: `👤 Ismi: ${result.name}\n📞 Telefon raqami: ${
        result.phone_number
      }\n🏢Ustaxona nomi: ${
        result.workshop_name ? result.workshop_name : "Berilmagan"
      }\n📍Manzil: ${
        result.address ? result.address : "Berilmagan"
      }\n💠Mo'ljal: ${result.landmark ? result.landmark : "Berilmagan"}`,
    },
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "📍 Lokatsiya",
            callback_data: `user_select_master_location-${result.id}`,
          },
          {
            text: "🕐 Vaqt olish",
            callback_data: `user_select_time_master-${result.id}`,
          },
        ],
        [
          { text: "⭐ Baxolash", callback_data: "user_rate_master" },
          {
            text: "🔙 Ortga",
            callback_data: "user_back",
          },
        ],
      ],
    },
  }));
};

export const getMastersDataByPhone = async (query) => {
  // console.log(query.query)
  // const user = await checkUser(query);
  const results = await prisma.masters.findMany({
    where: {
      phone_number: { mode: "insensitive", startsWith: query },
    },
  });
  console.log(results)
  return results.map((result) => ({
    type: "article",
    id: result.id,
    title: result.name,
    description: "Usta",
    input_message_content: {
      thumb_url:
          "https://rosstroystandart.ru/images/icon/BuildersLabourer_Icon.png",
      thumb_width: 50,
      thumb_height: 50,
      message_text: `👤 Ismi: ${result.name}\n📞 Telefon raqami: ${
          result.phone_number
      }\n🏢Ustaxona nomi: ${
          result.workshop_name ? result.workshop_name : "Berilmagan"
      }\n📍Manzil: ${
          result.address ? result.address : "Berilmagan"
      }\n💠Mo'ljal: ${result.landmark ? result.landmark : "Berilmagan"}`,
    },
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "📍 Lokatsiya",
            callback_data: `user_select_master_location-${result.id}`,
          },
          {
            text: "🕐 Vaqt olish",
            callback_data: `user_select_time_master-${result.id}`,
          },
        ],
        [
          { text: "⭐ Baxolash", callback_data: "user_rate_master" },
          {
            text: "🔙 Ortga",
            callback_data: "user_back",
          },
        ],
      ],
    },
  }));
};
