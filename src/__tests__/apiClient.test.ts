import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiClient } from '../apiClient';

describe('ApiClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should make a successful GET request', async () => {
    const mockResponse = { data: 'hello' };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: (name: string) => (name === 'content-type' ? 'application/json' : null),
      },
      json: async () => mockResponse,
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await ApiClient.get('/test');
    expect(fetchMock).toHaveBeenCalledWith('/api/test');
    expect(result).toEqual(mockResponse);
  });

  it('should retry GET requests on failure', async () => {
    const mockResponse = { data: 'success' };
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) => (name === 'content-type' ? 'application/json' : null),
        },
        json: async () => mockResponse,
      });
    vi.stubGlobal('fetch', fetchMock);

    const result = await ApiClient.get('/retry-test', 2, 10);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual(mockResponse);
  });

  it('should throw an error for non-ok responses', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: {
        get: (name: string) => (name === 'content-type' ? 'application/json' : null),
      },
      json: async () => ({ error: 'Resource not found' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(ApiClient.get('/test')).rejects.toThrow('Resource not found');
  });

  it('should throw an error for non-JSON responses', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: (name: string) => (name === 'content-type' ? 'text/html' : null),
      },
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(ApiClient.get('/test')).rejects.toThrow('Expected JSON response');
  });

  it('should make a successful POST request', async () => {
    const mockResponse = { id: 123 };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: (name: string) => (name === 'content-type' ? 'application/json' : null),
      },
      json: async () => mockResponse,
    });
    vi.stubGlobal('fetch', fetchMock);

    const body = { name: 'Dinar' };
    const result = await ApiClient.post('/test-post', body);
    expect(fetchMock).toHaveBeenCalledWith('/api/test-post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    expect(result).toEqual(mockResponse);
  });

  it('should make a successful PATCH request', async () => {
    const mockResponse = { updated: true };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: (name: string) => (name === 'content-type' ? 'application/json' : null),
      },
      json: async () => mockResponse,
    });
    vi.stubGlobal('fetch', fetchMock);

    const body = { status: 'ACTIVE' };
    const result = await ApiClient.patch('/test-patch', body);
    expect(fetchMock).toHaveBeenCalledWith('/api/test-patch', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    expect(result).toEqual(mockResponse);
  });

  it('should make a successful PUT request', async () => {
    const mockResponse = { replaced: true };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: (name: string) => (name === 'content-type' ? 'application/json' : null),
      },
      json: async () => mockResponse,
    });
    vi.stubGlobal('fetch', fetchMock);

    const body = { key: 'value' };
    const result = await ApiClient.put('/test-put', body);
    expect(fetchMock).toHaveBeenCalledWith('/api/test-put', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    expect(result).toEqual(mockResponse);
  });
});
