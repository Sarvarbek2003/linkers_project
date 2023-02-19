import TelegramBot from "node-telegram-bot-api";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();
const TOKEN = process.env.BOT_TOKEN;
const prisma = new PrismaClient();

const bot = new TelegramBot(TOKEN, { polling: true });

import adminPanel from "./admin/admin.js";

import {
  selectService,
  selectMaster,
  checkUser,
  changeSteep,
} from "./utils.js";
import { customerRegister } from "./users/users.js";
import { masterRegister, works } from "./masters/index.js";
import { cancel, nextBtn, starthome } from "./keyboards/keyboards.js";

bot.on("text", async (msg) => {
  const text = msg.text;
  const chat_id = msg.from.id;
  const user = await checkUser(msg);
  const steep = user?.steep || [];
  const st = steep[(steep?.length || 1) - 1];

  if (text == "/start") {
    await changeSteep(user, "home", true);
    bot.sendMessage(
      chat_id,
      "Assalomualekum MAISHIY XIZMATLAR uchun yartilgan botimizga hush kelibsiz\nKim bo'lib kirmoqchisiz",
      {
        reply_markup: starthome,
      }
    );
  } else if ((text == "/admin" && user.is_admin) || steep[1] == "admin") {
    if (text == "/admin") {
      await changeSteep(user, "home", true);
    }
    await adminPanel(bot, msg);
  } else if (
    text == "🧑‍🚒 Usta" ||
    steep[1] == "choose-service" ||
    steep[1] == "workSpace"
  ) {
    if (text == "❌ Bekor qilish") {
      await changeSteep(user, "home", true);
      await prisma.masters.deleteMany({ where: { is_verified: false } });

      return bot.sendMessage(chat_id, "🔒 *Ro'yhatdan o'tish*", {
        parse_mode: "Markdown",
        reply_markup: starthome,
      });
    }

    try {
      let is_master = await prisma.masters.findFirst({
        where: { AND: { user_id: chat_id, is_verified: true } },
      });
      is_master ? works(bot, msg) : masterRegister(bot, msg);
    } catch (error) {}
  } else if (text == "👤 Mijoz" || steep[1] == "client") {
    await customerRegister(bot, msg);
  }
});

bot.on("contact", async (msg) => {
  const chat_id = msg.from.id;
  const user = await checkUser(msg);
  const steep = user?.steep || [];
  const st = steep[(steep?.length || 1) - 1];
  const phone_number = msg.contact.phone_number;

  if (st === "client_enter_name") {
    await prisma.users.updateMany({
      where: { user_id: chat_id },
      data: { phone_number: phone_number },
    });

    await changeSteep(user, "client_enter_phone_number");
    await bot.sendMessage(chat_id, "Quyidagi xizmatlardan birini tanlang👇", {
      reply_markup: {
        resize_keyboard: true,
        keyboard: [
          [{ text: "Xizmatlar" }, { text: "Tanlangan xizmatlar" }],
          [{ text: "Malumotlarni o'zgartirish" }],
        ],
      },
    });
  } else if (st == "phone_number_master") {
    await prisma.users.updateMany({
      where: { user_id: chat_id },
      data: { phone_number: phone_number },
    });
    await prisma.masters.updateMany({
      where: { user_id: chat_id },
      data: { phone_number: phone_number },
    });

    bot.sendMessage(
      chat_id,
      "*📋 Ustaxona nomini kiriting (Bu majburiy emas)*",
      {
        parse_mode: "Markdown",
        reply_markup: nextBtn,
      }
    );
    await changeSteep(user, "workshop_name");
  } 
});

bot.on("callback_query", async (msg) => {
  const chat_id = msg.from.id;
  const msgId = msg.message.message_id;
  const user = await checkUser(msg);
  const steep = user?.steep || [];
  const st = steep[(steep?.length || 1) - 1];

  const data = msg.data;
  if (
    ["notconfirm_admin", "confirm_admin", "check"].includes(data.split("=")[0])
  ) {
    masterRegister(bot, msg);
  }

  if (data.split("=")[0] == "prev") {
    if (data.split("=")[1] == 0) {
      return bot.answerCallbackQuery(msg.id, { text: "Bu ohirgi sahifa!" });
    }

    let keyboard = await selectService(data.split("=")[1]);

    if (steep[1] === "client") {
      bot.editMessageText("Quyidagi xizmatlardan birini tanlang👇", {
        chat_id,
        message_id: msgId,
        reply_markup: {
          inline_keyboard: keyboard,
        },
      });
    } else {
      bot.editMessageText("Qaysi turdagi xizmatni ko`rsatasiz", {
        chat_id,
        message_id: msgId,
        reply_markup: {
          inline_keyboard: keyboard,
        },
      });
    }
  } else if (data.split("=")[0] == "next") {
    let keyboard = await selectService(data.split("=")[1]);
    if (keyboard[0].length == 0) {
      return bot.answerCallbackQuery(msg.id, { text: "Bu ohirgi sahifa!" });
    }
    if (steep[1] === "client") {
      bot.editMessageText("Quyidagi xizmatlardan birini tanlang👇", {
        chat_id,
        message_id: msgId,
        reply_markup: {
          inline_keyboard: keyboard,
        },
      });
    } else {
      bot.editMessageText("Qaysi turdagi xizmatni ko`rsatasiz", {
        chat_id,
        message_id: msgId,
        reply_markup: {
          inline_keyboard: keyboard,
        },
      });
    }
  } else if (data.split("=")[0] == "next_m") {
    let keyboard = await selectMaster(data.split("=")[1]);
    if (keyboard[0].length == 0) {
      return bot.answerCallbackQuery(msg.id, { text: "Bu ohirgi sahifa!" });
    }
    bot.editMessageText("Ustalar ro'yhati", {
      chat_id,
      message_id: msgId,
      reply_markup: {
        inline_keyboard: keyboard,
      },
    });
  } else if (data.split("=")[0] == "prev_m") {
    if (data.split("=")[1] == 0) {
      return bot.answerCallbackQuery(msg.id, { text: "Bu ohirgi sahifa!" });
    }
    let keyboard = await selectMaster(data.split("=")[1]);

    bot.editMessageText("Ustalar ro'yhati", {
      chat_id,
      message_id: msgId,
      reply_markup: {
        inline_keyboard: keyboard,
      },
    });
  } else if (st == "choose-service") {
    await changeSteep(user, "master_name");
    try {
      await prisma.masters.create({
        data: { user_id: chat_id, service_id: +data, ban_time_list: {} },
      });
    } catch (error) {}
    bot.deleteMessage(chat_id, msgId);
    bot.sendMessage(chat_id, "🖌 *Ismingizni kiriging*", {
      parse_mode: "Markdown",
      reply_markup: cancel,
    });
  } else if (steep[1] == "admin") {
    adminPanel(bot, msg);
  } else if (steep[1] == "choose-service" || steep[1] == "workSpace") {
    try {
      let is_master = await prisma.masters.findFirst({
        where: { AND: { user_id: chat_id, is_verified: true } },
      });
      is_master ? works(bot, msg) : masterRegister(bot, msg);
    } catch (error) {}
  }
});

bot.on("location", async (msg) => {
  try {
    const chat_id = msg.from.id;
    const { latitude, longitude } = msg.location;
    const user = await checkUser(msg);
    const steep = user?.steep || [];
    const st = steep[(steep?.length || 1) - 1];
    if (st == "location_master") {
      await prisma.masters.updateMany({
        where: { user_id: chat_id },
        data: { latitude: `${latitude}`, longtitude: `${longitude}` },
      });
      bot.sendMessage(
        chat_id,
        "⏰ *Ishni boshlanish vaqtini kiriting*\n_Namuna: 09:00_",
        {
          parse_mode: "Markdown",
          reply_markup: cancel,
        }
      );
      await changeSteep(user, "start_time");
    } else if(st == 'edit_location'){
      await prisma.masters.updateMany({
        where: { user_id: chat_id },
        data: { latitude: `${latitude}`, longtitude: `${longitude}` },
      });
      bot.sendMessage(chat_id, "✅ Muvoffaqyatli saqlandi",{
        reply_markup: changeInfobtn
    })
    }
  } catch (error) {
    console.log(error);
  }
});
