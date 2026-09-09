import React, { useState, useMemo } from 'react';
import { ExternalLink, Volume2, Globe2, Tag, BookOpen, CheckCircle2, Layers, LayoutList, MapPin } from 'lucide-react';
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
  const [selectedCountryFilter, setSelectedCountryFilter] = useState('all');
  const [viewMode, setViewMode] = useState('stream'); // 'stream' or 'grouped'

  const handleSpeak = (e, item, id) => {
    e.stopPropagation();
    e.preventDefault();
    if (readingId === id) {
      window.speechSynthesis.cancel();
      setReadingId(null);
      return;
    }
    setReadingId(id);
    speakText(`${item.title}. Country: ${item.country_name || item.country}. Reported by ${item.source || 'Global wire'}. Summary: ${item.description}`, () => {
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

  // Derive distinct countries present in the current news set with counts
  const availableCountries = useMemo(() => {
    const map = {};
    for (const item of news) {
      const cId = item.country || 'global';
      if (!map[cId]) {
        map[cId] = {
          id: cId,
          name: item.country_name || (cId === 'global' ? 'Global Wire' : cId.toUpperCase()),
          flag: item.country_flag || (cId === 'global' ? '🌐' : '🏳️'),
          count: 0
        };
      }
      map[cId].count++;
    }
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [news]);

  // Filter news according to country filter
  const filteredNews = useMemo(() => {
    if (selectedCountryFilter === 'all') return news;
    return news.filter(n => (n.country || 'global') === selectedCountryFilter);
  }, [news, selectedCountryFilter]);

  // Group news by country when in 'grouped' view
  const groupedByCountry = useMemo(() => {
    const groups = {};
    for (const item of filteredNews) {
      const cId = item.country || 'global';
      if (!groups[cId]) {
        groups[cId] = {
          id: cId,
          name: item.country_name || (cId === 'global' ? 'Global Wire' : cId.toUpperCase()),
          flag: item.country_flag || (cId === 'global' ? '🌐' : '🏳️'),
          articles: []
        };
      }
      groups[cId].articles.push(item);
    }
    return Object.values(groups).sort((a, b) => b.articles.length - a.articles.length);
  }, [filteredNews]);

  const renderNewsCard = (item, idx) => {
    const cardId = item.id || `news-${idx}`;
    const isReading = readingId === cardId;
    const domain = getCleanDomain(item.url);

    // Simplified Cognitive View (Accessibility friendly)
    if (isCognitiveSimple) {
      return (
        <div
          key={cardId}
          className="p-4 rounded-xl bg-black border-2 border-cyber-cyan hover:border-white transition-all shadow-md flex flex-col sm:flex-row items-start justify-between gap-4"
        >
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl" role="img" aria-label="flag">{item.country_flag || '🌐'}</span>
              <span className="text-xs font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2.5 py-0.5 rounded uppercase">
                {item.country_name || item.country?.toUpperCase()}
              </span>
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

    // Standard Analyst / Casual View
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
        {/* Meta Row: Country Flag, Source, Time, Domain, Sentiment */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
          <div className="flex flex-wrap items-center gap-2">
            {/* Country Badge */}
            <span className="px-2 py-0.5 rounded bg-slate-950 text-amber-300 font-bold border border-amber-500/40 flex items-center gap-1.5 shadow-sm">
              <span className="text-sm">{item.country_flag || '🌐'}</span>
              <span className="tracking-wide uppercase">{item.country_name || item.country}</span>
            </span>

            {/* Source Badge */}
            <span className="px-2.5 py-0.5 rounded bg-cyber-800 text-cyber-cyan font-bold border border-cyber-cyan/30 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              {item.source || 'International Wire'}
            </span>

            <span className="text-slate-400 flex items-center gap-1">
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

          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-cyber-cyan/15 hover:bg-cyber-cyan text-cyber-cyan hover:text-cyber-950 font-bold border border-cyber-cyan/40 transition-all text-xs"
          >
            <span>OPEN ARTICLE</span>
            <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full cyber-panel rounded-xl p-4 border border-cyber-border/80">
      
      {/* Header & Live Stream Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cyber-border">
        <div className="flex items-center space-x-2.5">
          <BookOpen className="w-5 h-5 text-cyber-cyan" />
          <h2 className="text-sm font-mono font-bold tracking-wide text-white uppercase flex items-center gap-2">
            WORLDWIDE INTEL WIRE <span className="text-cyber-cyan">[{selectedCountry.toUpperCase()}]</span>
          </h2>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/50 flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            {filteredNews.length} DISPATCHES
          </span>
        </div>

        {/* View Mode & Countdown */}
        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="flex items-center bg-cyber-900 border border-cyber-border rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('stream')}
              className={`px-2.5 py-1 rounded flex items-center gap-1 text-[11px] transition-all ${
                viewMode === 'stream' ? 'bg-cyber-cyan text-cyber-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Continuous Chronological Stream"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>STREAM</span>
            </button>
            <button
              onClick={() => setViewMode('grouped')}
              className={`px-2.5 py-1 rounded flex items-center gap-1 text-[11px] transition-all ${
                viewMode === 'grouped' ? 'bg-cyber-cyan text-cyber-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Group Articles By Country"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>BY COUNTRY</span>
            </button>
          </div>

          <span className="px-2 py-1 rounded bg-cyber-900 border border-cyber-cyan/30 text-cyber-cyan text-[11px]">
            SYNC: <strong className="text-white">{countdown}s</strong>
          </span>
        </div>
      </div>

      {/* Row 1: Topic Filters */}
      <div className="flex flex-wrap items-center gap-1.5 py-2.5 border-b border-cyber-border/60 text-xs font-mono">
        <span className="text-slate-400 mr-1">TOPIC:</span>
        {TOPICS.map(t => (
          <button
            key={t}
            onClick={() => onSelectTopic(t)}
            className={`px-2.5 py-1 rounded transition-all ${
              activeTopic === t
                ? 'bg-cyber-cyan text-cyber-950 font-bold shadow-glow-cyan'
                : 'bg-cyber-900 text-slate-300 hover:text-white border border-cyber-border hover:border-cyber-cyan/30'
            }`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Row 2: Country Categorization Bar */}
      {availableCountries.length > 1 && (
        <div className="flex flex-wrap items-center gap-1.5 py-2.5 border-b border-cyber-border/40 text-xs font-mono">
          <span className="text-slate-400 mr-1 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-amber-400" /> NATIONS:
          </span>
          <button
            onClick={() => setSelectedCountryFilter('all')}
            className={`px-2.5 py-1 rounded transition-all ${
              selectedCountryFilter === 'all'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                : 'bg-cyber-900 text-slate-300 hover:text-white border border-cyber-border'
            }`}
          >
            ALL ({news.length})
          </button>

          {availableCountries.slice(0, 10).map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCountryFilter(c.id)}
              className={`px-2.5 py-1 rounded transition-all flex items-center gap-1.5 ${
                selectedCountryFilter === c.id
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                  : 'bg-cyber-900 text-slate-300 hover:text-white border border-cyber-border hover:border-amber-400/40'
              }`}
            >
              <span>{c.flag}</span>
              <span>{c.name}</span>
              <span className="text-[10px] opacity-75">({c.count})</span>
            </button>
          ))}
        </div>
      )}

      {/* News Stream Body */}
      <div className="flex-1 overflow-y-auto mt-3 pr-1 space-y-4 max-h-[640px]">
        {isLoading && news.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <div className="w-8 h-8 border-2 border-cyber-cyan border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono text-cyber-cyan animate-pulse">INTERCEPTING REAL-TIME WORLDWIDE SATELLITE DISPATCHES...</p>
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 space-y-2">
            <Globe2 className="w-10 h-10 text-slate-600" />
            <p className="text-sm font-mono">No active intelligence dispatches for this country/topic selection.</p>
            <p className="text-xs text-slate-500">Auto-refreshing live signals from BBC, NYT, Guardian, and international wires...</p>
          </div>
        ) : viewMode === 'grouped' ? (
          // Grouped by Country View
          groupedByCountry.map(group => (
            <div key={group.id} className="space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-cyber-border/70 sticky top-0 bg-[#070c1e] z-10 py-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{group.flag}</span>
                  <h3 className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wide">
                    {group.name}
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {group.articles.length} dispatches
                </span>
              </div>
              <div className="space-y-3 pl-1">
                {group.articles.map((item, idx) => renderNewsCard(item, `${group.id}-${idx}`))}
              </div>
            </div>
          ))
        ) : (
          // Continuous Stream View
          filteredNews.map((item, idx) => renderNewsCard(item, idx))
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-3 pt-2.5 border-t border-cyber-border text-[11px] font-mono text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <span className="text-cyber-cyan flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          VERIFIED NATION-LEVEL INTELLIGENCE • DIRECT CANONICAL DISPATCHES
        </span>
        <span className="text-slate-400">
          AUTONOMOUS SYNC EVERY 30S
        </span>
      </div>
    </div>
  );
}
