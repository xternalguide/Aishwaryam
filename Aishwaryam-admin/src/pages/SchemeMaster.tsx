import React, { useEffect, useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Plus, Edit2, Trash2, X, Upload } from 'lucide-react';

interface Scheme {
  id: string;
  planName: string;
  description?: string;
  installmentAmountPaise: number;
  totalInstallments: number;
  frequency: string;
  isActive: boolean;
  durationUnit?: string;
  razorpayPlanId?: string;
  posterImageBase64?: string;
  keywordsJson?: string;
  paymentRulesJson?: string;
  bonusConfigJson?: string;
  customSectionsJson?: string;
}

export const SchemeMaster: React.FC = () => {
  const { apiBase, globalReloadToken, showToast } = useAdmin();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit / Create Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [planName, setPlanName] = useState('');
  const [description, setDescription] = useState('');
  const [installmentAmount, setInstallmentAmount] = useState('');
  const [totalInstallments, setTotalInstallments] = useState('11');
  const [frequency, setFrequency] = useState('Daily');
  const [isActive, setIsActive] = useState(true);
  
  // Advanced fields
  const [durationUnit, setDurationUnit] = useState('Days');
  const [razorpayPlanId, setRazorpayPlanId] = useState('');
  const [posterImageBase64, setPosterImageBase64] = useState('');
  const [keywords, setKeywords] = useState('');
  
  // Payment Rules
  const [minAmount, setMinAmount] = useState('100');
  const [maxAmount, setMaxAmount] = useState('50000');
  const [multiplePerDay, setMultiplePerDay] = useState(true);
  const [earlyExitAfterDays, setEarlyExitAfterDays] = useState('180');

  // JSON configs
  const [bonusConfigJson, setBonusConfigJson] = useState('');
  const [customSectionsJson, setCustomSectionsJson] = useState('');

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
    setDurationUnit('Days');
    setRazorpayPlanId('');
    setPosterImageBase64('');
    setKeywords('');
    setMinAmount('100');
    setMaxAmount('50000');
    setMultiplePerDay(true);
    setEarlyExitAfterDays('180');
    setBonusConfigJson('');
    setCustomSectionsJson('');
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
    setDurationUnit(s.durationUnit || 'Days');
    setRazorpayPlanId(s.razorpayPlanId || '');
    setPosterImageBase64(s.posterImageBase64 || '');
    
    // Parse keywords
    let kwStr = '';
    if (s.keywordsJson) {
      try {
        const kwArr = JSON.parse(s.keywordsJson);
        if (Array.isArray(kwArr)) kwStr = kwArr.join(', ');
      } catch (e) {}
    }
    setKeywords(kwStr);

    // Parse payment rules
    if (s.paymentRulesJson) {
      try {
        const rules = JSON.parse(s.paymentRulesJson);
        setMinAmount(rules.minAmountPaise ? (rules.minAmountPaise / 100).toString() : '100');
        setMaxAmount(rules.maxAmountPaise ? (rules.maxAmountPaise / 100).toString() : '50000');
        setMultiplePerDay(rules.multiplePerDay !== false);
        setEarlyExitAfterDays(rules.earlyExitAfterDays ? rules.earlyExitAfterDays.toString() : '180');
      } catch (e) {}
    } else {
      setMinAmount('100');
      setMaxAmount('50000');
      setMultiplePerDay(true);
      setEarlyExitAfterDays('180');
    }

    setBonusConfigJson(s.bonusConfigJson || '');
    setCustomSectionsJson(s.customSectionsJson || '');
    setModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('Poster file size must be less than 2MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPosterImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName || !installmentAmount) {
      showToast('Name and Installment Amount are required.', 'error');
      return;
    }

    setIsSaving(true);

    // Format keywords
    const kwArray = keywords.split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);
    const keywordsJson = JSON.stringify(kwArray);

    // Format payment rules
    const paymentRules = {
      minAmountPaise: Math.round(parseFloat(minAmount) * 100),
      maxAmountPaise: Math.round(parseFloat(maxAmount) * 100),
      multiplePerDay,
      earlyExitAfterDays: parseInt(earlyExitAfterDays)
    };
    const paymentRulesJson = JSON.stringify(paymentRules);

    const payload = {
      id: editId || undefined,
      planName,
      description,
      installmentAmountPaise: Math.round(parseFloat(installmentAmount) * 100),
      totalInstallments: parseInt(totalInstallments),
      frequency,
      isActive,
      durationUnit,
      razorpayPlanId: razorpayPlanId || null,
      posterImageBase64: posterImageBase64 || null,
      keywordsJson,
      paymentRulesJson,
      bonusConfigJson: bonusConfigJson || null,
      customSectionsJson: customSectionsJson || null
    };

    try {
      const endpoint = editId ? `${apiBase}/api/Scheme/update` : `${apiBase}/api/Scheme/create`;
      const res = await fetch(endpoint, {
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

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Schemes Master</h2>
          <p style={{ color: 'var(--text-2)', fontSize: '13px', marginTop: '4px' }}>
            Configure savings programs, durations, rules, and promotional bonus structures.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={16} /> Create Savings Scheme
        </button>
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
                    <th>Scheme Name</th>
                    <th>Installment</th>
                    <th>Frequency</th>
                    <th>Duration</th>
                    <th>Razorpay ID</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schemes.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-3)' }}>
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
                        <td><span className="badge badge-blue">{s.frequency}</span></td>
                        <td>{s.totalInstallments} {s.durationUnit || 'Months'}</td>
                        <td style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-2)' }}>{s.razorpayPlanId || '—'}</td>
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
          <form className="modal-content fade-in" onSubmit={handleSave} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div className="card-head" style={{ padding: '20px 24px', margin: 0, borderBottom: '1px solid var(--border)' }}>
              <span className="card-title">{editId ? 'Edit Savings Plan' : 'Create Savings Plan'}</span>
              <button type="button" className="btn btn-ghost btn-xs" onClick={() => setModalOpen(false)} style={{ padding: '4px', borderRadius: '50%' }}>
                <X size={18} />
              </button>
            </div>
            
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '75vh', overflowY: 'auto' }}>
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

                <div className="form-group">
                  <label className="form-label">Duration Unit</label>
                  <select
                    className="form-control"
                    value={durationUnit}
                    onChange={(e) => setDurationUnit(e.target.value)}
                  >
                    <option value="Days">Days</option>
                    <option value="Weeks">Weeks</option>
                    <option value="Months">Months</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Razorpay Plan ID (for AutoPay subscriptions)</label>
                <input
                  className="form-control"
                  type="text"
                  placeholder="e.g. plan_N1o9aH21sP45"
                  value={razorpayPlanId}
                  onChange={(e) => setRazorpayPlanId(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Search Keywords (Comma-separated list)</label>
                <input
                  className="form-control"
                  type="text"
                  placeholder="e.g. Flexible, 7% Gold Bonus, Start ₹100"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                />
              </div>

              {/* Poster Image upload */}
              <div className="form-group">
                <label className="form-label">Scheme Card Poster Image</label>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <label className="btn btn-outline" style={{ display: 'flex', gap: '8px', cursor: 'pointer', margin: 0 }}>
                    <Upload size={16} /> Choose Poster File
                    <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                  </label>
                  {posterImageBase64 ? (
                    <img
                      src={posterImageBase64}
                      alt="Preview"
                      style={{ height: '50px', borderRadius: '8px', border: '1px solid var(--border)' }}
                    />
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>No image uploaded (default poster will be used)</span>
                  )}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '8px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: '700' }}>Payment Constraints & Rules</h4>
                <div className="grid-cols-2" style={{ gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Min Extra Amount (INR)</label>
                    <input
                      className="form-control"
                      type="number"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Max Extra Amount (INR)</label>
                    <input
                      className="form-control"
                      type="number"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid-cols-2" style={{ gap: '16px', marginTop: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Early Exit Lock-in Period (Days)</label>
                    <input
                      className="form-control"
                      type="number"
                      value={earlyExitAfterDays}
                      onChange={(e) => setEarlyExitAfterDays(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
                      <input
                        type="checkbox"
                        id="multiplePerDayCheck"
                        checked={multiplePerDay}
                        onChange={(e) => setMultiplePerDay(e.target.checked)}
                      />
                      <label htmlFor="multiplePerDayCheck" style={{ fontWeight: '600', cursor: 'pointer', fontSize: '12px' }}>
                        Allow multiple payments per day
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '8px' }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '700' }}>Promotional & Bonus Configuration (JSON)</h4>
                <p style={{ fontSize: '11px', color: 'var(--text-3)', margin: '0 0 8px 0' }}>
                  {"Define custom bonus yield tiers (e.g. [{\"startDay\":1,\"endDay\":365,\"bonusPercentage\":7.5}])"}
                </p>
                <textarea
                  className="form-control"
                  style={{ fontFamily: 'monospace', fontSize: '12px', minHeight: '80px' }}
                  placeholder='e.g. [{"startDay": 1, "endDay": 330, "bonusPercentage": 7.5}]'
                  value={bonusConfigJson}
                  onChange={(e) => setBonusConfigJson(e.target.value)}
                />
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '8px' }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '700' }}>Custom Sections / Features Metadata (JSON)</h4>
                <p style={{ fontSize: '11px', color: 'var(--text-3)', margin: '0 0 8px 0' }}>
                  Define marketing attributes and tags for the details sheet.
                </p>
                <textarea
                  className="form-control"
                  style={{ fontFamily: 'monospace', fontSize: '12px', minHeight: '80px' }}
                  placeholder='e.g. {"rating": 4.9, "attributes": [{"key": "maturity", "enabled": 1, "title": "Maturity benefits"}]}'
                  value={customSectionsJson}
                  onChange={(e) => setCustomSectionsJson(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  id="planActiveCheck"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <label htmlFor="planActiveCheck" style={{ fontWeight: '600', cursor: 'pointer', fontSize: '13px', marginLeft: '8px' }}>
                  Active & Displayed in App
                </label>
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
