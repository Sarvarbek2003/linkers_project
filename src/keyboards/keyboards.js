import { Markup } from "telegraf";

export const keyboards = {
  adminHome: Markup.keyboard([["Xizmatlar ⚙️", "Ustalar 👨🏻‍🔧", "Mijozlar 👥"]])
    .oneTime()
    .resize(),
  back: Markup.keyboard([["Ortga 🔙"]])
    .oneTime()
    .resize(),
  on_masters: Markup.keyboard([["Usta Qo'shish 🆕", "Ustalar ro'yhati 📃"], ["Ortga 🔙"]])
      .oneTime()
      .resize(),
};
