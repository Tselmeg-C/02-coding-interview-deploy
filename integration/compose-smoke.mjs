import assert from 'node:assert/strict';

const baseUrl = process.env.APP_URL ?? 'http://127.0.0.1:3001';

async function request(path, options) {
  const response = await fetch(baseUrl + path, options);
  const body = await response.json();
  return { response, body };
}

const health = await request('/health');
assert.equal(health.response.status, 200);
assert.deepEqual(health.body, { status: 'ok' });

const created = await request('/api/rooms', { method: 'POST' });
assert.equal(created.response.status, 201);
assert.match(created.body.id, /^[a-f0-9]{8}$/);

const updated = await request('/api/rooms/' + created.body.id, {
  method: 'PATCH',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ language: 'python', code: 'print("postgres")' }),
});
assert.equal(updated.response.status, 200);
assert.equal(updated.body.code, 'print("postgres")');

const restored = await request('/api/rooms/' + created.body.id);
assert.equal(restored.response.status, 200);
assert.equal(restored.body.language, 'python');
assert.equal(restored.body.code, 'print("postgres")');
