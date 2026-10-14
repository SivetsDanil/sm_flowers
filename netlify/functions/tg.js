const TOKEN = process.env.TG_BOT_TOKEN;
const CHAT_ID = process.env.TG_CHAT_ID;
const API = `https://api.telegram.org/bot${TOKEN}`;

const FLOW = [
  { id: 'accept',  btn: '✅ Принять',   line: '✅ Принят' },
  { id: 'process', btn: '📦 Обработан', line: ' Обработан' },
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
  // CORS заголовки
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: cors, body: 'ok' };
  }

  if (event.httpMethod === 'GET') {
    return { statusCode: 200, headers: cors, body: 'tg function alive ✅' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: cors, body: 'nope' };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers: cors, body: 'bad json' };
  }

  // ========== НОВЫЙ ЗАКАЗ С САЙТА ==========
  if (body.text && body.reply_markup) {
    const sent = await tgRequest('sendMessage', {
      chat_id: CHAT_ID,
      text: body.text,
      parse_mode: body.parse_mode || 'Markdown',
      reply_markup: body.reply_markup
    });

    if (sent.ok) {
      return { statusCode: 200, headers: cors, body: JSON.stringify(sent) };
    } else {
      return { statusCode: 500, headers: cors, body: JSON.stringify(sent) };
    }
  }

  // ========== НАЖАТИЕ КНОПКИ ==========
  if (body.callback_query) {
    const cb = body.callback_query;
    const idx = FLOW.findIndex(s => s.id === (cb.data || '').replace('st:', ''));
    
    if (idx >= 0 && cb.message) {
      const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      const newText = (cb.message.text || '') + `\n📌 Статус: ${FLOW[idx].line} (${time})`;
      
      const nextStep = FLOW[idx + 1];
      const keyboard = { inline_keyboard: [] };
      
      const urlBtn = cb.message.reply_markup?.inline_keyboard?.find(row => row.find(b => b.url))?.[0];
      if (urlBtn) keyboard.inline_keyboard.push([urlBtn]);
      if (nextStep) keyboard.inline_keyboard.push([{ text: nextStep.btn, callback_data: `st:${nextStep.id}` }]);

      await tgRequest('editMessageText', {
        chat_id: cb.message.chat.id,
        message_id: cb.message.message_id,
        text: newText,
        reply_markup: keyboard.inline_keyboard.length > 0 ? keyboard : undefined
      });
      
      await tgRequest('answerCallbackQuery', {
        callback_query_id: cb.id,
        text: 'Статус обновлен'
      });
    }
    return { statusCode: 200, headers: cors, body: 'ok' };
  }

  return { statusCode: 200, headers: cors, body: 'ignored' };
};
