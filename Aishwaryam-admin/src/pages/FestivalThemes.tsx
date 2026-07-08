import React, { useEffect, useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import axios from 'axios';
import { 
  Palette, 
  Calendar, 
  CheckCircle, 
  Play, 
  Trash2, 
  Plus, 
  Edit3, 
  Eye, 
  X, 
  Clock, 
  RefreshCw, 
  Sparkles 
} from 'lucide-react';

interface FestivalTheme {
  id: string;
  name: string;
  description: string;
  primaryColorHex: string;
  secondaryColorHex: string;
  statusBarColorHex: string;
  splashBgColorHex: string;
  splashIllustrationUrl: string;
  loginIllustrationUrl: string;
  homeIllustrationUrl: string;
  sidebarIllustrationUrl: string;
  welcomeBannerUrl: string;
  decorationsJson: string;
  lottieAnimationsJson: string;
  startDate: string | null;
  endDate: string | null;
  isRecurring: boolean;
  startMonth: number | null;
  startDay: number | null;
  endMonth: number | null;
  endDay: number | null;
  isSystemDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export const FestivalThemes: React.FC = () => {
  const { showToast, apiBase } = useAdmin();
  const [themes, setThemes] = useState<FestivalTheme[]>([]);
  const [activeTheme, setActiveTheme] = useState<FestivalTheme | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Preview theme applied locally
  const [previewThemeId, setPreviewThemeId] = useState<string | null>(null);

  // Edit / Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<Partial<FestivalTheme> | null>(null);

  // API Config base URL
  const API_URL = apiBase;

  const fetchThemes = async () => {
    try {
      setLoading(true);
      const resThemes = await axios.get<FestivalTheme[]>(`${API_URL}/api/themes`);
      const resActive = await axios.get<FestivalTheme>(`${API_URL}/api/themes/active`);
      setThemes(resThemes.data);
      setActiveTheme(resActive.data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load themes data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThemes();
  }, []);

  const handleActivate = async (id: string) => {
    try {
      await axios.post(`${API_URL}/api/themes/${id}/activate`);
      showToast('Theme activated successfully!', 'success');
      fetchThemes();
    } catch (err) {
      console.error(err);
      showToast('Failed to activate theme', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this theme?')) return;
    try {
      await axios.delete(`${API_URL}/api/themes/${id}`);
      showToast('Theme deleted successfully', 'success');
      fetchThemes();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete theme', 'error');
    }
  };

  // Local Preview implementation
  const togglePreview = (theme: FestivalTheme) => {
    if (previewThemeId === theme.id) {
      // Revert to original active theme colors
      setPreviewThemeId(null);
      const active = activeTheme || themes.find(t => t.isSystemDefault);
      if (active) applyThemeColors(active);
      showToast('Reverted preview to current active theme', 'info');
    } else {
      setPreviewThemeId(theme.id);
      applyThemeColors(theme);
      showToast(`Previewing '${theme.name}' locally`, 'info');
    }
  };

  const applyThemeColors = (theme: FestivalTheme) => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', theme.primaryColorHex);
    root.style.setProperty('--secondary-color', theme.secondaryColorHex);
    root.style.setProperty('--status-bar-color', theme.statusBarColorHex);
    root.style.setProperty('--splash-bg-color', theme.splashBgColorHex);
  };

  // Open modal for new/editing
  const openModal = (theme: Partial<FestivalTheme> | null = null) => {
    setEditingTheme(theme || {
      id: '',
      name: '',
      description: '',
      primaryColorHex: '#6B21A8',
      secondaryColorHex: '#D4AF37',
      statusBarColorHex: '#4A0E4E',
      splashBgColorHex: '#FFFFFF',
      isRecurring: false,
      startMonth: 1,
      startDay: 1,
      endMonth: 1,
      endDay: 31,
    });
    setIsModalOpen(true);
  };

  const handleSaveTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTheme) return;

    try {
      const isEdit = themes.some(t => t.id === editingTheme.id);
      if (isEdit) {
        await axios.put(`${API_URL}/api/themes/${editingTheme.id}`, editingTheme);
        showToast('Theme updated successfully', 'success');
      } else {
        await axios.post(`${API_URL}/api/themes`, editingTheme);
        showToast('New theme created successfully', 'success');
      }
      setIsModalOpen(false);
      fetchThemes();
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data || 'Failed to save theme', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '300px' }}>
        <RefreshCw className="animate-spin text-accent" size={32} />
        <span style={{ marginLeft: '12px', fontWeight: '500' }}>Loading themes...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header card */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Palette className="text-accent" /> Festival Theme Management
          </h2>
          <p className="text-3" style={{ margin: '0' }}>
            Manage visuals, illustrations, animations, and active calendars across the entire suite of apps.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal(null)}>
          <Plus size={16} /> Create Theme
        </button>
      </div>

      {/* Current Active Theme Spotlight Banner */}
      {activeTheme && (
        <div className="card" style={{
          background: `linear-gradient(135deg, ${activeTheme.primaryColorHex} 0%, rgba(20,20,20,0.85) 100%)`,
          color: '#fff',
          border: `2px solid ${activeTheme.secondaryColorHex}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
            <div style={{ flex: '1', minWidth: '280px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles size={12} /> Active Campaign Now
                </span>
                {activeTheme.isRecurring && (
                  <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                    Recurring Annually
                  </span>
                )}
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0', color: activeTheme.secondaryColorHex }}>
                {activeTheme.name}
              </h1>
              <p style={{ opacity: '0.85', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                {activeTheme.description}
              </p>

              {/* Schedule */}
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '13px', opacity: '0.9' }}>
                {activeTheme.isRecurring ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} /> Scheduled: {activeTheme.startMonth}/{activeTheme.startDay} to {activeTheme.endMonth}/{activeTheme.endDay}
                  </div>
                ) : activeTheme.startDate ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} /> Custom Date: {new Date(activeTheme.startDate).toLocaleDateString()} to {new Date(activeTheme.endDate!).toLocaleDateString()}
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} /> Manually Activated
                  </div>
                )}
              </div>
            </div>

            {/* Colors Preview */}
            <div style={{ display: 'flex', gap: '12px', background: 'rgba(0,0,0,0.4)', padding: '16px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: activeTheme.primaryColorHex }} />
                <span style={{ fontSize: '10px' }}>Primary</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: activeTheme.secondaryColorHex }} />
                <span style={{ fontSize: '10px' }}>Accent</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: activeTheme.statusBarColorHex }} />
                <span style={{ fontSize: '10px' }}>Status</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: activeTheme.splashBgColorHex }} />
                <span style={{ fontSize: '10px' }}>Splash BG</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid of All Available Themes */}
      <h3 style={{ margin: '8px 0 0 0' }}>Available Campaigns & Themes</h3>
      <div className="grid grid-3">
        {themes.map((theme) => {
          const isCurrentlyActive = activeTheme?.id === theme.id;
          const isPreviewing = previewThemeId === theme.id;
          
          return (
            <div key={theme.id} className={`card ${isCurrentlyActive ? 'border-accent' : ''}`} style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h3 style={{ margin: '0', fontSize: '18px', fontWeight: '700' }}>{theme.name}</h3>
                  {isCurrentlyActive && (
                    <span className="badge badge-success" style={{ padding: '2px 8px', fontSize: '10px' }}>Active</span>
                  )}
                </div>
                <p className="text-3" style={{ fontSize: '13px', lineHeight: '1.4', margin: '0 0 16px 0', minHeight: '38px' }}>
                  {theme.description}
                </p>

                {/* Colors block */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: theme.primaryColorHex, border: '1px solid var(--border)' }} title="Primary Color" />
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: theme.secondaryColorHex, border: '1px solid var(--border)' }} title="Secondary Color" />
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: theme.statusBarColorHex, border: '1px solid var(--border)' }} title="Status Bar Color" />
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: theme.splashBgColorHex, border: '1px solid var(--border)' }} title="Splash BG Color" />
                </div>

                {/* Schedule Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-3)' }}>
                  <Calendar size={13} />
                  {theme.isRecurring ? (
                    <span>Recurring: {theme.startMonth}/{theme.startDay} - {theme.endMonth}/{theme.endDay}</span>
                  ) : theme.startDate ? (
                    <span>Dates: {new Date(theme.startDate).toLocaleDateString()} - {new Date(theme.endDate!).toLocaleDateString()}</span>
                  ) : (
                    <span>Manual trigger only</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: 'auto' }}>
                {!isCurrentlyActive && (
                  <button className="btn btn-ghost btn-sm" onClick={() => handleActivate(theme.id)} title="Activate Globally">
                    <CheckCircle size={14} className="text-success" /> Activate
                  </button>
                )}
                
                <button className={`btn btn-sm ${isPreviewing ? 'btn-primary' : 'btn-ghost'}`} onClick={() => togglePreview(theme)} title="Preview Locally">
                  <Eye size={14} /> {isPreviewing ? 'Stop Preview' : 'Preview'}
                </button>
                
                <button className="btn btn-ghost btn-sm" onClick={() => openModal(theme)} title="Edit Theme Settings">
                  <Edit3 size={14} />
                </button>

                {!theme.isSystemDefault && (
                  <button className="btn btn-ghost btn-sm text-red" onClick={() => handleDelete(theme.id)} title="Delete Theme" style={{ marginLeft: 'auto' }}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Creation/Edit Modal */}
      {isModalOpen && editingTheme && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <form className="modal-content fade-in" onSubmit={handleSaveTheme} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div className="card-head" style={{ padding: '20px 24px', margin: 0, borderBottom: '1px solid var(--border)' }}>
              <span className="card-title" style={{ lineHeight: '1.4' }}>
                {themes.some(t => t.id === editingTheme.id) ? 'Edit Festival Theme' : 'Create Festival Theme'}
              </span>
              <button type="button" className="btn btn-ghost btn-xs" onClick={() => setIsModalOpen(false)} style={{ padding: '4px', borderRadius: '50%' }}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
              <div className="grid-cols-2" style={{ gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Theme ID * (e.g. 'pongal')</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. pongal"
                    value={editingTheme.id || ''}
                    disabled={themes.some(t => t.id === editingTheme.id)}
                    onChange={(e) => setEditingTheme({ ...editingTheme, id: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Campaign/Theme Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Pongal Celebration"
                    value={editingTheme.name || ''}
                    onChange={(e) => setEditingTheme({ ...editingTheme, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Campaign Description</label>
                <textarea
                  className="form-control"
                  style={{ height: '60px', resize: 'none' }}
                  placeholder="Describe this festival campaign visual styling details..."
                  value={editingTheme.description || ''}
                  onChange={(e) => setEditingTheme({ ...editingTheme, description: e.target.value })}
                />
              </div>

              {/* Colors Setup */}
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '16px', borderRadius: '12px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '700' }}>Color Configuration (Hex codes)</h4>
                <div className="grid-cols-4" style={{ gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '11px' }}>Primary Theme</label>
                    <input
                      type="color"
                      className="form-control"
                      style={{ padding: '2px', height: '36px', cursor: 'pointer' }}
                      value={editingTheme.primaryColorHex || '#000000'}
                      onChange={(e) => setEditingTheme({ ...editingTheme, primaryColorHex: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '11px' }}>Secondary (Accent)</label>
                    <input
                      type="color"
                      className="form-control"
                      style={{ padding: '2px', height: '36px', cursor: 'pointer' }}
                      value={editingTheme.secondaryColorHex || '#000000'}
                      onChange={(e) => setEditingTheme({ ...editingTheme, secondaryColorHex: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '11px' }}>StatusBar</label>
                    <input
                      type="color"
                      className="form-control"
                      style={{ padding: '2px', height: '36px', cursor: 'pointer' }}
                      value={editingTheme.statusBarColorHex || '#000000'}
                      onChange={(e) => setEditingTheme({ ...editingTheme, statusBarColorHex: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '11px' }}>Splash BG</label>
                    <input
                      type="color"
                      className="form-control"
                      style={{ padding: '2px', height: '36px', cursor: 'pointer' }}
                      value={editingTheme.splashBgColorHex || '#000000'}
                      onChange={(e) => setEditingTheme({ ...editingTheme, splashBgColorHex: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Scheduling and recurrence */}
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '16px', borderRadius: '12px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '700' }}>Trigger Scheduling</h4>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                    <input
                      type="checkbox"
                      checked={editingTheme.isRecurring || false}
                      onChange={(e) => setEditingTheme({ ...editingTheme, isRecurring: e.target.checked })}
                    />
                    Recurring Annual Campaign
                  </label>
                </div>

                {editingTheme.isRecurring ? (
                  <div className="grid-cols-4" style={{ gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '11px' }}>Start Month</label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        className="form-control"
                        value={editingTheme.startMonth || 1}
                        onChange={(e) => setEditingTheme({ ...editingTheme, startMonth: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '11px' }}>Start Day</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        className="form-control"
                        value={editingTheme.startDay || 1}
                        onChange={(e) => setEditingTheme({ ...editingTheme, startDay: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '11px' }}>End Month</label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        className="form-control"
                        value={editingTheme.endMonth || 1}
                        onChange={(e) => setEditingTheme({ ...editingTheme, endMonth: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '11px' }}>End Day</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        className="form-control"
                        value={editingTheme.endDay || 1}
                        onChange={(e) => setEditingTheme({ ...editingTheme, endDay: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid-cols-2" style={{ gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Custom Absolute Start Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={editingTheme.startDate ? editingTheme.startDate.split('T')[0] : ''}
                        onChange={(e) => setEditingTheme({ ...editingTheme, startDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Custom Absolute End Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={editingTheme.endDate ? editingTheme.endDate.split('T')[0] : ''}
                        onChange={(e) => setEditingTheme({ ...editingTheme, endDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* CDN Asset URLs */}
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '16px', borderRadius: '12px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '700' }}>CDN Illustrations / Asset URLs</h4>
                <div className="grid-cols-2" style={{ gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '11px' }}>Splash Illustration URL</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="https://cdn.domain.com/splash.png"
                      value={editingTheme.splashIllustrationUrl || ''}
                      onChange={(e) => setEditingTheme({ ...editingTheme, splashIllustrationUrl: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '11px' }}>Login Illustration URL</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="https://cdn.domain.com/login.png"
                      value={editingTheme.loginIllustrationUrl || ''}
                      onChange={(e) => setEditingTheme({ ...editingTheme, loginIllustrationUrl: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '11px' }}>Home Header Illustration</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="https://cdn.domain.com/header.png"
                      value={editingTheme.homeIllustrationUrl || ''}
                      onChange={(e) => setEditingTheme({ ...editingTheme, homeIllustrationUrl: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '11px' }}>Welcome Banner Image URL</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="https://cdn.domain.com/welcome.png"
                      value={editingTheme.welcomeBannerUrl || ''}
                      onChange={(e) => setEditingTheme({ ...editingTheme, welcomeBannerUrl: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
