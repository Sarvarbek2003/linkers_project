import { PrismaClient } from "@prisma/client";
import { changeSteep, checkUser, selectService } from "../utils.js";
import { cancel } from "../keyboards/keyboards.js";

const prisma = new PrismaClient();
export const customerRegister = async (bot, msg) => {
  const text = msg.text;
  const user = await checkUser(msg);
  const chat_id = msg.from.id;
  const steep = user.steep;
  const st = steep[steep?.length - 1];
  // const msgId = msg.message.message_id;
  const data = msg.data;
  await prisma.users.updateMany({
    where: {
      user_id: chat_id,
    },
    data: {
      is_customer: true,
    },
  });

  if (st === "home") {
    await changeSteep(user, "client");
    console.log("KELDI!");
    await bot.sendMessage(chat_id, "Iltimos ismingizni kiriting👇", {
      reply_markup: cancel,
    });
  } else if (st === "client") {
    await prisma.users.updateMany({
      where: {
        user_id: chat_id,
      },
      data: {
        first_name: text,
      },
    });
    await changeSteep(user, "client_enter_name");
    await bot.sendMessage(
      chat_id,
      "<b>Telefon raqam jo'natish</b> 📞 tugmasi orqali telefon raqamingizni jo'nating!",
      {
        parse_mode: "HTML",
        reply_markup: {
          resize_keyboard: true,
          keyboard: [
            [{ request_contact: true, text: "Telefon raqamni jo'natish 📞" }],
          ],
        },
      }
    );
  } else if (
    (st === "client_enter_phone_number" && text === "Xizmatlar") ||
    data === "user_back_home"
  ) {
    const keyboards = await selectService();
    // throw new Error("ER1")
    await bot.sendMessage(chat_id, "Quyidagi xizmatlardan birini tanlang👇", {
      reply_markup: {
        inline_keyboard: keyboards,
      },
    });
    await changeSteep(user, "select_service_user");
  }
};
