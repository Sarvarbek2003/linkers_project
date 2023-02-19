import { changeSteep, checkUser, selectService } from "../utils.js";
import { PrismaClient } from "@prisma/client";
import { cancel, chageInfo, homeMaster, nextBtn, starthome } from "../keyboards/keyboards.js";

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
            changeSteep(user, [
                "home",
                "workSpace",
                "changeDate"
            ], true)

            let btns = await changeDate(msg)
            bot.sendMessage(chat_id, "📅 *Kerakli sanani tanlang*", {
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: btns
                } 
            })
        } else if (text == '🏆 Reyting'){
            let master = await prisma.masters.findFirst({where: { user_id: chat_id }})
            changeSteep(user, ['home', 'workspace'], true)
            let reyting = (master.rating / master.rating_count).toFixed(2)
            let stars = []
            for (let i = 0; i < reyting; i++) {
                stars.push('⭐️')
            }
            let txt = stars.join('') + ' ' + reyting
            return bot.sendMessage(chat_id, `*🎖 Sizning darajangiz\n\n🏆 Reyting: ${txt}*`, {parse_mode:'Markdown'})
        } else if (text == '🖋 Ma\'lumotlatni o\'zgartirish'){
            changeSteep(user, 'changeInfo')
            bot.sendMessage(chat_id, "*O'zgartirmochi bo'lgan ma'lumotingizni tanlang*👇",{
                parse_mode: 'Markdown',
                reply_markup: chageInfo
            })
        } else if (st == 'edit_number_master'){
            await prisma.masters.updateMany({
                where: { user_id: chat_id },
                data: { phone_number: text },
            });
            bot.sendMessage(chat_id, "✅ Muvoffaqyatli saqlandi",)
        }
        else if (st == 'changeDate'){
            changeSteep(user, 'changeTime')
            let master = await prisma.masters.findFirst({where:{user_id:chat_id}})
            let oldDateList = Object.keys(master?.ban_time_list)
            if (!oldDateList.includes(text) || oldDateList.length == 0) {
                master.ban_time_list[text] = []
                await prisma.masters.updateMany({where: { user_id: chat_id }, data:{ ban_time_list: master.ban_time_list } })
            }
            await prisma.users.updateMany({where: {user_id: chat_id}, data: {action: {date: text}}})
            let btns = await changeTime(msg)
            
            bot.editMessageText( "⏰ *Vaqtingizni boshqaring*\n_Vaqtlarni ustiga bosish orqali ularni band qilishigiz mumkin qaytarish uchun yana ustiga bosasiz_", {
                chat_id,
                message_id: msgId,
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: btns
                } 
            })
        } else if (text == 'changeDate'){
            steep.pop()
            let btns = await changeDate(msg)
            await changeSteep(user, steep, true)
            bot.editMessageText("📅 *Kerakli sanani tanlang*", {
                chat_id,
                message_id: msgId,
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: btns
                } 
            })
        } else if (st == 'changeTime') {
            let master = await prisma.masters.findFirst({where:{user_id:chat_id}})
            let ban_list = master.ban_time_list
            if(ban_list[user.action.date].includes(text)){
                let index = ban_list[user.action.date].indexOf(text)
                ban_list[user.action.date].splice(index, 1)
                await prisma.masters.updateMany({where:{user_id:chat_id}, data:{ban_time_list:ban_list}})
            } else  {
                ban_list[user.action.date].push(text)
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
        } else if (text.split('-')[0] == 'edit' && st == 'changeInfo'){
            changeInfo(msg, text.split('-')[0])
        }
    } catch (error) {   
         console.log('error',error);
    }
}

const changeTime = async(data) => {
    try {
        const chat_id = data.from.id
        let user = await prisma.masters.findFirst({where: {user_id:chat_id }})
        let master = await prisma.users.findFirst({where: {user_id:chat_id }})
        console.log(user,  master);
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
                    text: time + ' ' +(ban_list[master.action.date].includes(time) ? '❌':''),
                    callback_data: time
                })
            } else if (min > 60){
                while (min > 60) {
                    min = min - 60
                    start_time_hour++
                }
                let time = `${start_time_hour}`.padStart(2,'0')+':'+`${min}`.padStart(2,'0')
                array.push({
                    text: time+ ' ' + (ban_list[master.action.date].includes(time) ? '❌':''),
                    callback_data: time
                })
            } else {
                let time = `${start_time_hour}`.padStart(2,'0')+':'+`${min}`.padStart(2,'0')
                array.push({
                    text: time + ' ' + (ban_list[master.action.date].includes(time) ? '❌':''),
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
        responseArray.push([{text: "🔙 Ortga", callback_data:"changeDate"}])
        return responseArray
    } catch (error) {
        console.log('err', error);
        return []
    }
}

const changeDate = async (data) => {
    try {
        const chat_id = data.from.id
        let dateList = []
        let getTime = new Date().getTime()
        for (let i = 0; i < 7; i++) {
            dateList.push(new Date(getTime).toLocaleDateString())
            getTime += 86400000
        }

        let count = 2
        let responseArray = []
        let arr = []
        for (const el of dateList) {
            if (count > 0) {
                arr.push({text: el, callback_data: el});
                count--;
              } else {
                responseArray.push(arr);
                arr = [];
                count = 1;
                arr.push({text: el, callback_data: el});
              }
        }
        responseArray.push(arr);
        console.log(responseArray);
        return responseArray
    } catch (error) {
        console.log("🚀 ~ file: works.js:149 ~ changeDate ~ error", error)
        
    }
}

const changeInfo = async (data, event) => {
    try {
        const chat_id = data.from.id;
        if(event == 'phone') {
            await changeSteep(user, "edit_number_master");
            bot.sendMessage(chat_id, "*Telefon raqamingizni yozing*", {
                parse_mode: "Markdown",
            })
        }


    } catch (error) {
        
    }
}