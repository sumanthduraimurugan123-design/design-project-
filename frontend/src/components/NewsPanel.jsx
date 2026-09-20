import React, { useState, useMemo } from 'react';
import { ExternalLink, Volume2, Globe2, HelpCircle, Sparkles, VolumeX } from 'lucide-react';
import { speakInLanguage, stopSpeaking, playEarcon } from '../services/voiceService';
import { fetchNewsExplanation } from '../services/newsService';

const TOPICS = ['all', 'Geopolitics', 'Defense', 'Economy', 'Cyber', 'Energy'];

const SENTIMENT_LABEL = {
  'Hostile / Risk': { cls: 'text-wire-red border-wire-red/40', label: 'Risk' },
  'Tense':          { cls: 'text-wire-amber border-wire-amber/40', label: 'Tense' },
  'Positive / Stable': { cls: 'text-wire-green border-wire-green/40', label: 'Stable' },
  'Constructive':   { cls: 'text-wire-green border-wire-green/40', label: 'Pos.' },
  'Neutral':        { cls: 'text-wire-subtle border-wire-border', label: 'Neutral' },
};

export default function NewsPanel({ 
  news = [], 
  isLoading = false, 
  selectedCountry, 
  onSelectTopic, 
  activeTopic,
  persona,
  isCognitiveSimple = false,
  currentLanguage = 'en',
  lastUpdatedTime = '',
  countdown = 30
}) {
  const [readingId, setReadingId] = useState(null);
  const [explainingId, setExplainingId] = useState(null);
  const [explanations, setExplanations] = useState({});
  const [selectedCountryFilter, setSelectedCountryFilter] = useState('all');
  const [viewMode, setViewMode] = useState('stream');

  const handleSpeak = (e, item, id) => {
    e.stopPropagation();
    e.preventDefault();
    if (readingId === id) {
      stopSpeaking();
      setReadingId(null);
      return;
    }
    setReadingId(id);
    setExplainingId(null);
    playEarcon('click');

    const cleanTitle = (item.title || '').split(' - ')[0];
    const src = item.source ? `Source: ${item.source}. ` : '';
    const desc = item.description ? `${item.description}. ` : '';

    speakInLanguage(
      `${cleanTitle}. ${src} ${desc}`,
      {
        language: currentLanguage,
        rate: 0.95,
        onEnd: () => setReadingId(null),
        onError: () => setReadingId(null)
      }
    );
  };

  const handleExplain = async (e, item, id) => {
    e.stopPropagation();
    e.preventDefault();
    if (explainingId === id) {
      stopSpeaking();
      setExplainingId(null);
      return;
    }

    setExplainingId(id);
    setReadingId(null);
    playEarcon('click');

    // Immediate acknowledgment
    let waitMsg = 'Simplifying news in plain words...';
    if (currentLanguage === 'ta') waitMsg = 'செய்தியை எளிய தமிழில் விளக்குகிறேன்...';
    if (currentLanguage === 'hi') waitMsg = 'इस खबर को सरल भाषा में समझा रहे हैं...';
    speakInLanguage(waitMsg, { language: currentLanguage });

    try {
      const data = await fetchNewsExplanation(item.title, item.description, currentLanguage);
      setExplanations(prev => ({ ...prev, [id]: data }));

      const speech = data.simpleText || `${data.explanation} ${data.impact}`;
      speakInLanguage(speech, {
        language: currentLanguage,
        rate: 0.95,
        onEnd: () => setExplainingId(null),
        onError: () => setExplainingId(null)
      });
    } catch (err) {
      console.error('Explain error:', err);
      setExplainingId(null);
    }
  };

  const getCleanDomain = (url) => {
    try { return new URL(url).hostname.replace('www.', ''); }
    catch { return ''; }
  };

  const availableCountries = useMemo(() => {
    const map = {};
    for (const item of news) {
      const cId = item.country || 'global';
      if (!map[cId]) {
        map[cId] = {
          id: cId,
          name: item.country_name || (cId === 'global' ? 'Global' : cId),
          flag: item.country_flag || (cId === 'global' ? '🌐' : ''),
          count: 0
        };
      }
      map[cId].count++;
    }
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [news]);

  const filteredNews = useMemo(() => {
    if (selectedCountryFilter === 'all') return news;
    return news.filter(n => (n.country || 'global') === selectedCountryFilter);
  }, [news, selectedCountryFilter]);

  const groupedByCountry = useMemo(() => {
    const groups = {};
    for (const item of filteredNews) {
      const cId = item.country || 'global';
      if (!groups[cId]) {
        groups[cId] = {
          id: cId,
          name: item.country_name || (cId === 'global' ? 'Global' : cId.toUpperCase()),
          flag: item.country_flag || (cId === 'global' ? '🌐' : ''),
          articles: []
        };
      }
      groups[cId].articles.push(item);
    }
    return Object.values(groups).sort((a, b) => b.articles.length - a.articles.length);
  }, [filteredNews]);

  const renderNewsRow = (item, idx) => {
    const cardId = item.id || `news-${idx}`;
    const isReading = readingId === cardId;
    const isExplaining = explainingId === cardId;
    const explanation = explanations[cardId];
    const domain = getCleanDomain(item.url);
    const sentCfg = SENTIMENT_LABEL[item.sentiment] || SENTIMENT_LABEL['Neutral'];

    if (isCognitiveSimple) {
      return (
        <div key={cardId} className={`px-4 py-4 border-b border-wire-border/50 last:border-0 ${isReading ? 'bg-wire-amber/10' : (isExplaining ? 'bg-wire-blue/10' : '')}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{item.country_flag || '🌐'}</span>
            <span className="font-mono text-xs text-wire-subtle">{item.country_name || item.country}</span>
            <span className="font-mono text-xs text-wire-subtle">·</span>
            <span className="font-mono text-xs text-wire-subtle">{item.source}</span>
          </div>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block font-serif text-base text-wire-fg hover:text-wire-amber transition-colors leading-snug mb-2"
          >
            {item.title}
          </a>
          
          {explanation ? (
            <div className="bg-wire-raised border border-wire-amber/40 p-3 my-2 text-wire-fg font-sans text-xs">
              <span className="font-mono text-[10px] text-wire-amber block mb-1">💡 PLAIN EXPLANATION:</span>
              <p className="font-medium text-white mb-1">{explanation.explanation}</p>
              <p className="text-wire-subtle">👉 {explanation.impact}</p>
            </div>
          ) : (
            <p className="text-sm text-wire-subtle leading-relaxed">{item.description}</p>
          )}

          <div className="mt-2.5 flex items-center gap-3">
            <button
              onClick={(e) => handleSpeak(e, item, cardId)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 font-mono text-xs rounded-sm border transition-colors ${
                isReading 
                  ? 'bg-wire-red text-white border-wire-red' 
                  : 'bg-wire-base text-wire-fg border-wire-border hover:border-wire-amber'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              {isReading ? 'Stop' : '🔊 Listen'}
            </button>

            <button
              onClick={(e) => handleExplain(e, item, cardId)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 font-mono text-xs rounded-sm border transition-colors ${
                isExplaining 
                  ? 'bg-wire-amber text-wire-base font-semibold border-wire-amber' 
                  : 'bg-wire-base text-wire-subtle border-wire-border hover:text-wire-fg hover:border-wire-muted'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-wire-amber" />
              {isExplaining ? 'Explaining...' : '💡 Explain'}
            </button>
          </div>
        </div>
      );
    }

    // Standard wire row
    return (
      <div
        key={cardId}
        className={`group px-4 py-3 border-b border-wire-border/40 last:border-0 hover:bg-wire-raised transition-colors cursor-pointer ${
          isReading ? 'bg-wire-amber/10 border-l-2 border-l-wire-amber' : (isExplaining ? 'bg-wire-blue/10 border-l-2 border-l-wire-blue' : '')
        }`}
        onClick={(e) => {
          if (!e.target.closest('button') && !e.target.closest('a')) {
            window.open(item.url, '_blank', 'noopener,noreferrer');
          }
        }}
      >
        {/* Metadata strip */}
        <div className="flex items-center gap-3 mb-1.5 font-mono text-[10px] text-wire-subtle">
          <span>{item.country_flag || ''} <span className="capitalize">{item.country_name || item.country}</span></span>
          {item.source && <><span className="text-wire-border">·</span><span>{item.source}</span></>}
          {item.created_at && (
            <><span className="text-wire-border">·</span>
            <span className="tabular-nums">
              {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span></>
          )}
          {item.sentiment && (
            <span className={`ml-auto border px-1 py-0.5 text-[9px] ${sentCfg.cls}`}>
              {sentCfg.label}
            </span>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 ml-2">
            <button
              onClick={(e) => handleSpeak(e, item, cardId)}
              className={`p-1 rounded transition-colors ${
                isReading ? 'text-wire-amber bg-wire-amber/20' : 'text-wire-subtle hover:text-wire-fg hover:bg-wire-base'
              }`}
              title={isReading ? 'Stop listening' : 'Listen to headline'}
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={(e) => handleExplain(e, item, cardId)}
              className={`p-1 rounded transition-colors ${
                isExplaining ? 'text-wire-amber bg-wire-amber/20 font-bold' : 'text-wire-subtle hover:text-wire-amber hover:bg-wire-base'
              }`}
              title="Explain news in simple words"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Headline */}
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block font-serif text-sm text-wire-fg group-hover:text-wire-amber transition-colors leading-snug"
        >
          {item.title}
        </a>

        {/* Plain-Language Explanation Callout if active */}
        {explanation && (
          <div className="mt-2 bg-wire-base border border-wire-amber/40 p-2.5 text-xs text-wire-fg animate-in fade-in duration-150">
            <div className="flex items-center gap-1.5 mb-1 font-mono text-[10px] text-wire-amber">
              <Sparkles className="w-3 h-3 text-wire-amber" />
              <span>PLAIN EXPLANATION</span>
            </div>
            <p className="font-semibold text-white mb-0.5">{explanation.explanation}</p>
            <p className="text-wire-subtle text-[11px]">👉 {explanation.impact}</p>
          </div>
        )}

        {/* Description — only in Analyst mode when not explained */}
        {!explanation && persona === 'Analyst' && item.description && item.description !== item.title && (
          <p className="mt-1 text-[11px] text-wire-subtle leading-relaxed line-clamp-1 font-sans">
            {item.description}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="bg-wire-surface border border-wire-border flex flex-col">
      
      {/* Header */}
      <div className="px-4 py-3 border-b border-wire-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h2 className="font-serif text-wire-fg text-sm font-semibold">News Feed</h2>
          <span className="font-mono text-[10px] text-wire-subtle">{filteredNews.length} dispatches</span>
        </div>

        <div className="flex items-center gap-3 font-mono text-[10px]">
          {/* View toggle */}
          <div className="flex items-center border border-wire-border">
            <button
              onClick={() => setViewMode('stream')}
              className={`px-2.5 py-1 transition-colors ${
                viewMode === 'stream' ? 'bg-wire-raised text-wire-fg' : 'text-wire-subtle hover:text-wire-fg'
              }`}
            >Stream</button>
            <button
              onClick={() => setViewMode('grouped')}
              className={`px-2.5 py-1 transition-colors border-l border-wire-border ${
                viewMode === 'grouped' ? 'bg-wire-raised text-wire-fg' : 'text-wire-subtle hover:text-wire-fg'
              }`}
            >Grouped</button>
          </div>
          
          <span className={`tabular-nums ${countdown <= 5 ? 'text-wire-amber' : 'text-wire-subtle'}`}>
            Sync in {countdown}s
          </span>
        </div>
      </div>

      {/* Topic filter strip */}
      <div className="px-4 py-2 border-b border-wire-border/60 flex flex-wrap gap-1.5">
        {TOPICS.map(t => (
          <button
            key={t}
            onClick={() => onSelectTopic(t)}
            className={`font-mono text-[10px] px-2.5 py-1 transition-colors border ${
              activeTopic === t
                ? 'bg-wire-amber text-wire-base border-wire-amber font-medium'
                : 'text-wire-subtle border-wire-border hover:text-wire-fg hover:border-wire-muted'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Country sub-filter */}
      {availableCountries.length > 1 && (
        <div className="px-4 py-2 border-b border-wire-border/40 flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedCountryFilter('all')}
            className={`font-mono text-[10px] px-2.5 py-1 border transition-colors ${
              selectedCountryFilter === 'all'
                ? 'text-wire-fg border-wire-muted bg-wire-raised'
                : 'text-wire-subtle border-wire-border hover:text-wire-fg'
            }`}
          >All</button>
          {availableCountries.slice(0, 9).map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCountryFilter(c.id)}
              className={`font-mono text-[10px] px-2.5 py-1 border transition-colors flex items-center gap-1 ${
                selectedCountryFilter === c.id
                  ? 'text-wire-fg border-wire-muted bg-wire-raised'
                  : 'text-wire-subtle border-wire-border hover:text-wire-fg'
              }`}
            >
              {c.flag && <span>{c.flag}</span>}
              <span className="capitalize">{c.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* News body */}
      <div className="flex-1 overflow-y-auto max-h-[660px]">
        {isLoading && news.length === 0 ? (
          <div className="flex items-center justify-center py-20 gap-2.5 font-mono text-[11px] text-wire-subtle">
            <div className="w-3.5 h-3.5 border border-wire-muted border-t-wire-amber rounded-full animate-spin" />
            Connecting to wire...
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Globe2 className="w-7 h-7 text-wire-muted mb-2.5" />
            <p className="font-mono text-[11px] text-wire-subtle">No dispatches match your selection.</p>
          </div>
        ) : viewMode === 'grouped' ? (
          groupedByCountry.map(group => (
            <div key={group.id}>
              <div className="px-4 py-2 bg-wire-raised border-b border-wire-border flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  {group.flag && <span>{group.flag}</span>}
                  <span className="font-serif text-xs font-semibold text-wire-fg capitalize">{group.name}</span>
                </div>
                <span className="font-mono text-[10px] text-wire-subtle">{group.articles.length}</span>
              </div>
              <div className="pl-3">
                {group.articles.map((item, idx) => renderNewsRow(item, `${group.id}-${idx}`))}
              </div>
            </div>
          ))
        ) : (
          filteredNews.map((item, idx) => renderNewsRow(item, idx))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-wire-border flex items-center justify-between">
        <span className="font-mono text-[10px] text-wire-subtle">Verified wire feeds</span>
        {lastUpdatedTime && (
          <span className="font-mono text-[10px] text-wire-subtle">Updated {lastUpdatedTime}</span>
        )}
      </div>
    </div>
  );
}
