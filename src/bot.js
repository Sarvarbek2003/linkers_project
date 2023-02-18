import { Telegraf } from "telegraf";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const app = new Telegraf("6236507965:AAFoDHcvNgFQlGDHTbQ2hUcdxhrPwbPcOvo");

import adminPanel, { onMaster } from "./admin/admin.js";



app.command("/admin", async (ctx) => {
  const bot = ctx.telegram;
  const msg = ctx.message;

  const text = msg.text;
  const chat_id = msg.from.id;
  const first_name = msg.from.first_name;
  const user = await checkUser(msg);
  const steep = user.steep;
  const st = steep[steep.length - 1];

  if (user.is_admin || steep[1] == "admin") {
    await changeSteep(user, "admin");
    await adminPanel(ctx);
  }
});

app.hears("Ustalar 👨🏻‍🔧", async (ctx) => {
  console.log("KELDI!");
  await onMaster(ctx);
});

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

const changeSteep = async (user, steep) => {
  try {
    let steep = user.steep;
    steep.push(steep);
    await prisma.users.update({
      where: {
        user_id: user.user_id,
      },
      data: {
        steep,
      },
    });
  } catch (error) {
    return 0;
  }
};

export { changeSteep };
app.launch();

// Enable graceful stop
process.once("SIGINT", () => app.stop("SIGINT"));
process.once("SIGTERM", () => app.stop("SIGTERM"));
