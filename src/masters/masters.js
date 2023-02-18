import { changeSteep, checkUser, selectService } from "../utils.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export default async(bot, msg) => {
    const text = msg.text;
    const chat_id = msg.from.id;
    const user = await checkUser(msg);
    const steep = user.steep;
    const st = steep[steep?.length - 1];
    console.log(msg);
    if(st == 'home') {
        await changeSteep(user, "choose-service");
        let keyboard = await selectService();
        bot.sendMessage(chat_id, "Qaysi turdagi xizmatni ko`rsatasiz", {
            reply_markup: {
                inline_keyboard: keyboard,
            },
        });
    } else if (st == 'master_name'){
        await changeSteep(user, "phone_number_master");
        await prisma.masters.updateMany({
            where: {
                user_id:chat_id
            },
            data: {
                name: text
            }
        })
        console.log("salom");
        bot.sendMessage(chat_id, "<b>Telefon raqam jo'natish</b> 📞 tugmasi orqali telefon raqamingizni jo'nating!", {
            parse_mode: "HTML",
            reply_markup: {
                resize_keyboard: true,
                keyboard: [
                    [{ request_contact: true, text: "Telefon raqamni jo'natish 📞" }],
                ],
            },
        })
        
    } else if(st == 'workshop_name'){
        if(text != "O`tkazish ⏭️")  await prisma.masters.updateMany({where:{user_id:chat_id}, data:{workshop_name: text}})
        bot.sendMessage(chat_id, "Ustaxona manzilini kiriting (bu majburiy emas)",{
            reply_markup:{
                resize_keyboard: true,
                keyboard: [[{text:"O`tkazish ⏭️"}],[{text:"❌ Bekor qilish"}]]
            }
        })
        await changeSteep(user, "address");
    } else if(st == 'address'){
        if(text != "O`tkazish ⏭️") await prisma.masters.updateMany({where:{user_id:chat_id}, data:{address: text}})
        bot.sendMessage(chat_id, "Mo'ljalni yozing (bu majburiy emas)",{
            reply_markup:{
                resize_keyboard: true,
                keyboard: [[{text:"O`tkazish ⏭️"}],[{text:"❌ Bekor qilish"}]]
            }
        })
        await changeSteep(user, "landmark");
    } else if(st == 'landmark'){
        if(text != "O`tkazish ⏭️") await prisma.masters.updateMany({where:{user_id:chat_id}, data:{landmark: text}})
        bot.sendMessage(chat_id, "Ustaxona locatisyasini yuboring",{
            reply_markup:{
                resize_keyboard: true,
                keyboard: [[{text:"Location", request_location: true}]]
            }
        })
        await changeSteep(user, "location_master");
    } else if(st == 'start_time'){
        if(!/^[0-2][0-9]:[0-5][0-9]$/.test(text)) {
            return bot.sendMessage(chat_id, "Ishni boshlanish vaqtini namunadagidaqa to'g'ri kiriting\nNamuna: 09:00")
        }
        await prisma.masters.updateMany({where:{user_id:chat_id}, data:{start_time: text}})
        bot.sendMessage(chat_id, "Ishni yakunlash vaqtini kiriting\nNamuna: 18:00")
        await changeSteep(user, 'end_time')
    } else if(st == 'end_time'){
        if(!/^[0-2][0-9]:[0-5][0-9]$/.test(text)) {
            return bot.sendMessage(chat_id, "Ishni yakunlash vaqtini namunadagidaqa to'g'ri kiriting\nNamuna: 09:00")
        }
        await prisma.masters.updateMany({where:{user_id:chat_id}, data:{end_time: text}})
        bot.sendMessage(chat_id, "Har bir mijozga ajratiladigan o`rtacha vaqtni yozing")
        await changeSteep(user, 'time_peer')
    } else if (st == 'time_peer'){
        if(isNaN(text)) return bot.sendMessage(chat_id, "❗Faqat raqamda yozing")
        await prisma.masters.updateMany({where:{user_id:chat_id}, data:{time_per_cutomer: text}})
        let readyMaster = await prisma.masters.findFirst({where: {user_id: chat_id}})
        console.log(readyMaster);

        let txt = `1. ISMI – ${readyMaster.name}
2. TELEFON RAQAMI – ${user.phone_number}
3. USTAXONA NOMI – ${readyMaster.workshop_name ? readyMaster.workshop_name : ''}
4. MANZILI – ${readyMaster.address ? readyMaster.address : ''}
5. MO’LJAL – ${readyMaster.landmark ? readyMaster.landmark : ''}
6. LOKATSIYASI (LOCATION) – 📍
7. ISHNI BOSHLASH VAQTI – ${readyMaster.start_time}
8. ISHNI YAKUNLASH VAQTI – ${readyMaster.end_time}
9. HAR BIR MIJOZ UCHUN O’RTACHA
SARFLANADIGAN VAQT (MIN) – ${readyMaster.time_per_cutomer}`

        bot.sendMessage(chat_id, txt, {
            reply_markup: {
                inline_keyboard: [
                    [{text: "✅ Tasdiqlash", callback_data: 'confirm_master'}, {text: "❌ Bekor qilish", callback_data: 'notconfirm_master'}]
                ]
            }
        })
    }
   
}