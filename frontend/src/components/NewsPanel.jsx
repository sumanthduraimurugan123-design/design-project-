import React, { useState } from 'react';
import { ExternalLink, Volume2, ShieldAlert, Sparkles, Clock, Globe2, Tag, BookOpen, Layers, CheckCircle2 } from 'lucide-react';
import { speakText } from '../services/newsService';

const TOPICS = ['all', 'Geopolitics', 'Defense', 'Economy', 'Cyber', 'Energy'];

export default function NewsPanel({ 
  news = [], 
  isLoading = false, 
  selectedCountry, 
  onSelectTopic, 
  activeTopic,
  persona,
  isCognitiveSimple = false,
  lastUpdatedTime = '',
  countdown = 30
}) {
  const [readingId, setReadingId] = useState(null);

  const handleSpeak = (e, item, id) => {
    e.stopPropagation();
    e.preventDefault();
    if (readingId === id) {
      window.speechSynthesis.cancel();
      setReadingId(null);
      return;
    }
    setReadingId(id);
    speakText(`${item.title}. Reported by ${item.source || 'Global wire'}. Summary: ${item.description}`, () => {
      setReadingId(null);
    });
  };

  const getCleanDomain = (url) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'direct article';
    }
  };

  return (
    <div className="flex flex-col h-full cyber-panel rounded-xl p-4 border border-cyber-border/80">
      
      {/* Header & Live Stream Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cyber-border">
        <div className="flex items-center space-x-2.5">
          <BookOpen className="w-5 h-5 text-cyber-cyan" />
          <h2 className="text-sm font-mono font-bold tracking-wide text-white uppercase flex items-center gap-2">
            LIVE INTEL WIRE <span className="text-cyber-cyan">[{selectedCountry.toUpperCase()}]</span>
          </h2>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/50 flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            {news.length} LIVE DISPATCHES
          </span>
        </div>

        {/* Live Refresh Status Counter */}
        <div className="flex items-center space-x-3 text-xs font-mono">
          <span className="text-slate-400 hidden md:inline">
            UPDATED: <span className="text-cyber-cyan font-semibold">{lastUpdatedTime || 'STREAMING'}</span>
          </span>
          <span className="px-2 py-0.5 rounded bg-cyber-900 border border-cyber-cyan/30 text-cyber-cyan text-[11px]">
            NEXT SYNC: <strong className="text-white">{countdown}s</strong>
          </span>
        </div>
      </div>

      {/* Topic Filters */}
      <div className="flex flex-wrap gap-1.5 py-3 border-b border-cyber-border/60">
        <span className="text-xs font-mono text-slate-400 self-center mr-1">TOPIC:</span>
        {TOPICS.map(t => (
          <button
            key={t}
            onClick={() => onSelectTopic(t)}
            className={`text-xs font-mono px-2.5 py-1 rounded transition-all ${
              activeTopic === t
                ? 'bg-cyber-cyan text-cyber-950 font-bold shadow-glow-cyan'
                : 'bg-cyber-900 text-slate-300 hover:text-white border border-cyber-border hover:border-cyber-cyan/30'
            }`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* News Stream Body */}
      <div className="flex-1 overflow-y-auto mt-3 pr-1 space-y-3.5 max-h-[640px]">
        {isLoading && news.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <div className="w-8 h-8 border-2 border-cyber-cyan border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono text-cyber-cyan animate-pulse">INTERCEPTING REAL-TIME SATELLITE DISPATCHES...</p>
          </div>
        ) : news.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 space-y-2">
            <Globe2 className="w-10 h-10 text-slate-600" />
            <p className="text-sm font-mono">No active intelligence dispatches for this sector filter.</p>
            <p className="text-xs text-slate-500">Auto-refreshing live signals from BBC, NYT, Guardian, and international wires...</p>
          </div>
        ) : (
          news.map((item, idx) => {
            const cardId = item.id || `news-${idx}`;
            const isReading = readingId === cardId;
            const domain = getCleanDomain(item.url);

            // Simplified Cognitive View (Illiterate/Accessibility friendly)
            if (isCognitiveSimple) {
              return (
                <div
                  key={cardId}
                  className="p-4 rounded-xl bg-black border-2 border-cyber-cyan hover:border-white transition-all shadow-md flex flex-col sm:flex-row items-start justify-between gap-4"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl" role="img" aria-label="alert">📢</span>
                      <span className="text-xs font-bold text-cyber-cyan bg-cyber-cyan/20 px-2.5 py-0.5 rounded uppercase">
                        {item.source || 'WORLD NEWS'}
                      </span>
                    </div>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-lg font-bold text-white hover:text-cyber-cyan transition-colors underline leading-snug"
                    >
                      {item.title}
                    </a>
                    <p className="text-sm text-slate-200 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex sm:flex-col gap-2 shrink-0 w-full sm:w-auto">
                    <button
                      onClick={(e) => handleSpeak(e, item, cardId)}
                      className={`flex-1 sm:flex-none px-4 py-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all font-bold text-sm ${
                        isReading
                          ? 'bg-cyber-crimson border-white text-white animate-pulse'
                          : 'bg-cyber-cyan text-black border-cyber-cyan hover:bg-white'
                      }`}
                    >
                      <Volume2 className="w-5 h-5" />
                      <span>{isReading ? 'STOP' : 'LISTEN'}</span>
                    </button>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-none px-4 py-3 rounded-xl bg-slate-800 text-white border border-slate-600 hover:border-cyber-cyan flex items-center justify-center gap-2 text-sm font-bold"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>READ</span>
                    </a>
                  </div>
                </div>
              );
            }

            // Standard / Analyst / Casual View
            return (
              <div
                key={cardId}
                onClick={(e) => {
                  if (!e.target.closest('button') && !e.target.closest('a')) {
                    window.open(item.url, '_blank', 'noopener,noreferrer');
                  }
                }}
                className={`group relative p-4 rounded-lg border transition-all duration-200 flex flex-col justify-between gap-3 cursor-pointer ${
                  persona === 'Accessibility mode'
                    ? 'bg-black border-2 border-cyber-cyan text-white hover:border-white'
                    : 'bg-cyber-900/70 hover:bg-cyber-850 border-cyber-border hover:border-cyber-cyan/60 shadow-sm hover:shadow-glow-cyan'
                }`}
              >
                {/* Meta Row: Source, Time, Domain, Sentiment */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded bg-cyber-800 text-cyber-cyan font-bold border border-cyber-cyan/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      {item.source || 'International Wire'}
                    </span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}
                    </span>
                    <span className="text-slate-500 hidden sm:inline">
                      ({domain})
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Sentiment / Risk Badge */}
                    {item.sentiment && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.sentiment.includes('Hostile') || item.sentiment.includes('Risk')
                          ? 'bg-cyber-crimson/20 text-cyber-crimson border border-cyber-crimson/50 font-mono'
                          : item.sentiment.includes('Positive')
                          ? 'bg-cyber-emerald/20 text-cyber-emerald border border-cyber-emerald/50 font-mono'
                          : 'bg-slate-800 text-slate-300 border border-slate-700 font-mono'
                      }`}>
                        {item.sentiment}
                      </span>
                    )}

                    {/* Speech Synthesizer Action */}
                    <button
                      onClick={(e) => handleSpeak(e, item, cardId)}
                      className={`p-1.5 rounded transition-all ${
                        isReading
                          ? 'bg-cyber-crimson/20 text-cyber-crimson border border-cyber-crimson'
                          : 'hover:bg-cyber-800 text-slate-400 hover:text-cyber-cyan'
                      }`}
                      title={isReading ? 'Stop Speech' : 'Listen with Text-to-Speech'}
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Article Headline with Direct Anchor Link */}
                <div>
                  <h3 className="text-sm font-semibold text-white group-hover:text-cyber-cyan transition-colors leading-snug">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline inline-flex items-start gap-1.5"
                    >
                      <span>{item.title}</span>
                    </a>
                  </h3>
                  <div className="text-[10px] font-mono text-cyan-400/80 hover:text-cyan-300 truncate max-w-md mt-1">
                    ↳ {item.url}
                  </div>
                </div>

                {/* Article Description */}
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed font-sans">
                  {item.description}
                </p>

                {/* Direct Action Bar */}
                <div className="pt-2 border-t border-cyber-border/40 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-slate-500" /> Sector: {item.topic || 'Geopolitics'}
                  </span>

                  {/* Guaranteed Direct Click Link Button */}
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-cyber-cyan/15 hover:bg-cyber-cyan text-cyber-cyan hover:text-cyber-950 font-bold border border-cyber-cyan/40 transition-all text-xs"
                  >
                    <span>OPEN HEADLINE ARTICLE</span>
                    <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-3 pt-2.5 border-t border-cyber-border text-[11px] font-mono text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <span className="text-cyber-cyan flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          DIRECT CANONICAL PUBLISHER LINKS (ZERO REDIRECT INTERMEDIARIES)
        </span>
        <span className="text-slate-400">
          AUTONOMOUS SYNC EVERY 30S
        </span>
      </div>
    </div>
  );
}
