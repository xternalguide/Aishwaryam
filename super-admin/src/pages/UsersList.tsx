import React, { useEffect, useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import {
  Search,
  Download,
  Eye,
  Edit,
  Trash2,
  Plus,
  X,
  CreditCard,
  Briefcase,
  Layers,
  Activity,
  UserPlus
} from 'lucide-react';

interface User {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  kycLevel: string;
  isActive: boolean;
  createdAt: string;
}

interface UserDetail {
  profile: any;
  portfolio: any;
  schemes: any;
  transactions: any[];
}

export const UsersList: React.FC = () => {
  const { apiBase, globalReloadToken, showToast } = useAdmin();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  // Modal control states
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState('');
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // User Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    kycLevel: 'BASIC',
    isActive: true
  });

  // User Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    id: '',
    fullName: '',
    phoneNumber: '',
    email: '',
    kycLevel: 'BASIC',
    isActive: true
  });

  const [isSaving, setIsSaving] = useState(false);

  const loadUsers = async () => {
    try {
      const res = await fetch(`${apiBase}/api/User/all`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
        setFilteredUsers(data);
      }
    } catch (e) {
      console.error('Failed to load users list', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [globalReloadToken]);

  useEffect(() => {
    const q = searchQuery.toLowerCase();
    const filtered = users.filter((u) => {
      const matchQuery =
        (u.fullName || '').toLowerCase().includes(q) ||
        (u.phoneNumber || '').includes(q) ||
        (u.email || '').toLowerCase().includes(q);

      const matchStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Active' && u.isActive) ||
        (statusFilter === 'Inactive' && !u.isActive);

      return matchQuery && matchStatus;
    });
    setFilteredUsers(filtered);
  }, [searchQuery, statusFilter, users]);

  const handleExportCSV = () => {
    if (!filteredUsers.length) {
      showToast('No data to export', 'info');
      return;
    }
    const headers = ['ID', 'Name', 'Phone', 'Email', 'KYC Level', 'Is Active', 'Created At'];
    const rows = filteredUsers.map((u) => [
      u.id,
      u.fullName || '—',
      u.phoneNumber || '—',
      u.email || '—',
      u.kycLevel || '—',
      u.isActive ? 'Active' : 'Inactive',
      new Date(u.createdAt).toLocaleString()
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'aishwaryam_users.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported successfully', 'success');
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`${apiBase}/api/Admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm)
      });
      if (res.ok) {
        showToast('Subscriber profile created successfully', 'success');
        setIsCreateOpen(false);
        setCreateForm({ fullName: '', phoneNumber: '', email: '', kycLevel: 'BASIC', isActive: true });
        loadUsers();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.message || 'Failed to create user', 'error');
      }
    } catch (err: any) {
      showToast('Network error: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditOpen = (user: User) => {
    setEditForm({
      id: user.id,
      fullName: user.fullName || '',
      phoneNumber: user.phoneNumber || '',
      email: user.email || '',
      kycLevel: user.kycLevel || 'BASIC',
      isActive: user.isActive
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`${apiBase}/api/Admin/users/${editForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        showToast('Subscriber profile updated successfully', 'success');
        setIsEditOpen(false);
        loadUsers();
        if (selectedUid === editForm.id) {
          viewUser(editForm.id, editForm.fullName);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.message || 'Failed to update profile details', 'error');
      }
    } catch (err: any) {
      showToast('Network error: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (uid: string, name: string) => {
    const confirm = window.confirm(
      `CRITICAL WARNING: Are you absolutely sure you want to HARD DELETE the user "${name}"? This will permanently delete their profile, active schemes, wallets, gold holdings, bank account details, and all transaction histories from the database. This action cannot be undone.`
    );
    if (!confirm) return;

    try {
      setIsSaving(true);
      const res = await fetch(`${apiBase}/api/Admin/users/${uid}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`User ${name} and all data deleted successfully`, 'success');
        setSelectedUid(null);
        loadUsers();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.message || 'Failed to delete user profile', 'error');
      }
    } catch (err: any) {
      showToast('Network error during delete: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const viewUser = async (uid: string, name: string) => {
    setSelectedUid(uid);
    setSelectedName(name);
    setIsDetailLoading(true);
    setUserDetail(null);

    try {
      const [profileRes, portfolioRes, schemesRes, txsRes] = await Promise.all([
        fetch(`${apiBase}/api/User/profile/${uid}`),
        fetch(`${apiBase}/api/Dashboard/portfolio/${uid}`),
        fetch(`${apiBase}/api/Scheme/dashboard/${uid}`),
        fetch(`${apiBase}/api/Dashboard/transactions/${uid}`)
      ]);

      let profileData = {};
      let portfolioData = {};
      let schemesData = {};
      let txsData: any[] = [];

      if (profileRes.ok) profileData = await profileRes.json();
      if (portfolioRes.ok) portfolioData = await portfolioRes.json();
      if (schemesRes.ok) schemesData = await schemesRes.json();
      if (txsRes.ok) txsData = await txsRes.json();

      setUserDetail({
        profile: profileData,
        portfolio: portfolioData,
        schemes: schemesData,
        transactions: txsData
      });
    } catch (e) {
      showToast('Failed to retrieve detailed profile details', 'error');
    } finally {
      setIsDetailLoading(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Super Admin: Users Directory</h2>
          <p style={{ color: 'var(--text-2)', fontSize: '13px', marginTop: '4px' }}>
            Full CRUD operations on registered accounts, wallets, profiles, and transaction settings.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
            <Plus size={16} /> Create User
          </button>
          <button className="btn btn-outline" onClick={handleExportCSV}>
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="card" style={{ padding: '16px 24px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-3)' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '38px', width: '100%' }}
              placeholder="Search by name, phone number, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="form-label" style={{ whiteSpace: 'nowrap' }}>Status Filter:</span>
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Users</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid container */}
      <div className="card">
        {isLoading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-2)', padding: '20px' }}>Loading users directory...</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Client Name</th>
                  <th>Phone Number</th>
                  <th>Email ID</th>
                  <th>KYC Level</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-3)' }}>
                      No matching user records found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td><div style={{ fontWeight: '600' }}>{u.fullName || 'Unknown'}</div></td>
                      <td>{u.phoneNumber || '—'}</td>
                      <td className="text-xs" style={{ color: 'var(--text-2)' }}>{u.email || '—'}</td>
                      <td>
                        <span className={`badge ${
                          u.kycLevel === 'FULL'
                            ? 'badge-green'
                            : u.kycLevel === 'PENDING'
                            ? 'badge-amber'
                            : u.kycLevel === 'BASIC'
                            ? 'badge-blue'
                            : 'badge-red'
                        }`}>
                          {u.kycLevel || 'NONE'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>
                          {u.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="btn btn-ghost btn-xs"
                            onClick={() => viewUser(u.id, u.fullName)}
                            title="View Full Profile details"
                          >
                            <Eye size={14} /> Review
                          </button>
                          <button
                            className="btn btn-ghost btn-xs"
                            onClick={() => handleEditOpen(u)}
                            title="Edit User Details"
                          >
                            <Edit size={14} /> Edit
                          </button>
                          <button
                            className="btn btn-ghost btn-xs"
                            onClick={() => handleDeleteUser(u.id, u.fullName)}
                            style={{ color: 'var(--red)' }}
                            title="Delete User"
                          >
                            <Trash2 size={14} /> Delete
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

      {/* User Details Modal Slide-over */}
      {selectedUid && (
        <div className="modal-backdrop" onClick={() => setSelectedUid(null)}>
          <div className="modal-content fade-in" style={{ maxWidth: '800px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <div className="card-head" style={{ borderBottom: '1px solid var(--border)', padding: '20px 24px', margin: 0 }}>
              <span className="card-title" style={{ fontSize: '18px' }}>Manage Profile: {selectedName}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  className="btn btn-ghost btn-xs"
                  onClick={() => setSelectedUid(null)}
                  style={{ padding: '4px', borderRadius: '50%' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="modal-body">
              {isDetailLoading ? (
                <div style={{ color: 'var(--text-2)', textAlign: 'center', padding: '40px' }}>Loading client details...</div>
              ) : userDetail ? (
                <>
                  {/* Address Section */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', borderBottom: '1px solid var(--border2)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Briefcase size={16} /> Contact & Home Address
                    </h4>
                    <div className="grid-cols-2" style={{ gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">Email ID</label>
                        <input className="form-control" type="text" value={userDetail.profile?.email || '—'} readOnly />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Referral Code</label>
                        <input className="form-control" type="text" value={userDetail.profile?.referralCode || '—'} readOnly />
                      </div>
                    </div>
                  </div>

                  {/* Wallet & Portfolio info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', borderBottom: '1px solid var(--border2)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CreditCard size={16} /> Wallet & Savings Balance
                    </h4>
                    <div className="grid-cols-3" style={{ gap: '16px' }}>
                      <div className="kpi-card" style={{ padding: '12px 16px' }}>
                        <div className="kpi-details">
                          <span className="kpi-title" style={{ fontSize: '10px' }}>Gold Balance</span>
                          <span className="kpi-value" style={{ fontSize: '15px' }}>{((userDetail.portfolio?.goldBalanceMg || 0) / 1000).toFixed(4)} g</span>
                        </div>
                      </div>

                      <div className="kpi-card" style={{ padding: '12px 16px' }}>
                        <div className="kpi-details">
                          <span className="kpi-title" style={{ fontSize: '10px' }}>Matured Gold</span>
                          <span className="kpi-value" style={{ fontSize: '15px' }}>{((userDetail.portfolio?.maturedRedeemableGoldMg || 0) / 1000).toFixed(4)} g</span>
                        </div>
                      </div>

                      <div className="kpi-card" style={{ padding: '12px 16px' }}>
                        <div className="kpi-details">
                          <span className="kpi-title" style={{ fontSize: '10px' }}>Total Cash Value</span>
                          <span className="kpi-value" style={{ fontSize: '15px' }}>₹{((userDetail.portfolio?.currentValuePaise || 0) / 100).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Subscriptions schemes list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', borderBottom: '1px solid var(--border2)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Layers size={16} /> Active Schemes ({userDetail.schemes?.length || 0})
                    </h4>
                    {userDetail.schemes && userDetail.schemes.length > 0 ? (
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>Plan Name</th>
                              <th>Paid Installments</th>
                              <th>Due Date</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {userDetail.schemes.map((s: any) => (
                              <tr key={s.schemeId}>
                                <td style={{ fontWeight: '600' }}>{s.planName}</td>
                                <td>{s.installmentsPaid} / {s.totalInstallments}</td>
                                <td className="text-xs">{new Date(s.nextDueDate).toLocaleDateString()}</td>
                                <td><span className="badge badge-green">{s.status || 'Active'}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ color: 'var(--text-3)', fontSize: '12.5px', textAlign: 'center', padding: '10px' }}>User has not joined any schemes.</div>
                    )}
                  </div>

                  {/* Transaction log */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', borderBottom: '1px solid var(--border2)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Activity size={16} /> Recent Transactions ({userDetail.transactions?.length || 0})
                    </h4>
                    {userDetail.transactions && userDetail.transactions.length > 0 ? (
                      <div className="table-wrap" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        <table>
                          <thead>
                            <tr>
                              <th>Type</th>
                              <th>Weight</th>
                              <th>Total Amount</th>
                              <th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {userDetail.transactions.slice(0, 10).map((t: any) => (
                              <tr key={t.transactionId}>
                                <td><span className={`badge ${t.type === 'BUY' ? 'badge-green' : 'badge-red'}`}>{t.type}</span></td>
                                <td>{(t.goldWeightMg / 1000).toFixed(4)} g</td>
                                <td style={{ fontWeight: '600' }}>₹{(t.amountPaise / 100).toFixed(2)}</td>
                                <td className="text-xs" style={{ color: 'var(--text-3)' }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ color: 'var(--text-3)', fontSize: '12.5px', textAlign: 'center', padding: '10px' }}>No transaction history found.</div>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ color: 'var(--red)', textAlign: 'center', padding: '40px' }}>No client profile details available.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* User Create Modal */}
      {isCreateOpen && (
        <div className="modal-backdrop" onClick={() => setIsCreateOpen(false)}>
          <form className="modal-content fade-in" onSubmit={handleCreateSubmit} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="card-head" style={{ borderBottom: '1px solid var(--border)', padding: '20px 24px', margin: 0 }}>
              <span className="card-title" style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={20} /> Create New Account
              </span>
              <button type="button" className="btn btn-ghost btn-xs" onClick={() => setIsCreateOpen(false)} style={{ padding: '4px', borderRadius: '50%' }}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  className="form-control"
                  required
                  placeholder="e.g. 9876543210"
                  value={createForm.phoneNumber}
                  onChange={(e) => setCreateForm({ ...createForm, phoneNumber: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email ID</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="e.g. rahul@gmail.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                />
              </div>
              <div className="grid-cols-2" style={{ gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">KYC Status</label>
                  <select
                    className="form-control"
                    value={createForm.kycLevel}
                    onChange={(e) => setCreateForm({ ...createForm, kycLevel: e.target.value })}
                  >
                    <option value="NONE">NONE</option>
                    <option value="BASIC">BASIC</option>
                    <option value="PENDING">PENDING</option>
                    <option value="FULL">FULL</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Account Status</label>
                  <select
                    className="form-control"
                    value={createForm.isActive ? 'true' : 'false'}
                    onChange={(e) => setCreateForm({ ...createForm, isActive: e.target.value === 'true' })}
                  >
                    <option value="true">Active</option>
                    <option value="false">Suspended</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsCreateOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Create Account'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* User Edit Modal */}
      {isEditOpen && (
        <div className="modal-backdrop" onClick={() => setIsEditOpen(false)}>
          <form className="modal-content fade-in" onSubmit={handleEditSubmit} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="card-head" style={{ borderBottom: '1px solid var(--border)', padding: '20px 24px', margin: 0 }}>
              <span className="card-title" style={{ fontSize: '18px' }}>Edit Subscriber Details</span>
              <button type="button" className="btn btn-ghost btn-xs" onClick={() => setIsEditOpen(false)} style={{ padding: '4px', borderRadius: '50%' }}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  className="form-control"
                  required
                  placeholder="e.g. 9876543210"
                  value={editForm.phoneNumber}
                  onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email ID</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="e.g. rahul@gmail.com"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
              <div className="grid-cols-2" style={{ gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">KYC Status</label>
                  <select
                    className="form-control"
                    value={editForm.kycLevel}
                    onChange={(e) => setEditForm({ ...editForm, kycLevel: e.target.value })}
                  >
                    <option value="NONE">NONE</option>
                    <option value="BASIC">BASIC</option>
                    <option value="PENDING">PENDING</option>
                    <option value="FULL">FULL</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Account Status</label>
                  <select
                    className="form-control"
                    value={editForm.isActive ? 'true' : 'false'}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === 'true' })}
                  >
                    <option value="true">Active</option>
                    <option value="false">Suspended</option>
                  </select>
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
