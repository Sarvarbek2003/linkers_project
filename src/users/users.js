import { PrismaClient } from "@prisma/client";
import { changeSteep } from "../utils.js";

const prisma = new PrismaClient();
export const customerRegister = async (bot, msg) => {
  const chat_id = msg.from.id;
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
  const user = await prisma.users.findFirst({
    where: {
      user_id: chat_id,
    },
  });

  await bot.sendMessage(chat_id, "Ismingizni kiriting👇");
  await changeSteep(user, "user_enter_name");
};
