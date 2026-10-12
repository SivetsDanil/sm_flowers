(function(){
  const form = document.getElementById('public-order-form');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const msg = document.getElementById('public-order-msg');
    const d = new FormData(form);
    const summary = document.getElementById('order-summary')?.textContent || '';
    const price = (summary.match(/[\d\s\u00A0]+₽/) || [''])[0].replace(/\D/g, '');

    msg.textContent = 'Отправляем заказ…';
    let ok = false;

    // 1) Telegram через серверную функцию
    try {
      const r = await fetch('/.netlify/functions/tg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: d.get('name') || '', phone: d.get('phone') || '',
          email: d.get('email') || '', telegram: d.get('telegram') || '',
          address: d.get('address') || '', date: d.get('date') || '',
          time: d.get('time') || '', comment: d.get('comment') || '',
          bouquet: summary, total: price
        })
      });
      const j = await r.json();
      ok = j.ok === true;
    } catch (err) { console.error('order fn:', err); }

    // 2) Дубль в журнал Netlify Forms
    try {
      const fd = new FormData(form);
      fd.set('form-name', 'orders');
      fd.set('bouquet', summary);
      await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(fd).toString()
      });
    } catch (err) { console.error('forms:', err); }

    if (ok) {
      msg.textContent = '✅ Заказ отправлен! Мы свяжемся с вами в ближайшее время.';
      form.reset();
    } else {
      msg.textContent = '❌ Не удалось отправить. Позвоните нам: +7 917 564-52-13';
    }
  });
})();