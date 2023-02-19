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

const changeInfobtn = {
  inline_keyboard: [
    [{text:"🖋 Ism", callback_data:'edit-name'}],
    [{text:"📞 Telefon raqam", callback_data:'edit-phone'}],
    [{text:"🏠 Ustaxona nomi", callback_data:'edit-workshopname'}],
    [{text:"📍 Manzil", callback_data:'edit-address'}],
    [{text:"🚩 Mo'laj", callback_data:'edit-landmark'}],
    [{text:"🕹 Locatsyasi", callback_data:'edit-location'}],
    [{text:"⏰ Ish boshlanish vaqti", callback_data:'edit-start_time'}],
    [{text:"🕰 Ishning tugash vaqti", callback_data:'edit-end_time'}],
    [{text:"🧭 Har bir mijoz uchun o'rt vaqt", callback_data:'edit-time_per_cost'}],
    [{text:"❌ Bekor qilish", callback_data:'edit-cancel'}]
  ]
} 

export {
  adminMenuKeyboard,
  homeMaster,
  starthome,
  changeInfobtn,
  nextBtn,
  cancel
}