import React, { useEffect, useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Search, Info, X, Calendar, DollarSign, Award } from 'lucide-react';

interface Enrollment {
  schemeId: string;
  userId: string;
  planId: string;
  planName: string;
  installmentAmountPaise: number;
  installmentsPaid: number;
  totalInstallments: number;
  nextDueDate: string;
  status: string;
  autoPayEnabled: boolean;
  createdAt: string;
  fullName?: string;
  phoneNumber?: string;
  email?: string;
}

export const SchemeEnrollments: React.FC = () => {
  const { apiBase, globalReloadToken, showToast } = useAdmin();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [filteredEnrollments, setFilteredEnrollments] = useState<Enrollment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  // Detail Modal state
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);

  const loadEnrollments = async () => {
    try {
      const [usersRes, enrollRes] = await Promise.all([
        fetch(`${apiBase}/api/User/all`),
        fetch(`${apiBase}/api/Scheme/enrollments`)
      ]);

      let usersMap: Record<string, any> = {};
      if (usersRes.ok) {
        const users = await usersRes.json();
        users.forEach((u: any) => {
          usersMap[u.id.toLowerCase()] = u;
        });
      }

      if (enrollRes.ok) {
        const enrollData = await enrollRes.json();
        const list = Array.isArray(enrollData) 
          ? enrollData 
          : (enrollData && Array.isArray(enrollData.enrollments) ? enrollData.enrollments : []);
        const enriched = list.map((e: any) => {
          const u = usersMap[(e.userId || '').toLowerCase()];
          return {
            ...e,
            fullName: u ? u.fullName : (e.userId || 'Unknown'),
            phoneNumber: u ? u.phoneNumber : '—',
            email: u ? u.email : '—'
          };
        });
        setEnrollments(enriched);
        setFilteredEnrollments(enriched);
      }
    } catch (e) {
      console.error('Failed to load scheme enrollments', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEnrollments();
  }, [globalReloadToken]);

  useEffect(() => {
    const q = searchQuery.toLowerCase();
    const filtered = enrollments.filter((e) => {
      const matchQuery =
        (e.fullName || '').toLowerCase().includes(q) ||
        (e.phoneNumber || '').includes(q) ||
        (e.planName || '').toLowerCase().includes(q);

      const matchPlan = planFilter === 'All' || e.planName === planFilter;

      return matchQuery && matchPlan;
    });
    setFilteredEnrollments(filtered);
  }, [searchQuery, planFilter, enrollments]);

  const uniquePlans = Array.from(new Set(enrollments.map((e) => e.planName)));

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Plan Enrollments</h2>
          <p style={{ color: 'var(--text-2)', fontSize: '13px', marginTop: '4px' }}>
            Monitor subscriber schedules, payment milestones, maturities, and automated payment setups.
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
              placeholder="Search by subscriber name, phone number, or plan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="form-label" style={{ whiteSpace: 'nowrap' }}>Savings Plan:</span>
            <select
              className="form-control"
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
            >
              <option value="All">All Savings Plans</option>
              {uniquePlans.map((p, idx) => (
                <option key={idx} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid Table */}
      <div className="card">
        {isLoading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-2)', padding: '20px' }}>Loading subscribers schedule...</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Subscriber Name</th>
                  <th>Plan Scheme</th>
                  <th>Paid Installments</th>
                  <th>Progress</th>
                  <th>Next Due</th>
                  <th>AutoPay</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEnrollments.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-3)' }}>
                      No active plan enrollments found.
                    </td>
                  </tr>
                ) : (
                  filteredEnrollments.map((e) => {
                    const progressPercent = Math.min(100, Math.round((e.installmentsPaid / e.totalInstallments) * 100));
                    
                    return (
                      <tr key={e.schemeId}>
                        <td>
                          <div style={{ fontWeight: '600' }}>{e.fullName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{e.phoneNumber}</div>
                        </td>
                        <td>{e.planName}</td>
                        <td>{e.installmentsPaid} / {e.totalInstallments}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '120px' }}>
                            <div style={{ flex: 1, height: '6px', background: 'var(--surface3)', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--green)', borderRadius: '4px' }} />
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: '700' }}>{progressPercent}%</span>
                          </div>
                        </td>
                        <td className="text-xs" style={{ color: 'var(--text-2)' }}>
                          {new Date(e.nextDueDate).toLocaleDateString()}
                        </td>
                        <td>
                          <span className={`badge ${e.autoPayEnabled ? 'badge-green' : 'badge-red'}`}>
                            {e.autoPayEnabled ? 'ENABLED' : 'MANUAL'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${e.status === 'Active' ? 'badge-green' : 'badge-amber'}`}>
                            {e.status}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-ghost btn-xs" onClick={() => setSelectedEnrollment(e)}>
                            <Info size={14} /> Details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Enrollment Details Modal */}
      {selectedEnrollment && (
        <div className="modal-backdrop" onClick={() => setSelectedEnrollment(null)}>
          <div className="modal-content fade-in" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="card-head" style={{ padding: '20px 24px', margin: 0, borderBottom: '1px solid var(--border)' }}>
              <span className="card-title">Enrollment Specifics</span>
              <button className="btn btn-ghost btn-xs" onClick={() => setSelectedEnrollment(null)} style={{ padding: '4px', borderRadius: '50%' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--surface2)', padding: '16px', borderRadius: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '15px', fontWeight: '800' }}>{selectedEnrollment.fullName}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>{selectedEnrollment.phoneNumber} • {selectedEnrollment.email}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border2)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-2)' }}>Scheme Savings Plan</span>
                  <span style={{ fontWeight: '700' }}>{selectedEnrollment.planName}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border2)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-2)' }}>Installment Amount</span>
                  <span style={{ fontWeight: '700', color: 'var(--green)' }}>₹{(selectedEnrollment.installmentAmountPaise / 100).toFixed(2)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border2)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-2)' }}>Milestone Payments</span>
                  <span style={{ fontWeight: '700' }}>
                    {selectedEnrollment.frequency?.toLowerCase() === 'daily' || selectedEnrollment.planName?.toLowerCase().includes('silver') || selectedEnrollment.planName?.toLowerCase().includes('gold')
                      ? 'Daily Weight Accumulation (Flexible)'
                      : `${selectedEnrollment.installmentsPaid} of ${selectedEnrollment.totalInstallments} paid`}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border2)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-2)' }}>Auto-Debit Schedule</span>
                  <span style={{ fontWeight: '700' }}>{selectedEnrollment.autoPayEnabled ? 'Enabled (Razorpay Autopay)' : 'Disabled'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border2)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-2)' }}>Date Enrolled</span>
                  <span style={{ fontWeight: '700' }}>{new Date(selectedEnrollment.createdAt).toLocaleDateString()}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border2)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-2)' }}>Upcoming Due Date</span>
                  <span style={{ fontWeight: '700', color: 'var(--amber)' }}>{new Date(selectedEnrollment.nextDueDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
