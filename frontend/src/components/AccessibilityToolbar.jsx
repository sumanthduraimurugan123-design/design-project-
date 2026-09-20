import React from 'react';
import { Volume2, VolumeX, Eye, Type, Smile, Mic, Radio, Bell, BellOff, Sparkles } from 'lucide-react';

export default function AccessibilityToolbar({
  isHighContrast,
  onToggleHighContrast,
  isLargeText,
  onToggleLargeText,
  isCognitiveSimple,
  onToggleCognitiveSimple,
  onTriggerVoiceSummary,
  isSpeaking,
  onOpenVoiceModal,
  onStartRadio,
  isRadioPlaying,
  isAudioAlertsEnabled,
  onToggleAudioAlerts,
  onToggleEasyMode,
  isEasyMode,
  currentLanguage = 'en'
}) {
  const btnBase = "flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-[10px] border transition-colors rounded-sm";
  const btnOff = "text-wire-subtle border-wire-border hover:text-wire-fg hover:border-wire-muted bg-wire-surface";
  const btnOn = "text-wire-base bg-wire-amber border-wire-amber font-medium";

  return (
    <div className="w-full bg-wire-raised border-b border-wire-border/60 px-4 py-1.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        
        {/* Left: Voice First & Accessibility Tools */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] text-wire-muted mr-1 hidden sm:inline">Voice & A11y:</span>

          {/* Voice Assistant Trigger */}
          <button
            onClick={onOpenVoiceModal}
            className={`${btnBase} bg-wire-amber text-wire-base border-wire-amber font-bold shadow-sm hover:bg-wire-amber/90`}
            title="Speak voice command (Speech-to-text)"
          >
            <Mic className="w-3 h-3 animate-pulse" />
            <span>Voice Access</span>
          </button>

          {/* Radio Auto-Play Mode */}
          <button
            onClick={onStartRadio}
            className={`${btnBase} ${isRadioPlaying ? 'bg-wire-green text-wire-base border-wire-green font-semibold' : btnOff}`}
            title="Auto-play all news like radio"
          >
            <Radio className="w-3 h-3" />
            <span>{isRadioPlaying ? 'Radio Playing' : 'Continuous Radio'}</span>
          </button>

          {/* Live Audio Alerts Toggle */}
          <button
            onClick={onToggleAudioAlerts}
            className={`${btnBase} ${isAudioAlertsEnabled ? 'bg-wire-amber text-wire-base border-wire-amber font-semibold' : btnOff}`}
            title="Enable/disable unauthenticated spoken threat warnings"
          >
            {isAudioAlertsEnabled ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
            <span>{isAudioAlertsEnabled ? 'Audio Alerts: ON' : 'Audio Alerts: OFF'}</span>
          </button>

          {/* Easy Mode Toggle */}
          <button
            onClick={() => onToggleEasyMode(!isEasyMode)}
            className={`${btnBase} ${isEasyMode ? 'bg-yellow-400 text-black border-yellow-400 font-bold' : btnOff}`}
            title="Switch to simplified oversized high-contrast Easy Mode"
          >
            <span>🎛️</span>
            <span>{isEasyMode ? 'Exit Easy' : 'Easy Mode (Simple UI)'}</span>
          </button>

          {/* Voice Summary */}
          <button
            onClick={onTriggerVoiceSummary}
            className={`${btnBase} ${isSpeaking ? btnOn : btnOff}`}
            title="Read sector intelligence briefing aloud"
          >
            {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
            <span>{isSpeaking ? 'Stop briefing' : 'Sector briefing'}</span>
          </button>
        </div>

        {/* Right: Visual toggles */}
        <div className="hidden lg:flex items-center gap-1.5">
          <button
            onClick={onToggleHighContrast}
            className={`${btnBase} ${isHighContrast ? btnOn : btnOff}`}
            title="High contrast mode (WCAG AAA)"
          >
            <Eye className="w-3 h-3" />
            <span>High contrast</span>
          </button>

          <button
            onClick={onToggleLargeText}
            className={`${btnBase} ${isLargeText ? btnOn : btnOff}`}
            title="Large text typography"
          >
            <Type className="w-3 h-3" />
            <span>Large text</span>
          </button>

          <button
            onClick={onToggleCognitiveSimple}
            className={`${btnBase} ${isCognitiveSimple ? btnOn : btnOff}`}
            title="Simplified reading layout"
          >
            <Smile className="w-3 h-3" />
            <span>Simplified</span>
          </button>
        </div>

      </div>
    </div>
  );
}
