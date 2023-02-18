import { PrismaClient } from "@prisma/client";
import { Markup } from "telegraf";

const prisma = new PrismaClient();
export default async (ctx) => {
  try {

    await ctx.reply(
      "Admin Bo'limiga hush kelibsiz!\nKerakli bo'limni tanlang!"
    );
  } catch (e) {
    console.log(e);
  }
};


async function showMasters(ctx) {
  try {
    const masters = await prisma.masters.findMany();
    ctx.reply("Ustalar ro'yhati:\n", ...Markup.keyboard([]));
  } catch (e) {
    console.log(e)
  }
}
