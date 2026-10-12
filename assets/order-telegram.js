(function(){
  const TG_BOT_TOKEN = '8636942868:AAHPcjYpjkYae8_m6VYchSgFQyfPyWmEgLs';
  const TG_CHAT_ID = '5235744796'; // вставь свой chat_id из getUpdates

  const form = document.getElementById('public-order-form');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const msg = document.getElementById('public-order-msg');
    const d = new FormData(form);
    const summary = document.getElementById('order-summary')?.textContent || '';

    const text = '🌷 НОВЫЙ ЗАКАЗ SM FLOWERS\n\n' +
      '💐 ' + summary +
      '\n👤 Имя: ' + (d.get('name') || '') +
      '\n📞 Телефон: ' + (d.get('phone') || '') +
      (d.get('email') ? '\n✉️ Email: ' + d.get('email') : '') +
      (d.get('telegram') ? '\n💬 Telegram: ' + d.get('telegram') : '') +
      (d.get('address') ? '\n📍 Адрес: ' + d.get('address') : '') +
      (d.get('date') ? '\n📅 Доставка: ' + d.get('date') + ' ' + (d.get('time') || '') : '') +
      (d.get('comment') ? '\n📝 Комментарий: ' + d.get('comment') : '');

    msg.textContent = 'Отправляем заказ…';

    try {
      const r = await fetch('https://api.telegram.org/bot' + TG_BOT_TOKEN + '/sendMessage', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({chat_id: TG_CHAT_ID, text: text})
      });
      const j = await r.json();

      if (j.ok) {
        msg.textContent = '✅ Заказ отправлен! Мы свяжемся с вами в ближайшее время.';
        form.reset();
      } else {
        throw new Error(j.description || 'Ошибка отправки');
      }
    } catch (err) {
      console.error('Telegram error:', err);
      msg.textContent = '❌ Не удалось отправить. Позвоните нам: +7 917 564-52-13';
    }
  });
})();