import { afterEach, beforeEach, expect, test, vi } from 'vitest';

async function loadApi(env = {}) {
  vi.resetModules();
  vi.unstubAllEnvs();
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  return import('../api.js');
}
beforeEach(() => localStorage.clear());
afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });

test('uses the configured absolute API base and sends the Bearer token cross-origin', async () => {
  const { api, auth, API_BASE_URL } = await loadApi({ VITE_API_BASE_URL: 'https://api.avinyaa.tech/api/v1/' });
  expect(API_BASE_URL).toBe('https://api.avinyaa.tech/api/v1');
  auth.set('jwt-token');
  global.fetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({}) }));
  await api.me();
  expect(fetch.mock.calls[0][0]).toBe('https://api.avinyaa.tech/api/v1/auth/me');
  expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer jwt-token');
});

test('falls back to the same-origin /api/v1 proxy when no base URL is set (dev and Docker)', async () => {
  const { API_BASE_URL } = await loadApi({ VITE_API_BASE_URL: '' });
  expect(API_BASE_URL).toBe('/api/v1');
});

test('assetUrl resolves root-relative backend paths and leaves absolute URLs alone', async () => {
  const { assetUrl } = await loadApi({ VITE_API_BASE_URL: 'https://api.avinyaa.tech/api/v1' });
  expect(assetUrl('/uploads/puzzles/a/piece_0.webp')).toBe('https://api.avinyaa.tech/uploads/puzzles/a/piece_0.webp');
  expect(assetUrl('/media/sequencing/x.png')).toBe('https://api.avinyaa.tech/media/sequencing/x.png');
  expect(assetUrl('https://cdn.example.test/a.png')).toBe('https://cdn.example.test/a.png');
  expect(assetUrl('//cdn.example.test/a.png')).toBe('//cdn.example.test/a.png');
  expect(assetUrl('data:image/png;base64,AAA')).toBe('data:image/png;base64,AAA');
  expect(assetUrl(null)).toBeNull();
});

test('assetUrl keeps same-origin paths in dev/Docker, and honours VITE_ASSET_BASE_URL', async () => {
  expect((await loadApi({ VITE_API_BASE_URL: '' })).assetUrl('/uploads/p.webp')).toBe('/uploads/p.webp');
  const { assetUrl } = await loadApi({ VITE_API_BASE_URL: '/api/v1', VITE_ASSET_BASE_URL: 'https://files.example.test/' });
  expect(assetUrl('/uploads/p.webp')).toBe('https://files.example.test/uploads/p.webp');
});

test('network failures become a readable error with status 0', async () => {
  const { api } = await loadApi({ VITE_API_BASE_URL: 'https://api.avinyaa.tech/api/v1' });
  global.fetch = vi.fn(async () => { throw new TypeError('Failed to fetch'); });
  await expect(api.me()).rejects.toMatchObject({ status: 0, code: 'network', message: expect.stringContaining('Cannot reach') });
});

test('requests abort with a timeout error', async () => {
  vi.useFakeTimers();
  const { api } = await loadApi({ VITE_API_BASE_URL: 'https://api.avinyaa.tech/api/v1', VITE_API_TIMEOUT_MS: '1000' });
  global.fetch = vi.fn((_url, init) => new Promise((_resolve, reject) => {
    init.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
  }));
  const pending = expect(api.me()).rejects.toMatchObject({ status: 0, code: 'timeout' });
  await vi.advanceTimersByTimeAsync(1100);
  await pending;
});

test('FormData uploads keep the browser-set multipart header and Bearer token', async () => {
  const { api, auth } = await loadApi({ VITE_API_BASE_URL: 'https://api.avinyaa.tech/api/v1' });
  auth.set('t');
  global.fetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({}) }));
  await api.sequencing.uploadMaterial(new File(['x'], 'a.pdf'), 'Science', 5);
  const [url, init] = fetch.mock.calls[0];
  expect(url).toBe('https://api.avinyaa.tech/api/v1/teacher/sequencing/upload');
  expect(init.headers['Content-Type']).toBeUndefined();
  expect(init.headers.Authorization).toBe('Bearer t');
  expect(init.body).toBeInstanceOf(FormData);
});
