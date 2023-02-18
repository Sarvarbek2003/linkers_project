import TelegramBot from "node-telegram-bot-api";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();
const TOKEN = process.env.BOT_TOKEN;
const prisma = new PrismaClient();

const bot = new TelegramBot(TOKEN, { polling: true });

import adminPanel from "./admin/admin.js";

bot.on("text", async (msg) => {
  const text = msg.text;
  const chat_id = msg.from.id;
  const user = await checkUser(msg);
  const steep = user.steep;
  const st = steep[steep.length - 1];

  if (text == "/start") {
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
    await changeSteep(user, "admin");
    await adminPanel(bot, msg);
  } else if (text == "Usta") {
    await changeSteep(user, "choose-service");
    let keyboard = await selectService();
    bot.sendMessage(chat_id, "Qaysi turdagi xizmatni ko`rsatasiz", {
      reply_markup: {
        inline_keyboard: keyboard,
      },
    });
  } else if (text == "Mijoz") {
    let keyboard = await selectMaster();
    bot.sendMessage(chat_id, "Ustalar ro`yhati", {
      reply_markup: {
        inline_keyboard: keyboard,
      },
    });
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
  }
});

const selectService = async (page = 1) => {
  try {
    let services = await prisma.services.findMany();
    services = services.slice(+page * 10 - 10, 10 * +page);
    let array = [];
    let arr = [];
    let count = 2;
    services.forEach((el) => {
      if (count > 0) {
        arr.push({ text: el.service_name, callback_data: `${el.id}` });
        count--;
      } else {
        array.push(arr);
        arr = [];
        count = 1;
        arr.push({ text: el.service_name, callback_data: `${el.id}` });
      }
    });

    array.push(arr);
    array.push([
      { text: "⏪ Oldingisi", callback_data: "prev=" + (+page - 1) },
      {
        text: "⏩ Keyingisi",
        callback_data: "next=" + (+page + 1),
      },
    ]);

    return array;
  } catch (error) {
    console.log(error);
    return [];
  }
};

const selectMaster = async (page = 1) => {
  try {
    let services = await prisma.masters.findMany();
    services = services.slice(+page * 5 - 5, 5 * +page);
    let array = [];

    services.forEach((el) => {
      array.push([
        {
          text: el.name + " 🎖" + el.rating / el.rating_count,
          callback_data: `${el.id}`,
        },
      ]);
    });

    array.push([
      { text: "⏪", callback_data: "prev_m=" + (+page - 1) },
      {
        text: "⏩",
        callback_data: "next_m=" + (+page + 1),
      },
    ]);

    return array;
  } catch (error) {
    console.log(error);
    return [];
  }
};

const checkUser = async (data) => {
  try {
    const chat_id = data.from.id;
    const user = await prisma.users.findFirst({ where: { user_id: chat_id } });

    if (user) {
      return user;
    } else {
      let user = await prisma.users.create({
        data: {
          user_id: chat_id,
          steep: ["home"],
        },
      });

      return user;
    }
  } catch (error) {
    return 0;
  }
};

const changeSteep = async (user, steep, steepHome = false) => {
  try {
    let steeps = user.steep;
    steepHome ? (steeps = user.steep) : steeps.push(steep);
    await prisma.users.update({
      where: {
        user_id: user.user_id,
      },
      data: {
        steep: steeps,
      },
    });
  } catch (error) {
    return 0;
  }
};

export {
    changeSteep
}
