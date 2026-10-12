const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod === 'GET')  return { statusCode: 200, headers: CORS, body: 'tg function alive ✅' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: 'nope' };

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return { statusCode: 400, headers: CORS, body: 'bad json' }; }

  // ========== НАЖАТИЕ КНОПКИ (приходит с вебхука) ==========
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
    return { statusCode: 200, headers: CORS, body: 'ok' };
  }

  // ========== НОВЫЙ ЗАКАЗ С САЙТА ==========
  const o = body;
  const tgUser = (o.telegram || '').trim();
  const urlButton = tgUser ? { text: '✉️ Написать', url: 'https://t.me/' + tgUser.replace(/^@/, '') } : null;

  const lines = [
    '👤 Клиент: ' + (o.name || '—'),
    '📞 Телефон: ' + (o.phone || '—'),
    tgUser ? '💬 Telegram: ' + tgUser : '',
    o.total ? '💰 Сумма: ' + Number(o.total).toLocaleString('ru-RU') + ' ₽' : '',
    o.address ? '📍 Адрес: ' + o.address : '',
    o.date ? '📅 Дата: ' + o.date : '',
    o.time ? '🕐 Время: ' + o.time : '',
    o.comment ? '💬 Комментарий: ' + o.comment : '',
    '',
    '💐 Состав заказа:',
    '· ' + (o.bouquet || '—'),
    '',
    '📌 Статус: 🆕 Новый',
  ].filter(Boolean);

  const sent = await tg('sendMessage', {
    chat_id: CHAT_ID,
    text: '🔔 НОВЫЙ ЗАКАЗ\n\n' + lines.join('\n'),
    reply_markup: keyboard('accept', urlButton),
  });

  if (sent.ok) {
    await tg('editMessageText', {
      chat_id: CHAT_ID,
      message_id: sent.result.message_id,
      text: '🔔 НОВЫЙ ЗАКАЗ #' + sent.result.message_id + '\n\n' + lines.join('\n'),
      reply_markup: keyboard('accept', urlButton),
    });
  }

  return { statusCode: 200, headers: CORS, body: JSON.stringify(sent) };
};