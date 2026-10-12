(function(){
  const FN_URL = 'https://frolicking-seahorse-0c10ff.netlify.app/.netlify/functions/tg';
  const form = document.getElementById('public-order-form');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const msg = document.getElementById('public-order-msg');
    const d = new FormData(form);
    const summary = document.getElementById('order-summary')?.textContent || '';
    const price = (summary.match(/[\d\s\u00A0]+₽/) || [''])[0].replace(/\D/g, '');

    msg.textContent = 'Отправляем заказ…';

    try {
      const payload = JSON.stringify({
        name: d.get('name') || '', phone: d.get('phone') || '',
        email: d.get('email') || '', telegram: d.get('telegram') || '',
        address: d.get('address') || '', date: d.get('date') || '',
        time: d.get('time') || '', comment: d.get('comment') || '',
        bouquet: summary, total: price
      });

      const r = await fetch(FN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: payload
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