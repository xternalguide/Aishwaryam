import axios from 'axios';
import type { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';
import { SessionManager } from './SessionManager';

const isLocalHost = 
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1' || 
  window.location.hostname.startsWith('192.168.') || 
  window.location.hostname.startsWith('10.') || 
  window.location.protocol === 'file:';

const BASE_URL = isLocalHost
  ? 'http://192.168.1.36:5044/'
  : 'https://aishwaryam.blazewing.in/';

export const getDeviceFingerprint = (): string => {
  const isCapacitor = !!(window as any).Capacitor;
  return isCapacitor ? 'android_default' : 'web_default';
};

const instance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: add bearer token if session exists
instance.interceptors.request.use(
  (config) => {
    const token = SessionManager.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

// Response interceptor: automatically handles JWT expiration and refresh token rotation
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Attempt token refresh rotation on 401
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(instance(originalRequest));
          });
        });
      }

      isRefreshing = true;
      const refreshToken = SessionManager.getRefreshToken();
      
      if (refreshToken) {
        try {
          const res = await axios.post(`${BASE_URL}api/Auth/refresh`, {
            refreshToken,
            deviceFingerprint: getDeviceFingerprint()
          });

          if (res.data && res.data.success) {
            const { token, refreshToken: newRefresh, userId } = res.data;
            SessionManager.saveSession(userId, token, newRefresh);
            isRefreshing = false;
            onRefreshed(token);
            
            // Retry the original request
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return instance(originalRequest);
          } else {
            isRefreshing = false;
            SessionManager.clearSession();
            window.location.hash = '#/login';
          }
        } catch (refreshErr) {
          isRefreshing = false;
          // Refresh failed, clear session and redirect
          SessionManager.clearSession();
          window.location.hash = '#/login';
        }
      } else {
        isRefreshing = false;
        SessionManager.clearSession();
        window.location.hash = '#/login';
      }
    }

    return Promise.reject(error);
  }
);

export const ApiClient = {
  getDeviceFingerprint,
  // GET wraps Axios request
  get: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return await instance.get<T>(url, config);
  },

  // POST wraps Axios request
  post: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return await instance.post<T>(url, data, config);
  },

  // PUT wraps Axios request
  put: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return await instance.put<T>(url, data, config);
  },

  // DELETE wraps Axios request
  delete: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return await instance.delete<T>(url, config);
  }
};
