import React, { useEffect, useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import {
  Search,
  Bell,
  Check,
  X,
  FileText,
  Clock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface KycUser {
  id: string;
  fullName: string;
  phoneNumber: string;
  kycLevel: string;
  createdAt: string;
}

interface KycDetails {
  documentType: string;
  documentNumber: string;
  status: string;
  documents: Array<{
    documentType: string;
    documentNumber: string;
    documentUrl: string;
    status?: string;
    submittedAt?: string;
    rejectedReason?: string;
  }>;
}

export const KycVerification: React.FC = () => {
  const { apiBase, globalReloadToken, showToast } = useAdmin();
  const [users, setUsers] = useState<KycUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<KycUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  // Detail view state
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState('');
  const [details, setDetails] = useState<KycDetails | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [activeDocTab, setActiveDocTab] = useState<'pending' | 'rejected' | 'approved'>('pending');

  const loadKycList = async () => {
    try {
      const res = await fetch(`${apiBase}/api/Kyc/all`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
        setFilteredUsers(data);
      }
    } catch (e) {
      console.error('Failed to load KYC lists', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadKycList();
  }, [globalReloadToken]);

  useEffect(() => {
    const q = searchQuery.toLowerCase();
    const filtered = users.filter((u) => {
      const matchQuery =
        (u.fullName || '').toLowerCase().includes(q) ||
        (u.phoneNumber || '').includes(q);

      const matchStatus =
        statusFilter === 'All' ||
        u.kycLevel === statusFilter;

      return matchQuery && matchStatus;
    });
    setFilteredUsers(filtered);
  }, [searchQuery, statusFilter, users]);

  const viewKycDetails = async (uid: string, name: string) => {
    setSelectedUid(uid);
    setSelectedName(name);
    setIsDetailLoading(true);
    setDetails(null);
    setReviewNotes('');
    setActiveDocTab('pending');

    try {
      const res = await fetch(`${apiBase}/api/Kyc/status/${uid}`);
      if (res.ok) {
        const d = await res.json();
        const rawDocs = d.documents || d.Documents || [];
        const docUrl = d.documentUrl || d.DocumentUrl || '';
        const docType = d.documentType || d.DocumentType || '';
        const docNum = d.documentNumber || d.DocumentNumber || '';
        const statusVal = d.status || d.Status || '';

        const docs = rawDocs && rawDocs.length
          ? rawDocs
          : docUrl
          ? [{ documentType: docType, documentNumber: docNum, documentUrl: docUrl, status: statusVal }]
          : [];
        
        const selUser = users.find((u) => u.id === uid);
        const isUserPending = selUser?.kycLevel === 'PENDING';
        
        const mappedDocs = docs.map((doc: any) => {
          const docStatus = (doc.status || doc.Status || '').toUpperCase();
          const docTypeStr = doc.documentType || doc.DocumentType || '';
          const docNumStr = doc.documentNumber || doc.DocumentNumber || '';
          const docUrlStr = doc.documentUrl || doc.DocumentUrl || '';
          const submittedAtVal = doc.submittedAt || doc.SubmittedAt || doc.uploadedAt || doc.UploadedAt || '';

          let finalStatus = docStatus;
          if (isUserPending && (docStatus === 'VERIFIED' || docStatus === 'APPROVED')) {
            finalStatus = 'PENDING';
          }

          return {
            documentType: docTypeStr,
            documentNumber: docNumStr,
            documentUrl: docUrlStr,
            status: finalStatus,
            submittedAt: submittedAtVal
          };
        });
        
        const displayStatus = isUserPending ? 'PENDING' : (statusVal || '—');

        setDetails({
          documentType: docType || '—',
          documentNumber: docNum || '—',
          status: displayStatus,
          documents: mappedDocs
        });

        // Dynamically select the tab to show based on which documents are present
        const hasPending = mappedDocs.some((doc: any) => {
          const s = (doc.status || '').toUpperCase();
          return s === 'PENDING' || !s || s === '—' || s === 'UNDER_REVIEW';
        });
        const hasApproved = mappedDocs.some((doc: any) => {
          const s = (doc.status || '').toUpperCase();
          return s === 'APPROVED' || s === 'VERIFIED';
        });
        const hasRejected = mappedDocs.some((doc: any) => (doc.status || '').toUpperCase() === 'REJECTED');

        if (hasPending) {
          setActiveDocTab('pending');
        } else if (hasApproved) {
          setActiveDocTab('approved');
        } else if (hasRejected) {
          setActiveDocTab('rejected');
        } else {
          setActiveDocTab('pending');
        }
      }
    } catch (e) {
      showToast('Failed to retrieve document details', 'error');
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleSendNudge = async (uid: string, name: string, isFromDetail = false) => {
    const message = isFromDetail && reviewNotes.trim()
      ? reviewNotes.trim()
      : 'Please complete your KYC to unlock all features in Aishwaryam.';

    try {
      const res = await fetch(`${apiBase}/api/Notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: uid,
          title: 'KYC Verification Update',
          message: message,
          type: 'KYC'
        })
      });

      if (res.ok) {
        showToast(`Notification nudge sent to ${name}`, 'success');
        if (isFromDetail) setReviewNotes('');
      } else {
        showToast('Failed to send notification nudge', 'error');
      }

      // Log audits
      await fetch(`${apiBase}/api/Audit/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: uid,
          action: 'KYC_NUDGE_PUSH',
          details: `Admin sent KYC push notification to ${name}. Message: ${message}`,
          status: 'SUCCESS'
        })
      });
    } catch (e) {
      showToast('Network error while nudging user', 'error');
    }
  };

  const handleKycAction = async (isApproved: boolean) => {
    if (!selectedUid || isProcessing) return;

    if (!isApproved && !reviewNotes.trim()) {
      showToast('Please enter a rejection reason in the Review Notes field first.', 'error');
      return;
    }

    const docsCount = details?.documents?.length || 0;
    if (isApproved && docsCount === 0) {
      showToast('Cannot approve KYC: User has not uploaded any documents.', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch(`${apiBase}/api/Admin/kyc-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUid,
          isApproved,
          adminNotes: reviewNotes.trim() || (isApproved ? 'Approved by manual review' : 'Rejected by manual review')
        })
      });

      if (res.ok) {
        showToast(`KYC ${isApproved ? 'Approved' : 'Rejected'} successfully`, 'success');
        setSelectedUid(null);
        
        // Invalidate cache version
        const vRes = await fetch(`${apiBase}/api/Admin/db-version`);
        if (vRes.ok) {
          const vData = await vRes.json();
          sessionStorage.setItem('admin-db-version', String(vData.version));
        }
        loadKycList();
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.message || 'Failed to update KYC status', 'error');
      }
    } catch (e) {
      showToast('Network error while updating KYC', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedUser = users.find((u) => u.id === selectedUid);

  return (
    <>
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800' }}>KYC Approvals</h2>
          <p style={{ color: 'var(--text-2)', fontSize: '13px', marginTop: '4px' }}>
            Review user identity verifications, PAN/Aadhaar document files, and approve/reject profiles.
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
              placeholder="Search by client name or phone number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="form-label" style={{ whiteSpace: 'nowrap' }}>KYC Status:</span>
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Documents</option>
              <option value="PENDING">Pending Approval</option>
              <option value="FULL">Completed (FULL)</option>
              <option value="BASIC">Not Verified (BASIC)</option>
              <option value="NONE">Not Started</option>
            </select>
          </div>
        </div>
      </div>

      {/* KYC Table Grid */}
      <div>
        <div className="card">
          <div className="card-head">
            <span className="card-title">KYC Submissions List</span>
            <span className="badge badge-amber">{filteredUsers.length} shown</span>
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-2)', padding: '20px' }}>Loading KYC records...</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>User Name</th>
                    <th>Phone</th>
                    <th>KYC Level</th>
                    <th>Registered</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-3)' }}>
                        No KYC records match the current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id}>
                        <td><div style={{ fontWeight: '600' }}>{u.fullName || 'Unknown'}</div></td>
                        <td>{u.phoneNumber}</td>
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
                            {u.kycLevel}
                          </span>
                        </td>
                        <td className="text-xs" style={{ color: 'var(--text-3)' }}>
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-ghost btn-xs" onClick={() => viewKycDetails(u.id, u.fullName)}>
                              Review
                            </button>
                            {(u.kycLevel === 'BASIC' || u.kycLevel === 'NONE') && (
                              <button
                                className="btn btn-outline btn-xs"
                                onClick={() => handleSendNudge(u.id, u.fullName)}
                                title="Nudge to complete KYC"
                              >
                                <Bell size={12} />
                              </button>
                            )}
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

      {/* Selected KYC Detail Popup Modal */}
      {selectedUid && (
        <div className="modal-backdrop" onClick={() => setSelectedUid(null)}>
          <div className="modal-content fade-in" style={{ maxWidth: '640px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <div className="card-head" style={{ borderBottom: '1px solid var(--border)', padding: '20px 24px', margin: 0 }}>
              <span className="card-title" style={{ fontSize: '18px' }}>Review KYC: {selectedName}</span>
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => setSelectedUid(null)}
                style={{ padding: '4px', borderRadius: '50%' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {isDetailLoading ? (
                <div style={{ color: 'var(--text-2)', textAlign: 'center', padding: '30px' }}>Loading attachments...</div>
              ) : details ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="form-group">
                    <label className="form-label">Document Details</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
                      <div><strong>Type:</strong> {details.documentType}</div>
                      <div><strong>Number:</strong> {details.documentNumber}</div>
                      <div><strong>Status:</strong> {details.status === 'PENDING' || details.status === 'UNDER_REVIEW' ? 'Waiting for Approval' : details.status}</div>
                    </div>
                  </div>

                  {(() => {
                    const documents = details?.documents || [];
                    const pendingDocs = documents.filter((d: any) => d.status === 'PENDING' || !d.status || d.status === '—' || d.status === 'UNDER_REVIEW');
                    const rejectedDocs = documents.filter((d: any) => d.status === 'REJECTED');
                    const approvedDocs = documents.filter((d: any) => d.status === 'APPROVED' || d.status === 'VERIFIED');

                    const displayDocs = activeDocTab === 'pending'
                      ? pendingDocs
                      : activeDocTab === 'rejected'
                      ? rejectedDocs
                      : approvedDocs;

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <label className="form-label">Uploaded Document Files</label>
                        {/* Tabs Navigation */}
                        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: '12px', paddingBottom: '4px', marginBottom: '8px' }}>
                          <button
                            type="button"
                            style={{
                              padding: '6px 12px',
                              border: 'none',
                              background: 'transparent',
                              color: activeDocTab === 'pending' ? 'var(--blue)' : 'var(--text-3)',
                              borderBottom: activeDocTab === 'pending' ? '2px solid var(--blue)' : 'none',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              fontSize: '12.5px'
                            }}
                            onClick={() => setActiveDocTab('pending')}
                          >
                            Pending ({pendingDocs.length})
                          </button>
                          <button
                            type="button"
                            style={{
                              padding: '6px 12px',
                              border: 'none',
                              background: 'transparent',
                              color: activeDocTab === 'rejected' ? 'var(--red)' : 'var(--text-3)',
                              borderBottom: activeDocTab === 'rejected' ? '2px solid var(--red)' : 'none',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              fontSize: '12.5px'
                            }}
                            onClick={() => setActiveDocTab('rejected')}
                          >
                            Rejected ({rejectedDocs.length})
                          </button>
                          <button
                            type="button"
                            style={{
                              padding: '6px 12px',
                              border: 'none',
                              background: 'transparent',
                              color: activeDocTab === 'approved' ? 'var(--green)' : 'var(--text-3)',
                              borderBottom: activeDocTab === 'approved' ? '2px solid var(--green)' : 'none',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              fontSize: '12.5px'
                            }}
                            onClick={() => setActiveDocTab('approved')}
                          >
                            Approved ({approvedDocs.length})
                          </button>
                        </div>

                        {displayDocs.length === 0 ? (
                          <div style={{ padding: '16px', background: 'var(--surface2)', border: '1px dashed var(--border)', textAlign: 'center', borderRadius: '8px', color: 'var(--text-3)', fontSize: '12.5px' }}>
                            No files found in this section.
                          </div>
                        ) : (
                          displayDocs.map((doc, idx) => {
                            const isImg =
                              doc.documentUrl.toLowerCase().includes('.jpg') ||
                              doc.documentUrl.toLowerCase().includes('.jpeg') ||
                              doc.documentUrl.toLowerCase().includes('.png') ||
                              doc.documentUrl.toLowerCase().includes('.webp') ||
                              doc.documentUrl.startsWith('data:image');

                            // Type label format helper
                            const docType = doc.documentType?.toUpperCase();
                            const typeLabel = docType === 'PAN' 
                              ? 'PAN Card' 
                              : docType === 'AADHAAR_FRONT' 
                                ? 'Aadhaar (Front)' 
                                : docType === 'AADHAAR_BACK' 
                                  ? 'Aadhaar (Back)' 
                                  : doc.documentType || 'Identity File';

                            return (
                              <div
                                key={idx}
                                style={{
                                  padding: '12px',
                                  background: 'var(--surface2)',
                                  borderRadius: '8px',
                                  border: '1px solid var(--border)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '8px'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontWeight: '700', fontSize: '12px', color: activeDocTab === 'rejected' ? 'var(--red)' : activeDocTab === 'approved' ? 'var(--green)' : 'var(--blue)' }}>
                                    {typeLabel}
                                  </span>
                                  <a
                                    href={doc.documentUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-2)' }}
                                  >
                                    Open <ExternalLink size={10} />
                                  </a>
                                </div>

                                {/* Timestamps */}
                                {(doc as any).submittedAt && (
                                  <div style={{ fontSize: '10.5px', color: 'var(--text-3)' }}>
                                    Uploaded At: {new Date((doc as any).submittedAt).toLocaleString()}
                                  </div>
                                )}

                                {isImg ? (
                                  <img
                                    src={doc.documentUrl}
                                    alt="Document Preview"
                                    style={{
                                      width: '100%',
                                      maxHeight: '180px',
                                      background: '#000',
                                      objectFit: 'contain',
                                      borderRadius: '4px'
                                    }}
                                  />
                                ) : (
                                  <div style={{ fontSize: '11.5px', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <FileText size={14} /> PDF File attached
                                  </div>
                                )}

                                {/* Rejection Details */}
                                {doc.status === 'REJECTED' && (doc as any).rejectedReason && (
                                  <div style={{ fontSize: '11.5px', color: 'var(--red)', borderTop: '1px dashed rgba(239,68,68,0.15)', paddingTop: '6px', marginTop: '4px' }}>
                                    <strong>Rejection Reason:</strong> {(doc as any).rejectedReason}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    );
                  })()}

                  {activeDocTab === 'pending' && selectedUser?.kycLevel !== 'FULL' && selectedUser?.kycLevel !== 'VERIFIED' && (
                    <>
                      {/* Review Notes Area */}
                      <div className="form-group">
                        <label className="form-label">Review Notes / Rejection Reason</label>
                        <textarea
                          className="form-control"
                          placeholder="Type details if documents are blurry or wrong to notify the user..."
                          rows={3}
                          style={{ resize: 'vertical' }}
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                        />
                      </div>

                      {/* Actions Panel */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="btn btn-success"
                            style={{ flex: 1 }}
                            onClick={() => handleKycAction(true)}
                            disabled={!details.documents.length || isProcessing}
                          >
                            <Check size={14} /> Approve
                          </button>
                          <button
                            className="btn btn-danger"
                            style={{ flex: 1 }}
                            onClick={() => handleKycAction(false)}
                            disabled={isProcessing}
                          >
                            <X size={14} /> Reject
                          </button>
                        </div>
                        <button
                          className="btn btn-primary"
                          style={{ width: '100%' }}
                          onClick={() => handleSendNudge(selectedUid, selectedName, true)}
                          disabled={isProcessing}
                        >
                          <Bell size={14} /> Send Custom Nudge
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-3)' }}>Failed to load parameters.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* On-screen Loading Overlay Spinner */}
      {isProcessing && (
        <div className="fullscreen-loader">
          <div className="spinner" />
          <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '15px' }}>Processing, please wait...</span>
        </div>
      )}
    </>
  );
};
