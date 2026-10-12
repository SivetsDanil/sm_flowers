const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

exports.handler = async (event) => {
  // Preflight от браузера
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  // Healthcheck: открой URL функции в браузере — должно ответить жив
  if (event.httpMethod === 'GET') return { statusCode: 200, headers: CORS, body: 'tg function alive ✅' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: 'nope' };

  // ... дальше весь старый код без изменений (callback_query и отправка заказа) ...
  // НО во всех return добавь headers: CORS, например:
  // return { statusCode: 200, headers: CORS, body: 'ok' };
  // return { statusCode: 200, headers: CORS, body: JSON.stringify(sent) };
};