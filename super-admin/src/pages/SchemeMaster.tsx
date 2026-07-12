import React, { useEffect, useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Plus, Edit, Trash2, CheckCircle, X, Search, Upload } from 'lucide-react';

interface Scheme {
  id: string;
  planName: string;
  description?: string;
  installmentAmountPaise: number;
  totalInstallments: number;
  frequency: string; // Daily, Weekly, Monthly, Flexible
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

  // Parsed Tier & Section Builder States
  const [bonusTiers, setBonusTiers] = useState<{ startDay: number; endDay: number; bonusPercentage: number }[]>([]);
  const [customSections, setCustomSections] = useState<{ type: number; title: string; content: string }[]>([]);

  const [isSaving, setIsSaving] = useState(false);

  const loadSchemes = async () => {
    try {
      const res = await fetch(`${apiBase}/api/Scheme/admin/list`);
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
    setBonusTiers([]);
    setCustomSections([]);
    setModalOpen(true);
  };

  const handleOpenEdit = (s: Scheme) => {
    setEditId(s.id);
    setPlanName(s.planName);
    setDescription(s.description || '');
    setInstallmentAmount((s.installmentAmountPaise / 100).toString());
    setTotalInstallments(s.totalInstallments.toString());
    setFrequency(s.frequency || 'Daily');
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

    // Parse tiers
    let parsedTiers = [];
    if (s.bonusConfigJson) {
      try {
        parsedTiers = JSON.parse(s.bonusConfigJson);
      } catch (e) {}
    }
    setBonusTiers(Array.isArray(parsedTiers) ? parsedTiers : []);

    // Parse sections
    let parsedSections = [];
    if (s.customSectionsJson) {
      try {
        parsedSections = JSON.parse(s.customSectionsJson);
      } catch (e) {}
    }
    setCustomSections(Array.isArray(parsedSections) ? parsedSections : []);

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
    if (!planName || (frequency !== 'Flexible' && !installmentAmount)) {
      showToast('Plan Name and Installment Amount are required.', 'error');
      return;
    }

    const tenureVal = parseInt(totalInstallments) || 0;
    if (tenureVal <= 0) {
      showToast('Scheme Duration / Tenure must be greater than 0.', 'error');
      return;
    }

    // Validate Loyalty Bonus Structure Tiers
    for (let i = 0; i < bonusTiers.length; i++) {
      const tier = bonusTiers[i];
      if (tier.startDay <= 0 || tier.endDay <= 0) {
        showToast(`Tier ${i + 1}: Day ranges must be greater than 0.`, 'error');
        return;
      }
      if (tier.startDay > tier.endDay) {
        showToast(`Tier ${i + 1}: Start day (${tier.startDay}) cannot be greater than End day (${tier.endDay}).`, 'error');
        return;
      }
      if (tier.bonusPercentage <= 0) {
        showToast(`Tier ${i + 1}: Bonus percentage must be greater than 0%.`, 'error');
        return;
      }

      // Check for overlap with other tiers
      for (let j = i + 1; j < bonusTiers.length; j++) {
        const other = bonusTiers[j];
        if (tier.startDay <= other.endDay && other.startDay <= tier.endDay) {
          showToast(`Tier ${i + 1} and Tier ${j + 1} have overlapping day ranges.`, 'error');
          return;
        }
      }
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
      earlyExitAfterDays: 0
    };
    const paymentRulesJson = JSON.stringify(paymentRules);

    const bonusConfigJson = bonusTiers.length > 0 ? JSON.stringify(bonusTiers) : null;
    const customSectionsJson = customSections.length > 0 ? JSON.stringify(customSections) : null;

    const payload = {
      id: editId || undefined,
      planName,
      description,
      installmentAmountPaise: frequency === 'Flexible' ? 0 : Math.round(parseFloat(installmentAmount) * 100),
      totalInstallments: parseInt(totalInstallments),
      frequency,
      isActive,
      durationUnit,
      razorpayPlanId: frequency === 'Flexible' ? null : (razorpayPlanId || null),
      posterImageBase64: posterImageBase64 || null,
      keywordsJson,
      paymentRulesJson,
      bonusConfigJson,
      customSectionsJson
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
    if (!window.confirm('Are you sure you want to permanently delete this scheme?')) return;

    try {
      const res = await fetch(`${apiBase}/api/Scheme/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Scheme deleted successfully', 'success');
        // Force version increment trigger
        const vRes = await fetch(`${apiBase}/api/Admin/db-version`);
        if (vRes.ok) {
          const vData = await vRes.json();
          sessionStorage.setItem('admin-db-version', String(vData.version));
        }
        loadSchemes();
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.message || errData.Message || 'Failed to delete scheme', 'error');
      }
    } catch (e) {
      showToast('Network error while deleting scheme', 'error');
    }
  };

  return (
    <>
      {/* Top Header */}
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Schemes Master</h2>
          <p style={{ color: 'var(--text-2)', fontSize: '13px', marginTop: '4px' }}>
            Configure savings programs, durations, rules, and promotional yield milestones.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={16} /> Create Savings Scheme
        </button>
      </div>

      {/* Main List Table Card */}
      <div className="card" style={{ marginTop: '24px' }}>
        {isLoading ? (
          <div style={{ color: 'var(--text-2)', padding: '20px', textAlign: 'center' }}>Loading active programs...</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Scheme Name</th>
                  <th>Type</th>
                  <th>Installment (INR)</th>
                  <th>Tenure</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {schemes.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-3)' }}>
                      No gold savings schemes configured yet. Click 'Create Savings Scheme' to start.
                    </td>
                  </tr>
                ) : (
                  schemes.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text)' }}>{s.planName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px', maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.description || 'No description provided.'}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${s.frequency === 'Flexible' ? 'badge-blue' : 'badge-green'}`} style={{ textTransform: 'uppercase' }}>
                          {s.frequency}
                        </span>
                      </td>
                      <td style={{ fontWeight: '600' }}>
                        {s.frequency === 'Flexible' ? (
                          <span style={{ color: 'var(--text-3)' }}>Flexible Amount</span>
                        ) : (
                          `₹${(s.installmentAmountPaise / 100).toFixed(2)}`
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: '600' }}>{s.totalInstallments} {s.durationUnit || 'Months'}</div>
                      </td>
                      <td>
                        <span className={`badge ${s.isActive ? 'badge-green' : 'badge-outline'}`}>
                          {s.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '16px' }}>
                          <button
                            className="btn btn-ghost btn-xs"
                            onClick={() => handleOpenEdit(s)}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px' }}
                          >
                            <Edit size={13} /> Edit
                          </button>
                          <button
                            className="btn btn-ghost btn-xs"
                            onClick={() => handleDelete(s.id)}
                            style={{ color: 'var(--red)', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px' }}
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

      {/* Edit/Create Modal */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <form className="modal-content fade-in" onSubmit={handleSave} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div className="card-head" style={{ padding: '24px 24px 16px 24px', margin: 0, borderBottom: '1px solid var(--border)' }}>
              <span className="card-title" style={{ lineHeight: '1.4' }}>{editId ? 'Edit Savings Plan' : 'Create Savings Plan'}</span>
              <button type="button" className="btn btn-ghost btn-xs" onClick={() => setModalOpen(false)} style={{ padding: '4px', borderRadius: '50%' }}>
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Plan Scheme Name <span style={{ color: 'red' }}>*</span></label>
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
                  <label className="form-label">Billing Frequency <span style={{ color: 'red' }}>*</span></label>
                  <select
                    className="form-control"
                    value={frequency}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFrequency(val);
                      if (val === 'Flexible') {
                        setDurationUnit('Days');
                      }
                    }}
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Flexible">Flexible</option>
                  </select>
                </div>

                {frequency !== 'Flexible' && (
                  <div className="form-group">
                    <label className="form-label">Duration Unit <span style={{ color: 'red' }}>*</span></label>
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
                )}
              </div>

              {frequency !== 'Flexible' ? (
                <div className="grid-cols-2" style={{ gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Installment Size (INR) <span style={{ color: 'red' }}>*</span></label>
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
                    <label className="form-label">Total Installments <span style={{ color: 'red' }}>*</span></label>
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
              ) : (
                <div className="form-group">
                  <label className="form-label">Scheme Duration / Tenure <span style={{ color: 'red' }}>*</span></label>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <input
                      className="form-control"
                      type="number"
                      placeholder="e.g. 1 (for 1 Day) or 30 (for 30 Days)"
                      required
                      style={{ flex: 1 }}
                      value={totalInstallments}
                      onChange={(e) => setTotalInstallments(e.target.value)}
                    />
                    <select
                      className="form-control"
                      style={{ width: '150px' }}
                      value={durationUnit}
                      onChange={(e) => setDurationUnit(e.target.value)}
                    >
                      <option value="Days">Days</option>
                      <option value="Weeks">Weeks</option>
                      <option value="Months">Months</option>
                    </select>
                  </div>
                </div>
              )}

              {frequency !== 'Flexible' && (
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
              )}

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

                <div style={{ marginTop: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

              {/* Visual Loyalty Bonus Tier Builder */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '700' }}>Loyalty Bonus Structure (Tiers)</h4>
                    <p style={{ fontSize: '11px', color: 'var(--text-3)', margin: '2px 0 0 0' }}>
                      Define custom bonus yields earned at specific days (e.g. Day 1 to 75 = 7.5%).
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-xs"
                    onClick={() => setBonusTiers([...bonusTiers, { startDay: 1, endDay: 30, bonusPercentage: 7.5 }])}
                  >
                    + Add Tier
                  </button>
                </div>
                {bonusTiers.length === 0 ? (
                  <p style={{ fontSize: '12px', color: 'var(--text-3)', margin: 0, fontStyle: 'italic' }}>
                    No custom tiers added. Default scheme rules will apply.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {bonusTiers.map((tier, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Day</span>
                        <input
                          type="number"
                          className="form-control"
                          style={{ width: '80px', padding: '4px 8px' }}
                          value={tier.startDay}
                          onChange={(e) => {
                            const newTiers = [...bonusTiers];
                            newTiers[idx].startDay = parseInt(e.target.value) || 0;
                            setBonusTiers(newTiers);
                          }}
                        />
                        <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>to</span>
                        <input
                          type="number"
                          className="form-control"
                          style={{ width: '80px', padding: '4px 8px' }}
                          value={tier.endDay}
                          onChange={(e) => {
                            const newTiers = [...bonusTiers];
                            newTiers[idx].endDay = parseInt(e.target.value) || 0;
                            setBonusTiers(newTiers);
                          }}
                        />
                        <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Bonus %:</span>
                        <input
                          type="number"
                          step="0.1"
                          className="form-control"
                          style={{ width: '80px', padding: '4px 8px' }}
                          value={tier.bonusPercentage}
                          onChange={(e) => {
                            const newTiers = [...bonusTiers];
                            newTiers[idx].bonusPercentage = parseFloat(e.target.value) || 0;
                            setBonusTiers(newTiers);
                          }}
                        />
                        <button
                          type="button"
                          className="btn btn-outline btn-xs"
                          style={{ color: 'var(--red)', borderColor: 'var(--red)', padding: '4px 8px' }}
                          onClick={() => setBonusTiers(bonusTiers.filter((_, i) => i !== idx))}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Visual Marketing Section Builder */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '700' }}>Marketing Sections & User Guides</h4>
                    <p style={{ fontSize: '11px', color: 'var(--text-3)', margin: '2px 0 0 0' }}>
                      Add details, benefits, FAQs, or steps to display in the mobile app.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-xs"
                    onClick={() => setCustomSections([...customSections, { type: 0, title: 'FAQ', content: 'Double-tap lines to edit...' }])}
                  >
                    + Add Section
                  </button>
                </div>
                {customSections.length === 0 ? (
                  <p style={{ fontSize: '12px', color: 'var(--text-3)', margin: 0, fontStyle: 'italic' }}>
                    No marketing sections added. User will only see the basic description.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {customSections.map((sec, idx) => (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px', border: '1px solid var(--border)', padding: '12px', borderRadius: '12px', background: 'var(--bg)' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <select
                            className="form-control"
                            style={{ width: '160px', padding: '4px 8px' }}
                            value={sec.type}
                            onChange={(e) => {
                              const newSecs = [...customSections];
                              newSecs[idx].type = parseInt(e.target.value);
                              setCustomSections(newSecs);
                            }}
                          >
                            <option value="0">FAQ Accordion</option>
                            <option value="1">Premium Highlight Card</option>
                            <option value="2">Standard Info Card</option>
                          </select>
                          <input
                            type="text"
                            placeholder="Section Title (e.g. FAQ)"
                            className="form-control"
                            style={{ flex: 1, padding: '4px 8px' }}
                            value={sec.title}
                            onChange={(e) => {
                              const newSecs = [...customSections];
                              newSecs[idx].title = e.target.value;
                              setCustomSections(newSecs);
                            }}
                          />
                          <button
                            type="button"
                            className="btn btn-outline btn-xs"
                            style={{ color: 'var(--red)', borderColor: 'var(--red)', padding: '4px 8px' }}
                            onClick={() => setCustomSections(customSections.filter((_, i) => i !== idx))}
                          >
                            Remove
                          </button>
                        </div>
                        <textarea
                          placeholder="Content details or bullet points..."
                          className="form-control"
                          style={{ minHeight: '60px', fontSize: '12px' }}
                          value={sec.content}
                          onChange={(e) => {
                            const newSecs = [...customSections];
                            newSecs[idx].content = e.target.value;
                            setCustomSections(newSecs);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Saving Plan...' : 'Save & Publish'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
