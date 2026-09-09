import React from 'react';
import { X, UserCheck, LineChart, Coffee, Accessibility, Check } from 'lucide-react';
import { logTelemetryAction } from '../services/supabaseClient';

const PERSONAS = [
  {
    id: 'Analyst',
    title: 'Intelligence Analyst',
    icon: <LineChart className="w-5 h-5 text-cyber-cyan" />,
    desc: 'Dense telemetry, raw sentiment telemetry, source verification IDs, metadata tags, and active threat matrices.',
    tag: 'MAX DATA DENSITY'
  },
  {
    id: 'Casual user',
    title: 'Casual Observer',
    icon: <Coffee className="w-5 h-5 text-cyber-amber" />,
    desc: 'Streamlined headline digests, global overview, easy reading without deep telemetry jargon.',
    tag: 'CLEAN & CONCISE'
  },
  {
    id: 'Accessibility mode',
    title: 'Accessibility Mode',
    icon: <Accessibility className="w-5 h-5 text-cyber-emerald" />,
    desc: 'Extra-high contrast, large touch targets, automatic speech synthesis narration, and cognitive pictograms.',
    tag: 'INCLUSIVE & AUDIO'
  }
];

export default function PersonaSelector({ 
  isOpen, 
  onClose, 
  currentPersona, 
  onSelectPersona 
}) {
  if (!isOpen) return null;

  const handleSelect = (pId) => {
    onSelectPersona(pId);
    logTelemetryAction(`User switched persona to: ${pId}`, pId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl cyber-panel border border-cyber-cyan/40 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-cyber-border">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-cyber-cyan" />
            <h3 className="text-base font-mono font-bold text-white uppercase tracking-wider">
              OPERATIONAL PERSONA MATRIX
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-cyber-850"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-300 mt-3 font-sans">
          Select your operational mode. Telemetry views, news formatting, and accessibility parameters adapt automatically and sync with Supabase.
        </p>

        {/* Persona Options */}
        <div className="mt-4 space-y-3">
          {PERSONAS.map((p) => {
            const isSelected = currentPersona === p.id;
            return (
              <div
                key={p.id}
                onClick={() => handleSelect(p.id)}
                className={`cursor-pointer p-4 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                  isSelected
                    ? 'bg-cyber-900 border-cyber-cyan shadow-glow-cyan'
                    : 'bg-cyber-950/60 border-cyber-border hover:border-slate-500 hover:bg-cyber-900/50'
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  <div className="p-2 rounded-lg bg-cyber-850 border border-cyber-border mt-0.5">
                    {p.icon}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-white">{p.title}</h4>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyber-800 text-slate-300 border border-cyber-border">
                        {p.tag}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {p.desc}
                    </p>
                  </div>
                </div>

                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-cyber-cyan text-cyber-950 flex items-center justify-center shrink-0 mt-1">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-5 pt-3 border-t border-cyber-border text-center text-[11px] font-mono text-slate-500">
          State synced to Supabase `users` table: id, name, persona
        </div>

      </div>
    </div>
  );
}
