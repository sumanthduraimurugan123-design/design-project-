import React from 'react';
import { AlertTriangle, Flame, ShieldAlert, Radio, ExternalLink } from 'lucide-react';

export default function AlertSystem({ alerts = [], selectedCountry, onSelectCountry }) {
  const getSeverityStyle = (sev) => {
    switch (sev?.toUpperCase()) {
      case 'CRITICAL':
        return {
          bg: 'bg-red-950/70 border-red-500/70 text-red-300',
          badge: 'bg-red-600 text-white animate-pulse',
          icon: <Flame className="w-4 h-4 text-red-400 animate-bounce" />
        };
      case 'HIGH':
        return {
          bg: 'bg-amber-950/60 border-amber-500/60 text-amber-300',
          badge: 'bg-amber-500 text-black font-bold',
          icon: <ShieldAlert className="w-4 h-4 text-amber-400" />
        };
      case 'MEDIUM':
        return {
          bg: 'bg-cyan-950/50 border-cyan-500/50 text-cyan-300',
          badge: 'bg-cyan-600 text-white',
          icon: <Radio className="w-4 h-4 text-cyan-400" />
        };
      default:
        return {
          bg: 'bg-slate-900 border-slate-700 text-slate-300',
          badge: 'bg-slate-700 text-slate-200',
          icon: <AlertTriangle className="w-4 h-4 text-slate-400" />
        };
    }
  };

  return (
    <div className="cyber-panel rounded-xl p-4 border border-cyber-border/80 flex flex-col h-full">
      {/* Alert Header */}
      <div className="flex items-center justify-between pb-3 border-b border-cyber-border">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded bg-cyber-crimson/20 border border-cyber-crimson/50 text-cyber-crimson">
            <AlertTriangle className="w-4 h-4 animate-pulse" />
          </div>
          <h2 className="text-sm font-mono font-bold tracking-wide text-white uppercase">
            ACTIVE THREAT MATRIX
          </h2>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-red-900/40 text-red-300 border border-red-500/40 font-bold">
          {alerts.length} ALERTS
        </span>
      </div>

      {/* Alert Cards Container */}
      <div className="flex-1 overflow-y-auto mt-3 pr-1 space-y-2.5 max-h-[320px]">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
            <Radio className="w-8 h-8 text-slate-600 mb-1" />
            <p className="text-xs font-mono">No active critical alerts for {selectedCountry.toUpperCase()}</p>
            <p className="text-[10px] text-slate-500 mt-1">Autonomous sentinel scanning live news streams...</p>
          </div>
        ) : (
          alerts.map((alert, index) => {
            const style = getSeverityStyle(alert.severity);
            return (
              <div
                key={alert.id || `alert-${index}`}
                className={`p-3 rounded-lg border transition-all ${style.bg} hover:border-white/50 flex flex-col gap-1.5`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    {style.icon}
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${style.badge}`}>
                      {alert.severity}
                    </span>
                    <button
                      onClick={() => onSelectCountry(alert.country)}
                      className="text-[11px] font-mono text-cyan-300 hover:underline uppercase"
                      title="Filter dashboard for this country"
                    >
                      [{alert.country || 'GLOBAL'}]
                    </button>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {alert.created_at ? new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}
                  </span>
                </div>

                <p className="text-xs text-white leading-relaxed font-mono">
                  {alert.message}
                </p>

                {alert.source_url && (
                  <div className="pt-1 flex justify-end">
                    <a
                      href={alert.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-mono text-cyber-cyan hover:underline flex items-center gap-1"
                    >
                      View Source Dispatches <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Status */}
      <div className="mt-3 pt-2 border-t border-cyber-border text-[10px] font-mono text-slate-400 flex items-center justify-between">
        <span>STORED IN SUPABASE: public.alerts</span>
        <span className="text-red-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
          SENTINEL ACTIVE
        </span>
      </div>
    </div>
  );
}
