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
      <div className="relative w-full max-w-5xl max-h-[85vh] rounded-2xl cyber-panel border border-cyber-cyan/50 p-5 shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-cyber-border">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-cyber-900 border border-cyber-cyan/50 text-cyber-cyan">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-mono font-bold text-white flex items-center gap-2">
                SUPABASE LIVE DATABASE EXPLORER
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                  isConfigured ? 'bg-emerald-950 text-emerald-300 border border-emerald-500' : 'bg-amber-950 text-amber-300 border border-amber-500'
                }`}>
                  {isConfigured ? 'CONNECTED TO SUPABASE' : 'LOCAL BACKEND DB ENGINE'}
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-sans">
                Real-time query of PostgreSQL tables: <code className="text-cyber-cyan">users</code>, <code className="text-cyber-cyan">news</code>, <code className="text-cyber-cyan">alerts</code>, <code className="text-cyber-cyan">logs</code>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchTableRows(activeTable)}
              disabled={loading}
              className="p-2 rounded-lg bg-cyber-900 border border-cyber-border text-slate-300 hover:text-cyber-cyan transition-all"
              title="Refresh Table Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-cyber-900 border border-cyber-border text-slate-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table Selector Tabs */}
        <div className="flex items-center space-x-2 mt-4 pb-2 overflow-x-auto border-b border-cyber-border/60">
          {TABLES.map(tbl => (
            <button
              key={tbl}
              onClick={() => setActiveTable(tbl)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                activeTable === tbl
                  ? 'bg-cyber-cyan text-cyber-950 shadow-glow-cyan'
                  : 'bg-cyber-900 text-slate-300 hover:text-white border border-cyber-border'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>public.{tbl}</span>
            </button>
          ))}
        </div>

        {/* Status Line */}
        {statusMsg && (
          <div className="mt-2 text-[11px] font-mono text-cyber-cyan bg-cyber-900/60 px-3 py-1.5 rounded border border-cyber-border/60">
            ⚡ {statusMsg}
          </div>
        )}

        {/* Data Grid / Records View */}
        <div className="flex-1 overflow-auto mt-3 border border-cyber-border rounded-xl bg-cyber-950/80">
          {loading ? (
            <div className="flex items-center justify-center py-20 space-x-3 text-cyber-cyan font-mono text-xs">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>QUERYING POSTGRESQL TABLE public.{activeTable}...</span>
            </div>
          ) : tableData.length === 0 ? (
            <div className="text-center py-20 text-slate-500 font-mono text-xs">
              No records found in public.{activeTable}. Trigger a refresh or dispatch news to seed rows.
            </div>
          ) : (
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-cyber-900 text-cyber-cyan sticky top-0 border-b border-cyber-border">
                <tr>
                  {Object.keys(tableData[0]).slice(0, 6).map(col => (
                    <th key={col} className="px-3 py-2.5 uppercase font-bold tracking-wider">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-border/40 text-slate-200">
                {tableData.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-cyber-900/60 transition-colors">
                    {Object.entries(row).slice(0, 6).map(([k, val]) => (
                      <td key={k} className="px-3 py-2 max-w-xs truncate" title={typeof val === 'object' ? JSON.stringify(val) : String(val)}>
                        {typeof val === 'object' ? (
                          <span className="text-slate-400 font-mono text-[10px]">{JSON.stringify(val)}</span>
                        ) : k === 'url' ? (
                          <a href={val} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">
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
        <div className="mt-4 pt-3 border-t border-cyber-border flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-slate-400 gap-2">
          <span>SQL Schema file: <code className="text-cyber-cyan">database/schema.sql</code></span>
          <span>Set <code className="text-cyber-emerald">VITE_SUPABASE_URL</code> & <code className="text-cyber-emerald">VITE_SUPABASE_KEY</code> in .env to connect live</span>
        </div>

      </div>
    </div>
  );
}
