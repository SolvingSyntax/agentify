export const API_BASE_URL = (import.meta.env['VITE_API_BASE_URL'] as string) || 'http://localhost:8000/api/v1';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number = 500, data: any = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const getStoredToken = (): string | null => {
  return (
    localStorage.getItem('agentify_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('auth_token') ||
    sessionStorage.getItem('token') ||
    null
  );
};

export const setStoredToken = (token: string) => {
  localStorage.setItem('agentify_token', token);
  localStorage.setItem('token', token);
  localStorage.setItem('auth_token', token);
};

export const clearStoredToken = () => {
  localStorage.removeItem('agentify_token');
  localStorage.removeItem('token');
  localStorage.removeItem('auth_token');
  sessionStorage.removeItem('token');
};

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // If unauthorized and not already on login page, redirect to /login
    if (response.status === 401 && !window.location.pathname.includes('/login')) {
      clearStoredToken();
      window.location.href = '/login';
    }

    throw new ApiError(
      data.detail || data.message || `API Error (${response.status})`,
      response.status,
      data
    );
  }

  return data as T;
}

export const apiClient = {
  get: <T = any>(url: string, options?: RequestInit) => apiFetch<T>(url, { ...options, method: 'GET' }),
  post: <T = any>(url: string, body?: any, options?: RequestInit) =>
    apiFetch<T>(url, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: <T = any>(url: string, body?: any, options?: RequestInit) =>
    apiFetch<T>(url, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  delete: <T = any>(url: string, options?: RequestInit) => apiFetch<T>(url, { ...options, method: 'DELETE' }),
  request: <T = any>(url: string, options?: RequestInit) => apiFetch<T>(url, options),
};

export const api = apiClient;
export default apiClient;