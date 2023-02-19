import { changeSteep, checkUser, selectService } from "../utils.js";
import { PrismaClient } from "@prisma/client";
import { cancel, changeInfobtn, homeMaster, nextBtn, starthome } from "../keyboards/keyboards.js";

const prisma = new PrismaClient();

export const works = async(bot, msg) => {
    try {
        const text = msg?.text || msg?.data;
        const chat_id = msg.from.id;
        const user = await checkUser(msg);
        const msgId = msg?.message?.message_id

        const steep = user?.steep || [];
        const st = steep[(steep?.length || 1) - 1];
        let edit_steps = ['name', 'edit_wokrshop_name', 'edit_address', 'edit_landmark', 'edit_start_time', 'edit_end_time', 'edit_time_per_cost']
        if (st == 'home') {
            changeSteep(user, 'workSpace')
            bot.sendMessage(chat_id, "📂 *Ish stolingizga hush kelibsiz*", {
                parse_mode: "Markdown",
                reply_markup: homeMaster
            })
        } else if (text == '👥 Mijozlar'){
            let txt = await myClient(msg)
            bot.sendMessage(chat_id, "📂 <b>Mijozlar ro'yhati</b>\n"+(txt == '' ? 'bo\'sh':txt), {
                parse_mode: "HTML",
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
            changeSteep(user, ['home', 'workSpace'], true)
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
                reply_markup: changeInfobtn
            })
        } else if (st == 'edit_number_master'){
            if (!/^\+998(9[012345789]|3[3]|5[5]|7[7,1,0]|8[8])[0-9]{7}$/.test(text)) {
                return bot.sendMessage(chat_id, "*‼️ Telefon raqamingizni operator kodi va (+) bilan to'g'ri kiriting*\n_Namuna: +998901234567_", {
                    parse_mode:'Markdown'
                })
            }
            await prisma.masters.updateMany({
                where: { user_id: chat_id },
                data: { phone_number: text },
            });
            bot.sendMessage(chat_id, "✅ Muvoffaqyatli saqlandi",{
                reply_markup: changeInfobtn
            })
        } else if (st == 'changeDate'){
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
            change_info(bot, msg, text.split('-')[1])
        } else if (edit_steps.includes(st)){
            edit_Info(bot, msg)
        }
    } catch (error) {   
         console.log('error',error);
    }
}

const myClient = async(data) => {
    try {
        const chat_id = data.from.id;
        let clients = await prisma.orders.findMany({
            where: { AND: {master_id: chat_id, status:'active', time: {gte: new Date().getTime()}} }, 
            orderBy: [{time:'asc'}]
        })
        let txt = ''
        let index = 1
        for (const client of clients) {
            let user = await prisma.users.findFirst({where: {user_id: client.customer_id}})
            txt += `<b>${index}).</b> 👤<b> Ismi:</b> ${user.first_name}\n📆<b> Sanasi </b>${new Date(parseInt(client.time)).toLocaleString()}\n📞<b> Tel:</b> ${user.phone_number}\n🟰🟰🟰🟰🟰🟰🟰🟰🟰🟰\n`
            index++
        }
        return txt
        
    } catch (error) {
        console.log(error);
        return ''
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

const change_info = async (bot, data, event) => {
    try {
        const chat_id = data.from.id;
        const msgId = data?.message?.message_id
        let user = await checkUser(data)
        bot.deleteMessage(chat_id, msgId)
        if(event == 'phone') {
            await changeSteep(user, "edit_number_master");
            bot.deleteMessage(chat_id, msgId)
            bot.sendMessage(chat_id, "*📞 Telefon raqamingizni operator kodi va (+) bilan to'g'ri kiriting*\n_Namuna: +998901234567_", {
                parse_mode: "Markdown",
            })
        } else if (event == 'name'){
            await changeSteep(user,'edit_wokrshop_name')
            bot.sendMessage(chat_id, "🏠 *Ismingizni yozing*",{parse_mode: "Markdown"})
        } else if (event == 'address'){
            await changeSteep(user,'edit_address')
            bot.sendMessage(chat_id, "🏠 *Ustaxonani yangi manzilini yozing*",{parse_mode: "Markdown"})
        } else if (event == 'landmark'){
            await changeSteep(user,'edit_landmark')
            bot.sendMessage(chat_id, "🏠 *Ustaxonani topish uchun mo'ljalni yozing*",{parse_mode: "Markdown"})
        } else if (event == 'location'){
            await changeSteep(user,'edit_location')
            bot.sendMessage(chat_id, "🕹 *Ustaxonani localtsyasini tashlang*", {parse_mode: 'Markdown', reply_markup:  [[{text:"🕹 Location", request_location: true}]]})
        } else if (event == 'start_time'){
            await changeSteep(user,'edit_start_time')
            bot.sendMessage(chat_id, "🏠 *Ish boshlash vaqtiningizni kiriting*",{parse_mode: "Markdown"})
        } else if (event == 'end_time'){
            await changeSteep(user,'edit_end_time')
            bot.sendMessage(chat_id, "🏠 *Ishni yakunlash vaqtiningizni kiriting*",{parse_mode: "Markdown"})
        } else if (event == 'time_per_cost'){
            await changeSteep(user,'edit_time_per_cost')
            bot.sendMessage(chat_id, "🏠 *Har bir mijoz uchun o'rtacha ish vaqti minutda kiriting*",{parse_mode: "Markdown"})
        } else if (event == 'cancel'){
            await changeSteep(user,['home', 'workSpace'], true)
            bot.sendMessage(chat_id, "🏠 *Bosh menu*",{parse_mode: "Markdown"})
        }

    } catch (error) {
        console.log(error);
    }
}

const edit_Info = async(bot, msg) => {
    try {
        const text = msg.text
        const chat_id = msg.from.id;
        const msgId = msg?.message?.message_id
        let user = await checkUser(msg)
        const steep = user?.steep || [];
        const st = steep[(steep?.length || 1) - 1];
        steep.pop()
        await changeSteep(user, steep, true)
        if (st == 'name'){
            await prisma.masters.updateMany({
                where: {
                    user_id:chat_id
                },
                data: {
                    name: text
                }
            })
            bot.sendMessage(chat_id, "✅ Muvoffaqyatli saqlandi",{
                reply_markup: changeInfobtn
            })
            
        } else if(st == 'edit_wokrshop_name'){
            await prisma.masters.updateMany({where:{user_id:chat_id}, data:{workshop_name: text}})
            bot.sendMessage(chat_id, "✅ Muvoffaqyatli saqlandi",{
                reply_markup: changeInfobtn
            })
        }
        else if(st == 'edit_address'){
            await prisma.masters.updateMany({where:{user_id:chat_id}, data:{address: text}})
            bot.sendMessage(chat_id, "✅ Muvoffaqyatli saqlandi",{
                reply_markup: changeInfobtn
            })
        }
        else if(st == 'edit_landmark'){
            await prisma.masters.updateMany({where:{user_id:chat_id}, data:{landmark: text}})
            bot.sendMessage(chat_id, "✅ Muvoffaqyatli saqlandi",{
                reply_markup: changeInfobtn
            })
        }
        else if(st == 'edit_start_time'){
            await prisma.masters.updateMany({where:{user_id:chat_id}, data:{start_time: text}})
            bot.sendMessage(chat_id, "✅ Muvoffaqyatli saqlandi",{
                reply_markup: changeInfobtn
            })
        }
        else if(st == 'edit_end_time'){
            await prisma.masters.updateMany({where:{user_id:chat_id}, data:{end_time: text}})
            bot.sendMessage(chat_id, "✅ Muvoffaqyatli saqlandi",{
                reply_markup: changeInfobtn
            })
        }
        else if(st == 'edit_time_per_cost'){
            await prisma.masters.updateMany({where:{user_id:chat_id}, data:{end_time: text}})
            bot.sendMessage(chat_id, "✅ Muvoffaqyatli saqlandi",{
                reply_markup: changeInfobtn
            })
        }
    } catch (error) {
        
    }
}