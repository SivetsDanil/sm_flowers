const TOKEN = process.env.TG_BOT_TOKEN;
const CHAT_ID = process.env.TG_CHAT_ID;
const API = `https://api.telegram.org/bot${TOKEN}`;

const FLOW = [
  { id: 'accept',  btn: '✅ Принять',   line: '✅ Принят' },
  { id: 'process', btn: '📦 Обработан', line: '📦 Обработан' },
  { id: 'paid',    btn: '💳 Оплачен',   line: '💳 Оплачен' },
];

async function tgRequest(method, payload) {
  const r = await fetch(API + '/' + method, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const res = await r.json();
  if (!res.ok) console.error('❌ Telegram API Error:', method, res);
  return res;
}

exports.handler = async (event) => {
  console.log('--- ФУНКЦИЯ ЗАПУЩЕНА ---');
  console.log('Метод:', event.httpMethod);

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, body: 'ok' };
  if (event.httpMethod === 'GET') return { statusCode: 200, body: 'tg function alive ✅' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'nope' };

  let body;
  try {
    body = JSON.parse(event.body || '{}');
    console.log('Ключи в теле запроса:', Object.keys(body));
  } catch (e) {
    console.error('Ошибка парсинга JSON:', e);
    return { statusCode: 400, body: 'bad json' };
  }

  // Проверяем, есть ли нажатие кнопки
  if (body.callback_query) {
    console.log('👆 НАЖАТИЕ КНОПКИ ОБНАРУЖЕНО!');
    const cb = body.callback_query;
    console.log('Данные кнопки (data):', cb.data);
    console.log('ID нажатия (callback_query_id):', cb.id);

    const statusId = (cb.data || '').replace('st:', '');
    const step = FLOW.find(s => s.id === statusId);

    try {
      if (step && cb.message) {
        const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        const newText = (cb.message.text || '') + `\n📌 Статус: ${step.line} (${time})`;

        const currentIndex = FLOW.findIndex(s => s.id === statusId);
        const nextStep = FLOW[currentIndex + 1];

        const keyboard = { inline_keyboard: [] };
        // Сохраняем кнопку "Написать", если она была
        const urlBtn = cb.message.reply_markup?.inline_keyboard?.find(row => row.find(b => b.url))?.[0];
        if (urlBtn) keyboard.inline_keyboard.push([urlBtn]);
        // Добавляем кнопку следующего шага
        if (nextStep) {
          keyboard.inline_keyboard.push([{ text: nextStep.btn, callback_data: `st:${nextStep.id}` }]);
        }

        console.log('Отправляем запрос на обновление текста сообщения...');
        await tgRequest('editMessageText', {
          chat_id: cb.message.chat.id,
          message_id: cb.message.message_id,
          text: newText,
          reply_markup: keyboard.inline_keyboard.length > 0 ? keyboard : undefined
        });
      } else {
        console.log('⚠️ Шаг не найден или нет сообщения. step:', step, 'message:', !!cb.message);
      }
    } catch (err) {
      console.error('❌ ОШИБКА в блоке try:', err);
    } finally {
      console.log('Отправляем answerCallbackQuery с id:', cb.id);
      await tgRequest('answerCallbackQuery', {
        callback_query_id: cb.id,
        text: 'Статус обновлен'
      });
    }

    return { statusCode: 200, body: 'ok' };
  }

  console.log('⚠️ В теле запроса НЕТ callback_query. Игнорируем.');
  return { statusCode: 200, body: 'ignored' };
};