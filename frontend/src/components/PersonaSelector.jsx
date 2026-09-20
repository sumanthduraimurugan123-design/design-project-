import React from 'react';
import { X, LineChart, Coffee, Accessibility, Check } from 'lucide-react';
import { logTelemetryAction } from '../services/supabaseClient';

const PERSONAS = [
  {
    id: 'Analyst',
    title: 'Analyst',
    icon: <LineChart className="w-4 h-4 text-wire-amber" />,
    desc: 'Dense data view — sentiment scores, source names, full alert details, and article summaries visible.',
    tag: 'Dense'
  },
  {
    id: 'Casual user',
    title: 'Standard',
    icon: <Coffee className="w-4 h-4 text-wire-subtle" />,
    desc: 'Headlines and alerts only. Scores and metadata hidden for a cleaner read.',
    tag: 'Clean'
  },
  {
    id: 'Accessibility mode',
    title: 'Accessibility',
    icon: <Accessibility className="w-4 h-4 text-wire-green" />,
    desc: 'High contrast, large touch targets, speech synthesis enabled, and simplified reading layout.',
    tag: 'Inclusive'
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
    logTelemetryAction(`Persona changed to: ${pId}`, pId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-wire-surface border border-wire-border shadow-2xl">
        
        {/* Title bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-wire-border">
          <div>
            <h3 className="font-serif text-wire-fg text-sm font-semibold">View profile</h3>
            <p className="font-mono text-[10px] text-wire-subtle mt-0.5">Interface density adapts to your selection</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-wire-subtle hover:text-wire-fg hover:bg-wire-raised transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Options */}
        <div className="divide-y divide-wire-border/50">
          {PERSONAS.map((p) => {
            const isSelected = currentPersona === p.id;
            return (
              <div
                key={p.id}
                onClick={() => handleSelect(p.id)}
                className={`px-5 py-4 cursor-pointer transition-colors flex items-start justify-between gap-3 ${
                  isSelected ? 'bg-wire-raised' : 'hover:bg-wire-raised/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 bg-wire-base border border-wire-border shrink-0">
                    {p.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-serif text-sm text-wire-fg font-semibold">{p.title}</span>
                      <span className="font-mono text-[9px] text-wire-subtle border border-wire-border px-1.5 py-0.5">
                        {p.tag}
                      </span>
                    </div>
                    <p className="font-sans text-xs text-wire-subtle leading-relaxed">{p.desc}</p>
                  </div>
                </div>

                {isSelected && (
                  <div className="w-4 h-4 bg-wire-amber flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-wire-base stroke-[3]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
