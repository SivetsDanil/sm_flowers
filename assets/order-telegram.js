(function() {
  const form = document.getElementById('public-order-form');
  const modal = document.getElementById('order-modal');
  const msg = document.getElementById('public-order-msg');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = 'Отправляем заказ…';
    
    const d = new FormData(form);
    const summary = document.getElementById('order-summary')?.textContent || 'Не указан';
    const price = (summary.match(/[\d\s\u00A0]+₽/) || [''])[0].replace(/\D/g, '');
    const tgUser = (d.get('telegram') || '').trim().replace(/^@/, '');

    const text = `🔔 НОВЫЙ ЗАКАЗ\n\n` +
      `💐 *${summary}*\n` +
      `👤 Клиент: ${d.get('name') || '—'}\n` +
      `📞 Телефон: ${d.get('phone') || '—'}\n` +
      (tgUser ? `💬 Telegram: @${tgUser}\n` : '') +
      (price ? `💰 Сумма: ${Number(price).toLocaleString('ru-RU')} ₽\n` : '') +
      (d.get('address') ? `📍 Адрес: ${d.get('address')}\n` : '') +
      (d.get('date') ? `📅 Дата: ${d.get('date')}\n` : '') +
      (d.get('time') ? `🕐 Время: ${d.get('time')}\n` : '') +
      (d.get('comment') ? ` Комментарий: ${d.get('comment')}\n` : '') +
      `\n📌 Статус: 🆕 Новый`;

    const keyboardRows = [];
    if (tgUser) {
      keyboardRows.push([{ text: '✉️ Написать клиенту', url: `https://t.me/${tgUser}` }]);
    }
    keyboardRows.push([{ text: '✅ Принять', callback_data: 'st:accept' }]);

    try {
      // Отправляем на Netlify функцию (не блокируется в России)
      const response = await fetch('https://frolicking-seahorse-0c10ff.netlify.app/.netlify/functions/tg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: keyboardRows }
        })
      });

      const result = await response.json();

      if (result.ok) {
        msg.textContent = '✅ Заказ успешно отправлен!';
        form.reset();
        
        setTimeout(() => {
          modal.classList.remove('open');
          modal.setAttribute('aria-hidden', 'true');
          document.body.classList.remove('modal-open');
          msg.textContent = '';
        }, 1500);
        
      } else {
        console.error('Telegram API Error:', result);
        throw new Error(result.description || 'Ошибка Telegram');
      }
    } catch (error) {
      console.error('Order submission failed:', error);
      msg.textContent = ' Ошибка отправки. Позвоните: +7 917 564-52-13';
    }
  });
})();
