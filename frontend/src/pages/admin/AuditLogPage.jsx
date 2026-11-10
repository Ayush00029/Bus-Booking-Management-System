import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import { Activity, ShieldCheck, Filter, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [expandedLogId, setExpandedLogId] = useState(null);

  useEffect(() => {
    loadLogs();
  }, [actionFilter]);

  const loadLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (actionFilter) params.action = actionFilter;
      const res = await adminApi.getAuditLogs(params);
      if (res.success && res.data) {
        setLogs(res.data.logs || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve audit trail');
    } finally {
      setLoading(false);
    }
  };

  const actionOptions = [
    'BOOKING_CREATE',
    'BOOKING_CANCEL',
    'BUS_CREATE',
    'BUS_UPDATE',
    'BUS_DELETE',
    'ROUTE_CREATE',
    'ROUTE_UPDATE',
    'TRIP_CREATE',
    'OPERATOR_CREATE',
    'AUTH_LOGIN',
    'AUTH_REGISTER'
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-rose-600" />
            Security & Compliance Audit Trail
          </h1>
          <p className="text-xs text-slate-500">
            Immutable log of state mutations, seat locks, cancellations, and administrative events
          </p>
        </div>

        {/* Action Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">Filter Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold"
          >
            <option value="">All Actions</option>
            {actionOptions.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Performed By</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                    No audit records found matching this action filter.
                  </td>
                </tr>
              ) : (
                logs.map(log => {
                  const isExpanded = expandedLogId === log._id;

                  return (
                    <React.Fragment key={log._id}>
                      <tr className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 text-slate-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.action?.includes('CANCEL')
                              ? 'bg-red-50 text-red-700'
                              : log.action?.includes('CREATE')
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {log.entityType} ({log.entityId?.slice(-6) || 'N/A'})
                        </td>
                        <td className="py-3 px-4 text-slate-800">
                          {log.userId?.name || log.userRole}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {log.ipAddress || '127.0.0.1'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setExpandedLogId(isExpanded ? null : log._id)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans font-semibold rounded text-[11px]"
                          >
                            {isExpanded ? 'Hide' : 'Inspect'}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="p-4 bg-slate-900 text-emerald-400 text-[11px] font-mono overflow-x-auto">
                            <pre>{JSON.stringify(log.details, null, 2)}</pre>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

