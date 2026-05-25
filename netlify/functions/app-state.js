import { getStore } from '@netlify/blobs';

const HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};

const STATE_KEY = 'shared-state';
const VERSION = 1;

function response(statusCode, body) {
  return {
    statusCode,
    headers: HEADERS,
    body: JSON.stringify(body),
  };
}

function isValidData(data) {
  return (
    data &&
    Array.isArray(data.users) &&
    Array.isArray(data.clients) &&
    Array.isArray(data.products) &&
    Array.isArray(data.orders) &&
    Array.isArray(data.tasks) &&
    Array.isArray(data.clockLogs)
  );
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: HEADERS, body: '' };
  }

  const store = getStore('acumen-app-state');

  if (event.httpMethod === 'GET') {
    const payload = await store.get(STATE_KEY, { type: 'json' });
    return response(200, payload ?? { version: VERSION, updatedAt: null, data: null });
  }

  if (event.httpMethod === 'PUT' || event.httpMethod === 'POST') {
    let data;
    try {
      data = JSON.parse(event.body || '{}');
    } catch {
      return response(400, { error: 'Invalid JSON body' });
    }

    if (!isValidData(data)) {
      return response(400, { error: 'Invalid shared app data shape' });
    }

    const payload = {
      version: VERSION,
      updatedAt: new Date().toISOString(),
      data,
    };
    await store.setJSON(STATE_KEY, payload);
    return response(200, payload);
  }

  return response(405, { error: 'Method not allowed' });
}
