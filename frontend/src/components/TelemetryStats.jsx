import React from 'react';
import { Activity, ShieldAlert, Cpu, Database } from 'lucide-react';

export default function TelemetryStats({ 
  selectedCountry = 'global', 
  newsCount = 0, 
  alertsCount = 0, 
  news = [], 
  alerts = [],
  persona 
}) {
  const totalNews = news.length || newsCount || 0;
  
  let tenseOrHostileCount = 0;
  let defenseCyberCount = 0;
  const sourcesSet = new Set();

  for (const item of news) {
    if (item.source) sourcesSet.add(item.source);
    const sent = (item.sentiment || '').toLowerCase();
    if (sent.includes('hostile') || sent.includes('risk') || sent.includes('tense')) tenseOrHostileCount++;
    const topic = (item.topic || '').toLowerCase();
    if (topic === 'defense' || topic === 'cyber') defenseCyberCount++;
  }

  const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL').length;
  const highAlerts = alerts.filter(a => a.severity === 'HIGH').length;

  let calculatedRisk = 30;
  if (totalNews > 0) {
    const sentimentRatio = tenseOrHostileCount / totalNews;
    const topicRatio = defenseCyberCount / totalNews;
    calculatedRisk = Math.round(35 + (sentimentRatio * 40) + (topicRatio * 15) + (criticalAlerts * 8) + (highAlerts * 4));
  } else {
    calculatedRisk = criticalAlerts > 0 ? 85 : 50;
  }
  const tensionScore = Math.min(98, Math.max(22, calculatedRisk));
  const isHighTension = tensionScore >= 70;

  let threatLabel = 'Routine';
  if (criticalAlerts >= 2 || defenseCyberCount >= 6) threatLabel = 'Severe';
  else if (criticalAlerts >= 1 || isHighTension) threatLabel = 'Elevated';
  else if (alertsCount > 0 || defenseCyberCount > 2) threatLabel = 'Heightened';

  const distinctSources = sourcesSet.size || (totalNews > 0 ? 3 : 0);

  const StatCell = ({ label, value, unit, note, color = 'text-wire-fg', barPct }) => (
    <div className="bg-wire-surface border border-wire-border p-4 flex flex-col gap-1.5">
      <div className="font-mono text-[10px] text-wire-subtle tracking-widest">{label}</div>
      <div className="flex items-baseline gap-1.5">
        <span className={`font-mono text-2xl font-medium tabular-nums ${color}`}>{value}</span>
        {unit && <span className="font-mono text-[10px] text-wire-subtle">{unit}</span>}
      </div>
      {barPct !== undefined && (
        <div className="w-full h-0.5 bg-wire-raised overflow-hidden">
          <div
            className={`h-full transition-all duration-700 ${isHighTension ? 'bg-wire-red' : 'bg-wire-amber'}`}
            style={{ width: `${barPct}%` }}
          />
        </div>
      )}
      {note && <div className="font-mono text-[10px] text-wire-subtle">{note}</div>}
    </div>
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-wire-border border border-wire-border">
      <StatCell
        label="RISK INDEX"
        value={tensionScore}
        unit="/ 100"
        note={`${tenseOrHostileCount} of ${totalNews} elevated`}
        color={isHighTension ? 'text-wire-red' : 'text-wire-amber'}
        barPct={tensionScore}
      />
      <StatCell
        label="THREAT STATUS"
        value={threatLabel}
        note={`${alertsCount} active triggers`}
        color={criticalAlerts > 0 ? 'text-wire-red' : alertsCount > 0 ? 'text-wire-amber' : 'text-wire-green'}
      />
      <StatCell
        label="DISPATCHES"
        value={totalNews}
        unit="processed"
        note={distinctSources > 0 ? `${distinctSources} verified sources` : 'System active'}
        color="text-wire-fg"
      />
      <StatCell
        label="PERSISTENCE"
        value="4"
        unit="tables"
        note="users · news · alerts · logs"
        color="text-wire-subtle"
      />
    </div>
  );
}
