import React, { useState, useEffect } from 'react';
import { ApiClient } from '../../utils/ApiClient';
import { 
  Tag, 
  Plus, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  Users, 
  Calendar, 
  AlertCircle
} from 'lucide-react';

interface PromotionalOffer {
  id: string;
  title: string;
  description: string;
  offerType: string;
  targetUserId: string | null;
  targetUserName?: string | null;
  targetUserPhone?: string | null;
  bonusWorthPaise: number;
  bonusGoldMg: number;
  bonusPercent: number;
  minPurchaseAmountPaise: number;
  minPurchaseGoldMg: number;
  bannerUrl: string | null;
  durationHours: number;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
}

interface ClaimedUser {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  offerId: string;
  offerTitle: string;
  offerType: string;
  claimedAt: string;
  awardedGoldMg: number;
  awardedAmountPaise: number;
}

export const AdminOffersManager: React.FC = () => {
  const [offers, setOffers] = useState<PromotionalOffer[]>([]);
  const [claims, setClaims] = useState<ClaimedUser[]>([]);
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'claims'>('list');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [offerType, setOfferType] = useState('SEASONAL');
  const [bonusType, setBonusType] = useState<'paise' | 'percent' | 'gold'>('paise');
  const [bonusValue, setBonusValue] = useState<number>(500); // ₹500 by default
  const [thresholdType, setThresholdType] = useState<'grams' | 'rupees' | 'none'>('grams');
  const [thresholdValue, setThresholdValue] = useState<number>(1); // 1 gram by default
  const [durationHours, setDurationHours] = useState<number>(72); // 3 days by default
  const [expiresAt, setExpiresAt] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 16);
  });
  const [bannerUrl, setBannerUrl] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Only JPG, JPEG, PNG, and WEBP formats are allowed.');
      setBannerUrl('');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Image size must be less than 2MB.');
      setBannerUrl('');
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      setBannerUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const fetchOffers = async () => {
    setIsLoading(true);
    try {
      const res = await ApiClient.get('api/Offers/all-enriched');
      if (res.data) {
        setOffers(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClaims = async () => {
    setIsLoading(true);
    try {
      const res = await ApiClient.get('api/Offers/claimed-users');
      if (res.data) {
        setClaims(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
    fetchClaims();
  }, []);

  const handleToggle = async (offerId: string) => {
    try {
      const res = await ApiClient.post(`api/Offers/${offerId}/toggle`, {});
      if (res.data && res.data.success) {
        setOffers(prev => prev.map(o => o.id === offerId ? { ...o, isActive: res.data.isActive } : o));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (offerId: string) => {
    if (!window.confirm('Are you sure you want to delete this offer?')) return;
    try {
      await ApiClient.delete(`api/Offers/${offerId}`);
      setMessage({ text: 'Offer deleted successfully!', type: 'success' });
      fetchOffers();
      fetchClaims();
    } catch (err) {
      setMessage({ text: 'Failed to delete offer.', type: 'error' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setMessage({ text: 'Title and description are required.', type: 'error' });
      return;
    }

    const payload: any = {
      title: title.trim(),
      description: description.trim(),
      offerType: offerType,
      isActive: true,
      durationHours: durationHours,
      expiresAt: new Date(expiresAt).toISOString(),
      bannerUrl: bannerUrl.trim() || null
    };

    // Set Bonus
    if (bonusType === 'paise') {
      payload.bonusWorthPaise = Math.round(bonusValue * 100);
      payload.bonusPercent = 0;
      payload.bonusGoldMg = 0;
    } else if (bonusType === 'percent') {
      payload.bonusPercent = bonusValue;
      payload.bonusWorthPaise = 0;
      payload.bonusGoldMg = 0;
    } else {
      payload.bonusGoldMg = Math.round(bonusValue * 1000); // converting grams to mg
      payload.bonusWorthPaise = 0;
      payload.bonusPercent = 0;
    }

    // Set Thresholds
    if (thresholdType === 'grams') {
      payload.minPurchaseGoldMg = Math.round(thresholdValue * 1000);
      payload.minPurchaseAmountPaise = 0;
    } else if (thresholdType === 'rupees') {
      payload.minPurchaseAmountPaise = Math.round(thresholdValue * 100);
      payload.minPurchaseGoldMg = 0;
    } else {
      payload.minPurchaseGoldMg = 0;
      payload.minPurchaseAmountPaise = 0;
    }

    setIsLoading(true);
    try {
      await ApiClient.post('api/Offers/create', payload);
      setMessage({ text: 'Offer created successfully!', type: 'success' });
      setTitle('');
      setDescription('');
      setBannerUrl('');
      setActiveTab('list');
      fetchOffers();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Failed to create offer.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      color: 'var(--brand-deep)'
    }}>
      {/* Sub tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid var(--border-light)',
        marginBottom: '20px',
        gap: '24px'
      }}>
        <button
          onClick={() => { setActiveTab('list'); setMessage(null); }}
          style={{
            padding: '12px 6px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'list' ? '3px solid var(--gold-primary)' : '3px solid transparent',
            color: activeTab === 'list' ? 'var(--gold-primary)' : 'var(--text-secondary)',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '14.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Tag size={16} />
          <span>Active Offers ({offers.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('create'); setMessage(null); }}
          style={{
            padding: '12px 6px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'create' ? '3px solid var(--gold-primary)' : '3px solid transparent',
            color: activeTab === 'create' ? 'var(--gold-primary)' : 'var(--text-secondary)',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '14.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Plus size={16} />
          <span>Create New Offer</span>
        </button>

        <button
          onClick={() => { setActiveTab('claims'); setMessage(null); }}
          style={{
            padding: '12px 6px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'claims' ? '3px solid var(--gold-primary)' : '3px solid transparent',
            color: activeTab === 'claims' ? 'var(--gold-primary)' : 'var(--text-secondary)',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '14.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Users size={16} />
          <span>Claimed Users / Rewards ({claims.length})</span>
        </button>
      </div>

      {message && (
        <div style={{
          padding: '14px 18px',
          borderRadius: '8px',
          backgroundColor: message.type === 'success' ? '#F0FDF4' : '#FEF2F2',
          border: `1px solid ${message.type === 'success' ? '#DCFCE7' : '#FEE2E2'}`,
          color: message.type === 'success' ? '#15803D' : '#B91C1C',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          <AlertCircle size={18} />
          <span>{message.text}</span>
        </div>
      )}

      {/* Tabs panels */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {activeTab === 'list' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
            {offers.map(offer => (
              <div key={offer.id} style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                border: '1px solid var(--border-light)',
                padding: '20px',
                boxShadow: '0 4px 10px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <span style={{
                      backgroundColor: 'rgba(212,175,55,0.1)',
                      color: 'var(--gold-primary)',
                      padding: '4px 10px',
                      borderRadius: '100px',
                      fontSize: '11.5px',
                      fontWeight: 'bold',
                      letterSpacing: '0.5px'
                    }}>
                      {offer.offerType}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => handleToggle(offer.id)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: offer.isActive ? 'var(--success-green)' : 'var(--text-secondary)' }}
                      >
                        {offer.isActive ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                      </button>
                      <button 
                        onClick={() => handleDelete(offer.id)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--error-red)' }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <h3 style={{ fontSize: '16.5px', margin: '0 0 8px 0', fontWeight: 'bold', color: 'var(--brand-deep)' }}>
                    {offer.title}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                    {offer.description}
                  </p>
                  {offer.bannerUrl && (
                    <div style={{ marginBottom: '16px', borderRadius: '8px', overflow: 'hidden', height: '120px', border: '1px solid var(--border-light)' }}>
                      <img src={offer.bannerUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Poster Preview" />
                    </div>
                  )}
                </div>

                <div style={{
                  borderTop: '1px solid var(--border-light)',
                  paddingTop: '12px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  fontSize: '12.5px'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px' }}>REWARD VALUE</span>
                    <strong style={{ color: '#15803D', fontWeight: 'bold' }}>
                      {offer.bonusWorthPaise > 0 && `₹${offer.bonusWorthPaise / 100} Gold`}
                      {offer.bonusGoldMg > 0 && `${offer.bonusGoldMg / 1000}g Gold`}
                      {offer.bonusPercent > 0 && `${offer.bonusPercent}% Bonus`}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px' }}>MIN THRESHOLD</span>
                    <strong style={{ color: 'var(--brand-deep)', fontWeight: 'bold' }}>
                      {offer.minPurchaseGoldMg > 0 && `> ${offer.minPurchaseGoldMg / 1000}g Gold`}
                      {offer.minPurchaseAmountPaise > 0 && `> ₹${offer.minPurchaseAmountPaise / 100}`}
                      {offer.minPurchaseGoldMg === 0 && offer.minPurchaseAmountPaise === 0 && 'No Minimum'}
                    </strong>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px' }}>EXPIRES ON</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                      <Calendar size={13} style={{ color: 'var(--gold-primary)' }} />
                      {new Date(offer.expiresAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}{' '}
                      {new Date(offer.expiresAt).toLocaleTimeString(undefined, { timeStyle: 'short' })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'create' && (
          <form onSubmit={handleSubmit} style={{
            maxWidth: '640px',
            backgroundColor: 'white',
            border: '1px solid var(--border-light)',
            borderRadius: '12px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <h3 style={{ fontSize: '17px', margin: 0, fontWeight: 'bold' }}>Define Seasonal Offer Rule</h3>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Campaign Title *</label>
              <input
                type="text"
                placeholder="e.g., Pongal Gold Fest, Diwali Bonanza"
                value={title}
                onChange={e => setTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-light)',
                  fontSize: '13.5px'
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Description *</label>
              <textarea
                placeholder="Describe rules, e.g. Purchase more than 1g gold and earn ₹500 worth of gold instantly!"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-light)',
                  fontSize: '13.5px',
                  fontFamily: 'inherit'
                }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Campaign Type</label>
                <select
                  value={offerType}
                  onChange={e => setOfferType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-light)',
                    fontSize: '13.5px'
                  }}
                >
                  <option value="SEASONAL">Seasonal (Pongal, Diwali, Ramzan)</option>
                  <option value="FLASH_SALE">Flash Sale (Bulk flat bonus)</option>
                  <option value="BIRTHDAY">Birthday Reward</option>
                  <option value="ANNIVERSARY">Anniversary Reward</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Campaign Poster (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-light)',
                    fontSize: '13px'
                  }}
                />
                {uploadError && <p style={{ color: 'var(--error-red)', fontSize: '11.5px', margin: '4px 0 0 0' }}>{uploadError}</p>}
                {bannerUrl && (
                  <div style={{ marginTop: '8px', border: '1px solid var(--border-light)', borderRadius: '6px', overflow: 'hidden', width: '150px', height: '90px' }}>
                    <img src={bannerUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Poster Preview" />
                  </div>
                )}
              </div>
            </div>

            {/* Threshold Block */}
            <div style={{
              backgroundColor: 'var(--surface-light)',
              padding: '16px',
              borderRadius: '8px',
              border: '1px dashed var(--border-light)'
            }}>
              <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 'bold', marginBottom: '10px' }}>
                Purchase Threshold (Condition)
              </label>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="thresholdType"
                    checked={thresholdType === 'grams'}
                    onChange={() => setThresholdType('grams')}
                  />
                  <span>Min Gold Weight (Grams)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="thresholdType"
                    checked={thresholdType === 'rupees'}
                    onChange={() => setThresholdType('rupees')}
                  />
                  <span>Min Purchase Amount (Rupees)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="thresholdType"
                    checked={thresholdType === 'none'}
                    onChange={() => setThresholdType('none')}
                  />
                  <span>No Minimum</span>
                </label>
              </div>

              {thresholdType !== 'none' && (
                <div>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={thresholdValue}
                    onChange={e => setThresholdValue(parseFloat(e.target.value) || 0)}
                    style={{
                      width: '180px',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-light)',
                      fontSize: '13.5px'
                    }}
                  />
                  <span style={{ marginLeft: '8px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                    {thresholdType === 'grams' ? 'grams (e.g. 1 gram)' : 'Rupees (e.g. ₹5,000)'}
                  </span>
                </div>
              )}
            </div>

            {/* Bonus Reward Block */}
            <div style={{
              backgroundColor: 'var(--surface-light)',
              padding: '16px',
              borderRadius: '8px',
              border: '1px dashed var(--border-light)'
            }}>
              <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 'bold', marginBottom: '10px' }}>
                Reward Value (Bonus)
              </label>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="bonusType"
                    checked={bonusType === 'paise'}
                    onChange={() => { setBonusType('paise'); setBonusValue(500); }}
                  />
                  <span>Rupees Worth of Gold</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="bonusType"
                    checked={bonusType === 'percent'}
                    onChange={() => { setBonusType('percent'); setBonusValue(5); }}
                  />
                  <span>Percentage (%) Extra Gold</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="bonusType"
                    checked={bonusType === 'gold'}
                    onChange={() => { setBonusType('gold'); setBonusValue(0.1); }}
                  />
                  <span>Flat Gold Weight (Grams)</span>
                </label>
              </div>

              <div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={bonusValue}
                  onChange={e => setBonusValue(parseFloat(e.target.value) || 0)}
                  style={{
                    width: '180px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-light)',
                    fontSize: '13.5px'
                  }}
                />
                <span style={{ marginLeft: '8px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                  {bonusType === 'paise' && 'Rupees (e.g. ₹500 worth of gold)'}
                  {bonusType === 'percent' && '% extra gold weight'}
                  {bonusType === 'gold' && 'grams of gold'}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Duration (Hours Valid)</label>
                <input
                  type="number"
                  min="1"
                  value={durationHours}
                  onChange={e => setDurationHours(parseInt(e.target.value) || 24)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-light)',
                    fontSize: '13.5px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Expires At *</label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={e => setExpiresAt(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-light)',
                    fontSize: '13.5px'
                  }}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                backgroundColor: 'var(--gold-primary)',
                color: 'var(--brand-deep)',
                border: 'none',
                padding: '14px',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '15px',
                transition: 'all 0.2s ease',
                marginTop: '10px'
              }}
            >
              {isLoading ? 'Creating Campaign...' : 'Publish & Broadcast Offer'}
            </button>
          </form>
        )}

        {activeTab === 'claims' && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid var(--border-light)',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-light)', borderBottom: '1px solid var(--border-light)' }}>
                  <th style={{ padding: '16px 20px', fontWeight: 'bold' }}>User Name</th>
                  <th style={{ padding: '16px 20px', fontWeight: 'bold' }}>Phone Number</th>
                  <th style={{ padding: '16px 20px', fontWeight: 'bold' }}>Offer Availed</th>
                  <th style={{ padding: '16px 20px', fontWeight: 'bold' }}>Claimed At</th>
                  <th style={{ padding: '16px 20px', fontWeight: 'bold' }}>Awarded Gold</th>
                </tr>
              </thead>
              <tbody>
                {claims.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No users have availed seasonal offers yet.
                    </td>
                  </tr>
                ) : (
                  claims.map(claim => (
                    <tr key={claim.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '16px 20px', fontWeight: '600' }}>{claim.userName}</td>
                      <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{claim.userPhone}</td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ fontWeight: '500' }}>{claim.offerTitle}</span>
                        <span style={{
                          marginLeft: '8px',
                          fontSize: '11px',
                          backgroundColor: '#F3F4F6',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          color: 'var(--text-secondary)'
                        }}>
                          {claim.offerType}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>
                        {new Date(claim.claimedAt).toLocaleDateString()} {new Date(claim.claimedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '16px 20px', fontWeight: 'bold', color: '#15803D' }}>
                        {claim.awardedGoldMg > 0 ? `+${(claim.awardedGoldMg / 1000).toFixed(4)}g` : 'Processing'}
                        {claim.awardedAmountPaise > 0 && (
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', fontWeight: 'normal' }}>
                            (Worth ₹{claim.awardedAmountPaise / 100})
                          </span>
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
    </div>
  );
};
