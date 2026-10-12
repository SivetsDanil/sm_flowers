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
  return r.json();
}

exports.handler = async (event) => {
  console.log('🔔 Function triggered:', event.httpMethod);

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, body: 'ok' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'nope' };

  if (!TOKEN || !CHAT_ID) {
    console.error('❌ MISSING ENV VARS: TG_BOT_TOKEN or TG_CHAT_ID');
    return { statusCode: 500, body: 'Missing environment variables' };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, body: 'bad json' }; }

  // ОБРАБОТКА НАЖАТИЯ КНОПКИ
  if (body.callback_query) {
    const cb = body.callback_query;
    console.log('👆 Callback received:', cb.data);

    const statusId = (cb.data || '').replace('st:', '');
    const step = FLOW.find(s => s.id === statusId);

    try {
      if (step && cb.message) {
        const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        const newText = (cb.message.text || '') + `\n📌 Статус: ${step.line} (${time})`;

        // Находим следующий шаг
        const currentIndex = FLOW.findIndex(s => s.id === statusId);
        const nextStep = FLOW[currentIndex + 1];

        // Собираем клавиатуру для следующего шага
        const keyboard = { inline_keyboard: [] };

        // Сохраняем кнопку "Написать", если она была
        const urlBtn = cb.message.reply_markup?.inline_keyboard?.find(row => row.find(b => b.url))?.[0];
        if (urlBtn) keyboard.inline_keyboard.push([urlBtn]);

        // Добавляем кнопку следующего статуса
        if (nextStep) {
          keyboard.inline_keyboard.push([{ text: nextStep.btn, callback_data: `st:${nextStep.id}` }]);
        }

        // Обновляем текст и кнопки
        await tgRequest('editMessageText', {
          chat_id: cb.message.chat.id,
          message_id: cb.message.message_id,
          text: newText,
          reply_markup: keyboard.inline_keyboard.length > 0 ? keyboard : undefined
        });
      }
    } catch (err) {
      console.error('❌ Error editing message:', err);
    } finally {
      // ЭТО ГЛАВНОЕ: ВСЕГДА отвечаем Telegram, что нажатие обработано,
      // иначе кнопка будет крутить загрузку вечно!
      await tgRequest('answerCallbackQuery', {
        callback_query_id: cb.id,
        text: 'Статус обновлен'
      });
    }

    return { statusCode: 200, body: 'ok' };
  }

  return { statusCode: 200, body: 'ignored' };
};