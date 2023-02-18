import { changeSteep, checkUser, selectService } from "../utils.js";
import { PrismaClient } from "@prisma/client";
import { cancel, homeMaster, nextBtn, starthome } from "../keyboards/keyboards.js";

const prisma = new PrismaClient();
export const masterRegister = async(bot, msg) => {
    try {
        const text = msg?.text || msg?.data;
        const chat_id = msg.from.id;
        const user = await checkUser(msg);
        const steep = user?.steep || [];
        const st = steep[steep?.length - 1];
        let msgId = msg?.message?.message_id
        if(st == 'home') {
            await changeSteep(user, "choose-service");
            let keyboard = await selectService();
            bot.sendMessage(chat_id, "*Qaysi turdagi xizmatni ko`rsatasiz*👇", {
                parse_mode: 'Markdown',
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
            bot.sendMessage(chat_id, "<b>Telefon raqam jo'natish</b> 📞\n tugmasi orqali telefon raqamingizni jo'nating!", {
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
            bot.sendMessage(chat_id, "📍 *Ustaxona manzilini kiriting (bu majburiy emas)*",{
                parse_mode:'Markdown',
                reply_markup:nextBtn
            })
            await changeSteep(user, "address");
        } else if(st == 'address'){
            if(text != "O`tkazish ⏭️") await prisma.masters.updateMany({where:{user_id:chat_id}, data:{address: text}})
            bot.sendMessage(chat_id, "🚩 *Mo'ljalni yozing (bu majburiy emas)*",{
                parse_mode:'Markdown',
                reply_markup:nextBtn
            })
            await changeSteep(user, "landmark");
        } else if(st == 'landmark'){
            if(text != "O`tkazish ⏭️") await prisma.masters.updateMany({where:{user_id:chat_id}, data:{landmark: text}})
            bot.sendMessage(chat_id, "🕹 *Ustaxona locatisyasini yuboring*",{
                parse_mode: 'Markdown',
                reply_markup:{
                    resize_keyboard: true,
                    keyboard: [[{text:"🕹 Location", request_location: true}]]
                }
            })
            await changeSteep(user, "location_master");
        } else if(st == 'start_time'){
            if(!/^[0-2][0-9]:[0-5][0-9]$/.test(text)) {
                return bot.sendMessage(chat_id, "‼️ *Ishni boshlanish vaqtini namunadagidaqa to'g'ri kiriting*\n_Namuna: 09:00_", {parse_mode:'Markdown'})
            }
            await prisma.masters.updateMany({where:{user_id:chat_id}, data:{start_time: text}})
            bot.sendMessage(chat_id, "⏱ *Ishni yakunlash vaqtini kiriting*\n_Namuna: 18:00_", {
                parse_mode:'Markdown',
                reply_markup: cancel
            })
            await changeSteep(user, 'end_time')
        } else if(st == 'end_time'){
            if(!/^[0-2][0-9]:[0-5][0-9]$/.test(text)) {
                return bot.sendMessage(chat_id, "‼️ *Ishni yakunlash vaqtini namunadagidaqa to'g'ri kiriting*\n_Namuna: 09:00_",{parse_mode:'Markdown'})
            }
            await prisma.masters.updateMany({where:{user_id:chat_id}, data:{end_time: text}})
            bot.sendMessage(chat_id, "🧭* Har bir mijozga ajratiladigan o`rtacha vaqtni minutda yozing*",{parse_mode:'Markdown'})
            await changeSteep(user, 'time_peer')
        } else if (st == 'time_peer'){
            if(isNaN(text)) return bot.sendMessage(chat_id, "❗*Faqat raqamda yozing*", {parse_mode:'Markdown'})
            else if (text < 30) return bot.sendMessage(chat_id, "❗*Minimal 30 kiritishingiz mumkin*", {parse_mode:'Markdown'})
            await prisma.masters.updateMany({where:{user_id:chat_id}, data:{time_per_cutomer: text}})
            
            let readyMaster = await prisma.masters.findFirst({where: {user_id: chat_id}})
            await changeSteep(user, 'confirm_master')
            
            let txt = 
            `👤 *Ismi* – ${readyMaster.name}\n`+
            `📞 *Telefon raqami* – ${user.phone_number}\n`+
            `🏠 *Ustaxona nomi* – ${readyMaster.workshop_name ? readyMaster.workshop_name : ''}\n`+
            `📍 *Manzili* – ${readyMaster.address ? readyMaster.address : ''}\n`+
            `🚩 *Mo'ljal* – ${readyMaster.landmark ? readyMaster.landmark : ''}\n`+
            `🏁 *Locatsyasi* – 📍\n`+
            `⏰ *Ish boshlanish vaqti* – ${readyMaster.start_time}\n`+
            `🕰 *Ishning tugash vaqti* – ${readyMaster.end_time}\n`+
            `🧭 *Har bir mijoz uchun o'rtacha\n`+
            `sariflaydigan vaqti* – ${readyMaster.time_per_cutomer}`

            bot.sendMessage(chat_id, txt, {
                parse_mode:"Markdown",
                reply_markup: {
                    inline_keyboard: [
                        [
                            {text: "✅ Tasdiqlash", callback_data: 'confirm_master='+readyMaster.id},
                            {text: "❌ Bekor qilish", callback_data: 'notconfirm_master='+readyMaster.id}
                        ]
                    ]
                }
            })
        } else if (text.split('=')[0] == 'confirm_master' && st == 'confirm_master'){
            let id = text.split('=')[1]
            let readyMaster = await prisma.masters.findFirst({where: {user_id: chat_id}})
            let txt = 
            `👤 *Ismi* – ${readyMaster.name}\n`+
            `📞 *Telefon raqami* – ${user.phone_number}\n`+
            `🏠 *Ustaxona nomi* – ${readyMaster.workshop_name ? readyMaster.workshop_name : ''}\n`+
            `📍 *Manzili* – ${readyMaster.address ? readyMaster.address : ''}\n`+
            `🚩 *Mo'ljal* – ${readyMaster.landmark ? readyMaster.landmark : ''}\n`+
            `🏁 *Locatsyasi* – 📍\n`+
            `⏰ *Ish boshlanish vaqti* – ${readyMaster.start_time}\n`+
            `🕰 *Ishning tugash vaqti* – ${readyMaster.end_time}\n`+
            `🧭 *Har bir mijoz uchun o'rtacha\n`+
            `sariflaydigan vaqti* – ${readyMaster.time_per_cutomer}`

            let sendMsg = await bot.sendLocation('-1001898967264', readyMaster.latitude, readyMaster.longtitude)
            bot.sendMessage('-1001898967264', txt, {
                parse_mode:"Markdown",
                reply_to_message_id: sendMsg.message_id,
                reply_markup: {
                    inline_keyboard: [
                        [
                            {text: "✅ Tasdiqlash", callback_data: 'confirm_admin='+readyMaster.id},
                            {text: "❌ Bekor qilish", callback_data: 'notconfirm_admin='+readyMaster.id}
                        ]
                    ]
                }
            })
            bot.editMessageText( "*✅ Arizangiz adminga yuborildi. Tasdiqlanishini kuting*", {
                chat_id,
                message_id: msgId,
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [
                        [{text: "♻️ Tekshirish", callback_data: 'check='+id},{text: "❌ Bekor qilish", callback_data: 'cancel='+id}],
                        [{text: "Admin bilan bog'lanish", url: 'https://github.com/Sarvarbek2003'}],
                    ]
                }
            })
        } else if (['cancel', 'notconfirm_master'].includes(text.split('=')[0])  && st == 'confirm_master'){
            let id = text.split('=')[1]
            changeSteep(user, 'home', true)
            await prisma.masters.delete({ where:{ id: +id } })
            bot.deleteMessage(chat_id, msgId)
            bot.sendMessage(chat_id, "*❌ Arizangiz bekor qilindi*", {
                parse_mode: "Markdown", 
                reply_markup: starthome
            })
        } else if (text.split('=')[0] == 'confirm_admin'){
            let id  = text.split('=')[1]
            let verify = await prisma.masters.updateMany({where: {id: +id}, data: {is_verified: true}})
            if (verify.count == 0) {
                let txt = msg.message.text + '\n\n❌ Foydalanuchui tomonidan bekor qilingan'
                bot.editMessageText(txt, {
                    chat_id: '-1001898967264',
                    message_id: msgId
                })

                bot.editMessageReplyMarkup({reply_markup: {remove_keyboard: true}},{
                    message_id: msgId,
                    chat_id: '-1001898967264',
                })
            } else {
                let txt = msg.message.text + '\n\n✅Tasdiqlandi ' + chat_id + '\n' + new Date().toLocaleTimeString()
                bot.editMessageText(txt, {
                    chat_id: '-1001898967264',
                    message_id: msgId
                })
    
                bot.editMessageReplyMarkup({reply_markup: {remove_keyboard: true}},{
                    message_id: msgId,
                    chat_id: '-1001898967264',
                })

               
            }
            
        } else if (text.split('=')[0] == 'notconfirm_admin'){
            let id = text.split('=')[1] 
            let verify = await prisma.masters.deleteMany({where: {id: +id}})
            if (verify?.count == 0) {
                let txt = msg.message.text + '\n\n❌ Foydalanuvchi tomonidan bekor qilingan'
                bot.editMessageText(txt, {
                    chat_id: '-1001898967264',
                    message_id: msgId
                })

                bot.editMessageReplyMarkup({reply_markup: {remove_keyboard: true}},{
                    message_id: msgId,
                    chat_id: '-1001898967264',
                })
            } else {
                let txt = msg.message.text + '\n\n❌ Bekor qilindi ' + chat_id + '\n' + new Date().toLocaleTimeString()
                bot.editMessageText(txt, {
                    chat_id: '-1001898967264',
                    message_id: msgId
                })
    
                bot.editMessageReplyMarkup({reply_markup: {remove_keyboard: true}},{
                    message_id: msgId,
                    chat_id: '-1001898967264',
                })
            }
            
        } else if (text.split('=')[0] == 'check'){
            let id = text.split('=')[1]
            let check = await prisma.masters.findFirst({where: {id:+id}})

            if (check?.is_verified === true) {
                bot.deleteMessage(chat_id, msgId)
                bot.sendMessage(chat_id, "🥳 Tabriklaymiz siz tekshiruvdan o'tdingiz", {
                    reply_markup: homeMaster
                })
            } else if (check?.is_verified === false) {
                return bot.answerCallbackQuery(msg.id, { text: "‼️ Admin Tomonodan hali ko`rib chiqilmagan", show_alert:true });
            } else {
                bot.deleteMessage(chat_id, msgId)
                bot.sendMessage(chat_id, "❌ Kechirasiz sizni arizangiz bekor qilindi", {
                    reply_markup: starthome
                })
            }
        }  
    } catch (error) {
        console.log(error);
    }
}

