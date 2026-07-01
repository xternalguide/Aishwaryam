import React, { useState } from 'react';
import { BookOpen, Copy, Check } from 'lucide-react';

interface EnvVar {
  key: string;
  value: string;
  purpose: string;
  required: boolean;
  status: 'valid' | 'missing' | 'warning';
}

export const SetupGuide: React.FC = () => {
  const [activeTopic, setActiveTopic] = useState<string>('Overview');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [envVars] = useState<EnvVar[]>([
    { key: 'APP_NAME', value: 'Aishwaryam Gold', purpose: 'Application display name', required: true, status: 'valid' },
    { key: 'APP_URL', value: 'https://aishwaryamgold.web.app', purpose: 'Web app URL for redirection links', required: true, status: 'valid' },
    { key: 'API_URL', value: 'https://api.aishwaryamgold.com', purpose: 'Backend API production endpoint', required: true, status: 'valid' },
    { key: 'DATABASE_URL', value: 'mongodb+srv://admin:...', purpose: 'Primary database connection string', required: true, status: 'valid' },
    { key: 'JWT_SECRET', value: 'super-secret-key-12345!', purpose: 'Auth token encryption signature', required: true, status: 'valid' },
    { key: 'FIREBASE_API_KEY', value: 'AIzaSyA1...', purpose: 'Firebase auth and configuration settings', required: true, status: 'valid' },
    { key: 'FIREBASE_PROJECT_ID', value: 'aishwaryam-gold-prod', purpose: 'Firebase cloud console project identifier', required: true, status: 'valid' },
    { key: 'GOOGLE_CLIENT_ID', value: '123456789-abc...', purpose: 'Google Sign-In integration token', required: false, status: 'warning' },
    { key: 'APPLE_CLIENT_ID', value: 'com.aishwaryam.signin', purpose: 'Apple developer authentication service key', required: false, status: 'missing' },
    { key: 'RAZORPAY_KEY_ID', value: 'rzp_live_K8m...', purpose: 'Razorpay production key ID', required: true, status: 'valid' },
    { key: 'RAZORPAY_KEY_SECRET', value: '••••••••••••', purpose: 'Razorpay API access secret', required: true, status: 'valid' },
    { key: 'AWS_ACCESS_KEY', value: 'AKIAIOSFODNN7...', purpose: 'S3 cloud storage file access credential', required: true, status: 'valid' },
    { key: 'AWS_SECRET_KEY', value: '••••••••••••', purpose: 'S3 storage secret signature key', required: true, status: 'valid' },
    { key: 'SMTP_HOST', value: 'smtp.gmail.com', purpose: 'Transactional email dispatch server', required: true, status: 'valid' },
    { key: 'SMTP_PORT', value: '587', purpose: 'Email mail transfer protocol port', required: true, status: 'valid' },
    { key: 'SMTP_USER', value: 'no-reply@aishwaryam.com', purpose: 'Mailing sender credentials username', required: true, status: 'valid' },
    { key: 'SMTP_PASSWORD', value: '••••••••••••', purpose: 'App specific mailer password code', required: true, status: 'valid' },
  ]);

  const handleCopy = (key: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const topics = [
    { id: 'Overview', title: 'Overview' },
    { id: 'Installation', title: 'Installation' },
    { id: 'Environment Variables', title: 'Environment Variables' },
    { id: 'Firebase Setup', title: 'Firebase Setup' },
    { id: 'Google Login', title: 'Google Login' },
    { id: 'Apple Login', title: 'Apple Login' },
    { id: 'Push Notifications', title: 'Push Notifications' },
    { id: 'Database Setup', title: 'Database Setup' },
    { id: 'Storage Setup', title: 'Storage Setup' },
    { id: 'Payment Gateway', title: 'Payment Gateway' },
    { id: 'Email Service', title: 'Email Service' },
    { id: 'SMS Service', title: 'SMS Service' },
    { id: 'Maps Setup', title: 'Maps Setup' },
    { id: 'Build Android APK', title: 'Build Android APK' },
    { id: 'Build Android AAB', title: 'Build Android AAB' },
    { id: 'Build iOS IPA', title: 'Build iOS IPA' },
    { id: 'Play Store Publish', title: 'Play Store Publish' },
    { id: 'App Store Publish', title: 'App Store Publish' },
    { id: 'Web Deployment', title: 'Web Deployment' },
    { id: 'Troubleshooting', title: 'Troubleshooting' },
    { id: 'FAQ', title: 'FAQ' },
  ];

  const renderTopicContent = () => {
    switch (activeTopic) {
      case 'Overview':
        return (
          <div>
            <h3 style={{ fontSize: '20px', marginBottom: '16px' }}>Project Overview</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '12px' }}>
              Welcome to the Aishwaryam Project Administrator Guide. This portal allows developers and system administrators to trace, maintain, and bootstrap app ecosystems without manual command-line inspection.
            </p>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '12px' }}>
              The application utilizes <strong>React (Vite)</strong> for the front-end rendering combined with <strong>Capacitor</strong> to package and build native applications for Android and iOS systems. Follow this interactive guide to completely deploy and operate production instances.
            </p>
            <div style={{ backgroundColor: 'var(--brand-glow)', padding: '16px', borderRadius: '8px', marginTop: '20px' }}>
              <h4 style={{ color: 'var(--brand-dark)', marginBottom: '8px' }}>Key Architecture Components:</h4>
              <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                <li><strong>Local Cache Engine:</strong> Manages offline sync states via local storage telemetry.</li>
                <li><strong>Payment Integration:</strong> Razorpay native bindings for secure money transfers.</li>
                <li><strong>Push Channels:</strong> Capacitor PushNotification listener with Firebase Cloud Messaging.</li>
              </ul>
            </div>
          </div>
        );

      case 'Installation':
        return (
          <div>
            <h3 style={{ fontSize: '20px', marginBottom: '16px' }}>Quick Installation Guide</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>Follow these simple commands inside your shell terminal to install dependencies and execute dev servers locally:</p>
            
            <h4 style={{ marginBottom: '8px', fontSize: '15px' }}>1. Clone Repository & Install Node Modules</h4>
            <pre style={{ backgroundColor: '#2d3748', color: '#f7fafc', padding: '14px', borderRadius: '6px', overflowX: 'auto', marginBottom: '16px', fontSize: '13px' }}>
{`git clone https://github.com/blazewing/aishwaryam-web.git
cd aishwaryam-web
npm install`}
            </pre>

            <h4 style={{ marginBottom: '8px', fontSize: '15px' }}>2. Spin Up Vite Local Server</h4>
            <pre style={{ backgroundColor: '#2d3748', color: '#f7fafc', padding: '14px', borderRadius: '6px', overflowX: 'auto', marginBottom: '16px', fontSize: '13px' }}>
{`npm run dev`}
            </pre>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              The local server runs on <a href="http://localhost:5173" target="_blank" rel="noreferrer" style={{ color: 'var(--brand-mid)' }}>http://localhost:5173</a>.
            </p>
          </div>
        );

      case 'Environment Variables':
        return (
          <div>
            <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>Environment Variables Configuration</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '14px' }}>
              Configure your <code>.env</code> file in the project root with the variables listed below. Ensure production environment variables are fully validated before releasing native builds.
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E2E8F0', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '12px 8px' }}>Variable Key</th>
                    <th style={{ padding: '12px 8px' }}>Purpose</th>
                    <th style={{ padding: '12px 8px' }}>Example Value</th>
                    <th style={{ padding: '12px 8px' }}>Requirement</th>
                    <th style={{ padding: '12px 8px' }}>Status</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {envVars.map((v) => (
                    <tr key={v.key} style={{ borderBottom: '1px solid #EDF2F7' }}>
                      <td style={{ padding: '12px 8px', fontWeight: '600', color: 'var(--brand-deep)', fontFamily: 'monospace' }}>{v.key}</td>
                      <td style={{ padding: '12px 8px', color: 'var(--text-secondary)', maxWidth: '200px' }}>{v.purpose}</td>
                      <td style={{ padding: '12px 8px', fontFamily: 'monospace', color: '#4A5568' }}>{v.value}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          backgroundColor: v.required ? 'var(--error-light)' : 'var(--surface-card)',
                          color: v.required ? 'var(--error-red)' : 'var(--text-secondary)'
                        }}>
                          {v.required ? 'Required' : 'Optional'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          color: v.status === 'valid' ? 'var(--success-green)' : v.status === 'warning' ? 'var(--warning-amber)' : 'var(--error-red)'
                        }}>
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: v.status === 'valid' ? 'var(--success-green)' : v.status === 'warning' ? 'var(--warning-amber)' : 'var(--error-red)'
                          }}></span>
                          {v.status === 'valid' ? 'Verified' : v.status === 'warning' ? 'Mismatch' : 'Missing'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleCopy(v.key, v.value)}
                          style={{
                            border: 'none',
                            backgroundColor: 'transparent',
                            cursor: 'pointer',
                            color: 'var(--brand-mid)',
                            padding: '4px',
                            borderRadius: '4px'
                          }}
                          title="Copy to Clipboard"
                        >
                          {copiedKey === v.key ? <Check size={16} style={{ color: 'var(--success-green)' }} /> : <Copy size={16} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'Firebase Setup':
        return (
          <div>
            <h3 style={{ fontSize: '20px', marginBottom: '16px' }}>Firebase Console Configurations</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '16px' }}>
              Firebase is essential for supporting verification codes, database backups, and push notifications.
            </p>
            
            <div style={{ borderLeft: '3px solid var(--brand-mid)', paddingLeft: '16px', margin: '16px 0' }}>
              <ol style={{ paddingLeft: '20px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                <li>Navigate to <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" style={{ color: 'var(--brand-mid)' }}>Firebase Developer Console</a>.</li>
                <li>Create a project named <strong>Aishwaryam Gold App</strong>.</li>
                <li>Add Web, Android, and iOS applications to the project registry.</li>
                <li>Download and drop the config files:
                  <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
                    <li>Android: Place <code>google-services.json</code> inside <code>android/app/</code>.</li>
                    <li>iOS: Place <code>GoogleService-Info.plist</code> inside the Xcode project bundle directory.</li>
                  </ul>
                </li>
              </ol>
            </div>
          </div>
        );

      case 'Payment Gateway':
        return (
          <div>
            <h3 style={{ fontSize: '20px', marginBottom: '16px' }}>Razorpay Integration Guide</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '12px' }}>
              Aishwaryam uses Razorpay Standard Integration to process client deposits and digital gold purchases.
            </p>
            <h4 style={{ fontSize: '15px', marginTop: '16px', marginBottom: '8px' }}>Setup Checklist:</h4>
            <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
              <li>Generate <strong>API Keys</strong> under API Keys section in Settings on Razorpay Admin Dashboard.</li>
              <li>Provide Key ID and Key Secret to the environment file.</li>
              <li>For Capacitor Android deployment, verify that <code>capacitor-razorpay</code> dependencies are added correctly to the gradle properties.</li>
            </ul>
          </div>
        );

      case 'Build Android APK':
      case 'Build Android AAB':
        return (
          <div>
            <h3 style={{ fontSize: '20px', marginBottom: '16px' }}>Packaging Android Native Build (APK / AAB)</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>Follow these build instructions to generate native installable packages:</p>
            
            <pre style={{ backgroundColor: '#2d3748', color: '#f7fafc', padding: '14px', borderRadius: '6px', overflowX: 'auto', marginBottom: '16px', fontSize: '13px' }}>
{`# 1. Compile web static files
npm run build

# 2. Sync bundles into Capacitor Native Directory
npx cap sync android

# 3. Open Android Studio projects
npx cap open android`}
            </pre>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              Inside Android Studio, navigate to <strong>Build &gt; Build Bundle(s) / APK(s) &gt; Build APK</strong> to generate debug/release artifacts. For publishing to Google Play Store, choose <strong>Generate Signed Bundle</strong> and configure your Keystore key settings.
            </p>
          </div>
        );

      default:
        return (
          <div>
            <h3 style={{ fontSize: '20px', marginBottom: '16px' }}>{activeTopic} Setup</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              Setup documentation and verification scripts for <strong>{activeTopic}</strong> are currently under sync. Keep environment credentials secure and always test custom gateway triggers under Sandbox mode prior to deployment.
            </p>
          </div>
        );
    }
  };

  return (
    <div style={{ display: 'flex', gap: '24px', height: 'calc(100vh - 160px)', minHeight: '400px' }}>
      {/* Document Sidebar Selector */}
      <div style={{
        width: '240px',
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        padding: '16px',
        overflowY: 'auto',
        border: '1px solid var(--border-light)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-deep)', fontWeight: 'bold', padding: '0 8px 12px 8px', borderBottom: '1px solid #F3F4F6', marginBottom: '8px' }}>
          <BookOpen size={18} />
          <span>Setup Guides</span>
        </div>
        {topics.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTopic(t.id)}
            style={{
              textAlign: 'left',
              padding: '10px 12px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: activeTopic === t.id ? 'bold' : 'normal',
              backgroundColor: activeTopic === t.id ? 'var(--brand-glow)' : 'transparent',
              color: activeTopic === t.id ? 'var(--brand-dark)' : 'var(--text-secondary)',
              transition: 'all 0.2s ease'
            }}
          >
            {t.title}
          </button>
        ))}
      </div>

      {/* Guide Content Display */}
      <div style={{
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        padding: '24px',
        overflowY: 'auto',
        border: '1px solid var(--border-light)'
      }}>
        {renderTopicContent()}
      </div>
    </div>
  );
};
