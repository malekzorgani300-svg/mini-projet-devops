const test = require('node:test');
const assert = require('node:assert');
const app = require('./app');

test('GET /api/health renvoie ok', async () => {
  const server = app.listen(0);
  const { port } = server.address();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/health`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.status, 'ok');
  } finally {
    server.close();
  }
});

test('POST /api/tasks sans titre renvoie 400', async () => {
  const server = app.listen(0);
  const { port } = server.address();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '   ' }),
    });
    assert.strictEqual(res.status, 400);
  } finally {
    server.close();
  }
});

test('GET /metrics expose les métriques Prometheus', async () => {
  const server = app.listen(0);
  const { port } = server.address();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/metrics`);
    assert.strictEqual(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes('http_request_duration_seconds'));
  } finally {
    server.close();
  }
});

test('POST /api/tasks avec un titre trop long renvoie 400', async () => {
  const server = app.listen(0);
  const { port } = server.address();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/tasks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'a'.repeat(101) }) });
    assert.strictEqual(res.status, 400);
  } finally {
    server.close();
  }
});

test('POST /api/tasks avec un titre non-texte renvoie 400', async () => {
  const server = app.listen(0);
  const { port } = server.address();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/tasks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 123 }) });
    assert.strictEqual(res.status, 400);
  } finally {
    server.close();
  }
});

test('GET /api/tasks/abc renvoie 400', async () => {
  const server = app.listen(0);
  const { port } = server.address();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/tasks/abc`);
    assert.strictEqual(res.status, 400);
  } finally {
    server.close();
  }
});

test('PUT /api/tasks/1 avec done non booléen renvoie 400', async () => {
  const server = app.listen(0);
  const { port } = server.address();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/tasks/1`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ done: 'oui' }) });
    assert.strictEqual(res.status, 400);
  } finally {
    server.close();
  }
});
