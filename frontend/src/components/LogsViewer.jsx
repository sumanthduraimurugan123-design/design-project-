import React, { useState, useEffect } from 'react';
import { X, Database, Table, RefreshCw, Layers, ShieldCheck, Key } from 'lucide-react';
import { supabase, isConfigured } from '../services/supabaseClient';

const TABLES = ['news', 'alerts', 'logs', 'users'];

export default function LogsViewer({ isOpen, onClose }) {
  const [activeTable, setActiveTable] = useState('news');
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const fetchTableRows = async (table) => {
    setLoading(true);
    setStatusMsg('');
    try {
      // Direct Supabase query if credentials configured
      if (isConfigured && supabase) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .order(table === 'logs' ? 'timestamp' : 'created_at', { ascending: false })
          .limit(20);

        if (!error && data) {
          setTableData(data);
          setStatusMsg(`Loaded ${data.length} records directly from Supabase [public.${table}]`);
          setLoading(false);
          return;
        }
      }

      // Fallback to backend API
      let res;
      try {
        res = await fetch(`http://localhost:5000/api/${table}`);
      } catch (e) {
        res = await fetch(`/api/${table}`);
      }
      if (res && res.ok) {
        const result = await res.json();
        const rows = result[table] || result.news || result.alerts || result.logs || result.users || [];
        setTableData(rows);
        setStatusMsg(`Loaded ${rows.length} records from Backend Database (${result.source || 'live database'})`);
      } else {
        setTableData([]);
        setStatusMsg(`Table query returned status: ${res?.status || 'network error'}`);
      }
    } catch (err) {
      setStatusMsg(`Fetch error: ${err.message}`);
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTableRows(activeTable);
    }
  }, [isOpen, activeTable]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-5xl max-h-[85vh] rounded-sm bg-slate-900 border border-slate-700 p-5 shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-sm bg-slate-950 border border-slate-800 text-slate-300">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                Database Explorer
                <span className={`text-[10px] px-2 py-0.5 rounded-sm font-mono ${
                  isConfigured ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' : 'bg-amber-950 text-amber-400 border border-amber-900'
                }`}>
                  {isConfigured ? 'Connected to Supabase' : 'Local Backend DB'}
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-1">
                Querying PostgreSQL tables: <code className="text-slate-300">users</code>, <code className="text-slate-300">news</code>, <code className="text-slate-300">alerts</code>, <code className="text-slate-300">logs</code>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchTableRows(activeTable)}
              disabled={loading}
              className="p-2 rounded-sm bg-slate-800 border border-slate-700 text-slate-300 hover:text-slate-100 transition-all"
              title="Refresh Table Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-sm bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table Selector Tabs */}
        <div className="flex items-center space-x-2 mt-4 pb-2 overflow-x-auto border-b border-slate-800/60">
          {TABLES.map(tbl => (
            <button
              key={tbl}
              onClick={() => setActiveTable(tbl)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-sm text-xs font-mono font-semibold transition-all ${
                activeTable === tbl
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>public.{tbl}</span>
            </button>
          ))}
        </div>

        {/* Status Line */}
        {statusMsg && (
          <div className="mt-2 text-xs font-mono text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-sm border border-slate-800/60">
            {statusMsg}
          </div>
        )}

        {/* Data Grid / Records View */}
        <div className="flex-1 overflow-auto mt-3 border border-slate-800 rounded-sm bg-slate-950">
          {loading ? (
            <div className="flex items-center justify-center py-20 space-x-3 text-slate-400 font-mono text-xs">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Querying public.{activeTable}...</span>
            </div>
          ) : tableData.length === 0 ? (
            <div className="text-center py-20 text-slate-500 font-mono text-xs">
              No records found in public.{activeTable}.
            </div>
          ) : (
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead className="bg-slate-900 text-slate-300 sticky top-0 border-b border-slate-800">
                <tr>
                  {Object.keys(tableData[0]).slice(0, 6).map(col => (
                    <th key={col} className="px-3 py-2.5 uppercase font-semibold">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-slate-300">
                {tableData.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-slate-800/50 transition-colors">
                    {Object.entries(row).slice(0, 6).map(([k, val]) => (
                      <td key={k} className="px-3 py-2 max-w-xs truncate" title={typeof val === 'object' ? JSON.stringify(val) : String(val)}>
                        {typeof val === 'object' ? (
                          <span className="text-slate-500 font-mono text-[10px]">{JSON.stringify(val)}</span>
                        ) : k === 'url' ? (
                          <a href={val} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
                            {String(val)}
                          </a>
                        ) : (
                          String(val)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer info about Supabase setup */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-slate-500 gap-2">
          <span>Schema: <code className="text-slate-400">database/schema.sql</code></span>
          <span>Set <code className="text-slate-400">VITE_SUPABASE_URL</code> & <code className="text-slate-400">VITE_SUPABASE_KEY</code> to connect</span>
        </div>

      </div>
    </div>
  );
}
