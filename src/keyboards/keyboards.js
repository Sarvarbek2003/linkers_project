import { Markup } from "telegraf";

export const keyboards = {
  adminHome: Markup.keyboard([["Xizmatlar ⚙️", "Ustalar 👨🏻‍🔧", "Mijozlar 👥"]])
    .oneTime()
    .resize(),
  back: Markup.keyboard([["Ortga 🔙"]])
    .oneTime()
    .resize(),
};
