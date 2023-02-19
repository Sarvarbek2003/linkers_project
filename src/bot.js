import TelegramBot from "node-telegram-bot-api";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();
const TOKEN = process.env.BOT_TOKEN;
const prisma = new PrismaClient();

const bot = new TelegramBot(TOKEN, { polling: true });

import adminPanel from "./admin/admin.js";

import {
  selectService,
  checkUser,
  changeSteep,
  selectMaster,
} from "./utils.js";
import {getMastersDataByName, getMastersDataByPhone, mastersData} from "./orders/orders.js";
import { customerRegister } from "./users/users.js";
import { masterRegister, works } from "./masters/index.js";
import { cancel, nextBtn, starthome } from "./keyboards/keyboards.js";

bot.on("text", async (msg) => {
  const text = msg.text;
  const chat_id = msg.from.id;
  const user = await checkUser(msg);
  const steep = user?.steep || [];
  const st = steep[(steep?.length || 1) - 1];

  if (text == "/start") {
    await changeSteep(user, "home", true);
    bot.sendMessage(
        chat_id,
        "👋Assalomualekum *MAISHIY XIZMATLAR* uchun yartilgan botimizga hush kelibsiz\n*Kim bo'lib kirmoqchisiz*",
        {
          parse_mode: 'Markdown',
          reply_markup: starthome,
        }
    );
  } else if ((text == "/admin" && user.is_admin) || steep[1] == "admin") {
    if (text == "/admin") {
      await changeSteep(user, "home", true);
    }
    await adminPanel(bot, msg);
  } else if (
      text == "🧑‍🚒 Usta" ||
      steep[1] == "choose-service" ||
      steep[1] == "workSpace"
  ) {
    if (text == "❌ Bekor qilish") {
      await changeSteep(user, "home", true);
      await prisma.masters.deleteMany({ where: { is_verified: false } });

      return bot.sendMessage(chat_id, "🔒 *Ro'yhatdan o'tish*", {
        parse_mode: "Markdown",
        reply_markup: starthome,
      });
    }

    try {
      let is_master = await prisma.masters.findFirst({
        where: { AND: { user_id: chat_id, is_verified: true } },
      });
      is_master ? works(bot, msg) : masterRegister(bot, msg);
    } catch (error) {}
  } else if (text == "👤 Mijoz" || steep[1] == "client") {
    await customerRegister(bot, msg);
  }
});

bot.on("contact", async (msg) => {
  const chat_id = msg.from.id;
  const user = await checkUser(msg);
  const steep = user?.steep || [];
  const st = steep[(steep?.length || 1) - 1];
  const phone_number = msg.contact.phone_number;

  if (st === "client_enter_name") {
    await prisma.users.updateMany({
      where: { user_id: chat_id },
      data: { phone_number: phone_number },
    });

    await changeSteep(user, "client_enter_phone_number");
    await bot.sendMessage(chat_id, "Quyidagi xizmatlardan birini tanlang👇", {
      reply_markup: {
        resize_keyboard: true,
        keyboard: [
          [{ text: "Xizmatlar" }, { text: "Tanlangan xizmatlar" }],
          [{ text: "Malumotlarni o'zgartirish" }],
        ],
      },
    });
  } else if (st == "phone_number_master") {
    await prisma.users.updateMany({
      where: { user_id: chat_id },
      data: { phone_number: phone_number },
    });
    await prisma.masters.updateMany({
      where: { user_id: chat_id },
      data: { phone_number: phone_number },
    });

    bot.sendMessage(
        chat_id,
        "*📋 Ustaxona nomini kiriting (Bu majburiy emas)*",
        {
          parse_mode: "Markdown",
          reply_markup: nextBtn,
        }
    );
    await changeSteep(user, "workshop_name");
  }
});

bot.on("callback_query", async (msg) => {
  const chat_id = msg.from.id;
  const msgId = msg?.message?.message_id;
  const user = await checkUser(msg);
  const steep = user?.steep || [];
  const st = steep[(steep?.length || 1) - 1];

  const data = msg.data;
  if (
      ["notconfirm_admin", "confirm_admin", "check"].includes(data.split("=")[0])
  ) {
    masterRegister(bot, msg);
  }

  if (data.split("=")[0] == "prev") {
    if (data.split("=")[1] == 0) {
      return bot.answerCallbackQuery(msg.id, { text: "Bu ohirgi sahifa!" });
    }

    let keyboard = await selectService(data.split("=")[1]);

    if (steep[1] === "client") {
      bot.editMessageText("Quyidagi xizmatlardan birini tanlang👇", {
        chat_id,
        message_id: msgId,
        reply_markup: {
          inline_keyboard: keyboard,
        },
      });
    } else {
      bot.editMessageText("Qaysi turdagi xizmatni ko`rsatasiz", {
        chat_id,
        message_id: msgId,
        reply_markup: {
          inline_keyboard: keyboard,
        },
      });
    }
  } else if (data.split("=")[0] == "next") {
    let keyboard = await selectService(data.split("=")[1]);
    if (keyboard[0].length == 0) {
      return bot.answerCallbackQuery(msg.id, { text: "Bu ohirgi sahifa!" });
    }
    if (steep[1] === "client") {
      bot.editMessageText("Quyidagi xizmatlardan birini tanlang👇", {
        chat_id,
        message_id: msgId,
        reply_markup: {
          inline_keyboard: keyboard,
        },
      });
    } else {
      bot.editMessageText("Qaysi turdagi xizmatni ko`rsatasiz", {
        chat_id,
        message_id: msgId,
        reply_markup: {
          inline_keyboard: keyboard,
        },
      });
    }
  } else if (data.split("=")[0] == "next_m") {
    let keyboard = await selectMaster(data.split("=")[1]);
    if (keyboard[0].length == 0) {
      return bot.answerCallbackQuery(msg.id, { text: "Bu ohirgi sahifa!" });
    }
    bot.editMessageText("Ustalar ro'yhati", {
      chat_id,
      message_id: msgId,
      reply_markup: {
        inline_keyboard: keyboard,
      },
    });
  } else if (data.split("=")[0] == "prev_m") {
    if (data.split("=")[1] == 0) {
      return bot.answerCallbackQuery(msg.id, { text: "Bu ohirgi sahifa!" });
    }
    let keyboard = await selectMaster(data.split("=")[1]);

    bot.editMessageText("Ustalar ro'yhati", {
      chat_id,
      message_id: msgId,
      reply_markup: {
        inline_keyboard: keyboard,
      },
    });
  }
  else if (data.split("=")[0] == "next_lc") {
    let keyboard = await selectSortMaster(msg, data.split("=")[1]);
    console.log(keyboard);
    if (keyboard[0].length == 0) {
      return bot.answerCallbackQuery(msg.id, { text: "Bu ohirgi sahifa!" });
    }

    bot.editMessageText("Ustalar ro'yhati", {
      chat_id,
      message_id: msgId,
      reply_markup: {
        inline_keyboard: keyboard,
      },
    });
  } else if (data.split("=")[0] == "prev_lc") {
    if (data.split("=")[1] == 0) {
      return bot.answerCallbackQuery(msg.id, { text: "Bu ohirgi sahifa!" });
    }
    let keyboard = await selectSortMaster(msg, data.split("=")[1]);

    bot.editMessageText("Ustalar ro'yhati", {
      chat_id,
      message_id: msgId,
      reply_markup: {
        inline_keyboard: keyboard,
      },
    });
  } else if (st == "choose-service") {
    await changeSteep(user, "master_name");
    try {
      await prisma.masters.create({
        data: { user_id: chat_id, service_id: +data, ban_time_list: {} },
      });
    } catch (error) {}
    bot.deleteMessage(chat_id, msgId);
    bot.sendMessage(chat_id, "🖌 *Ismingizni kiriging*", {
      parse_mode: "Markdown",
      reply_markup: cancel,
    });
  } else if (steep[1] == "admin") {
    await adminPanel(bot, msg);
  } else if (steep[1] == "choose-service" || steep[1] == "workSpace") {
    try {
      let is_master = await prisma.masters.findFirst({
        where: { AND: { user_id: chat_id, is_verified: true } },
      });
      is_master ? works(bot, msg) : masterRegister(bot, msg);
    } catch (error) {}
  } else if (st === "select_service_user" && data !== "user_back_home") {
    await mastersData(bot, msg);
  } else if (data === "user_back_home") {
    await customerRegister(bot, msg);
  } else if (/user_select_master_location-(\d+)/.test(data)){
    const id = data.split('-')[1]
    const readyMaster = await prisma.masters.findFirst({
      where: {
        id: +id,
      }
    })
    console.log(readyMaster)
    await bot.sendLocation(chat_id, readyMaster.latitude, readyMaster.longtitude)
  } else if(/user_select_time_master-(\d+)/.test(data)){
    let btns = await changeDate(msg)
    const id = data.split('-')[1]
    await prisma.users.updateMany({where:{user_id:chat_id}, data: {action: {master_id: id}}})

    await  changeSteep(user, 'changeTime')
    let master = await prisma.masters.findFirst({where:{id:+id}})
    console.log('masters',master)
    let oldDateList = Object.keys(master?.ban_time_list)

    if (!oldDateList.includes(data) || oldDateList.length == 0) {
      master.ban_time_list[data] = []
      await prisma.masters.updateMany({where: { id: +id }, data:{ ban_time_list: master.ban_time_list } })
    }
    await prisma.users.updateMany({where: {user_id: chat_id}, data: {action: {date: data}}})
    bot.sendMessage(chat_id, "📅 *Kerakli sanani tanlang*", {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: btns
      }
    })
  } else if (st == 'changeTime'){
    let btn = await changeTime(msg)
    bot.sendMessage(chat_id, "📅 *Kerakli vaqtni tanlang*", {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: btn
      }
    })
  }
  // console.log(steep)
});

bot.on("location", async (msg) => {
  try {
    const chat_id = msg.from.id;
    const { latitude, longitude } = msg.location;
    const user = await checkUser(msg);
    const steep = user?.steep || [];
    const st = steep[(steep?.length || 1) - 1];

    let locations = await prisma.masters.findMany({select:
          {latitude:true, longtitude: true, user_id: true, name: true, phone_number:true, rating:true, rating_count:true}
    })
    let users = findNearestLocation(locations, latitude, longitude)
    selectSortMaster(users)
    // console.log(users);
    if (st == "location_master") {
      await prisma.masters.updateMany({
        where: { user_id: chat_id },
        data: { latitude: `${latitude}`, longtitude: `${longitude}` },
      });
      bot.sendMessage(
        chat_id,
        "⏰ *Ishni boshlanish vaqtini kiriting*\n_Namuna: 09:00_",
        {
          parse_mode: "Markdown",
          reply_markup: cancel,
        }
      );
      await changeSteep(user, "start_time");
    } else if(st == 'edit_location'){
      await prisma.masters.updateMany({
        where: { user_id: chat_id },
        data: { latitude: `${latitude}`, longtitude: `${longitude}` },
      });
      bot.sendMessage(chat_id, "✅ Muvoffaqyatli saqlandi",{
        reply_markup: changeInfobtn
      })
    } else if (st == 'send_location'){

      await prisma.users.updateMany({where: {user_id: chat_id}, data: {action: {latitude, longitude}}})
      let btn = await selectSortMaster(msg)
      bot.sendMessage(chat_id, "📋 *Ustalar ro'yhati*", {parse_mode:'Markdown',reply_markup: {inline_keyboard: btn}})
    }
  } catch (error) {
    console.log(error);
  }
});

bot.on('inline_query',async (query)=> {
  const chat_id = query.from.id;
  const user = await checkUser(query);
  const steep = user?.steep || [];

  if (steep[1] == "admin") {
    await adminPanel(bot, query)
  }
  else if(steep[1] === 'client'){
    try {
      let result = [];
      const byName = /^#by_name\s(.+)/;
      const byPhone = /^#by_phone\s(.+)/;
      const text = query.query;
      const queryTextName = text.match(byName) ? text.match(byName)[1] : "";
      const queryTextPhone = text.match(byPhone) ? text.match(byPhone)[1] : "";
      if(queryTextName){
        result = await getMastersDataByName(queryTextName)
      }else if(queryTextPhone){
        result = await getMastersDataByPhone(queryTextPhone)
      }
      await bot.answerInlineQuery(query.id, result)
    }catch(e) {
      console.log(e)
    }
  }
})

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

function findNearestLocation(locations, latitude, longitude) {

  locations.forEach((location) => {
    const distance = calculateDistance(
        latitude,
        longitude,
        location.latitude,
        location.longtitude
    );
    location.distance = distance;
  });

  locations.sort((a, b) => a.distance - b.distance);
  return locations;
}

const selectSortMaster = async (msg, page = 1) => {
  try {
      let user = await checkUser(msg)
      let locations = await prisma.masters.findMany({select:
        {latitude:true, longtitude: true, user_id: true, name: true, phone_number:true, rating:true, rating_count:true}
      })
      let users = findNearestLocation(locations, user.action.latitude, user.action.longitude)
      let data = users.slice(+page * 10 - 10, 10 * +page);

      if (!data.length) return [[]];
      let responseArray = []
      for (const user of data) {
        responseArray.push([{text: user.name, callback_data: parseInt(user.user_id)}]);
      }

      responseArray.push([{ text: "⏪ Oldingisi", callback_data: "prev=" + (+page - 1) },{text: "⏩ Keyingisi",callback_data: "next=" + (+page + 1)}]);
      console.log(responseArray);
  } catch (error) {
    
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

const changeTime = async(data) => {
  try {
    const chat_id = data.from.id
    let master = await prisma.users.findFirst({where: {user_id:chat_id }})
    let user = await prisma.masters.findFirst({where: {id: +master.action.master_id }})
    console.log('user', user)
    let start_time_hour = parseInt(user.start_time.split(':')[0])
    let start_time_minute = parseInt(user.start_time.split(':')[1])
    let end_time_hour = parseInt(user.end_time.split(':')[0])

    let time_per_cutomer = parseInt(user.time_per_cutomer)
    let ban_list = user.ban_time_list
    console.log(master)
    let array = []
    for (let min = start_time_minute; start_time_hour < end_time_hour; ) {
      min += time_per_cutomer
      if (min == 60){
        min = 0
        start_time_hour++
        let time = `${start_time_hour}`.padStart(2,'0')+':'+`${min}`.padStart(2,'0')
        if (ban_list[master.action.date].includes(time)) return
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
        if (ban_list[master.action.date].includes(time)) return
        array.push({
          text: time+ ' ' + (ban_list[master.action.date].includes(time) ? '❌':''),
          callback_data: time
        })
      } else {
        let time = `${start_time_hour}`.padStart(2,'0')+':'+`${min}`.padStart(2,'0')
        if (ban_list[master.action.date].includes(time)) return
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
    responseArray.push([{text: "🔙 Ortga", callback_data:"master_changeDate"}])
    return responseArray
  } catch (error) {
    console.log('err', error);
    return []
  }
}
