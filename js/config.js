// Настройки сайта WLauncher. Меняйте только значения справа.
const CONFIG={
  PLUS_PRICE_RUB:49, // цена W+ в рублях за месяц
  REG_COINS:250, // коины за регистрацию
  DAILY_HOUR:13, // во сколько каждый день обновляется награда
  DAILY_REWARDS:[25,25,50,25,25,50,250], // награда по дням серии, 7-й день особый
  PROMOS:{ReleaseSoon:{max:25,days:7,coins:250}}, // промокоды: max — сколько раз можно активировать, days — дней W+, coins — коины
  ADMIN_EMAIL:"dimaplay1420@gmail.com",
  VERSION:"1.0.0",
  AI_ENDPOINT:"", // адрес вашего прокси к DeepSeek (см. spark-worker.js). Ключ DeepSeek сюда НЕ вставлять!
  BASE_DOWNLOADS:100, // сколько человек уже скачало (число на сайте = это + скачивания в браузере)
  SPONSORS:[], // имена спонсоров для стены, например ["Dima","Alex"]
  DOWNLOADS:{windows:""} // сюда вставьте прямые ссылки на файлы лаунчера
};
