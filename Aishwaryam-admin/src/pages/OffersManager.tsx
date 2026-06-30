import React, { useEffect, useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Plus, Edit2, Trash2, ShieldAlert, Award, ToggleLeft, ToggleRight, X, Percent } from 'lucide-react';

interface Offer {
  id: string;
  title: string;
  description?: string;
  offerType: string;
  discountPercentage: number;
  maxDiscountPaise: number;
  minTransactionAmountPaise: number;
  couponCode?: string;
  isActive: boolean;
  expiresAt: string;
}

export const OffersManager: React.FC = () => {
  const { apiBase, globalReloadToken, showToast } = useAdmin();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [referralBonusMsg, setReferralBonusMsg] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [offerType, setOfferType] = useState('BULK'); // BULK, COUPON, SCHEME
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    try {
      const [configRes, offersRes] = await Promise.all([
        fetch(`${apiBase}/api/User/config`),
        fetch(`${apiBase}/api/Offers/all-enriched`)
      ]);

      if (configRes.ok) {
        const config = await configRes.json();
        setReferralBonusMsg(config.referralBonusMsg || '');
      }

      if (offersRes.ok) {
        setOffers(await offersRes.json());
      }
    } catch (e) {
      console.error('Failed to load offers manager', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [globalReloadToken]);

  const handleSaveReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiBase}/api/User/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faqJson: '[]', referralBonusMsg })
      });
      if (res.ok) {
        showToast('Referral settings updated successfully', 'success');
        // Force version increment trigger
        const vRes = await fetch(`${apiBase}/api/Admin/db-version`);
        if (vRes.ok) {
          const vData = await vRes.json();
          sessionStorage.setItem('admin-db-version', String(vData.version));
        }
        loadData();
      } else {
        showToast('Failed to save referral settings', 'error');
      }
    } catch (e) {
      showToast('Network error while saving settings', 'error');
    }
  };

  const handleOpenCreate = () => {
    setEditId(null);
    setTitle('');
    setDescription('');
    setOfferType('BULK');
    setDiscountPercentage('');
    setCouponCode('');
    setExpiresAt(new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]);
    setModalOpen(true);
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !discountPercentage) {
      showToast('Title and Discount Percentage are required.', 'error');
      return;
    }

    setIsSaving(true);
    const payload = {
      title,
      description,
      offerType,
      discountPercentage: parseInt(discountPercentage),
      maxDiscountPaise: 50000, // 500 INR default max
      minTransactionAmountPaise: 10000, // 100 INR default min
      couponCode: offerType === 'COUPON' ? couponCode : undefined,
      expiresAt: new Date(expiresAt).toISOString()
    };

    try {
      const url = editId ? `${apiBase}/api/Offers/${editId}` : `${apiBase}/api/Offers/create`;
      const method = editId ? 'PUT' : 'POST'; // Note: update might use different paths, we use default legacy update
      // Fallback: Legacy create/update endpoint
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(`Promo Offer ${editId ? 'updated' : 'created'} successfully`, 'success');
        setModalOpen(false);
        // Force version increment trigger
        const vRes = await fetch(`${apiBase}/api/Admin/db-version`);
        if (vRes.ok) {
          const vData = await vRes.json();
          sessionStorage.setItem('admin-db-version', String(vData.version));
        }
        loadData();
      } else {
        showToast('Failed to save promotional offer', 'error');
      }
    } catch (e) {
      showToast('Network error while saving offer', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleOffer = async (id: string) => {
    try {
      const res = await fetch(`${apiBase}/api/Offers/${id}/toggle`, { method: 'POST' });
      if (res.ok) {
        showToast('Offer status toggled', 'success');
        // Force version increment trigger
        const vRes = await fetch(`${apiBase}/api/Admin/db-version`);
        if (vRes.ok) {
          const vData = await vRes.json();
          sessionStorage.setItem('admin-db-version', String(vData.version));
        }
        loadData();
      } else {
        showToast('Failed to toggle offer', 'error');
      }
    } catch (e) {
      showToast('Network error while toggling offer', 'error');
    }
  };

  const handleDeleteOffer = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this promotional offer?')) return;
    try {
      const res = await fetch(`${apiBase}/api/Offers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Offer deleted successfully', 'success');
        // Force version increment trigger
        const vRes = await fetch(`${apiBase}/api/Admin/db-version`);
        if (vRes.ok) {
          const vData = await vRes.json();
          sessionStorage.setItem('admin-db-version', String(vData.version));
        }
        loadData();
      } else {
        showToast('Failed to delete offer', 'error');
      }
    } catch (e) {
      showToast('Network error while deleting offer', 'error');
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Promos & Incentives</h2>
          <p style={{ color: 'var(--text-2)', fontSize: '13px', marginTop: '4px' }}>
            Configure gold transaction coupons, signup bonuses, referral campaigns, and bulk event rewards.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={16} /> Create Offer
        </button>
      </div>

      <div className="grid-cols-3" style={{ alignItems: 'start' }}>
        {/* Referral Settings Card */}
        <form className="card" onSubmit={handleSaveReferral} style={{ gridColumn: 'span 1' }}>
          <div className="card-head">
            <span className="card-title">Referral Bonus Settings</span>
            <Award size={18} style={{ color: 'var(--accent)' }} />
          </div>
          
          <div className="form-group">
            <label className="form-label">Referral Message Banner (In-App)</label>
            <textarea
              className="form-control"
              rows={4}
              placeholder="e.g. Invite friends and earn ₹50 worth of gold bonus on their first scheme subscription..."
              required
              value={referralBonusMsg}
              onChange={(e) => setReferralBonusMsg(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Save Referral Configuration
          </button>
        </form>

        {/* Offers Grid list */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-head">
            <span className="card-title">Active Campaign Rules</span>
            <span className="badge badge-green">{offers.length} active</span>
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-2)', padding: '20px' }}>Loading campaign rules...</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Campaign Rule</th>
                    <th>Type</th>
                    <th>Discount</th>
                    <th>Expires</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-3)' }}>
                        No marketing campaign rules found.
                      </td>
                    </tr>
                  ) : (
                    offers.map((o) => (
                      <tr key={o.id}>
                        <td>
                          <div style={{ fontWeight: '600' }}>{o.title}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                            {o.couponCode ? `Coupon Code: ${o.couponCode}` : 'Automatic Apply'}
                          </div>
                        </td>
                        <td><span className="badge badge-blue">{o.offerType}</span></td>
                        <td style={{ color: 'var(--green)', fontWeight: '700' }}>{o.discountPercentage}%</td>
                        <td className="text-xs">{new Date(o.expiresAt).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge ${o.isActive ? 'badge-green' : 'badge-red'}`}>
                            {o.isActive ? 'RUNNING' : 'PAUSED'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              className="btn btn-ghost btn-xs"
                              onClick={() => handleToggleOffer(o.id)}
                              style={{ color: o.isActive ? 'var(--red)' : 'var(--green)' }}
                              title={o.isActive ? 'Pause campaign' : 'Run campaign'}
                            >
                              {o.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                            </button>
                            <button
                              className="btn btn-ghost btn-xs"
                              style={{ color: 'var(--red)' }}
                              onClick={() => handleDeleteOffer(o.id)}
                            >
                              <Trash2 size={12} />
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
      </div>

      {/* Create Offer Modal */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <form className="modal-content fade-in" onSubmit={handleSaveOffer} onClick={(e) => e.stopPropagation()}>
            <div className="card-head" style={{ padding: '20px 24px', margin: 0, borderBottom: '1px solid var(--border)' }}>
              <span className="card-title">Configure Promotional Offer</span>
              <button type="button" className="btn btn-ghost btn-xs" onClick={() => setModalOpen(false)} style={{ padding: '4px', borderRadius: '50%' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Campaign Title</label>
                <input
                  className="form-control"
                  type="text"
                  placeholder="e.g. Independence Day 5% Bonus Gold"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description / Subtitle</label>
                <input
                  className="form-control"
                  type="text"
                  placeholder="Get 5% extra gold weight on all BUY transactions..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid-cols-2" style={{ gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Campaign Scope Type</label>
                  <select
                    className="form-control"
                    value={offerType}
                    onChange={(e) => setOfferType(e.target.value)}
                  >
                    <option value="BULK">Bulk Automatic (All Users)</option>
                    <option value="COUPON">Coupon Code Specific</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Bonus Percentage (%)</label>
                  <input
                    className="form-control"
                    type="number"
                    min="1"
                    max="100"
                    placeholder="e.g. 5"
                    required
                    value={discountPercentage}
                    onChange={(e) => setDiscountPercentage(e.target.value)}
                  />
                </div>
              </div>

              {offerType === 'COUPON' && (
                <div className="form-group">
                  <label className="form-label">Coupon Code (Required)</label>
                  <input
                    className="form-control"
                    type="text"
                    placeholder="e.g. GOLDWEEK5"
                    required
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Expiration Date</label>
                <input
                  className="form-control"
                  type="date"
                  required
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Deploy Offer'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
