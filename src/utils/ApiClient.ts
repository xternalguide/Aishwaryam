import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import { SessionManager } from './SessionManager';

const BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:')
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

// Response interceptor: automatically handles JWT expiration and refresh token rotation
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Attempt token refresh rotation on 401
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
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
            
            // Retry the original request
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return instance(originalRequest);
          }
        } catch (refreshErr) {
          // Refresh failed, clear session and redirect
          SessionManager.clearSession();
          if (SessionManager.getOnboardingStage() === 'FULLY_VERIFIED') {
            window.location.hash = '#/mpin/verify';
          } else {
            window.location.hash = '#/login';
          }
        }
      } else {
        SessionManager.clearSession();
        if (SessionManager.getOnboardingStage() === 'FULLY_VERIFIED') {
          window.location.hash = '#/mpin/verify';
        } else {
          window.location.hash = '#/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export const ApiClient = {
  getDeviceFingerprint,
  // GET wraps Axios request
  get: async <T = any>(url: string): Promise<AxiosResponse<T>> => {
    return await instance.get<T>(url);
  },

  // POST wraps Axios request
  post: async <T = any>(url: string, data?: any): Promise<AxiosResponse<T>> => {
    return await instance.post<T>(url, data);
  },

  // PUT wraps Axios request
  put: async <T = any>(url: string, data?: any): Promise<AxiosResponse<T>> => {
    return await instance.put<T>(url, data);
  }
};
