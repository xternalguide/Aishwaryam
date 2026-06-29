import React, { useEffect, useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Plus, Edit2, Trash2, Eye, X, Settings, RefreshCw } from 'lucide-react';

interface Scheme {
  id: string;
  planName: string;
  description?: string;
  installmentAmountPaise: number;
  totalInstallments: number;
  frequency: string;
  isActive: boolean;
}

export const SchemeMaster: React.FC = () => {
  const { apiBase, globalReloadToken, showToast } = useAdmin();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScraping, setIsScraping] = useState(false);

  // Edit / Create Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [planName, setPlanName] = useState('');
  const [description, setDescription] = useState('');
  const [installmentAmount, setInstallmentAmount] = useState('');
  const [totalInstallments, setTotalInstallments] = useState('11');
  const [frequency, setFrequency] = useState('Daily');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadSchemes = async () => {
    try {
      const res = await window.fetchWithCache(`${apiBase}/api/Scheme/admin/list`);
      if (res.ok) {
        setSchemes(await res.json());
      }
    } catch (e) {
      console.error('Failed to load schemes master', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSchemes();
  }, [globalReloadToken]);

  const handleOpenCreate = () => {
    setEditId(null);
    setPlanName('');
    setDescription('');
    setInstallmentAmount('');
    setTotalInstallments('11');
    setFrequency('Daily');
    setIsActive(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (s: Scheme) => {
    setEditId(s.id);
    setPlanName(s.planName);
    setDescription(s.description || '');
    setInstallmentAmount((s.installmentAmountPaise / 100).toString());
    setTotalInstallments(s.totalInstallments.toString());
    setFrequency(s.frequency);
    setIsActive(s.isActive);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName || !installmentAmount) {
      showToast('Name and Installment Amount are required.', 'error');
      return;
    }

    setIsSaving(true);
    const payload = {
      id: editId || undefined,
      planName,
      description,
      installmentAmountPaise: Math.round(parseFloat(installmentAmount) * 100),
      totalInstallments: parseInt(totalInstallments),
      frequency,
      isActive
    };

    try {
      const res = await fetch(`${apiBase}/api/Scheme/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(`Savings plan ${editId ? 'updated' : 'created'} successfully`, 'success');
        setModalOpen(false);
        // Force version increment trigger
        const vRes = await fetch(`${apiBase}/api/Admin/db-version`);
        if (vRes.ok) {
          const vData = await vRes.json();
          sessionStorage.setItem('admin-db-version', String(vData.version));
        }
        loadSchemes();
      } else {
        showToast('Failed to save savings plan', 'error');
      }
    } catch (e) {
      showToast('Network error while saving plan', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this plan? This action cannot be undone.')) return;

    try {
      const res = await fetch(`${apiBase}/api/Scheme/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Plan deleted successfully', 'success');
        // Force version increment trigger
        const vRes = await fetch(`${apiBase}/api/Admin/db-version`);
        if (vRes.ok) {
          const vData = await vRes.json();
          sessionStorage.setItem('admin-db-version', String(vData.version));
        }
        loadSchemes();
      } else {
        showToast('Failed to delete savings plan', 'error');
      }
    } catch (e) {
      showToast('Network error while deleting plan', 'error');
    }
  };

  const handleScrapePothys = async () => {
    setIsScraping(true);
    try {
      const res = await fetch(`${apiBase}/api/Scheme/scrape-pothys`);
      if (res.ok) {
        showToast('Scraping successful. Pothys rates updated.', 'success');
        // Force version increment trigger
        const vRes = await fetch(`${apiBase}/api/Admin/db-version`);
        if (vRes.ok) {
          const vData = await vRes.json();
          sessionStorage.setItem('admin-db-version', String(vData.version));
        }
        loadSchemes();
      } else {
        showToast('Scraping failed or Pothys site layout changed.', 'error');
      }
    } catch (e) {
      showToast('Network error while scraping Pothys', 'error');
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Savings Plan Master</h2>
          <p style={{ color: 'var(--text-2)', fontSize: '13px', marginTop: '4px' }}>
            Configure default Aishwaryam monthly gold schemes, subscription parameters, and scraping hooks.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" onClick={handleScrapePothys} disabled={isScraping}>
            <RefreshCw size={16} className={isScraping ? 'spin' : ''} /> {isScraping ? 'Scraping Pothys...' : 'Scrape Pothys Rates'}
          </button>
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} /> Create Plan
          </button>
        </div>
      </div>

      {/* Plans list */}
      <div className="card">
        {isLoading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-2)', padding: '20px' }}>Loading savings schemes...</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Plan Scheme Name</th>
                  <th>Installment Size</th>
                  <th>Term Duration</th>
                  <th>Frequency</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {schemes.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-3)' }}>
                      No plan configurations active in database.
                    </td>
                  </tr>
                ) : (
                  schemes.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div style={{ fontWeight: '600' }}>{s.planName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{s.description || 'No description'}</div>
                      </td>
                      <td style={{ fontWeight: '700', color: 'var(--green)' }}>₹{(s.installmentAmountPaise / 100).toFixed(2)}</td>
                      <td>{s.totalInstallments} Months</td>
                      <td><span className="badge badge-blue">{s.frequency}</span></td>
                      <td>
                        <span className={`badge ${s.isActive ? 'badge-green' : 'badge-red'}`}>
                          {s.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn btn-ghost btn-xs" onClick={() => handleOpenEdit(s)}>
                            <Edit2 size={12} /> Edit
                          </button>
                          <button className="btn btn-ghost btn-xs" style={{ color: 'var(--red)' }} onClick={() => handleDelete(s.id)}>
                            <Trash2 size={12} /> Delete
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

      {/* Edit/Create Modal */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <form className="modal-content fade-in" onSubmit={handleSave} onClick={(e) => e.stopPropagation()}>
            <div className="card-head" style={{ padding: '20px 24px', margin: 0, borderBottom: '1px solid var(--border)' }}>
              <span className="card-title">{editId ? 'Edit Savings Plan' : 'Create Savings Plan'}</span>
              <button type="button" className="btn btn-ghost btn-xs" onClick={() => setModalOpen(false)} style={{ padding: '4px', borderRadius: '50%' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Plan Scheme Name</label>
                <input
                  className="form-control"
                  type="text"
                  placeholder="e.g. Swarna Varshini Scheme"
                  required
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Short Description</label>
                <input
                  className="form-control"
                  type="text"
                  placeholder="e.g. 11 Months Gold Accumulation Program"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid-cols-2" style={{ gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Installment Size (INR)</label>
                  <input
                    className="form-control"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 1000.00"
                    required
                    value={installmentAmount}
                    onChange={(e) => setInstallmentAmount(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Total Installments</label>
                  <input
                    className="form-control"
                    type="number"
                    placeholder="e.g. 11"
                    required
                    value={totalInstallments}
                    onChange={(e) => setTotalInstallments(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid-cols-2" style={{ gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Billing Frequency</label>
                  <select
                    className="form-control"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>

                <div className="form-group" style={{ justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
                    <input
                      type="checkbox"
                      id="planActiveCheck"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                    />
                    <label htmlFor="planActiveCheck" style={{ fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>
                      Active & Displayed in App
                    </label>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Scheme'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
