export class ApiClient {
  private static token: string | null = null;
  private static tokenPromise: Promise<string> | null = null;

  static async getToken(): Promise<string> {
    if (this.token) return this.token;
    if (this.tokenPromise) return this.tokenPromise;

    this.tokenPromise = fetch('/api/auth/token', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        this.token = data.token;
        return data.token;
      })
      .finally(() => {
        this.tokenPromise = null;
      });

    return this.tokenPromise;
  }

  static async fetchWithAuth(url: string, options: RequestInit = {}, retries = 3, delay = 1000): Promise<any> {
    try {
      const token = await this.getToken();
      const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      };

      const response = await fetch(url, { ...options, headers });
      const contentType = response.headers.get('content-type');

      if (response.status === 401 && retries > 0) {
        // Token expired or invalid, refresh and retry
        this.token = null;
        return this.fetchWithAuth(url, options, retries - 1, delay);
      }

      if (!response.ok) {
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json();
          throw new Error(error.error || `HTTP ${response.status}`);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Expected JSON response but received ${contentType || 'unknown'}`);
      }
      return response.json();
    } catch (error: any) {
      const isTransientError = 
        error.message?.includes('fetch') || 
        error instanceof TypeError || 
        error.message?.includes('HTTP 502') || 
        error.message?.includes('HTTP 503') || 
        error.message?.includes('HTTP 504') || 
        error.message?.includes('Expected JSON response');

      if (retries > 0 && isTransientError) {
        console.warn(`Fetch to ${url} failed (${error.message}). Retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithAuth(url, options, retries - 1, delay * 1.5);
      }
      throw error;
    }
  }

  static async get(endpoint: string, retries = 3, delay = 1000): Promise<any> {
    return this.fetchWithAuth(`/api${endpoint}`, { method: 'GET' }, retries, delay);
  }

  static async post(endpoint: string, body: any) {
    return this.fetchWithAuth(`/api${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  static async patch(endpoint: string, body: any) {
    return this.fetchWithAuth(`/api${endpoint}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  static async put(endpoint: string, body: any) {
    return this.fetchWithAuth(`/api${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }
}

