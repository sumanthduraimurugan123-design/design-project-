import React, { useState, useEffect } from 'react';
import { RefreshCw, Volume2, UserCheck, Database } from 'lucide-react';
import { isConfigured } from '../services/supabaseClient';

export default function Navbar({ 
  selectedCountry, 
  onRefresh, 
  isRefreshing, 
  persona, 
  onOpenPersonaModal,
  onOpenDbModal,
  onToggleVoiceSummary,
  isSpeaking,
  countdown,
  currentLanguage = 'en',
  onSelectLanguage,
  onOpenVoiceModal,
  onToggleEasyMode,
  isEasyMode = false
}) {
  const [utcTime, setUtcTime] = useState('');
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const parts = now.toUTCString().split(' ');
      setUtcTime(`${parts[1]} ${parts[2]} ${parts[3]}  ${parts[4]} UTC`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const languageLabels = {
    en: 'EN',
    ta: 'தமிழ்',
    hi: 'हिंदी',
    te: 'తెలుగు',
    bn: 'বাংলা',
    mr: 'मराठी'
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-wire-base border-b border-wire-border">
      {/* Amber wire rule */}
      <div className="h-px bg-wire-amber opacity-50 w-full" />

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-2.5 flex items-center justify-between gap-4">

        {/* Left: Publication nameplate */}
        <div className="flex items-center gap-4">
          <div>
            <h1 className="font-serif text-wire-fg font-semibold text-sm tracking-tight leading-none">
              Global Intelligence Wire
            </h1>
            <div className="font-mono text-[10px] text-wire-subtle mt-0.5 tracking-widest">
              UGI&nbsp;&nbsp;VOICE&nbsp;INTEL&nbsp;v2.5
            </div>
          </div>
        </div>

        {/* Center: UTC dateline + sector */}
        <div className="hidden md:flex items-center gap-5 font-mono text-[11px] text-wire-subtle">
          <span className="tabular-nums">{utcTime || 'Syncing clock...'}</span>
          <span className="text-wire-border">|</span>
          <span>
            Sector:&nbsp;
            <span className="text-wire-fg capitalize">{selectedCountry || 'Global'}</span>
          </span>
          <span className="text-wire-border">|</span>
          <span>
            Next sync:&nbsp;
            <span className={`tabular-nums ${countdown <= 5 ? 'text-wire-amber' : 'text-wire-fg'}`}>
              {countdown}s
            </span>
          </span>
        </div>

        {/* Right: Action strip */}
        <div className="flex items-center gap-1.5">

          {/* 🎤 Voice Access Button (High Priority Feature) */}
          <button
            onClick={onOpenVoiceModal}
            className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[11px] bg-wire-amber text-wire-base hover:bg-wire-amber/90 font-bold rounded-sm shadow transition-all active:scale-95"
            title="Voice Access: speak to navigate news"
            aria-label="Open Voice Assistant"
          >
            <span className="animate-pulse">🎤</span>
            <span className="hidden sm:inline">Voice Access</span>
          </button>

          {/* 🌐 Language Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="flex items-center gap-1 px-2.5 py-1.5 font-mono text-[11px] text-wire-fg border border-wire-border hover:border-wire-muted bg-wire-surface rounded-sm transition-colors"
              title="Select language"
              aria-label="Select language"
            >
              <span className="text-xs">🌐</span>
              <span>{languageLabels[currentLanguage] || 'EN'}</span>
            </button>

            {isLangMenuOpen && (
              <div className="absolute right-0 top-full mt-1 bg-wire-surface border border-wire-border shadow-xl z-50 py-1 min-w-[130px] rounded-sm animate-in fade-in duration-100">
                <button
                  onClick={() => { onSelectLanguage('en'); setIsLangMenuOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs font-mono transition-colors ${currentLanguage === 'en' ? 'bg-wire-raised text-wire-amber font-bold' : 'text-wire-fg hover:bg-wire-raised'}`}
                >
                  🇬🇧 English
                </button>
                <button
                  onClick={() => { onSelectLanguage('ta'); setIsLangMenuOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs font-mono transition-colors ${currentLanguage === 'ta' ? 'bg-wire-raised text-wire-amber font-bold' : 'text-wire-fg hover:bg-wire-raised'}`}
                >
                  🇮🇳 தமிழ் (Tamil)
                </button>
                <button
                  onClick={() => { onSelectLanguage('hi'); setIsLangMenuOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs font-mono transition-colors ${currentLanguage === 'hi' ? 'bg-wire-raised text-wire-amber font-bold' : 'text-wire-fg hover:bg-wire-raised'}`}
                >
                  🇮🇳 हिंदी (Hindi)
                </button>
                <button
                  onClick={() => { onSelectLanguage('te'); setIsLangMenuOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs font-mono transition-colors ${currentLanguage === 'te' ? 'bg-wire-raised text-wire-amber font-bold' : 'text-wire-fg hover:bg-wire-raised'}`}
                >
                  🇮🇳 తెలుగు (Telugu)
                </button>
                <button
                  onClick={() => { onSelectLanguage('bn'); setIsLangMenuOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs font-mono transition-colors ${currentLanguage === 'bn' ? 'bg-wire-raised text-wire-amber font-bold' : 'text-wire-fg hover:bg-wire-raised'}`}
                >
                  🇮🇳 বাংলা (Bengali)
                </button>
                <button
                  onClick={() => { onSelectLanguage('mr'); setIsLangMenuOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs font-mono transition-colors ${currentLanguage === 'mr' ? 'bg-wire-raised text-wire-amber font-bold' : 'text-wire-fg hover:bg-wire-raised'}`}
                >
                  🇮🇳 मराठी (Marathi)
                </button>
              </div>
            )}
          </div>

          {/* 🎛️ Easy Mode Button */}
          <button
            onClick={() => onToggleEasyMode(!isEasyMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-[11px] border rounded-sm transition-colors ${
              isEasyMode 
                ? 'bg-yellow-400 text-black border-yellow-400 font-bold' 
                : 'text-wire-subtle hover:text-wire-fg border-wire-border hover:border-wire-muted bg-wire-surface'
            }`}
            title="Toggle Easy Mode (Simple UI for disabled/elderly)"
            aria-label="Toggle Easy Mode"
          >
            <span>🎛️</span>
            <span className="hidden lg:inline">{isEasyMode ? 'Exit Easy' : 'Easy Mode'}</span>
          </button>

          <button
            onClick={onOpenPersonaModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-[11px] text-wire-subtle hover:text-wire-fg border border-wire-border hover:border-wire-muted transition-colors bg-wire-surface rounded-sm"
            title="Switch profile"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{persona}</span>
          </button>

          <button
            onClick={onOpenDbModal}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-[11px] border rounded-sm transition-colors ${
              isConfigured
                ? 'text-wire-subtle hover:text-wire-fg border-wire-border hover:border-wire-muted bg-wire-surface'
                : 'text-wire-red border-wire-red/40 bg-wire-red/10'
            }`}
            title="Database inspector"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{isConfigured ? 'DB' : 'No DB'}</span>
          </button>

          <button
            onClick={onToggleVoiceSummary}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-[11px] border rounded-sm transition-colors ${
              isSpeaking
                ? 'text-wire-amber border-wire-amber/50 bg-wire-amber/10 font-medium'
                : 'text-wire-subtle hover:text-wire-fg border-wire-border hover:border-wire-muted bg-wire-surface'
            }`}
            title="Audio briefing"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isSpeaking ? 'Stop' : 'Briefing'}</span>
          </button>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-[11px] text-wire-base bg-wire-amber hover:bg-wire-amber/90 rounded-sm transition-colors disabled:opacity-50 font-medium"
            title="Sync feeds"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Sync</span>
          </button>

        </div>
      </div>
    </header>
  );
}
