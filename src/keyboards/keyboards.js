const starthome = {
  resize_keyboard: true,
  keyboard: [[{ text: '🧑‍🚒 Usta' }, { text: '👤 Mijoz' }]],
};

const nextBtn = {
  resize_keyboard: true,
  keyboard: [[{ text: 'O`tkazish ⏭️' }], [{ text: '❌ Bekor qilish' }]],
};

const cancel = {
  resize_keyboard: true,
  keyboard: [[{ text: '❌ Bekor qilish' }]],
};

const adminMenuKeyboard = {
  resize_keyboard: true,
  keyboard: [
    [{ text: 'Xizmatlar ⚙️' }, { text: 'Ustalar 👨🏻‍🔧' }, { text: 'Mijozlar 👥' }],
  ],
};

const homeMaster = {
  resize_keyboard: true,
  keyboard: [
    [{text: '👥 Mijozlar'}, {text: "⏰ Vaqt"}, {text: "🏆 Reyting"}],
    [{text: '🖋 Ma\'lumotlatni o\'zgartirish'}]
  ]
} 

const chageInfo = {
  inline_keyboard: [
    
  ]
} 

export {
  adminMenuKeyboard,
  homeMaster,
  starthome,
  nextBtn,
  cancel
}