const { Telegraf } = require('telegraf');

const app = new Telegraf('5924672133:AAFr2B8uMN03TkqqTeiuq-kXYAkSdgCWpXo')

app.on('text', ctx => {
    const bot = ctx.telegram
    const msg = ctx.message
})