import TelegramBot from "node-telegram-bot-api";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();
const TOKEN = process.env.BOT_TOKEN;
const prisma = new PrismaClient();

const bot = new TelegramBot(TOKEN, { polling: true });

import adminPanel from "./admin/admin.js";

import { selectService, selectMaster, checkUser, changeSteep} from "./utils.js";
import { customerRegister } from "./users/users.js";

bot.on("text", async (msg) => {
  const text = msg.text;
  const chat_id = msg.from.id;
  const user = await checkUser(msg);
  console.log(user);
  const steep = user.steep;
  const st = steep[steep?.length - 1];

  if (text == "/start") {
    await changeSteep(user, 'home', true)
    bot.sendMessage( chat_id, "Assalomualekum MAISHIY XIZMATLAR uchun yartilgan botimizga hush kelibsiz\nKim bo'lib kirmoqchisiz",{
        reply_markup: {
          resize_keyboard: true,
          keyboard: [[{ text: "Usta" }, { text: "Mijoz" }]],
        },
      }
    );
  } else if ((text == "/admin" && user.is_admin) || steep[0] == "admin") {

    await changeSteep(user, "admin",true);
    await adminPanel(bot, msg);

  } else if (text == "Usta") {

    await changeSteep(user, "choose-service");
    let keyboard = await selectService();
    bot.sendMessage(chat_id, "Qaysi turdagi xizmatni ko`rsatasiz", {
      reply_markup: {
        inline_keyboard: keyboard,
      },
    });

  } else if (text == "Mijoz" || steep[1] == 'client') {

    await changeSteep(user, "client");
    await customerRegister(bot, msg)

  } else if(st == 'choose-service'){
    
  }
});


bot.on("callback_query", async (msg) => {
  const chat_id = msg.from.id;
  const msgId = msg.message.message_id;

  const user = await checkUser(msg);
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
    await prisma.masters.create({data: {user_id: chat_id, service_id: data.split('=')}})
    bot.sendMessage(chat_id, "Ismingizni kiriging")
  }
});

