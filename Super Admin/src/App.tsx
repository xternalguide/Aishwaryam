import React, { useState } from 'react';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { AdminLayout } from './components/AdminLayout';
import { Login } from './pages/Login';
import { DashboardOverview } from './pages/DashboardOverview';
import { UsersList } from './pages/UsersList';
import { KycVerification } from './pages/KycVerification';
import { TransactionsLedger } from './pages/TransactionsLedger';
import { RedemptionRequests } from './pages/RedemptionRequests';
import { SchemeEnrollments } from './pages/SchemeEnrollments';
import { SchemeMaster } from './pages/SchemeMaster';
import { OffersManager } from './pages/OffersManager';
import { MarketingAssets } from './pages/MarketingAssets';
import { NotificationPanel } from './pages/NotificationPanel';
import { AuditLogs } from './pages/AuditLogs';
import { DatabaseUpdates } from './pages/DatabaseUpdates';

// Helper component that accesses context
const AdminPortalContent: React.FC = () => {
  const { isAuthenticated } = useAdmin();
  const [currentTab, setCurrentTab] = useState('dashboard');

  if (!isAuthenticated) {
    return <Login />;
  }

  // Dynamic Page Rendering based on active sidebar tab
  const renderPage = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'users':
        return <UsersList />;
      case 'kyc':
        return <KycVerification />;
      case 'transactions':
        return <TransactionsLedger />;
      case 'redemptions':
        return <RedemptionRequests />;
      case 'enrollments':
        return <SchemeEnrollments />;
      case 'schemes':
        return <SchemeMaster />;
      case 'offers':
        return <OffersManager />;
      case 'marketing':
        return <MarketingAssets />;
      case 'notifications':
        return <NotificationPanel />;
      case 'audit':
        return <AuditLogs />;
      case 'db-updates':
        return <DatabaseUpdates />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <AdminLayout currentTab={currentTab} setCurrentTab={setCurrentTab}>
      {renderPage()}
    </AdminLayout>
  );
};

function App() {
  return (
    <AdminProvider>
      <AdminPortalContent />
    </AdminProvider>
  );
}

export default App;
