import { Telegraf } from 'telegraf'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const app = new Telegraf('5924672133:AAFr2B8uMN03TkqqTeiuq-kXYAkSdgCWpXo')

import adminPanel from './admin/admin.js'

app.command('start', async ctx => {
    await changeSteep(user, 'admin')
    await adminPanel(ctx)

    bot.sendMessage(chat_id, "Assalomualekum xi MAISHIY XIZMATLAR uchun yartilgan botimizga hush kelibsiz\nKim bo'lib kirmoqchisiz",{
        reply_markup:{
            resize_keyboard: true,
            keyboard:[
                [{text: "Usta"}, {text:"Mijoz"}]
            ]
        }
    })
})

app.hears('Usta', async ctx => {
    const bot = ctx.telegram
    const msg = ctx.message    
    const chat_id = msg.from.id

    const user = await checkUser(msg)
    await changeSteep(user, 'choose-service')

    let keyboard = await selectService()
    console.log('keyboard31', keyboard);
    bot.sendMessage(chat_id, "Qaysi turdagi xizmatni ko`rsatasiz",{
        reply_markup: {
            inline_keyboard: keyboard
        }
    })
})

app.hears('Mijoz', ctx => {
    
})


app.on('text', async (ctx) => {
    const bot = ctx.telegram
    const msg = ctx.message    

    const text = msg.text
    const chat_id = msg.from.id
    const user = await checkUser(msg)
    const steep = user.steep
    const st = steep[steep.length-1]

})

app.on('callback_query',async ctx => {
    const bot = ctx.telegram
    const msg = ctx.update 
    const chat_id = msg.callback_query.from.id
    const msgId = msg.callback_query.message.message_id
    const user = await checkUser(msg.callback_query)
    console.log('user', msg);
    const data = msg.callback_query.data

    if(data.split('=')[0]=='prev'){
        if (data.split('=')[1] == 0) {
            return bot.answerCbQuery(msg.callback_query.id, "Bu oxirgi saxifa")
        }
        let keyboard = await selectService(data.split('=')[1])
        console.log('keyboard87', keyboard);
        
        bot.editMessageText( chat_id, msgId, null,"Qaysi turdagi xizmatni ko`rsatasiz").then(data => {
            bot.editMessageReplyMarkup(chat_id, msgId, null,{inline_keyboard:keyboard})
        })
        

    } else if(data.split('=')[0]=='next'){
        let keyboard = await selectService(data.split('=')[1])
        console.log('keyboard97', keyboard);

        await bot.editMessageText( chat_id, msgId, null,"Qaysi turdagi xizmatni ko`rsatasiz" ).then(data => {
            bot.editMessageReplyMarkup(chat_id, msgId, null,{inline_keyboard:keyboard})
        })

    }
})

const selectService = async(page = 1) => {
    try {
        let services = await prisma.services.findMany()
        services = services.slice(+page * 10 - 10, 10 * +page)
        let array = []
        let arr = []
        let count = 2
        services.forEach(el => { 
            if (count > 0) {
                arr.push({ text: el.service_name, callback_data:`${el.id}` })           
                count --
            } else {
                array.push(arr)
                arr = []
                count = 1
                arr.push({ text: el.service_name, callback_data:`${el.id}` })     
            }

        });

        array.push(arr)
        array.push([{text: "⏪ Oldingisi", callback_data: 'prev='+(+page-1)}, {text: '⏩ Keyingisi', callback_data: 'next='+(+page+1)}])

        return array
    } catch (error) {
        console.log(error);
        return []
    }
}


const checkUser = async(data) => {
    try {
        const chat_id = data.from.id
        const user = await prisma.users.findFirst({where: {user_id: chat_id}})

        if(user){
            return user
        } else {
            let user = await prisma.users.create({data: {
                user_id: chat_id,
                steep: ['home']
            }})

            return user
        }

    } catch (error) {
        return 0
    }
}

const changeSteep =async (user, steep, steepHome = false) => {
    try {
        
        let steeps = user.steep
        steepHome ? steeps = user.steep : steeps.push(steep)
        await prisma.users.update({where: {
                user_id: user.user_id
            },
            data:{
                steep:steeps
            }
        })
    } catch (error) {
        return 0
    }
}

export {
    changeSteep, app
}
app.launch();

// Enable graceful stop
process.once('SIGINT', () => app.stop('SIGINT'));
process.once('SIGTERM', () => app.stop('SIGTERM'));