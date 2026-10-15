(function() {
  // Твой новый, быстрый и не блокируемый адрес
  const API_URL = 'https://sm-flowers-api.sivets-one.workers.dev/';

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
      (d.get('comment') ? `📝 Комментарий: ${d.get('comment')}\n` : '') +
      `\n📌 Статус: 🆕 Новый`;

    const keyboardRows = [];
    if (tgUser) {
      keyboardRows.push([{ text: '✉️ Написать клиенту', url: `https://t.me/${tgUser}` }]);
    }
    keyboardRows.push([{ text: '✅ Принять', callback_data: 'st:accept' }]);

    try {
      const response = await fetch(API_URL, {
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

        // Закрываем модалку через 1.5 секунды
        setTimeout(() => {
          modal.classList.remove('open');
          modal.setAttribute('aria-hidden', 'true');
          document.body.classList.remove('modal-open');
          msg.textContent = '';
        }, 1500);

      } else {
        throw new Error(result.description || 'Ошибка отправки');
      }
    } catch (error) {
      console.error('Order submission failed:', error);
      msg.innerHTML = '⚠️ Не удалось отправить онлайн. Пожалуйста, позвоните: <a href="tel:+79175645213" style="color:#263125;font-weight:600">+7 917 564-52-13</a>';
    }
  });
})();