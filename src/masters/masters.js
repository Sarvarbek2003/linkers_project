import { changeSteep, checkUser, selectService } from "../utils.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export default async(bot, msg) => {
    const text = msg.text;
    const chat_id = msg.from.id;
    const user = await checkUser(msg);
    const steep = user.steep;
    const st = steep[steep?.length - 1];
    if(st == 'home') {
        await changeSteep(user, "choose-service");
        let keyboard = await selectService();
        bot.sendMessage(chat_id, "Qaysi turdagi xizmatni ko`rsatasiz", {
            reply_markup: {
                inline_keyboard: keyboard,
            },
        });
    } else if (st == 'master'){
        await changeSteep(user, "phone_number_master");
        await prisma.users.findMany({
            where: {
                user_id:chat_id
            },
            data: {
                first_name: text
            }
        })
    }
   
}