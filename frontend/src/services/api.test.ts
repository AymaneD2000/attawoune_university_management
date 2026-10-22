import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('API base URL configuration', () => {
  it('prefers VITE_API_URL when both settings are configured', async () => {
    vi.stubEnv('VITE_API_URL', 'https://primary.example/api/v1');
    vi.stubEnv('VITE_API_BASE_URL', 'https://secondary.example/api/v1');
    const { default: api, API_BASE_URL } = await import('./api');
    expect(API_BASE_URL).toBe('https://primary.example/api/v1');
    expect(api.defaults.baseURL).toBe(API_BASE_URL);
  });

  it('uses VITE_API_BASE_URL when the primary setting is empty', async () => {
    vi.stubEnv('VITE_API_URL', '');
    vi.stubEnv('VITE_API_BASE_URL', 'https://secondary.example/api/v1');
    const { API_BASE_URL } = await import('./api');
    expect(API_BASE_URL).toBe('https://secondary.example/api/v1');
  });

  it('uses the same-origin API when neither setting is configured', async () => {
    vi.stubEnv('VITE_API_URL', '');
    vi.stubEnv('VITE_API_BASE_URL', '');
    const { API_BASE_URL } = await import('./api');
    expect(API_BASE_URL).toBe('/api/v1');
  });

  it('preserves explicitly configured URLs without rewriting their hostname', async () => {
    vi.stubEnv('VITE_API_URL', 'https://api.attawoune.ml/api/v1');
    const { API_BASE_URL } = await import('./api');
    expect(API_BASE_URL).toBe('https://api.attawoune.ml/api/v1');
  });
});
