import React, { useState, useEffect } from 'react';
import { Database, Save, Trash2, Plus, Search, Edit2, Server, RefreshCw } from 'lucide-react';
import { ApiClient } from '../../utils/ApiClient';
import { SessionManager } from '../../utils/SessionManager';
import { AuditLogger } from '../../utils/auditLogger';

interface TableDef {
  key: string;
  name: string;
  endpoint: string;
  defaultData: any;
  storageKey: string;
}

export const DatabaseViewer: React.FC = () => {
  const tables: TableDef[] = [
    { key: 'profile', name: 'User Profiles', endpoint: 'api/User/profile', defaultData: {}, storageKey: 'CACHE_PROFILE' },
    { key: 'transactions', name: 'Transactions Ledger', endpoint: 'api/Gold/transactions?page=1&pageSize=100', defaultData: [], storageKey: 'CACHE_TRANSACTIONS' },
    { key: 'active_schemes', name: 'Active Subscriptions', endpoint: 'api/Scheme/dashboard', defaultData: [], storageKey: 'CACHE_ACTIVE_SCHEMES' },
    { key: 'available_schemes', name: 'Available Schemes', endpoint: 'api/Scheme/list', defaultData: [], storageKey: 'CACHE_AVAILABLE_SCHEMES' },
    { key: 'banks', name: 'Bank Accounts', endpoint: 'api/Banking/accounts', defaultData: [], storageKey: 'CACHE_BANK_ACCOUNTS' },
    { key: 'notifications', name: 'Notification Logs', endpoint: 'api/Notification', defaultData: [], storageKey: 'CACHE_NOTIFICATIONS' },
    { key: 'live_price', name: 'Gold Rates Table', endpoint: 'api/Gold/price', defaultData: {}, storageKey: 'CACHE_LIVE_PRICE' }
  ];

  const [activeTable, setActiveTable] = useState<TableDef>(tables[0]);
  const [tableData, setTableData] = useState<any[]>([]);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [editingRowData, setEditingRowData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [jsonText, setJsonText] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    loadTableData();
  }, [activeTable]);

  const loadTableData = async () => {
    setIsLoading(true);
    const userId = SessionManager.getUserId();
    
    try {
      let endpoint = activeTable.endpoint;
      
      // Inject user ID parameter dynamically for personalized tables
      if (activeTable.key === 'profile' && userId) {
        endpoint = `${activeTable.endpoint}/${userId}`;
      } else if (activeTable.key === 'active_schemes' && userId) {
        endpoint = `${activeTable.endpoint}/${userId}`;
      } else if (activeTable.key === 'banks' && userId) {
        endpoint = `${activeTable.endpoint}/${userId}`;
      }

      // Fetch real data from Railway production server database APIs
      const response = await ApiClient.get(endpoint);
      let data = response.data;

      // Normalize backend schemas structure to array
      if (activeTable.key === 'active_schemes') {
        data = data?.activeSchemes || [];
      } else if (activeTable.key === 'transactions') {
        data = data?.transactions || [];
      }

      const dataArray = Array.isArray(data) ? data : data ? [data] : [];
      setTableData(dataArray);
      setJsonText(JSON.stringify(dataArray, null, 2));
      setEditingRowIndex(null);
      showStatus(`Fetched real-time data from ${activeTable.name} successfully`, 'success');
    } catch (e: any) {
      console.error(e);
      // Fallback to cache data if offline or unauthorized
      const raw = localStorage.getItem(activeTable.storageKey);
      let data: any = [];
      try {
        data = raw ? JSON.parse(raw) : activeTable.defaultData;
      } catch {
        data = [];
      }
      const dataArray = Array.isArray(data) ? data : data ? [data] : [];
      setTableData(dataArray);
      setJsonText(JSON.stringify(dataArray, null, 2));
      showStatus(`Offline fallback: Loaded cached data for ${activeTable.name}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showStatus = (text: string, type: 'success' | 'error') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleSaveAll = async (updatedData: any[]) => {
    try {
      const isSingleObject = !Array.isArray(activeTable.defaultData);
      const toSave = isSingleObject && updatedData.length === 1 ? updatedData[0] : updatedData;
      
      // Write to localStorage cache
      localStorage.setItem(activeTable.storageKey, JSON.stringify(toSave));
      setTableData(updatedData);
      setJsonText(JSON.stringify(toSave, null, 2));
      showStatus('Database updates applied locally & queued for sync!', 'success');
      
      AuditLogger.log('System', 'SuperAdmin', `Admin modified table cells in: ${activeTable.name}`);
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      showStatus('Failed to update local db state', 'error');
    }
  };

  const handleSaveRawJSON = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const dataArray = Array.isArray(parsed) ? parsed : [parsed];
      localStorage.setItem(activeTable.storageKey, JSON.stringify(parsed));
      setTableData(dataArray);
      showStatus('Raw JSON state updated in cache successfully!', 'success');
      AuditLogger.log('System', 'SuperAdmin', `Admin loaded raw JSON state for: ${activeTable.name}`);
      window.dispatchEvent(new Event('storage'));
    } catch (e: any) {
      showStatus(`JSON Syntax Error: ${e.message}`, 'error');
    }
  };

  // Cell-Level edit handlers
  const handleStartEditRow = (index: number) => {
    setEditingRowIndex(index);
    setEditingRowData({ ...tableData[index] });
  };

  const handleSaveRow = (index: number) => {
    const updated = [...tableData];
    updated[index] = editingRowData;
    handleSaveAll(updated);
    setEditingRowIndex(null);
  };

  const handleDeleteRow = (index: number) => {
    if (window.confirm('Delete row from database?')) {
      const updated = tableData.filter((_, idx) => idx !== index);
      handleSaveAll(updated);
    }
  };

  const handleAddRow = () => {
    const columns = getColumns();
    const newRow: any = {};
    columns.forEach(col => {
      newRow[col] = '';
    });
    if (columns.includes('id')) {
      newRow['id'] = 'NEW-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    }
    const updated = [newRow, ...tableData];
    handleSaveAll(updated);
    handleStartEditRow(0);
  };

  const getColumns = (): string[] => {
    if (tableData.length === 0) {
      if (activeTable.key === 'profile') return ['userId', 'name', 'phone', 'kycStatus'];
      return ['id', 'name', 'description', 'value'];
    }
    const cols = new Set<string>();
    tableData.forEach(row => {
      if (row && typeof row === 'object') {
        Object.keys(row).forEach(key => cols.add(key));
      }
    });
    return Array.from(cols);
  };

  const columnsList = getColumns();
  const filteredData = tableData.filter(row => {
    if (!row) return false;
    return columnsList.some(col => {
      const val = row[col];
      return val !== undefined && String(val).toLowerCase().includes(searchQuery.toLowerCase());
    });
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: 'calc(100vh - 160px)' }}>
      {/* DB Connection Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        backgroundColor: '#F8FAFC',
        borderRadius: '8px',
        border: '1px solid var(--border-light)',
        fontSize: '12.5px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-dark)', fontWeight: 'bold' }}>
          <Server size={16} />
          <span>Database Host: aishwaryam-production.up.railway.app</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success-green)', fontWeight: 'bold' }}>
          <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--success-green)', borderRadius: '50%' }}></span>
          <span>Queries routed through Axios API Client</span>
        </div>
      </div>

      {/* Row counter boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
        {tables.map((t) => {
          const isActive = activeTable.key === t.key;
          return (
            <div 
              key={t.key}
              onClick={() => setActiveTable(t)}
              style={{
                backgroundColor: isActive ? 'var(--brand-glow)' : 'white',
                border: isActive ? '2px solid var(--brand-dark)' : '1px solid var(--border-light)',
                borderRadius: '8px',
                padding: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold' }}>{t.name}</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--brand-deep)', marginTop: '4px' }}>
                  {isActive && isLoading ? 'Fetching...' : `${tableData.length} Rows`}
                </div>
              </div>
              <Database size={16} color={isActive ? 'var(--brand-dark)' : 'var(--text-light)'} />
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={handleAddRow}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: 'none',
              backgroundColor: 'var(--success-green)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            <Plus size={16} />
            <span>Add Row</span>
          </button>
          
          <button
            onClick={loadTableData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid #CBD5E1',
              backgroundColor: 'white',
              color: 'var(--text-secondary)',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            <RefreshCw size={14} className={isLoading ? 'spin-anim' : ''} />
            <span>Refresh Table</span>
          </button>
        </div>

        {statusMsg && (
          <div style={{
            fontSize: '13px',
            fontWeight: 'bold',
            padding: '6px 12px',
            borderRadius: '6px',
            backgroundColor: statusMsg.type === 'success' ? 'var(--success-light)' : 'var(--error-light)',
            color: statusMsg.type === 'success' ? 'var(--success-green)' : 'var(--error-red)'
          }}>
            {statusMsg.text}
          </div>
        )}

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder={`Filter records...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '8px 12px 8px 32px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '13px',
              width: '240px'
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: 0 }}>
        {/* Dynamic Spreadsheet Grid */}
        <div style={{
          flex: 2,
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid var(--border-light)',
          overflowY: 'auto'
        }}>
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-secondary)' }}>
              <RefreshCw size={24} className="spin-anim" style={{ marginBottom: '10px' }} />
              <span>Fetching live production database data...</span>
            </div>
          ) : filteredData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-light)' }}>
              No records found. Click "Add Row" or sync with backend.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0', color: 'var(--text-secondary)' }}>
                  {columnsList.map(col => (
                    <th key={col} style={{ padding: '10px 8px', textTransform: 'capitalize' }}>{col}</th>
                  ))}
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, rowIdx) => (
                  <tr key={rowIdx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    {columnsList.map(col => {
                      const isEditing = editingRowIndex === rowIdx;
                      return (
                        <td key={col} style={{ padding: '8px' }}>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingRowData[col] !== undefined ? String(editingRowData[col]) : ''}
                              onChange={(e) => setEditingRowData({ ...editingRowData, [col]: e.target.value })}
                              style={{
                                width: '100%',
                                padding: '4px 6px',
                                border: '1px solid var(--brand-mid)',
                                borderRadius: '4px',
                                fontSize: '12px'
                              }}
                            />
                          ) : (
                            <span style={{ 
                              fontFamily: typeof row[col] === 'object' || col.toLowerCase().includes('id') ? 'monospace' : 'inherit'
                            }}>
                              {row[col] !== null && row[col] !== undefined 
                                ? (typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col]))
                                : <span style={{ color: 'var(--text-light)' }}>null</span>
                              }
                            </span>
                          )}
                        </td>
                      );
                    })}

                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        {editingRowIndex === rowIdx ? (
                          <button
                            onClick={() => handleSaveRow(rowIdx)}
                            style={{
                              border: 'none',
                              backgroundColor: 'var(--brand-dark)',
                              color: 'white',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '11px'
                            }}
                          >
                            Save
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStartEditRow(rowIdx)}
                            style={{
                              border: 'none',
                              backgroundColor: '#E2E8F0',
                              color: 'var(--text-secondary)',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <Edit2 size={12} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteRow(rowIdx)}
                          style={{
                            border: 'none',
                            backgroundColor: 'rgba(239,68,68,0.1)',
                            color: 'var(--error-red)',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* JSON Editor */}
        <div style={{
          flex: 1,
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid var(--border-light)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--text-secondary)' }}>Bulk Database JSON Editor</span>
            <button
              onClick={handleSaveRawJSON}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                border: 'none',
                backgroundColor: 'var(--brand-mid)',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              <Save size={12} />
              <span>Apply JSON</span>
            </button>
          </div>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            style={{
              flex: 1,
              width: '100%',
              backgroundColor: '#0F172A',
              color: '#38BDF8',
              fontFamily: 'monospace',
              fontSize: '11.5px',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              resize: 'none',
              lineHeight: '1.5'
            }}
          />
        </div>
      </div>
    </div>
  );
};
