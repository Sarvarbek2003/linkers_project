import { Telegraf } from 'telegraf'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const app = new Telegraf('5924672133:AAFr2B8uMN03TkqqTeiuq-kXYAkSdgCWpXo')

import adminPanel from './admin/admin.js'

app.command('admin', async ctx => {
    await changeSteep(user, 'admin')
    await adminPanel(ctx)
})

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
    console.log(ctx);
    const user = await checkUser(msg)
    await changeSteep(user, 'choose-service')

    let keyboard = await selectService()
    bot.sendMessage(chat_id, "Qaysi turdagi xizmatni ko`rsatasiz",{
        reply_markup: {
            inline_keyboard: keyboard.keyboard
        }
    })
})

app.hears('Mijoz', ctx => {
    
})

app.action('⏩ Keyingisi', async ctx => {
    const bot = ctx.telegram
    const msg = ctx.message    
    const chat_id = msg.from.id
    const user = await checkUser(msg)
    await changeSteep(user, 'choose-service')

    let btn = await selectService()
    console.log(btn);
    bot.sendMessage(chat_id, "Qaysi turdagi xizmatni ko`rsatasiz",{
        reply_markup: {
            resize_keyboard:true,
            keyboard: btn
        }
    })
})

app.action('⏪ Oldingisi',ctx => {
    
})

app.on('text', async (ctx) => {
    const bot = ctx.telegram
    const msg = ctx.message    

    const text = msg.text
    const chat_id = msg.from.id
    const first_name = msg.from.first_name
    const user = await checkUser(msg)
    const steep = user.steep
    const st = steep[steep.length-1]

})



const selectService = async(page = 1) => {
    try {
        let services = await prisma.services.findMany({skip: page, take: 5})
        let array = []
        services.forEach(el => { 
            array.push([{ text:el.service_name, callback_data:el.id }, {text: el.service_name, callback_data:el.id}])           
        });

        array.push([{text: "⏪ Oldingisi", callback_data: 'prev='+page-1}, {text: '⏩ Keyingisi', callback_data:  'next='+page+1}])
        return {keyboard: array, page}
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
        
        let steep = user.steep
        steepHome ? steep = user.steep : steep.push(steep)
        await prisma.users.update({where: {
                user_id: user.user_id
            },
            data:{
                steep
            }
        })
    } catch (error) {
        return 0
    }
}

export {
    changeSteep
}
app.launch();

// Enable graceful stop
process.once('SIGINT', () => app.stop('SIGINT'));
process.once('SIGTERM', () => app.stop('SIGTERM'));