const API_BASE = window.REQUIEM_API_BASE || '';
const TOKEN_KEY = 'requiem.token';

const api = {
  token: () => localStorage.getItem(TOKEN_KEY),
  setToken: token => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),

  async request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    const token = api.token();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers
    });

    if (res.status === 204) {
      return null;
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || 'Erreur serveur');
    }

    return data;
  }
};
