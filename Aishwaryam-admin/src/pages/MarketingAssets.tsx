import React, { useEffect, useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Plus, Trash2, ShieldAlert, Image, Upload, Link, Eye, X } from 'lucide-react';

interface Asset {
  id: string;
  title: string;
  imageBase64: string;
  tapActionUrl?: string;
  location: string; // ONBOARDING, POSTER, DASHBOARD
  displayOrder: number;
  isActive: boolean;
}

export const MarketingAssets: React.FC = () => {
  const { apiBase, globalReloadToken, showToast } = useAdmin();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [activeLocation, setActiveLocation] = useState<'ONBOARDING' | 'POSTER'>('ONBOARDING');
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [tapActionUrl, setTapActionUrl] = useState('');
  const [displayOrder, setDisplayOrder] = useState('1');
  const [isSaving, setIsSaving] = useState(false);

  const loadAssets = async () => {
    try {
      const res = await window.fetchWithCache(`${apiBase}/api/Banner/admin/all`);
      if (res.ok) {
        setAssets(await res.json());
      }
    } catch (e) {
      console.error('Failed to load marketing assets', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, [globalReloadToken]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('Image file size must be less than 2MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !imageBase64) {
      showToast('Title and Image file are required.', 'error');
      return;
    }

    setIsSaving(true);
    const payload = {
      title,
      imageBase64,
      tapActionUrl: tapActionUrl || undefined,
      location: activeLocation,
      displayOrder: parseInt(displayOrder),
      isActive: true
    };

    try {
      const res = await fetch(`${apiBase}/api/Banner/admin/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast('Asset uploaded successfully', 'success');
        setModalOpen(false);
        // Force version increment trigger
        const vRes = await fetch(`${apiBase}/api/Admin/db-version`);
        if (vRes.ok) {
          const vData = await vRes.json();
          sessionStorage.setItem('admin-db-version', String(vData.version));
        }
        loadAssets();
      } else {
        showToast('Failed to upload marketing asset', 'error');
      }
    } catch (e) {
      showToast('Network error while saving asset', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this marketing asset?')) return;

    try {
      const res = await fetch(`${apiBase}/api/Banner/admin/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Asset deleted successfully', 'success');
        // Force version increment trigger
        const vRes = await fetch(`${apiBase}/api/Admin/db-version`);
        if (vRes.ok) {
          const vData = await vRes.json();
          sessionStorage.setItem('admin-db-version', String(vData.version));
        }
        loadAssets();
      } else {
        showToast('Failed to delete asset', 'error');
      }
    } catch (e) {
      showToast('Network error while deleting asset', 'error');
    }
  };

  const currentAssets = assets
    .filter((a) => a.location === activeLocation)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Marketing Assets</h2>
          <p style={{ color: 'var(--text-2)', fontSize: '13px', marginTop: '4px' }}>
            Manage in-app onboarding slider banners, category promo posters, and redirect routes.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setTitle('');
          setImageBase64('');
          setTapActionUrl('');
          setDisplayOrder('1');
          setModalOpen(true);
        }}>
          <Plus size={16} /> Upload New Image
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
        <button
          className={`btn ${activeLocation === 'ONBOARDING' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveLocation('ONBOARDING')}
        >
          Onboarding Banners
        </button>
        <button
          className={`btn ${activeLocation === 'POSTER' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveLocation('POSTER')}
        >
          Promo Posters
        </button>
      </div>

      {/* Assets Grid */}
      {isLoading ? (
        <div style={{ color: 'var(--text-2)', textAlign: 'center', padding: '40px' }}>Loading assets...</div>
      ) : (
        <div className="grid-cols-3" style={{ gap: '24px' }}>
          {currentAssets.length === 0 ? (
            <div style={{ gridColumn: 'span 3', padding: '40px', background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: '16px', textAlign: 'center', color: 'var(--text-3)' }}>
              No images uploaded under this section.
            </div>
          ) : (
            currentAssets.map((asset) => (
              <div key={asset.id} className="card" style={{ gap: '12px', padding: '16px' }}>
                <div style={{ position: 'relative', width: '100%', height: '180px', borderRadius: '12px', overflow: 'hidden', background: '#000', border: '1px solid var(--border)' }}>
                  <img
                    src={asset.imageBase64}
                    alt={asset.title}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                  <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>
                    Order: {asset.displayOrder}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text)' }}>{asset.title}</span>
                  {asset.tapActionUrl && (
                    <span style={{ fontSize: '11.5px', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Link size={12} /> {asset.tapActionUrl}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button
                    className="btn btn-danger btn-xs"
                    style={{ flex: 1 }}
                    onClick={() => handleDelete(asset.id)}
                  >
                    <Trash2 size={12} /> Delete Asset
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Upload Modal */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <form className="modal-content fade-in" onSubmit={handleSave} onClick={(e) => e.stopPropagation()}>
            <div className="card-head" style={{ padding: '20px 24px', margin: 0, borderBottom: '1px solid var(--border)' }}>
              <span className="card-title">Upload {activeLocation === 'ONBOARDING' ? 'Onboarding Banner' : 'Promo Poster'}</span>
              <button type="button" className="btn btn-ghost btn-xs" onClick={() => setModalOpen(false)} style={{ padding: '4px', borderRadius: '50%' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Asset Title</label>
                <input
                  className="form-control"
                  type="text"
                  placeholder="e.g. Slide Banner 1 - Save daily"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="grid-cols-2" style={{ gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Display Sequence Order</label>
                  <input
                    className="form-control"
                    type="number"
                    min="1"
                    required
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Redirect Target URL (Optional)</label>
                  <input
                    className="form-control"
                    type="text"
                    placeholder="e.g. /profile/kyc or https://..."
                    value={tapActionUrl}
                    onChange={(e) => setTapActionUrl(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Image File (PNG, JPG, WebP - under 2MB)</label>
                <div style={{ border: '2px dashed var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', position: 'relative' }}>
                  <Upload size={24} style={{ color: 'var(--text-3)' }} />
                  <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>
                    {imageBase64 ? 'Image selected successfully' : 'Drag file here or click to choose'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                  />
                </div>
                {imageBase64 && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                    <img src={imageBase64} alt="Upload preview" style={{ maxHeight: '120px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Uploading...' : 'Save & Publish'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
