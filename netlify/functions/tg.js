const TOKEN = process.env.TG_BOT_TOKEN;
const CHAT_ID = process.env.TG_CHAT_ID;
const API = 'https://api.telegram.org/bot' + TOKEN;

const FLOW = [
  { id: 'accept',  btn: '✅ Принять',   line: '✅ Принят' },
  { id: 'process', btn: '📦 Обработан', line: '📦 Обработан' },
  { id: 'paid',    btn: '💳 Оплачен',   line: '💳 Оплачен' },
];

async function tg(method, payload) {
  const r = await fetch(API + '/' + method, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return r.json();
}

function keyboard(nextId, urlButton) {
  const rows = [];
  if (urlButton) rows.push([urlButton]);
  const next = FLOW.find(s => s.id === nextId);
  if (next) rows.push([{ text: next.btn, callback_data: 'st:' + next.id }]);
  return { inline_keyboard: rows };
}

function getUrlButton(markup) {
  const rows = (markup && markup.inline_keyboard) || [];
  for (const row of rows) for (const b of row) if (b.url) return b;
  return null;
}

exports.handler = async (event) => {
  // CORS заголовки на всякий случай, хотя сервер-сервер их игнорирует
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors, body: 'ok' };
  if (event.httpMethod === 'GET') return { statusCode: 200, headers: cors, body: 'tg function alive ✅' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: cors, body: 'nope' };

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return { statusCode: 400, headers: cors, body: 'bad json' }; }

  // ЕДИНСТВЕННАЯ ЗАДАЧА ФУНКЦИИ: обработка нажатия кнопки
  if (body.callback_query) {
    const cb = body.callback_query;
    const idx = FLOW.findIndex(s => s.id === (cb.data || '').replace('st:', ''));

    if (idx >= 0 && cb.message) {
      const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      const newText = (cb.message.text || '') + '\n📌 Статус: ' + FLOW[idx].line + ' (' + time + ')';
      const urlButton = getUrlButton(cb.message.reply_markup);
      const next = FLOW[idx + 1];

      await tg('editMessageText', {
        chat_id: cb.message.chat.id,
        message_id: cb.message.message_id,
        text: newText,
        reply_markup: keyboard(next ? next.id : null, urlButton),
      });

      await tg('answerCallbackQuery', { callback_query_id: cb.id, text: 'Статус: ' + FLOW[idx].line });
    }
    return { statusCode: 200, headers: cors, body: 'ok' };
  }

  return { statusCode: 200, headers: cors, body: 'ignored' };
};