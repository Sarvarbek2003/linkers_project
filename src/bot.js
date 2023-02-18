import { Telegraf } from 'telegraf'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const app = new Telegraf('5924672133:AAFr2B8uMN03TkqqTeiuq-kXYAkSdgCWpXo')

import adminPanel from './admin/admin.js'

app.on('text', async (ctx) => {
    const bot = ctx.telegram
    const msg = ctx.message    

    const text = msg.text
    const chat_id = msg.from.id
    const first_name = msg.from.first_name
    const user = await checkUser(msg)
    const steep = user.steep
    const st = steep[steep.length-1]

    if ((text == '/admin' && user.is_admin) || steep[1] == 'admin') {
        await changeSteep(user, 'admin')
        await adminPanel(ctx)
    } 
})


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

const changeSteep =async (user, steep) => {
    try {
        
        let steep = user.steep
        steep.push(steep)
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