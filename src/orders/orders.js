import {
  changeSteep,
  checkUser,
  selectMaster,
  selectMasterByService,
} from "../utils.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const mastersData = async (bot, msg) => {
  const text = msg.text;
  const chat_id = msg.from.id;
  const user = await checkUser(msg);
  const steep = user?.steep || [];
  const st = steep[(steep?.length || 1) - 1];
  const data = msg.data;
  if (st === "select_service_user" || data !== 'user_back_home') {
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
      console.log(service)
      keyboard.push([{ text: "Ortga 🔙", callback_data: "user_back_home" }]);
      await bot.sendMessage(
        chat_id,
        `${service.service_name} xizmati bo'yicha ustalar ro'yhati:`,
        {
          reply_markup: {
            inline_keyboard: keyboard,
          },
        }
      );
    }
  }
};
