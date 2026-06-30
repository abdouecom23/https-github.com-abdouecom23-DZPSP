export class ApiClient {
  static async get(endpoint: string, retries = 3, delay = 1000): Promise<any> {
    try {
      const response = await fetch(`/api${endpoint}`);
      const contentType = response.headers.get('content-type');
      
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
      if (retries > 0 && (error.message?.includes('fetch') || error instanceof TypeError)) {
        console.warn(`Fetch to /api${endpoint} failed. Retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return ApiClient.get(endpoint, retries - 1, delay * 1.5);
      }
      throw error;
    }
  }

  static async post(endpoint: string, body: any) {
    const response = await fetch(`/api${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const contentType = response.headers.get('content-type');

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
  }

  static async patch(endpoint: string, body: any) {
    const response = await fetch(`/api${endpoint}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const contentType = response.headers.get('content-type');

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
  }

  static async put(endpoint: string, body: any) {
    const response = await fetch(`/api${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const contentType = response.headers.get('content-type');

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
  }
}
