import axios from 'axios';
import type { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';
import { SessionManager } from './SessionManager';
import { AuditLogger } from './auditLogger';

export const BASE_URL = 'https://aishwaryam-production.up.railway.app/';

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

const mockKycRequests = (method: string, url: string, data?: any): any => {
  // Normalize URL
  const path = url.replace(/^\/+|\/+$/g, ''); // strip leading/trailing slashes
  const userId = SessionManager.getUserId() || 'user_123';

  // Helper to load/save documents
  const getDocs = () => {
    try {
      const raw = localStorage.getItem('CACHE_KYC_DOCUMENTS');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };
  const saveDocs = (docs: any[]) => {
    localStorage.setItem('CACHE_KYC_DOCUMENTS', JSON.stringify(docs));
    // Trigger storage event to update components in real time
    window.dispatchEvent(new Event('storage'));
  };

  // Helper to update profile status
  const updateProfileKycLevel = (targetUserId: string, level: string) => {
    try {
      const profileRaw = localStorage.getItem('CACHE_PROFILE');
      if (profileRaw) {
        const profile = JSON.parse(profileRaw);
        if (profile.userId === targetUserId || !profile.userId) {
          profile.kycLevel = level;
          localStorage.setItem('CACHE_PROFILE', JSON.stringify(profile));
          window.dispatchEvent(new Event('storage'));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 1. GET api/Kyc/status/:userId
  if (method === 'GET' && path.startsWith('api/Kyc/status/')) {
    const targetUserId = path.substring('api/Kyc/status/'.length);
    const docs = getDocs().filter((d: any) => d.userId === targetUserId);
    
    // Determine overall status
    let status = 'PENDING';
    const profileRaw = localStorage.getItem('CACHE_PROFILE');
    if (profileRaw) {
      try {
        const profile = JSON.parse(profileRaw);
        status = profile.kycLevel || 'PENDING';
      } catch {}
    }

    return {
      data: {
        success: true,
        status,
        documents: docs
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {}
    };
  }

  // 2. POST api/Kyc/submit
  if (method === 'POST' && path === 'api/Kyc/submit') {
    const { userId: bodyUserId, documentType, documentNumber, documentUrl } = data;
    const targetUserId = bodyUserId || userId;
    const docs = getDocs();

    // Mark any existing PENDING document of this type as REPLACED to show history
    const updatedDocs = docs.map((d: any) => {
      if (d.userId === targetUserId && d.documentType === documentType && d.status === 'PENDING') {
        return { ...d, status: 'REPLACED' };
      }
      return d;
    });

    const newDoc = {
      id: 'kyc_' + Math.random().toString(36).substring(2, 9),
      userId: targetUserId,
      documentType,
      documentNumber,
      documentUrl: documentUrl || 'https://placeholder.url/document.jpg',
      status: 'PENDING',
      submittedAt: new Date().toISOString()
    };

    updatedDocs.push(newDoc);
    saveDocs(updatedDocs);

    return {
      data: { success: true, message: 'KYC Document submitted successfully', document: newDoc },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {}
    };
  }

  // 3. POST api/Kyc/update-status
  if (method === 'POST' && path === 'api/Kyc/update-status') {
    const { userId: bodyUserId, newLevel } = data;
    const targetUserId = bodyUserId || userId;
    updateProfileKycLevel(targetUserId, newLevel);
    return {
      data: { success: true, message: `Status updated to ${newLevel}` },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {}
    };
  }

  // 4. GET api/Kyc/admin/pending
  if (method === 'GET' && path === 'api/Kyc/admin/pending') {
    const docs = getDocs();
    
    // Get the current profile so the admin sees the user
    let userProfile = { userId, fullName: 'User', phoneNumber: '9876543210', kycLevel: 'PENDING' };
    const profileRaw = localStorage.getItem('CACHE_PROFILE');
    if (profileRaw) {
      try {
        const profile = JSON.parse(profileRaw);
        userProfile = {
          userId: profile.userId || userId,
          fullName: profile.fullName || 'User',
          phoneNumber: profile.phoneNumber || '9876543210',
          kycLevel: profile.kycLevel || 'PENDING'
        };
      } catch {}
    }

    // Wrap the user profile in a list
    const users = [
      {
        ...userProfile,
        documents: docs.filter((d: any) => d.userId === userProfile.userId)
      }
    ];

    return {
      data: { success: true, users },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {}
    };
  }

  // 5. POST api/Kyc/admin/verify
  if (method === 'POST' && path === 'api/Kyc/admin/verify') {
    const { userId: bodyUserId, documentId, status, rejectedReason } = data;
    const targetUserId = bodyUserId || userId;
    const docs = getDocs();

    const updatedDocs = docs.map((d: any) => {
      if (d.id === documentId) {
        return {
          ...d,
          status,
          rejectedReason: status === 'REJECTED' ? rejectedReason || 'Blurry document' : undefined,
          verifiedAt: new Date().toISOString()
        };
      }
      return d;
    });

    saveDocs(updatedDocs);

    // Calculate user's overall kycLevel
    const userDocs = updatedDocs.filter((d: any) => d.userId === targetUserId && d.status !== 'REPLACED');
    const pan = userDocs.find((d: any) => d.documentType === 'PAN');
    const aadhaarFront = userDocs.find((d: any) => d.documentType === 'AADHAAR_FRONT');
    const aadhaarBack = userDocs.find((d: any) => d.documentType === 'AADHAAR_BACK');

    let overallStatus = 'PENDING';
    if (
      pan?.status === 'APPROVED' &&
      aadhaarFront?.status === 'APPROVED' &&
      aadhaarBack?.status === 'APPROVED'
    ) {
      overallStatus = 'FULL';
    } else if (
      pan?.status === 'REJECTED' ||
      aadhaarFront?.status === 'REJECTED' ||
      aadhaarBack?.status === 'REJECTED'
    ) {
      overallStatus = 'REJECTED';
    } else if (
      pan?.status === 'PENDING' ||
      aadhaarFront?.status === 'PENDING' ||
      aadhaarBack?.status === 'PENDING'
    ) {
      overallStatus = 'PENDING';
    }

    updateProfileKycLevel(targetUserId, overallStatus);

    return {
      data: { success: true, message: `Document verification saved as ${status}`, kycLevel: overallStatus },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {}
    };
  }

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
