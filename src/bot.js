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
import masterRegister from "./masters/masters.js";

bot.on("text", async (msg) => {
  const text = msg.text;
  const chat_id = msg.from.id;
  const user = await checkUser(msg);
  const steep = user.steep;
  const st = steep[steep?.length - 1];

  if (text == "/start") {
    await changeSteep(user, "home", true);
    bot.sendMessage(
      chat_id,
      "Assalomualekum MAISHIY XIZMATLAR uchun yartilgan botimizga hush kelibsiz\nKim bo'lib kirmoqchisiz",
      {
        reply_markup: {
          resize_keyboard: true,
          keyboard: [[{ text: "Usta" }, { text: "Mijoz" }]],
        },
      }
    );
  } else if ((text == "/admin" && user.is_admin) || steep[0] == "admin") {

    await adminPanel(bot, msg);
  } else if (text == "Usta" || steep[2] == "master") {
    await masterRegister(bot, msg);
  } else if (text == "Mijoz" || steep[1] == "client") {
    await customerRegister(bot, msg);
  }
});

bot.on("contact", async (msg) => {
  const text = msg.text;
  const chat_id = msg.from.id;
  const user = await checkUser(msg);
  const steep = user.steep;
  const st = steep[steep?.length - 1];
  // console.log(st);
  if (st === "client_enter_name") {
    const phone_number = msg.contact.phone_number;
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
  }
});

bot.on("callback_query", async (msg) => {
  const chat_id = msg.from.id;
  const msgId = msg.message.message_id;

  const user = await checkUser(msg);
  const steep = user.steep;
  const st = steep[steep?.length - 1];

  const data = msg.data;

  if (data.split("=")[0] == "prev") {
    if (data.split("=")[1] == 0) {
      return bot.answerCallbackQuery(msg.id, { text: "Бу охирги саҳифа" });
    }
    let keyboard = await selectService(data.split("=")[1]);

    bot.editMessageText("Qaysi turdagi xizmatni ko`rsatasiz", {
      chat_id,
      message_id: msgId,
      reply_markup: {
        inline_keyboard: keyboard,
      },
    });
  } else if (data.split("=")[0] == "next") {
    let keyboard = await selectService(data.split("=")[1]);
    if (keyboard[0].length == 0) {
      return bot.answerCallbackQuery(msg.id, { text: "Bu ohirgi sahifa!" });
    }
    bot.editMessageText("Qaysi turdagi xizmatni ko`rsatasiz", {
      chat_id,
      message_id: msgId,
      reply_markup: {
        inline_keyboard: keyboard,
      },
    });
  } else if (data.split("=")[0] == "next_m") {
    let keyboard = await selectMaster(data.split("=")[1]);

    bot.editMessageText("Ustalar ro'yhati", {
      chat_id,
      message_id: msgId,
      reply_markup: {
        inline_keyboard: keyboard,
      },
    });
  } else if (data.split("=")[0] == "prev_m") {
    if (data.split("=")[1] == 0) {
      return bot.answerCallbackQuery(msg.id, { text: "Бу охирги саҳифа" });
    }
    let keyboard = await selectMaster(data.split("=")[1]);

    bot.editMessageText("Ustalar ro'yhati", {
      chat_id,
      message_id: msgId,
      reply_markup: {
        inline_keyboard: keyboard,
      },
    });
  } else if (st == 'choose-service'){
    await changeSteep(user, "master_name");
    let newMaster = await prisma.masters.create({data: {user_id: chat_id, service_id: +data}})
    bot.deleteMessage(chat_id, msgId)
    bot.sendMessage(chat_id, "Ismingizni kiriging", {
      reply_markup: {
        resize_keyboard: true,
        keyboard: [[{ text: "❌ Bekor qilish" }]],
      },
    });
  }
});


