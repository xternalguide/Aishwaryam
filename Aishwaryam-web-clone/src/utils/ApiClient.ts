import axios from 'axios';
import type { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';
import { SessionManager } from './SessionManager';
import { AuditLogger } from './auditLogger';

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isCapacitor = !!(window as any).Capacitor || navigator.userAgent.includes('Capacitor') || navigator.userAgent.includes('AishwaryamAPK') || navigator.userAgent.includes('wv') || navigator.userAgent.includes('Version/4.0');

export const BASE_URL = (isLocalhost && !isCapacitor)
  ? 'http://localhost:5044/'
  : 'https://aishwaryam-backend.onrender.com/';

export const getDeviceFingerprint = (): string => {
  const isCapacitor = !!(window as any).Capacitor;
  return isCapacitor ? 'android_default' : 'web_default';
};

const instance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: add bearer token if session exists
instance.interceptors.request.use(
  (config) => {
    // Log request
    const url = config.url || '';
    AuditLogger.log('System', 'API', `API Request: ${config.method?.toUpperCase()} ${url}`);

    // Exempt public auth endpoints from carrying the authorization header
    const publicEndpoints = [
      'api/Auth/send-otp',
      'api/Auth/verify-otp',
      'api/Auth/refresh'
    ];
    const isPublic = publicEndpoints.some(endpoint => url.includes(endpoint));

    if (!isPublic) {
      const token = SessionManager.getToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

interface Subscriber {
  resolve: (token: string) => void;
  reject: (err: any) => void;
}

let isRefreshing = false;
let refreshSubscribers: Subscriber[] = [];

const subscribeTokenRefresh = (resolve: (token: string) => void, reject: (err: any) => void) => {
  refreshSubscribers.push({ resolve, reject });
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((sub) => sub.resolve(token));
  refreshSubscribers = [];
};

const onRefreshFailed = (err: any) => {
  refreshSubscribers.forEach((sub) => sub.reject(err));
  refreshSubscribers = [];
};

// Response interceptor: automatically handles JWT expiration and refresh token rotation
instance.interceptors.response.use(
  (response) => {
    // Log successful response
    const url = response.config.url || '';
    AuditLogger.log('System', 'API', `API Success: ${response.config.method?.toUpperCase()} ${url} (${response.status} OK)`);
    return response;
  },
  async (error) => {
    const url = error.config?.url || '';
    const status = error.response?.status || 'Network Error';
    AuditLogger.log('Error', 'API', `API Failure: ${error.config?.method?.toUpperCase()} ${url} (${status})`);
    const originalRequest = error.config;
    const publicEndpoints = [
      'api/Auth/verify-mpin',
      'api/Auth/send-otp',
      'api/Auth/verify-otp',
      'api/Auth/refresh'
    ];
    const isPublic = publicEndpoints.some(endpoint => url.includes(endpoint));

    if (isPublic) {
      return Promise.reject(error);
    }

    // Attempt token refresh rotation on 401
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh(
            (token) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(instance(originalRequest));
            },
            (err) => {
              reject(err);
            }
          );
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
            const customError = new Error(res.data?.message || 'Session expired');
            onRefreshFailed(customError);
            SessionManager.clearSession();
            window.location.href = '/';
            return Promise.reject(customError);
          }
        } catch (refreshErr: any) {
          isRefreshing = false;
          // Check if this was a terminal server rejection (400 or 401) vs a network/server transient error
          const status = refreshErr.response?.status;
          if (status === 400 || status === 401) {
            onRefreshFailed(refreshErr);
            SessionManager.clearSession();
            window.location.href = '/';
            return Promise.reject(refreshErr);
          } else {
            // Transient error (network down, 503, etc.). Do NOT clear session.
            // Notify other queued requests of the failure so they don't hang, and reject current request.
            onRefreshFailed(refreshErr);
            console.warn('Token refresh failed due to network or server error. Retaining session.', refreshErr);
            return Promise.reject(refreshErr);
          }
        }
      } else {
        isRefreshing = false;
        const noTokenErr = new Error('No refresh token available');
        SessionManager.clearSession();
        window.location.href = '/';
        return Promise.reject(noTokenErr);
      }
    }

    return Promise.reject(error);
  }
);

const mockKycRequests = (_method: string, _url: string, _data?: any): any => {
  // Disable local mock for production-level live database writes
  return null;
};

export const ApiClient = {
  getDeviceFingerprint,
  // GET wraps Axios request
  get: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    const mock = mockKycRequests('GET', url);
    if (mock) return mock;
    return await instance.get<T>(url, config);
  },

  // POST wraps Axios request
  post: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    const mock = mockKycRequests('POST', url, data);
    if (mock) return mock;
    return await instance.post<T>(url, data, config);
  },

  // PUT wraps Axios request
  put: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    const mock = mockKycRequests('PUT', url, data);
    if (mock) return mock;
    return await instance.put<T>(url, data, config);
  },

  // DELETE wraps Axios request
  delete: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return await instance.delete<T>(url, config);
  }
};
