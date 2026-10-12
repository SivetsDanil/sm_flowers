(function(){
  const TG_BOT_TOKEN = '8636942868:AAHPcjYpjkYae8_m6VYchSgFQyfPyWmEgLs';
  const TG_CHAT_ID   = '5235744796';
  const form = document.getElementById('public-order-form');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const msg = document.getElementById('public-order-msg');
    const data = new FormData(form);
    data.set('bouquet', document.getElementById('order-summary')?.textContent || '');

    const text = '🌷 НОВЫЙ ЗАКАЗ SM FLOWERS\n🌸 ' + (data.get('bouquet') || '') +
      '\nИмя: ' + (data.get('name') || '') +
      '\nТелефон: ' + (data.get('phone') || '') +
      (data.get('email')   ? '\nEmail: ' + data.get('email') : '') +
      (data.get('telegram')? '\nTelegram: ' + data.get('telegram') : '') +
      (data.get('address') ? '\nАдрес: ' + data.get('address') : '') +
      (data.get('date')    ? '\nДоставка: ' + data.get('date') + ' ' + (data.get('time') || '') : '') +
      (data.get('comment') ? '\nКомментарий: ' + data.get('comment') : '');

    msg.textContent = 'Отправляем заказ…';
    let tgOk = false;

    // Канал 1: Telegram — мгновенно
    try {
      const r = await fetch('https://api.telegram.org/bot' + TG_BOT_TOKEN + '/sendMessage', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({chat_id: TG_CHAT_ID, text: text})
      });
      tgOk = (await r.json()).ok === true;
    } catch (err) { console.error('TG:', err); }

    // Канал 2: Netlify Forms — журнал в панели
    try {
      data.set('form-name', 'orders');
      await fetch('/', {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: new URLSearchParams(data).toString()
      });
    } catch (err) { console.error('Netlify Forms:', err); }

    if (tgOk) {
      msg.textContent = '✅ Заказ отправлен! Мы свяжемся с вами в ближайшее время.';
      form.reset();
    } else {
      msg.textContent = '❌ Не удалось отправить. Позвоните нам: +7 917 564-52-13';
    }
  });
})();