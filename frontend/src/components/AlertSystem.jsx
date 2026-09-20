import React from 'react';
import { AlertTriangle, Flame, ShieldAlert, Radio, ExternalLink } from 'lucide-react';

export default function AlertSystem({ alerts = [], selectedCountry, onSelectCountry }) {
  
  const getSeverityConfig = (sev) => {
    switch (sev?.toUpperCase()) {
      case 'CRITICAL':
        return {
          bar: 'bg-wire-red',
          badge: 'text-wire-red border-wire-red/50',
          icon: <Flame className="w-3.5 h-3.5 text-wire-red shrink-0" />,
          rowBg: 'bg-wire-red/5 border-wire-red/20',
        };
      case 'HIGH':
        return {
          bar: 'bg-wire-amber',
          badge: 'text-wire-amber border-wire-amber/50',
          icon: <ShieldAlert className="w-3.5 h-3.5 text-wire-amber shrink-0" />,
          rowBg: 'bg-wire-amber/5 border-wire-amber/20',
        };
      case 'MEDIUM':
        return {
          bar: 'bg-wire-blue',
          badge: 'text-wire-blue border-wire-blue/50',
          icon: <Radio className="w-3.5 h-3.5 text-wire-blue shrink-0" />,
          rowBg: 'bg-wire-surface border-wire-border',
        };
      default:
        return {
          bar: 'bg-wire-muted',
          badge: 'text-wire-subtle border-wire-border',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-wire-subtle shrink-0" />,
          rowBg: 'bg-wire-surface border-wire-border',
        };
    }
  };

  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length;

  return (
    <div className="bg-wire-surface border border-wire-border flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-wire-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h2 className="font-serif text-wire-fg text-sm font-semibold">Alerts</h2>
          {criticalCount > 0 && (
            <span className="font-mono text-[10px] text-wire-red border border-wire-red/50 px-1.5 py-0.5">
              {criticalCount} CRITICAL
            </span>
          )}
        </div>
        <span className="font-mono text-[10px] text-wire-subtle tabular-nums">
          {alerts.length} active
        </span>
      </div>

      {/* Alert rows */}
      <div className="flex-1 overflow-y-auto divide-y divide-wire-border/50 max-h-[340px]">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Radio className="w-5 h-5 text-wire-muted mb-2" />
            <p className="font-mono text-[11px] text-wire-subtle">
              No alerts for {selectedCountry?.toUpperCase() || 'GLOBAL'}
            </p>
          </div>
        ) : (
          alerts.map((alert, index) => {
            const cfg = getSeverityConfig(alert.severity);
            return (
              <div
                key={alert.id || `alert-${index}`}
                className={`px-4 py-3 border-l-2 ${cfg.bar} border-l-[2px] transition-colors hover:bg-wire-raised`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  {cfg.icon}
                  <span className={`font-mono text-[10px] border px-1.5 py-0.5 ${cfg.badge}`}>
                    {alert.severity}
                  </span>
                  <button
                    onClick={() => onSelectCountry(alert.country)}
                    className="font-mono text-[10px] text-wire-amber hover:underline capitalize ml-auto"
                  >
                    {alert.country || 'Global'}
                  </button>
                  {alert.created_at && (
                    <span className="font-mono text-[10px] text-wire-subtle tabular-nums">
                      {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>

                <p className="font-serif text-xs text-wire-fg leading-snug">
                  {alert.message}
                </p>

                {alert.source_url && (
                  <a
                    href={alert.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-1.5 font-mono text-[10px] text-wire-subtle hover:text-wire-amber transition-colors"
                  >
                    Source <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-wire-border">
        <span className="font-mono text-[10px] text-wire-subtle">Keyword scanner active</span>
      </div>
    </div>
  );
}
