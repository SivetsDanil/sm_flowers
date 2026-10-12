const TOKEN = process.env.TG_BOT_TOKEN;
const CHAT_ID = process.env.TG_CHAT_ID;
const API = 'https://api.telegram.org/bot' + TOKEN;

const STATUSES = [
  { id: 'accept',  label: '✅ Принят' },
  { id: 'process', label: '📦 Обработан' },
  { id: 'paid',    label: '💳 Оплачен' },
];

function keyboard(excludeId) {
  const row = STATUSES.filter(s => s.id !== excludeId)
    .map(s => ({ text: s.label, callback_data: 'st:' + s.id }));
  return { inline_keyboard: [row] };
}

async function tg(method, payload) {
  const r = await fetch(API + '/' + method, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return r.json();
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'nope' };
  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return { statusCode: 400, body: 'bad json' }; }

  // ===== 1) Нажатие кнопки (Telegram шлёт callback_query на вебхук) =====
  if (body.callback_query) {
    const cb = body.callback_query;
    const statusId = (cb.data || '').replace('st:', '');
    const st = STATUSES.find(s => s.id === statusId);
    if (st && cb.message) {
      const clean = (cb.message.text || '')
        .split('\n').filter(l => !l.startsWith('📌 Статус:')).join('\n');
      const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      await tg('editMessageText', {
        chat_id: cb.message.chat.id,
        message_id: cb.message.message_id,
        text: clean + '\n📌 Статус: ' + st.label + ' (' + time + ')',
        reply_markup: keyboard(statusId),
      });
      await tg('answerCallbackQuery', { callback_query_id: cb.id, text: 'Статус: ' + st.label });
    }
    return { statusCode: 200, body: 'ok' };
  }

  // ===== 2) Новый заказ с сайта =====
  const o = body;
  const lines = [
    '👤 Клиент: ' + (o.name || '—'),
    '📞 Телефон: ' + (o.phone || '—'),
    o.total ? '💰 Сумма: ' + Number(o.total).toLocaleString('ru-RU') + ' ₽' : '',
    o.address ? '📍 Адрес: ' + o.address : '',
    (o.date || o.time) ? '📅 Доставка: ' + [o.date, o.time].filter(Boolean).join(' ') : '',
    o.telegram ? '💬 Telegram: ' + o.telegram : '',
    o.email ? '✉️ Email: ' + o.email : '',
    o.comment ? '📝 Комментарий: ' + o.comment : '',
    '',
    '💐 Состав заказа:',
    '· ' + (o.bouquet || '—'),
    '',
    '📌 Статус: 🆕 Новый',
  ].filter(Boolean);

  const sent = await tg('sendMessage', {
    chat_id: CHAT_ID,
    text: '🔔 НОВЫЙ ЗАКАЗ\n\n' + lines.join('\n'),
    reply_markup: keyboard(null),
  });

  if (sent.ok) {
    // Номер заказа = номер сообщения в чате (сквозной, как #14 у старого бота)
    await tg('editMessageText', {
      chat_id: CHAT_ID,
      message_id: sent.result.message_id,
      text: '🔔 НОВЫЙ ЗАКАЗ #' + sent.result.message_id + '\n\n' + lines.join('\n'),
      reply_markup: keyboard(null),
    });
  }
  return { statusCode: 200, body: JSON.stringify(sent) };
};