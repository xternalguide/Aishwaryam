import React, { useEffect, useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Search, Download, FileDown, Calendar, RefreshCw } from 'lucide-react';

interface Transaction {
  transactionId: string;
  type: string;
  goldWeightMg: number;
  amountPaise: number;
  createdAt: string;
  userId?: string;
  resolvedName?: string;
  resolvedPhone?: string;
  schemeName?: string;
}

export const TransactionsLedger: React.FC = () => {
  const { apiBase, globalReloadToken, showToast } = useAdmin();
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [filteredTxs, setFilteredTxs] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  const loadTransactions = async () => {
    try {
      const [usersRes, txsRes] = await Promise.all([
        window.fetchWithCache(`${apiBase}/api/User/all`),
        window.fetchWithCache(`${apiBase}/api/Gold/transactions/all`)
      ]);

      let usersMap: Record<string, any> = {};
      if (usersRes.ok) {
        const users = await usersRes.json();
        users.forEach((u: any) => {
          usersMap[u.id.toLowerCase()] = u;
        });
      }

      if (txsRes.ok) {
        const txsData = await txsRes.json();
        const list = Array.isArray(txsData) ? txsData : [];
        const enriched = list.map((t: any) => {
          const u = usersMap[(t.userId || '').toLowerCase()];
          return {
            ...t,
            resolvedName: u ? u.fullName : (t.userId || 'Unknown'),
            resolvedPhone: u ? u.phoneNumber : '—'
          };
        });
        setTxs(enriched);
        setFilteredTxs(enriched);
      }
    } catch (e) {
      console.error('Failed to load transaction ledger', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [globalReloadToken]);

  useEffect(() => {
    const q = searchQuery.toLowerCase();
    const filtered = txs.filter((t) => {
      const matchQuery =
        (t.resolvedName || '').toLowerCase().includes(q) ||
        (t.resolvedPhone || '').includes(q) ||
        (t.transactionId || '').toLowerCase().includes(q);

      const matchType = typeFilter === 'All' || t.type === typeFilter;

      return matchQuery && matchType;
    });
    setFilteredTxs(filtered);
  }, [searchQuery, typeFilter, txs]);

  const handleExportCSV = () => {
    if (!filteredTxs.length) {
      showToast('No data to export', 'info');
      return;
    }
    const headers = ['Transaction ID', 'Client Name', 'Phone', 'Type', 'Gold Weight (g)', 'Amount (INR)', 'Date'];
    const rows = filteredTxs.map((t) => [
      t.transactionId,
      t.resolvedName || '—',
      t.resolvedPhone || '—',
      t.type,
      (t.goldWeightMg / 1000).toFixed(4),
      (t.amountPaise / 100).toFixed(2),
      new Date(t.createdAt).toLocaleString()
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'aishwaryam_transactions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Export complete', 'success');
  };

  const handleDownloadInvoice = (transactionId: string) => {
    window.open(`${apiBase}/api/Gold/receipt/download/${transactionId}`, '_blank');
    showToast('Receipt download started', 'success');
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Transactions Ledger</h2>
          <p style={{ color: 'var(--text-2)', fontSize: '13px', marginTop: '4px' }}>
            Platform gold purchases, sell-backs, bonus disbursements, and invoice generation.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" onClick={handleExportCSV}>
            <Download size={16} /> Export CSV
          </button>
          <button className="btn btn-primary" onClick={loadTransactions} title="Refresh ledger data">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '16px 24px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-3)' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '38px', width: '100%' }}
              placeholder="Search by client name, phone number, or transaction ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="form-label" style={{ whiteSpace: 'nowrap' }}>Tx Type:</span>
            <select
              className="form-control"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="All">All Types</option>
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
              <option value="BONUS">BONUS</option>
              <option value="EVENT_BONUS">EVENT BONUS</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="card">
        {isLoading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-2)', padding: '20px' }}>Loading transactions ledger...</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Client Name</th>
                  <th>Transaction ID</th>
                  <th>Type</th>
                  <th>Gold weight</th>
                  <th>Paid Amount</th>
                  <th>Timestamp</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTxs.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-3)' }}>
                      No transaction records match the filters.
                    </td>
                  </tr>
                ) : (
                  filteredTxs.map((t) => (
                    <tr key={t.transactionId}>
                      <td>
                        <div style={{ fontWeight: '600' }}>{t.resolvedName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{t.resolvedPhone}</div>
                      </td>
                      <td className="text-xs" style={{ fontFamily: 'monospace', color: 'var(--text-2)' }}>
                        {t.transactionId}
                      </td>
                      <td>
                        <span className={`badge ${
                          t.type === 'BUY'
                            ? 'badge-green'
                            : t.type === 'SELL'
                            ? 'badge-red'
                            : t.type === 'BONUS'
                            ? 'badge-blue'
                            : 'badge-amber'
                        }`}>
                          {t.type}
                        </span>
                      </td>
                      <td style={{ fontWeight: '600' }}>{(t.goldWeightMg / 1000).toFixed(4)} g</td>
                      <td style={{ fontWeight: '700' }}>₹{(t.amountPaise / 100).toFixed(2)}</td>
                      <td className="text-xs" style={{ color: 'var(--text-3)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={12} /> {new Date(t.createdAt).toLocaleString()}
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn btn-outline btn-xs"
                          onClick={() => handleDownloadInvoice(t.transactionId)}
                          title="Download Tax Receipt invoice"
                        >
                          <FileDown size={14} /> Receipt
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};
