import test from 'node:test';
import assert from 'node:assert/strict';

const base = 'http://127.0.0.1:3000';
function cookieFrom(response: Response) {
  const getSetCookie = (response.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.();
  return getSetCookie?.map((value) => value.split(';')[0]).join('; ') || '';
}

test('health and route manifest are available', async () => {
  const health = await fetch(`${base}/health`);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).ok, true);
  const manifest = await fetch(`${base}/manus-routes.json`);
  assert.equal(manifest.status, 200);
  assert.ok((await manifest.json()).routes.some((route: { path: string }) => route.path === '/marketplace'));
});

test('marketplace search and filtering return approved catalog data', async () => {
  const response = await fetch(`${base}/api/v1/products?department=Computer%20Science&sort=price_asc`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.ok(body.total >= 1);
  assert.ok(body.items.every((item: { status: string; department: string }) => item.status === 'APPROVED' && item.department === 'Computer Science'));
});

test('student login creates a protected session and admin route rejects it', async () => {
  const login = await fetch(`${base}/api/v1/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'aarav.demo@campusreuse.local', password: 'Student!2026', role: 'student' }) });
  assert.equal(login.status, 200);
  const cookie = cookieFrom(login);
  const me = await fetch(`${base}/api/v1/auth/me`, { headers: { cookie } });
  assert.equal(me.status, 200);
  assert.equal((await me.json()).user.role, 'STUDENT');
  const forbidden = await fetch(`${base}/api/v1/admin/dashboard`, { headers: { cookie } });
  assert.equal(forbidden.status, 403);
});

test('admin login returns database-backed metrics', async () => {
  const login = await fetch(`${base}/api/v1/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'admin@campusreuse.local', password: 'CampusReuse!2026', role: 'admin' }) });
  assert.equal(login.status, 200);
  const cookie = cookieFrom(login);
  const dashboard = await fetch(`${base}/api/v1/admin/dashboard`, { headers: { cookie } });
  assert.equal(dashboard.status, 200);
  const stats = (await dashboard.json()).stats;
  assert.ok(stats.totalListings >= 1);
  assert.ok(typeof stats.totalStudents === 'number');
});
