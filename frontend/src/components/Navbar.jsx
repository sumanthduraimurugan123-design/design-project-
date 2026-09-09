import React, { useState, useEffect } from 'react';
import { Shield, Radio, RefreshCw, Volume2, Globe, Eye, UserCheck, Database } from 'lucide-react';
import { isConfigured } from '../services/supabaseClient';

export default function Navbar({ 
  selectedCountry, 
  onRefresh, 
  isRefreshing, 
  persona, 
  onOpenPersonaModal,
  onOpenDbModal,
  onToggleVoiceSummary,
  isSpeaking 
}) {
  const [utcTime, setUtcTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().replace('GMT', 'UTC'));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-cyber-border bg-[#040711]/90 backdrop-blur-md px-4 lg:px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        
        {/* Branding & Status */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-cyber-900 border border-cyber-cyan/50 shadow-glow-cyan">
            <Shield className="w-5 h-5 text-cyber-cyan animate-pulse-fast" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-wider font-mono text-white flex items-center gap-1.5">
                UGI <span className="text-cyber-cyan text-xs px-1.5 py-0.5 rounded bg-cyber-cyan/10 border border-cyber-cyan/30">v2.4 TELEMETRY</span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Global Intel & Telemetry Command Matrix</p>
          </div>
        </div>

        {/* Center: Live UTC Clock & Active Sector */}
        <div className="hidden md:flex items-center space-x-4 px-3 py-1.5 rounded-lg bg-cyber-900/80 border border-cyber-border/70 text-xs font-mono">
          <div className="flex items-center space-x-1.5 text-cyber-emerald">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>LIVE STREAM</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="text-slate-300">
            SECTOR: <span className="text-cyber-cyan font-semibold uppercase">{selectedCountry || 'GLOBAL'}</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="text-slate-400">
            {utcTime || 'SYNCING UTC...'}
          </div>
        </div>

        {/* Right Actions: Persona, Database, Voice Summary, Refresh */}
        <div className="flex items-center space-x-2">
          
          {/* Persona Switcher Button */}
          <button
            onClick={onOpenPersonaModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-cyber-900 border border-cyber-border hover:border-cyber-cyan/50 text-slate-200 hover:text-white transition-all shadow-sm"
            title="Switch User Persona"
          >
            <UserCheck className="w-3.5 h-3.5 text-cyber-cyan" />
            <span className="hidden sm:inline">Persona:</span>
            <span className="text-cyber-cyan font-semibold">{persona}</span>
          </button>

          {/* Supabase DB Status & Inspector */}
          <button
            onClick={onOpenDbModal}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
              isConfigured
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/50'
                : 'bg-amber-950/40 border-amber-500/50 text-amber-300 hover:bg-amber-900/50'
            }`}
            title="Inspect Supabase Database Tables & Rows"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Supabase:</span>
            <span>{isConfigured ? 'Connected' : 'Tables DB'}</span>
          </button>

          {/* Voice Summary Audio Button */}
          <button
            onClick={onToggleVoiceSummary}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
              isSpeaking
                ? 'bg-cyber-crimson/20 border-cyber-crimson text-cyber-crimson animate-pulse shadow-glow-crimson'
                : 'bg-cyber-900 border-cyber-border hover:border-cyber-purple/60 text-purple-300 hover:bg-purple-950/30'
            }`}
            title="Text-to-Speech: Narrate Live Top Intelligence Summary"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isSpeaking ? 'Narrating...' : 'Voice Brief'}</span>
          </button>

          {/* Refresh News Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium bg-cyber-cyan/10 border border-cyber-cyan/40 text-cyber-cyan hover:bg-cyber-cyan/20 transition-all disabled:opacity-50"
            title="Force auto-ingestion of verified news & alerts"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">SYNC</span>
          </button>
        </div>

      </div>
    </header>
  );
}
