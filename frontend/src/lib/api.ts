import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

const baseURL = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';

export const api = axios.create({
  baseURL,
  withCredentials: true, // send refresh-token cookie
});

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (token) localStorage.setItem('scholr_access', token);
  else localStorage.removeItem('scholr_access');
};

export const getAccessToken = () => {
  if (accessToken) return accessToken;
  accessToken = localStorage.getItem('scholr_access');
  return accessToken;
};

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const tok = getAccessToken();
  if (tok) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${tok}`;
  }
  return config;
});

// Refresh-on-401 with single-flight protection
let refreshing: Promise<string | null> | null = null;

const refreshOnce = async (): Promise<string | null> => {
  try {
    const res = await axios.post(`${baseURL}/auth/refresh`, null, { withCredentials: true });
    const tok = res.data?.accessToken as string | undefined;
    if (tok) {
      setAccessToken(tok);
      return tok;
    }
    return null;
  } catch {
    setAccessToken(null);
    return null;
  }
};

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes('/auth/')
    ) {
      original._retry = true;
      refreshing = refreshing ?? refreshOnce();
      const newToken = await refreshing;
      refreshing = null;
      if (newToken) {
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  },
);
