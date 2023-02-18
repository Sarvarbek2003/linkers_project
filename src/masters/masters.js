import { checkUser, selectService } from "../utils.js";

export default async(bot, msg) => {
    const text = msg.text;
    const chat_id = msg.from.id;
    const user = await checkUser(msg);
    const steep = user.steep;
    const st = steep[steep?.length - 1];
    if(st == 'choose-service') {
        let keyboard = await selectService();
        console.log(keyboard);
        bot.sendMessage(chat_id, "Qaysi turdagi xizmatni ko`rsatasiz", {
            reply_markup: {
                inline_keyboard: keyboard,
            },
        });
    }
   
}