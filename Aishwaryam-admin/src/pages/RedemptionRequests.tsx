import React, { useEffect, useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Search, CheckCircle2, XCircle, AlertCircle, X, CreditCard, User, Coins } from 'lucide-react';

interface Redemption {
  id: string;
  userId: string;
  schemeId: string;
  schemePlanName: string;
  redemptionType: string;
  payoutMethod: string;
  status: string;
  goldWeightMg: number;
  amountPaise: number;
  bankAccountId?: string;
  createdAt: string;
  resolvedName?: string;
  resolvedPhone?: string;
}

export const RedemptionRequests: React.FC = () => {
  const { apiBase, globalReloadToken, showToast } = useAdmin();
  const [requests, setRequests] = useState<Redemption[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<Redemption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  // Modal target bank detail state
  const [bankAccount, setBankAccount] = useState<any | null>(null);
  const [isBankLoading, setIsBankLoading] = useState(false);
  const [bankModalOpen, setBankModalOpen] = useState(false);

  // Reject Modal state
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const loadRedemptions = async () => {
    try {
      const [usersRes, redRes] = await Promise.all([
        fetch(`${apiBase}/api/User/all`),
        fetch(`${apiBase}/api/Scheme/admin/redemptions`)
      ]);

      let usersMap: Record<string, any> = {};
      if (usersRes.ok) {
        const users = await usersRes.json();
        users.forEach((u: any) => {
          usersMap[u.id.toLowerCase()] = u;
        });
      }

      if (redRes.ok) {
        const redData = await redRes.json();
        const list = Array.isArray(redData) ? redData : [];
        const enriched = list.map((r: any) => {
          const u = usersMap[(r.userId || '').toLowerCase()];
          return {
            ...r,
            resolvedName: u ? u.fullName : (r.userId || 'Unknown'),
            resolvedPhone: u ? u.phoneNumber : '—'
          };
        });
        setRequests(enriched);
        setFilteredRequests(enriched);
      }
    } catch (e) {
      console.error('Failed to load redemptions list', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRedemptions();
  }, [globalReloadToken]);

  useEffect(() => {
    const q = searchQuery.toLowerCase();
    const filtered = requests.filter((r) => {
      const matchQuery =
        (r.resolvedName || '').toLowerCase().includes(q) ||
        (r.schemePlanName || '').toLowerCase().includes(q) ||
        (r.resolvedPhone || '').includes(q);

      const matchStatus = statusFilter === 'All' || r.status === statusFilter;

      return matchQuery && matchStatus;
    });
    setFilteredRequests(filtered);
  }, [searchQuery, statusFilter, requests]);

  const viewBankDetails = async (bankAccountId: string) => {
    if (!bankAccountId) return;
    setIsBankLoading(true);
    setBankAccount(null);
    setBankModalOpen(true);
    try {
      // Find matching bank detail by checking DB
      const res = await fetch(`${apiBase}/api/User/bank-account/${bankAccountId}`);
      if (res.ok) {
        setBankAccount(await res.json());
      } else {
        showToast('No linked bank account records found.', 'error');
      }
    } catch (e) {
      showToast('Network error while retrieving bank details', 'error');
    } finally {
      setIsBankLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    const doubleCheck = window.confirm('Are you sure you want to APPROVE this redemption request and disburse the payout?');
    if (!doubleCheck) return;

    setIsProcessing(true);
    try {
      const res = await fetch(`${apiBase}/api/Scheme/admin/redemptions/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: 'admin@aishwaryam.com' })
      });

      if (res.ok) {
        showToast('Redemption request approved and processed successfully', 'success');
        // Force version increment trigger
        const vRes = await fetch(`${apiBase}/api/Admin/db-version`);
        if (vRes.ok) {
          const vData = await vRes.json();
          sessionStorage.setItem('admin-db-version', String(vData.version));
        }
        loadRedemptions();
      } else {
        const err = await res.text();
        showToast('Approval failed: ' + err, 'error');
      }
    } catch (e: any) {
      showToast('Network error: ' + e.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingId || !rejectReason.trim()) {
      showToast('Please enter a rejection reason', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch(`${apiBase}/api/Scheme/admin/redemptions/${rejectingId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: 'admin@aishwaryam.com', reason: rejectReason.trim() })
      });

      if (res.ok) {
        showToast('Redemption request rejected.', 'info');
        setRejectingId(null);
        setRejectReason('');
        // Force version increment trigger
        const vRes = await fetch(`${apiBase}/api/Admin/db-version`);
        if (vRes.ok) {
          const vData = await vRes.json();
          sessionStorage.setItem('admin-db-version', String(vData.version));
        }
        loadRedemptions();
      } else {
        const err = await res.text();
        showToast('Rejection failed: ' + err, 'error');
      }
    } catch (e: any) {
      showToast('Network error: ' + e.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Redemption Requests</h2>
          <p style={{ color: 'var(--text-2)', fontSize: '13px', marginTop: '4px' }}>
            Process gold plan maturation, silver collections, cash payouts, and bank transfers.
          </p>
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
              placeholder="Search by client name, scheme name, or phone number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="form-label" style={{ whiteSpace: 'nowrap' }}>Redemption Status:</span>
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Requests</option>
              <option value="PENDING">Pending Payout</option>
              <option value="APPROVED">Completed (APPROVED)</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table grid */}
      <div className="card">
        {isLoading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-2)', padding: '20px' }}>Loading redemption requests...</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Client Profile</th>
                  <th>Scheme Plan</th>
                  <th>Redeem Type</th>
                  <th>Weight (g)</th>
                  <th>Disbursed Value</th>
                  <th>Bank Account</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-3)' }}>
                      No redemption requests found matching current criteria.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <div style={{ fontWeight: '600' }}>{r.resolvedName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{r.resolvedPhone}</div>
                      </td>
                      <td>{r.schemePlanName}</td>
                      <td>
                        <span className={`badge ${r.redemptionType === 'GOLD' ? 'badge-amber' : 'badge-blue'}`}>
                          {r.redemptionType}
                        </span>
                      </td>
                      <td style={{ fontWeight: '600' }}>{(r.goldWeightMg / 1000).toFixed(4)} g</td>
                      <td style={{ fontWeight: '700' }}>₹{(r.amountPaise / 100).toFixed(2)}</td>
                      <td>
                        {r.payoutMethod === 'BANK_TRANSFER' && r.bankAccountId ? (
                          <button
                            className="btn btn-outline btn-xs"
                            onClick={() => viewBankDetails(r.bankAccountId!)}
                          >
                            Linked Bank
                          </button>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{r.payoutMethod || 'Wallet'}</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${
                          r.status === 'APPROVED'
                            ? 'badge-green'
                            : r.status === 'PENDING'
                            ? 'badge-amber'
                            : 'badge-red'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td>
                        {r.status === 'PENDING' && (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              className="btn btn-success btn-xs"
                              onClick={() => handleApprove(r.id)}
                              disabled={isProcessing}
                            >
                              <CheckCircle2 size={12} /> Approve
                            </button>
                            <button
                              className="btn btn-danger btn-xs"
                              onClick={() => setRejectingId(r.id)}
                              disabled={isProcessing}
                            >
                              <XCircle size={12} /> Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Linked Bank Details Modal */}
      {bankModalOpen && (
        <div className="modal-backdrop" onClick={() => setBankModalOpen(false)}>
          <div className="modal-content fade-in" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="card-head" style={{ padding: '20px 24px', margin: 0, borderBottom: '1px solid var(--border)' }}>
              <span className="card-title">Linked Bank Account</span>
              <button className="btn btn-ghost btn-xs" onClick={() => setBankModalOpen(false)} style={{ padding: '4px', borderRadius: '50%' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '24px' }}>
              {isBankLoading ? (
                <div style={{ textAlign: 'center', color: 'var(--text-3)', padding: '20px' }}>Retrieving account details...</div>
              ) : bankAccount ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13.5px' }}>
                  <div className="form-group">
                    <label className="form-label">Beneficiary Name</label>
                    <input className="form-control" type="text" value={bankAccount.accountHolderName || '—'} readOnly />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bank Account Number</label>
                    <input className="form-control" type="text" value={bankAccount.accountNumber || '—'} readOnly />
                  </div>
                  <div className="form-group">
                    <label className="form-label">IFSC Routing Code</label>
                    <input className="form-control" type="text" value={bankAccount.ifscCode || '—'} readOnly />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bank Name</label>
                    <input className="form-control" type="text" value={bankAccount.bankName || '—'} readOnly />
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--red)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} /> No bank account details found for this profile.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Request Modal */}
      {rejectingId && (
        <div className="modal-backdrop" onClick={() => setRejectingId(null)}>
          <form className="modal-content fade-in" style={{ maxWidth: '440px' }} onSubmit={handleRejectSubmit} onClick={(e) => e.stopPropagation()}>
            <div className="card-head" style={{ padding: '20px 24px', margin: 0, borderBottom: '1px solid var(--border)' }}>
              <span className="card-title">Reject Redemption Request</span>
              <button type="button" className="btn btn-ghost btn-xs" onClick={() => setRejectingId(null)} style={{ padding: '4px', borderRadius: '50%' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Specify Rejection Reason</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="e.g. Account name mismatch, Bank transfer details are invalid..."
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setRejectingId(null)}>Cancel</button>
                <button type="submit" className="btn btn-danger" disabled={isProcessing}>
                  {isProcessing ? 'Processing...' : 'Confirm Reject'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
