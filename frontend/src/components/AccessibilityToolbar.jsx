import React from 'react';
import { Volume2, VolumeX, Eye, Type, Smile, Sparkles } from 'lucide-react';
import { stopSpeech } from '../services/newsService';

export default function AccessibilityToolbar({
  isHighContrast,
  onToggleHighContrast,
  isLargeText,
  onToggleLargeText,
  isCognitiveSimple,
  onToggleCognitiveSimple,
  onTriggerVoiceSummary,
  isSpeaking
}) {
  return (
    <div className="w-full bg-cyber-900/90 border-b border-cyber-border/80 px-4 py-2 text-xs font-mono">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Accessibility label */}
        <div className="flex items-center space-x-2 text-slate-300">
          <span className="text-sm">♿</span>
          <span className="font-bold text-white tracking-wide">ACCESSIBILITY MATRIX:</span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">Inclusive assistive telemetry controls</span>
        </div>

        {/* Right: Assistive Action Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Voice Summary Button */}
          <button
            onClick={onTriggerVoiceSummary}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded font-semibold transition-all ${
              isSpeaking
                ? 'bg-cyber-crimson text-white animate-pulse shadow-glow-crimson'
                : 'bg-purple-900/50 hover:bg-purple-800/60 text-purple-200 border border-purple-500/40'
            }`}
            title="Read whole intelligence summary aloud"
          >
            {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{isSpeaking ? 'STOP AUDIO' : 'VOICE SUMMARY'}</span>
          </button>

          {/* High Contrast Mode */}
          <button
            onClick={onToggleHighContrast}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded border transition-all ${
              isHighContrast
                ? 'bg-yellow-400 text-black border-yellow-300 font-bold'
                : 'bg-cyber-950 text-slate-300 border-cyber-border hover:border-slate-400'
            }`}
            title="Toggle High Contrast Theme (Yellow & High-Def on Black)"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>HIGH CONTRAST</span>
          </button>

          {/* Large Text Mode */}
          <button
            onClick={onToggleLargeText}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded border transition-all ${
              isLargeText
                ? 'bg-cyber-cyan text-black border-cyan-300 font-bold shadow-glow-cyan'
                : 'bg-cyber-950 text-slate-300 border-cyber-border hover:border-slate-400'
            }`}
            title="Increase font sizing across interface"
          >
            <Type className="w-3.5 h-3.5" />
            <span>LARGE TEXT</span>
          </button>

          {/* Simplified Cognitive / Illiterate UI */}
          <button
            onClick={onToggleCognitiveSimple}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded border transition-all ${
              isCognitiveSimple
                ? 'bg-cyber-emerald text-black border-emerald-300 font-bold shadow-glow-emerald'
                : 'bg-cyber-950 text-slate-300 border-cyber-border hover:border-slate-400'
            }`}
            title="Toggle Simplified Icon UI for intuitive cognitive comprehension"
          >
            <Smile className="w-3.5 h-3.5" />
            <span>SIMPLIFIED UI</span>
          </button>

        </div>
      </div>
    </div>
  );
}
