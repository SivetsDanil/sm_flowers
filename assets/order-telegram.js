(function(){
  // Ключи прямо в коде, как у прошлого разработчика
  const TG_BOT_TOKEN = '8636942868:AAHPcjYpjkYae8_m6VYchSgFQyfPyWmEgLs';
  const TG_CHAT_ID = '5235744796'; // Например: 123456789
  const API = 'https://api.telegram.org/bot' + TG_BOT_TOKEN;

  const form = document.getElementById('public-order-form');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const msg = document.getElementById('public-order-msg');
    const d = new FormData(form);
    const summary = document.getElementById('order-summary')?.textContent || '';
    const price = (summary.match(/[\d\s\u00A0]+₽/) || [''])[0].replace(/\D/g, '');
    const tgUser = (d.get('telegram') || '').trim();

    // Формируем кнопки
    const keyboard = { inline_keyboard: [] };
    if (tgUser) {
      keyboard.inline_keyboard.push([{
        text: '✉️ Написать',
        url: 'https://t.me/' + tgUser.replace(/^@/, '')
      }]);
    }
    keyboard.inline_keyboard.push([{ text: '✅ Принять', callback_data: 'st:accept' }]);

    const lines = [
      '👤 Клиент: ' + (d.get('name') || '—'),
      '📞 Телефон: ' + (d.get('phone') || '—'),
      tgUser ? '💬 Telegram: ' + tgUser : '',
      price ? '💰 Сумма: ' + Number(price).toLocaleString('ru-RU') + ' ₽' : '',
      d.get('address') ? '📍 Адрес: ' + d.get('address') : '',
      d.get('date') ? '📅 Дата: ' + d.get('date') : '',
      d.get('time') ? '🕐 Время: ' + d.get('time') : '',
      d.get('comment') ? '💬 Комментарий: ' + d.get('comment') : '',
      '',
      '💐 Состав заказа:',
      '· ' + (summary || '—'),
      '',
      '📌 Статус: 🆕 Новый'
    ].filter(Boolean);

    msg.textContent = 'Отправляем заказ…';

    try {
      // 1. Отправляем сообщение с кнопками напрямую в Telegram
      const sent = await fetch(API + '/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TG_CHAT_ID,
          text: '🔔 НОВЫЙ ЗАКАЗ\n\n' + lines.join('\n'),
          reply_markup: keyboard
        })
      }).then(r => r.json());

      if (!sent.ok) throw new Error(sent.description || 'Ошибка Telegram');

      // 2. Обновляем сообщение, добавляя его ID как номер заказа (чтобы функция знала, что менять)
      await fetch(API + '/editMessageText', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TG_CHAT_ID,
          message_id: sent.result.message_id,
          text: '🔔 НОВЫЙ ЗАКАЗ #' + sent.result.message_id + '\n\n' + lines.join('\n'),
          reply_markup: keyboard
        })
      });

      msg.textContent = '✅ Заказ отправлен! Мы свяжемся с вами в ближайшее время.';
      form.reset();
    } catch (err) {
      console.error('Telegram error:', err);
    }
  });
})();