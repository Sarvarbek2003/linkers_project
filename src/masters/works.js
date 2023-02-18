import { changeSteep, checkUser, selectService } from "../utils.js";
import { PrismaClient } from "@prisma/client";
import { cancel, homeMaster, nextBtn, starthome } from "../keyboards/keyboards.js";

const prisma = new PrismaClient();

export const works = async(bot, msg) => {
    try {
        const text = msg?.text || msg?.data;
        const chat_id = msg.from.id;
        const user = await checkUser(msg);
        const msgId = msg?.message?.message_id

        const steep = user?.steep || [];
        const st = steep[(steep?.length || 1) - 1];

        if (st == 'home') {
            changeSteep(user, 'workSpace')
            bot.sendMessage(chat_id, "📂 *Ish stolingizga hush kelibsiz*", {
                parse_mode: "Markdown",
                reply_markup: homeMaster
            })
        } else if (text == '👥 Mijozlar'){
            changeSteep(user, 'workSpace')

            bot.sendMessage(chat_id, "📂 *Mijozlar ro'yhati*", {
                parse_mode: "Markdown",
                reply_markup: homeMaster
            })
        } else if (text == '⏰ Vaqt'){
            changeSteep(user, 'changeTime')
            let btns = await changeTime(msg)
            bot.sendMessage(chat_id, "⏰ *Vaqtingizni boshqaring*\n_Vaqtlarni ustiga bosish orqali ularni band qilishigiz mumkin qaytarish uchun yana ustiga bosasiz_", {
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: btns
                } 
            })
        } else if (st == 'changeTime') {
            let master = await prisma.masters.findFirst({where:{user_id:chat_id}})
            let ban_list = master.ban_time_list
            if(master.ban_time_list.includes(text)){
                let index = ban_list.indexOf(text)
                ban_list.splice(index, 1)
                await prisma.masters.updateMany({where:{user_id:chat_id}, data:{ban_time_list:ban_list}})
            } else  {
                ban_list.push(text)
                await prisma.masters.updateMany({where:{user_id:chat_id}, data:{ban_time_list:ban_list}})
            }
            
            let btn = await changeTime(msg)
            bot.editMessageText("⏰ *Vaqtingizni boshqaring*\n_Vaqtlarni ustiga bosish orqali ularni band qilishigiz mumkin qaytarish uchun yana ustiga bosasiz_", {
                parse_mode: 'Markdown',
                chat_id, 
                message_id: msgId,
                reply_markup: {
                    inline_keyboard: btn
                }
            })

        }
    } catch (error) {   
         console.log('error',error);
    }
}

const changeTime = async(data) => {
    try {
        const chat_id = data.from.id
        let user = await prisma.masters.findFirst({where: {user_id:chat_id }})
        
        let start_time_hour = parseInt(user.start_time.split(':')[0])
        let start_time_minute = parseInt(user.start_time.split(':')[1])
        let end_time_hour = parseInt(user.end_time.split(':')[0])
        
        let time_per_cutomer = parseInt(user.time_per_cutomer)
        let ban_list = user.ban_time_list

        let array = []
        for (let min = start_time_minute; start_time_hour < end_time_hour; ) {
            min += time_per_cutomer
            if (min == 60){
                min = 0
                start_time_hour++
                let time = `${start_time_hour}`.padStart(2,'0')+':'+`${min}`.padStart(2,'0')
                array.push({
                    text: time + ' ' +(ban_list.includes(time) ? '❌':''),
                    callback_data: time
                })
            } else if (min > 60){
                while (min > 60) {
                    min = min - 60
                    start_time_hour++
                }
                let time = `${start_time_hour}`.padStart(2,'0')+':'+`${min}`.padStart(2,'0')
                array.push({
                    text: time+ ' ' + (ban_list.includes(time) ? '❌':''),
                    callback_data: time
                })
            } else {
                let time = `${start_time_hour}`.padStart(2,'0')+':'+`${min}`.padStart(2,'0')
                array.push({
                    text: time + ' ' + (ban_list.includes(time) ? '❌':''),
                    callback_data: time
                })
            }
        }
        let count = 2
        let responseArray = []
        let arr = []
        for (const obj of array) {
            if (count > 0) {
                arr.push(obj);
                count--;
              } else {
                responseArray.push(arr);
                arr = [];
                count = 1;
                arr.push(obj);
              }
        }

        responseArray.push(arr);
        return responseArray
    } catch (error) {
        console.log('err', error);
        return []
    }
}