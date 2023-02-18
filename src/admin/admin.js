import { PrismaClient } from "@prisma/client";
import { keyboards } from "../keyboards/keyboards.js";
import { changeSteep } from "../bot.js";

const prisma = new PrismaClient();
export default async (ctx) => {
  try {
    const bot = ctx.telegram;
    const msg = ctx.message;

    const text = msg.text;
    const chat_id = msg.from.id;
    const first_name = msg.from.first_name;
    const user = await prisma.users.findFirst({
      where: {
        user_id: chat_id,
      },
    });
    await ctx.reply(
      "Admin Bo'limiga hush kelibsiz!\nKerakli bo'limni tanlang!",
      keyboards.adminHome
    );
    await changeSteep(user, "masters");
  } catch (e) {
    console.log(e);
  }
};

async function showMasters(ctx) {
  try {
    const masters = await prisma.masters.findMany();
    ctx.reply("Ustalar ro'yhati:\n");
  } catch (e) {
    console.log(e);
  }
}

export async function onMaster(ctx) {
  console.log("Kirdi")
  await ctx.reply("Ustalar bo'limi", keyboards.on_masters);
}


async function addMaster(ctx) {
  try {
  } catch (e) {
    console.log(e);
  }
}
