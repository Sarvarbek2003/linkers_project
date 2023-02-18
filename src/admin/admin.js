import { PrismaClient } from "@prisma/client";
import { Markup } from "telegraf";

const prisma = new PrismaClient();
export default async (ctx) => {
  try {
    console.log(ctx);
    if (!isAdmin(ctx.from.id)) {
      await ctx.reply("Bu metod siz uchun emas!❌");
      return false;
    }
    await ctx.reply(
      "Admin Bo'limiga hush kelibsiz!\nKerakli bo'limni tanlang!",

    );
  } catch (e) {
    console.log(e);
  }
};

async function isAdmin(user_id) {
  try {
    const admin = await prisma.users.findMany({
      where: {
        user_id: user_id,
      },
    });
    return admin[0].is_admin;
  } catch (e) {
    console.log("ERROR: ", e);
  }
}

async function showMasters(ctx) {
  try {
    if (!isAdmin(ctx.from.id)) {
      ctx.reply("Bu metod siz uchun emas!❌");
      return false;
    } else {
      const masters = await prisma.masters.findMany();
      ctx.reply("Ustalar ro'yhati:\n", ...Markup.keyboard([]));
    }
  } catch (e) {}
}
