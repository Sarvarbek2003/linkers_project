import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const selectService = async (page = 1) => {
    try {
      let services = await prisma.services.findMany();
      services = services.slice(+page * 10 - 10, 10 * +page);
      if(!services.length) return [[]]
      let array = [];
      let arr = [];
      let count = 2;
      services.forEach((el) => {
        if (count > 0) {
          arr.push({ text: el.service_name, callback_data: `${el.id}` });
          count--;
        } else {
          array.push(arr);
          arr = [];
          count = 1;
          arr.push({ text: el.service_name, callback_data: `${el.id}` });
        }
      });
  
      array.push(arr);
      array.push([
        { text: "⏪ Oldingisi", callback_data: "prev=" + (+page - 1) },
        {
          text: "⏩ Keyingisi",
          callback_data: "next=" + (+page + 1),
        },
      ]);
  
      return array;
    } catch (error) {
      console.log(error);
      return [];
    }
};

const selectMaster = async (page = 1) => {
try {
    let services = await prisma.masters.findMany();
    services = services.slice(+page * 5 - 5, 5 * +page);
    let array = [];
    if(!services.length) return [[]]
    services.forEach((el) => {
    array.push([
        {
        text: el.name + " 🎖" + el.rating / el.rating_count,
        callback_data: `${el.id}`,
        },
    ]);
    });

    array.push([
    { text: "⏪", callback_data: "prev_m=" + (+page - 1) },
    {
        text: "⏩",
        callback_data: "next_m=" + (+page + 1),
    },
    ]);

    return array;
} catch (error) {
    console.log(error);
    return [];
}
};

const checkUser = async (data) => {
try {
    const chat_id = data.from.id;
    const user = await prisma.users.findFirst({ where: { user_id: chat_id } });

    if (user) {
    return user;
    } else {
    let user = await prisma.users.create({
        data: {
        user_id: chat_id,
        steep: ["home"],
        },
    });

    return user;
    }
} catch (error) {
    return 0;
}
};

const changeSteep = async (user, steep, steepHome = false) => {
try {
    let us = await prisma.users.findFirst({where: {user_id: user.user_id}})
    let st = us.steep[us.steep.length -1]

    let steeps = user.steep;
    if (st != steep) steepHome ? steeps = typeof steep == 'object' ? steep : [steep] : steeps.push(steep);
    else return

    await prisma.users.updateMany({
        where: {
            user_id: user.user_id,
        },
        data: {
            steep: steeps,
        },
    });
} catch (error) {
    return 0;
}
};

export {
    selectService, selectMaster, checkUser, changeSteep
}