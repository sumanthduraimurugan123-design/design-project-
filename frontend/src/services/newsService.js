import { supabase, isConfigured, logTelemetryAction } from './supabaseClient';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Fetch real news stream directly from Express backend (which aggregates verified deep-links)
 * with multi-tier failovers to Supabase or direct RSS stream.
 */
export async function fetchNewsStream(country = 'global', topic = 'all', forceRefresh = false) {
  const timestamp = Date.now();

  // 1. Primary: Direct Backend API on localhost:5000
  const candidateUrls = [
    `${API_BASE}/news?country=${encodeURIComponent(country)}&topic=${encodeURIComponent(topic)}&refresh=${forceRefresh}&_t=${timestamp}`,
    `http://localhost:5000/api/news?country=${encodeURIComponent(country)}&topic=${encodeURIComponent(topic)}&refresh=${forceRefresh}&_t=${timestamp}`,
    `/api/news?country=${encodeURIComponent(country)}&topic=${encodeURIComponent(topic)}&refresh=${forceRefresh}&_t=${timestamp}`
  ];

  for (const endpoint of candidateUrls) {
    try {
      const response = await fetch(endpoint, {
        cache: 'no-store',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      const contentType = response.headers.get('content-type') || '';
      if (response.ok && contentType.includes('application/json')) {
        const data = await response.json();
        if (Array.isArray(data.news) && data.news.length > 0) {
          // Verify that items have valid URLs
          const validArticles = data.news.filter(n => n.url && n.url.startsWith('http'));
          if (validArticles.length > 0) {
            return validArticles;
          }
        }
      }
    } catch (err) {
      // Try next endpoint candidate
    }
  }

  // 2. Secondary: Direct Supabase query if credentials configured
  if (isConfigured && supabase) {
    try {
      let query = supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      if (country && country !== 'global') {
        query = query.eq('country', country.toLowerCase());
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.warn('Supabase direct query failed:', e);
    }
  }

  // 3. Tertiary: Direct RSS fallback via public CORS proxy with strict Regex link extraction
  try {
    const feedUrl = 'https://feeds.bbci.co.uk/news/world/rss.xml';
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`;
    const directRes = await fetch(proxyUrl, { cache: 'no-store' });
    const xml = await directRes.text();

    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xml)) !== null && items.length < 25) {
      const itemBlock = match[1];

      // Extract title
      const titleMatch = itemBlock.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/i) || itemBlock.match(/<title>(.*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : 'Live Global Dispatch';

      // Extract description
      const descMatch = itemBlock.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/i) || itemBlock.match(/<description>(.*?)<\/description>/i);
      let desc = descMatch ? descMatch[1].replace(/<[^>]*>?/gm, '').trim() : title;

      // Extract EXACT article link from <link> or <guid>
      let articleUrl = '';
      const linkMatch = itemBlock.match(/<link>(.*?)<\/link>/i) || itemBlock.match(/<guid[^>]*>(.*?)<\/guid>/i);
      if (linkMatch && linkMatch[1]) {
        articleUrl = linkMatch[1].trim().split('?')[0]; // Strip tracking queries
      }

      const pubDateMatch = itemBlock.match(/<pubDate>(.*?)<\/pubDate>/i);
      const pubDate = pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString();

      if (articleUrl && articleUrl.startsWith('http') && !articleUrl.endsWith('/news') && !articleUrl.endsWith('/world')) {
        items.push({
          id: `wire-${Date.now()}-${items.length}`,
          title,
          description: desc,
          url: articleUrl,
          source: 'BBC News',
          country: country.toLowerCase(),
          topic: topic === 'all' ? 'Geopolitics' : topic,
          sentiment: 'Active',
          created_at: pubDate
        });
      }
    }

    if (items.length > 0) {
      return items;
    }
  } catch (directErr) {
    console.warn('Tertiary RSS fallback exception:', directErr);
  }

  return [];
}

/**
 * Fetch active alerts from backend or Supabase
 */
export async function fetchActiveAlerts(country = null) {
  const timestamp = Date.now();
  const q = country && country !== 'global' ? `?country=${encodeURIComponent(country)}&_t=${timestamp}` : `?_t=${timestamp}`;
  
  const endpoints = [
    `${API_BASE}/alerts${q}`,
    `http://localhost:5000/api/alerts${q}`,
    `/api/alerts${q}`
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, { cache: 'no-store' });
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('application/json')) {
        const data = await res.json();
        return data.alerts || [];
      }
    } catch (e) {
      // continue
    }
  }

  if (isConfigured && supabase) {
    const { data } = await supabase.from('alerts').select('*').order('created_at', { ascending: false }).limit(20);
    return data || [];
  }

  return [];
}

/**
 * Fetch logs for auditing
 */
export async function fetchSystemLogs() {
  const endpoints = [
    `${API_BASE}/logs?_t=${Date.now()}`,
    `http://localhost:5000/api/logs?_t=${Date.now()}`,
    `/api/logs?_t=${Date.now()}`
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, { cache: 'no-store' });
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('application/json')) {
        const data = await res.json();
        return data.logs || [];
      }
    } catch (e) {
      // continue
    }
  }

  if (isConfigured && supabase) {
    const { data } = await supabase.from('logs').select('*').order('timestamp', { ascending: false }).limit(30);
    return data || [];
  }

  return [];
}

/**
 * Speech Synthesis Helper (Web Speech API)
 */
let currentSpeechUtterance = null;

export function speakText(text, onEndCallback = null) {
  if (!('speechSynthesis' in window)) {
    alert('Text-to-speech is not supported in your browser.');
    return;
  }

  window.speechSynthesis.cancel();
  if (!text) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.lang = 'en-US';

  utterance.onend = () => {
    currentSpeechUtterance = null;
    if (onEndCallback) onEndCallback();
  };

  utterance.onerror = () => {
    currentSpeechUtterance = null;
    if (onEndCallback) onEndCallback();
  };

  currentSpeechUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeech() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    currentSpeechUtterance = null;
  }
}
