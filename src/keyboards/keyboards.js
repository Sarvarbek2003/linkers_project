const starthome = {
    resize_keyboard: true,
    keyboard: [[{ text: "🧑‍🚒 Usta" }, { text: "👤 Mijoz" }]],
}

const nextBtn = {
  resize_keyboard: true,
  keyboard: [[{text:"O`tkazish ⏭️"}],[{text:"❌ Bekor qilish"}]]
}

const cancel = {
  resize_keyboard: true,
  keyboard: [[{ text: "❌ Bekor qilish" }]],
}

const homeMaster = {
  resize_keyboard: true,
  keyboard: [
    [{text: '👥 Mijozlar'}, {text: "⏰ Vaqt"}, {text: "🏆 Reyting"}],
    [{text: '🖋 Ma\'lumotlatni o\'zgartirish'}]
  ]
} 

export {
  homeMaster,
  starthome,
  nextBtn,
  cancel
}