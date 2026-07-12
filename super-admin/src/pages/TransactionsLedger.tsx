import React, { useEffect, useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Search, Download, RefreshCw, Plus, Edit, Trash2, X, AlertCircle } from 'lucide-react';

interface Transaction {
  id: string;
  userId: string;
  transactionType: string;
  goldWeightMg: number;
  totalAmountPaise: number;
  pricePerGmPaise: number;
  createdAt: string;
  resolvedName?: string;
  resolvedPhone?: string;
}

interface User {
  id: string;
  fullName: string;
  phoneNumber: string;
}

export const TransactionsLedger: React.FC = () => {
  const { apiBase, globalReloadToken, showToast } = useAdmin();
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [filteredTxs, setFilteredTxs] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    userId: '',
    transactionType: 'BUY',
    goldWeightGrams: '',
    totalAmountRupees: '',
    pricePerGmRupees: ''
  });

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    id: '',
    userId: '',
    transactionType: 'BUY',
    goldWeightGrams: '',
    totalAmountRupees: '',
    pricePerGmRupees: ''
  });

  const [isSaving, setIsSaving] = useState(false);

  const loadTransactions = async () => {
    try {
      const [usersRes, txsRes] = await Promise.all([
        fetch(`${apiBase}/api/User/all`),
        fetch(`${apiBase}/api/Gold/transactions/all`)
      ]);

      let usersList: User[] = [];
      let usersMap: Record<string, any> = {};
      if (usersRes.ok) {
        usersList = await usersRes.json();
        setUsers(usersList);
        usersList.forEach((u: any) => {
          usersMap[u.id.toLowerCase()] = u;
        });
      }

      if (txsRes.ok) {
        const txsData = await txsRes.json();
        const list = Array.isArray(txsData) ? txsData : (txsData.transactions || []);
        
        const enriched = list.map((t: any) => {
          const u = usersMap[(t.userId || '').toLowerCase()];
          return {
            id: t.id || t.transactionId,
            userId: t.userId,
            transactionType: t.type || t.transactionType,
            goldWeightMg: t.goldWeightMg,
            totalAmountPaise: t.amountPaise || t.totalAmountPaise,
            pricePerGmPaise: t.pricePerGmPaise || 0,
            createdAt: t.createdAt,
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
        (t.id || '').toLowerCase().includes(q);

      const matchType = typeFilter === 'All' || t.transactionType === typeFilter;

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
      t.id,
      t.resolvedName || '—',
      t.resolvedPhone || '—',
      t.transactionType,
      (t.goldWeightMg / 1000).toFixed(4),
      (t.totalAmountPaise / 100).toFixed(2),
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

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.userId) {
      showToast('Please select a user account.', 'error');
      return;
    }
    setIsSaving(true);

    const payload = {
      userId: createForm.userId,
      transactionType: createForm.transactionType,
      goldWeightMg: Math.round(parseFloat(createForm.goldWeightGrams) * 1000),
      totalAmountPaise: Math.round(parseFloat(createForm.totalAmountRupees) * 100),
      pricePerGmPaise: Math.round(parseFloat(createForm.pricePerGmRupees) * 100)
    };

    try {
      const res = await fetch(`${apiBase}/api/Admin/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast('Transaction logged successfully', 'success');
        setIsCreateOpen(false);
        setCreateForm({ userId: '', transactionType: 'BUY', goldWeightGrams: '', totalAmountRupees: '', pricePerGmRupees: '' });
        loadTransactions();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.message || 'Failed to log transaction', 'error');
      }
    } catch (err: any) {
      showToast('Network error: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditOpen = (tx: Transaction) => {
    setEditForm({
      id: tx.id,
      userId: tx.userId,
      transactionType: tx.transactionType,
      goldWeightGrams: (tx.goldWeightMg / 1000).toString(),
      totalAmountRupees: (tx.totalAmountPaise / 100).toString(),
      pricePerGmRupees: (tx.pricePerGmPaise / 100).toString()
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const payload = {
      transactionType: editForm.transactionType,
      goldWeightMg: Math.round(parseFloat(editForm.goldWeightGrams) * 1000),
      totalAmountPaise: Math.round(parseFloat(editForm.totalAmountRupees) * 100),
      pricePerGmPaise: Math.round(parseFloat(editForm.pricePerGmRupees) * 100)
    };

    try {
      const res = await fetch(`${apiBase}/api/Admin/transactions/${editForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast('Transaction updated successfully', 'success');
        setIsEditOpen(false);
        loadTransactions();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.message || 'Failed to update transaction', 'error');
      }
    } catch (err: any) {
      showToast('Network error: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTransaction = async (tid: string) => {
    const confirm = window.confirm(
      'Are you sure you want to delete and reverse this transaction? The gold balance associated with the target user will be adjusted automatically.'
    );
    if (!confirm) return;

    try {
      setIsSaving(true);
      const res = await fetch(`${apiBase}/api/Admin/transactions/${tid}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Transaction reversed and deleted successfully', 'success');
        loadTransactions();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.message || 'Failed to delete transaction', 'error');
      }
    } catch (err: any) {
      showToast('Network error during transaction delete: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Super Admin: Transactions Ledger</h2>
          <p style={{ color: 'var(--text-2)', fontSize: '13px', marginTop: '4px' }}>
            Full CRUD operations on gold purchases, sell-backs, manual adjustments, and balances.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
            <Plus size={16} /> Log Transaction
          </button>
          <button className="btn btn-outline" onClick={handleExportCSV}>
            <Download size={16} /> Export CSV
          </button>
          <button className="btn btn-outline" onClick={loadTransactions} title="Refresh ledger data">
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
              placeholder="Search by client name, transaction ID, or phone..."
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
              <option value="All">All Operations</option>
              <option value="BUY">BUY (Purchase)</option>
              <option value="SELL">SELL (Sell-back)</option>
              <option value="BONUS">BONUS (Yield Reward)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table grid */}
      <div className="card">
        {isLoading ? (
          <div style={{ color: 'var(--text-2)', padding: '20px', textAlign: 'center' }}>Loading ledger entries...</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Subscriber Info</th>
                  <th>Transaction ID</th>
                  <th>Operation Type</th>
                  <th>Gold Weight</th>
                  <th>Amount (INR)</th>
                  <th>Timestamp</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTxs.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-3)' }}>
                      No transaction records matched the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredTxs.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <div style={{ fontWeight: '600' }}>{t.resolvedName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{t.resolvedPhone}</div>
                      </td>
                      <td className="text-xs" style={{ fontFamily: 'monospace' }}>{t.id?.substring(0, 8)}...</td>
                      <td>
                        <span className={`badge ${t.transactionType === 'BUY' ? 'badge-green' : t.transactionType === 'BONUS' ? 'badge-blue' : 'badge-red'}`}>
                          {t.transactionType}
                        </span>
                      </td>
                      <td style={{ fontWeight: '600' }}>{(t.goldWeightMg / 1000).toFixed(4)} g</td>
                      <td style={{ fontWeight: '700', color: 'var(--text)' }}>
                        ₹{(t.totalAmountPaise / 100).toFixed(2)}
                      </td>
                      <td className="text-xs" style={{ color: 'var(--text-3)' }}>
                        {new Date(t.createdAt).toLocaleString()}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="btn btn-ghost btn-xs"
                            onClick={() => handleEditOpen(t)}
                            title="Edit Details"
                          >
                            <Edit size={13} /> Edit
                          </button>
                          <button
                            className="btn btn-ghost btn-xs"
                            onClick={() => handleDeleteTransaction(t.id)}
                            style={{ color: 'var(--red)' }}
                            title="Delete / Reverse"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Transaction Modal */}
      {isCreateOpen && (
        <div className="modal-backdrop" onClick={() => setIsCreateOpen(false)}>
          <form className="modal-content fade-in" onSubmit={handleCreateSubmit} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="card-head" style={{ borderBottom: '1px solid var(--border)', padding: '20px 24px', margin: 0 }}>
              <span className="card-title" style={{ fontSize: '18px' }}>Log New Transaction</span>
              <button type="button" className="btn btn-ghost btn-xs" onClick={() => setIsCreateOpen(false)} style={{ padding: '4px', borderRadius: '50%' }}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Select Subscriber Account</label>
                <select
                  className="form-control"
                  required
                  value={createForm.userId}
                  onChange={(e) => setCreateForm({ ...createForm, userId: e.target.value })}
                >
                  <option value="">-- Choose User Profile --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.phoneNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid-cols-2" style={{ gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Transaction Type</label>
                  <select
                    className="form-control"
                    value={createForm.transactionType}
                    onChange={(e) => setCreateForm({ ...createForm, transactionType: e.target.value })}
                  >
                    <option value="BUY">BUY</option>
                    <option value="SELL">SELL</option>
                    <option value="BONUS">BONUS</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Gold Weight (in Grams)</label>
                  <input
                    type="number"
                    step="0.0001"
                    className="form-control"
                    required
                    placeholder="e.g. 0.5215"
                    value={createForm.goldWeightGrams}
                    onChange={(e) => setCreateForm({ ...createForm, goldWeightGrams: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid-cols-2" style={{ gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Total Amount (INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    required
                    placeholder="e.g. 3500.00"
                    value={createForm.totalAmountRupees}
                    onChange={(e) => setCreateForm({ ...createForm, totalAmountRupees: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Gold Price per Gram (INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    required
                    placeholder="e.g. 6800.00"
                    value={createForm.pricePerGmRupees}
                    onChange={(e) => setCreateForm({ ...createForm, pricePerGmRupees: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsCreateOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Logging...' : 'Confirm Transaction'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {isEditOpen && (
        <div className="modal-backdrop" onClick={() => setIsEditOpen(false)}>
          <form className="modal-content fade-in" onSubmit={handleEditSubmit} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="card-head" style={{ borderBottom: '1px solid var(--border)', padding: '20px 24px', margin: 0 }}>
              <span className="card-title" style={{ fontSize: '18px' }}>Edit Transaction Details</span>
              <button type="button" className="btn btn-ghost btn-xs" onClick={() => setIsEditOpen(false)} style={{ padding: '4px', borderRadius: '50%' }}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ gap: '16px' }}>
              <div className="grid-cols-2" style={{ gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Transaction Type</label>
                  <select
                    className="form-control"
                    value={editForm.transactionType}
                    onChange={(e) => setEditForm({ ...editForm, transactionType: e.target.value })}
                  >
                    <option value="BUY">BUY</option>
                    <option value="SELL">SELL</option>
                    <option value="BONUS">BONUS</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Gold Weight (in Grams)</label>
                  <input
                    type="number"
                    step="0.0001"
                    className="form-control"
                    required
                    placeholder="e.g. 0.5215"
                    value={editForm.goldWeightGrams}
                    onChange={(e) => setEditForm({ ...editForm, goldWeightGrams: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid-cols-2" style={{ gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Total Amount (INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    required
                    placeholder="e.g. 3500.00"
                    value={editForm.totalAmountRupees}
                    onChange={(e) => setEditForm({ ...editForm, totalAmountRupees: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Gold Price per Gram (INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    required
                    placeholder="e.g. 6800.00"
                    value={editForm.pricePerGmRupees}
                    onChange={(e) => setEditForm({ ...editForm, pricePerGmRupees: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsEditOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Update Details'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
