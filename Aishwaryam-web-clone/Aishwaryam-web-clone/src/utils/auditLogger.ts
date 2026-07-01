export interface AuditLog {
  id: string;
  type: 'Click' | 'View' | 'Error' | 'Login' | 'System';
  screenName: string;
  description: string;
  timestamp: string;
  sessionId: string;
  deviceId: string;
  meta?: any;
}

export interface DeviceTelemetry {
  deviceId: string;
  os: string;
  browser: string;
  location: string;
  installDate: string;
  status: 'active' | 'inactive';
}

export class AuditLogger {
  private static readonly DEVICE_ID_KEY = 'audit_device_id';
  private static readonly INSTALL_DATE_KEY = 'audit_install_date';
  private static readonly SESSION_ID_KEY = 'audit_session_id';
  private static readonly LAST_ACTIVITY_KEY = 'audit_last_activity';
  private static readonly LOGS_KEY = 'audit_logs';
  private static readonly SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

  static initialize(): void {
    this.getDeviceId();
    this.getInstallDate();
    this.checkSessionValidity();
    
    // Log system initialization
    this.log('System', 'App', 'Audit logger initialized and monitoring telemetry');
  }

  static getDeviceId(): string {
    let deviceId = localStorage.getItem(this.DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = 'DEV-' + Math.random().toString(36).substring(2, 11).toUpperCase();
      localStorage.setItem(this.DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  }

  static getInstallDate(): string {
    let installDate = localStorage.getItem(this.INSTALL_DATE_KEY);
    if (!installDate) {
      installDate = new Date().toISOString();
      localStorage.setItem(this.INSTALL_DATE_KEY, installDate);
    }
    return installDate;
  }

  private static checkSessionValidity(): string {
    const now = Date.now();
    let sessionId = localStorage.getItem(this.SESSION_ID_KEY);
    const lastActivityStr = localStorage.getItem(this.LAST_ACTIVITY_KEY);
    const lastActivity = lastActivityStr ? parseInt(lastActivityStr, 10) : 0;

    if (!sessionId || (now - lastActivity > this.SESSION_TIMEOUT_MS)) {
      sessionId = 'SESS-' + Math.random().toString(36).substring(2, 11).toUpperCase();
      localStorage.setItem(this.SESSION_ID_KEY, sessionId);
      
      // Inline logging to prevent recursive stack overflow loop
      const newLog: AuditLog = {
        id: 'LOG-' + Math.random().toString(36).substring(2, 11).toUpperCase(),
        type: 'System',
        screenName: 'App',
        description: `New user session established: ${sessionId}`,
        timestamp: new Date().toISOString(),
        sessionId,
        deviceId: this.getDeviceId()
      };

      try {
        const rawLogs = localStorage.getItem(this.LOGS_KEY);
        let logsList: AuditLog[] = [];
        if (rawLogs) {
          logsList = JSON.parse(rawLogs);
        }
        logsList.unshift(newLog);
        if (logsList.length > 500) {
          logsList = logsList.slice(0, 500);
        }
        localStorage.setItem(this.LOGS_KEY, JSON.stringify(logsList));
        window.dispatchEvent(new CustomEvent('audit_log_added', { detail: newLog }));
      } catch (e) {
        // ignore
      }
    }

    localStorage.setItem(this.LAST_ACTIVITY_KEY, now.toString());
    return sessionId;
  }

  static getSessionId(): string {
    return this.checkSessionValidity();
  }

  static getTelemetry(): DeviceTelemetry {
    const userAgent = navigator.userAgent;
    let os = 'Unknown OS';
    if (userAgent.indexOf('Win') !== -1) os = 'Windows';
    else if (userAgent.indexOf('Mac') !== -1) os = 'MacOS';
    else if (userAgent.indexOf('Linux') !== -1) os = 'Linux';
    else if (userAgent.indexOf('Android') !== -1) os = 'Android';
    else if (userAgent.indexOf('like Mac') !== -1) os = 'iOS';

    let browser = 'Unknown Browser';
    if (userAgent.indexOf('Chrome') !== -1) browser = 'Chrome';
    else if (userAgent.indexOf('Safari') !== -1) browser = 'Safari';
    else if (userAgent.indexOf('Firefox') !== -1) browser = 'Firefox';
    else if (userAgent.indexOf('MSIE') !== -1 || !!(document as any).documentMode) browser = 'IE';

    // Premium realistic locations based on local browser language / timezone
    let location = 'Tamil Nadu, India';
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz.includes('Calcutta') || tz.includes('Kolkata') || tz.includes('Asia/Delhi')) {
        location = 'Delhi, India';
      } else if (tz.includes('Mumbai') || tz.includes('Asia/Kolkata')) {
        location = 'Maharashtra, India';
      } else {
        location = tz || 'India';
      }
    } catch (e) {
      // ignore
    }

    return {
      deviceId: this.getDeviceId(),
      os,
      browser,
      location,
      installDate: this.getInstallDate(),
      status: 'active'
    };
  }

  static log(
    type: 'Click' | 'View' | 'Error' | 'Login' | 'System',
    screenName: string,
    description: string,
    meta?: any
  ): void {
    const sessionId = this.checkSessionValidity();
    const deviceId = this.getDeviceId();
    
    const newLog: AuditLog = {
      id: 'LOG-' + Math.random().toString(36).substring(2, 11).toUpperCase(),
      type,
      screenName,
      description,
      timestamp: new Date().toISOString(),
      sessionId,
      deviceId,
      meta
    };

    // Store log in localStorage
    const rawLogs = localStorage.getItem(this.LOGS_KEY);
    let logs: AuditLog[] = [];
    if (rawLogs) {
      try {
        logs = JSON.parse(rawLogs);
      } catch (e) {
        logs = [];
      }
    }

    // Unshift to keep newest first
    logs.unshift(newLog);
    
    // Keep last 500 logs to prevent LocalStorage bloat
    if (logs.length > 500) {
      logs = logs.slice(0, 500);
    }

    localStorage.setItem(this.LOGS_KEY, JSON.stringify(logs));

    // Dispatch event for live dashboard updates
    window.dispatchEvent(new CustomEvent('audit_log_added', { detail: newLog }));
  }

  static getLogs(): AuditLog[] {
    const rawLogs = localStorage.getItem(this.LOGS_KEY);
    if (!rawLogs) return [];
    try {
      return JSON.parse(rawLogs);
    } catch (e) {
      return [];
    }
  }

  static clearLogs(): void {
    localStorage.removeItem(this.LOGS_KEY);
    this.log('System', 'SuperAdmin', 'All audit logs cleared manually');
  }

  static logError(error: Error | any, context?: string): void {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    this.log('Error', context || 'Global', message, { stack });
  }
}
