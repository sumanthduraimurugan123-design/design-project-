import { XMLParser } from 'fast-xml-parser';
import { supabase, isSupabaseConfigured } from './supabaseClient.js';
import { evaluateNewsForAlerts, persistAlert } from './alertEngine.js';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  processEntities: false,
  attributeNamePrefix: '@_'
});

// Cache to store freshly aggregated dispatches
let memoryNewsCache = [];
let lastSyncTimestamp = new Date().toISOString();

// Direct authoritative RSS Feeds providing canonical, redirect-free article URLs
const FEED_REGISTRY = {
  // Global Headline Streams
  'global': [
    { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', source: 'BBC News' },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', source: 'The New York Times' },
    { url: 'https://www.theguardian.com/world/rss', source: 'The Guardian' },
    { url: 'https://www.aljazeera.com/xml/rss/all.xml', source: 'Al Jazeera' }
  ],
  // United States
  'us': [
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/US.xml', source: 'The New York Times' },
    { url: 'https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml', source: 'BBC News' },
    { url: 'https://feeds.npr.org/1004/rss.xml', source: 'NPR News' }
  ],
  // United Kingdom
  'uk': [
    { url: 'https://feeds.bbci.co.uk/news/uk/rss.xml', source: 'BBC News' },
    { url: 'https://www.theguardian.com/uk/rss', source: 'The Guardian' }
  ],
  // Europe, Ukraine, Russia, Germany
  'ukraine': [
    { url: 'https://feeds.bbci.co.uk/news/world/europe/rss.xml', source: 'BBC News' },
    { url: 'https://www.theguardian.com/world/europe-news/rss', source: 'The Guardian' },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Europe.xml', source: 'The New York Times' }
  ],
  'russia': [
    { url: 'https://feeds.bbci.co.uk/news/world/europe/rss.xml', source: 'BBC News' },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Europe.xml', source: 'The New York Times' },
    { url: 'https://www.theguardian.com/world/europe-news/rss', source: 'The Guardian' }
  ],
  'germany': [
    { url: 'https://feeds.bbci.co.uk/news/world/europe/rss.xml', source: 'BBC News' },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Europe.xml', source: 'The New York Times' }
  ],
  // Asia, China, Taiwan, India, Japan
  'china': [
    { url: 'https://feeds.bbci.co.uk/news/world/asia/rss.xml', source: 'BBC News' },
    { url: 'https://www.theguardian.com/world/asia/rss', source: 'The Guardian' },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/AsiaPacific.xml', source: 'The New York Times' }
  ],
  'taiwan': [
    { url: 'https://feeds.bbci.co.uk/news/world/asia/rss.xml', source: 'BBC News' },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/AsiaPacific.xml', source: 'The New York Times' }
  ],
  'india': [
    { url: 'https://feeds.bbci.co.uk/news/world/asia/india/rss.xml', source: 'BBC News' },
    { url: 'https://feeds.bbci.co.uk/news/world/asia/rss.xml', source: 'BBC News' },
    { url: 'https://www.theguardian.com/world/asia/rss', source: 'The Guardian' }
  ],
  'japan': [
    { url: 'https://feeds.bbci.co.uk/news/world/asia/rss.xml', source: 'BBC News' },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/AsiaPacific.xml', source: 'The New York Times' }
  ],
  // Middle East & Israel
  'israel': [
    { url: 'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml', source: 'BBC News' },
    { url: 'https://www.aljazeera.com/xml/rss/all.xml', source: 'Al Jazeera' },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/MiddleEast.xml', source: 'The New York Times' }
  ],
  // Topic-specific streams
  'cyber': [
    { url: 'https://feeds.arstechnica.com/arstechnica/index', source: 'Ars Technica' },
    { url: 'https://www.wired.com/feed/category/security/latest/rss', source: 'Wired Security' },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml', source: 'The New York Times' }
  ],
  'economy': [
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml', source: 'The New York Times' },
    { url: 'https://feeds.bbci.co.uk/news/business/rss.xml', source: 'BBC News' }
  ]
};

/**
 * Clean URL and remove tracking queries
 */
function cleanArticleUrl(rawUrl) {
  if (!rawUrl) return '';
  try {
    // Keep clean base URL without query junk
    const clean = rawUrl.split('?')[0];
    return clean;
  } catch (e) {
    return rawUrl;
  }
}

/**
 * Validates that a link is a discrete, individual headline news article
 * and NOT a root domain, section portal, or rolling liveblog.
 */
function isDiscreteHeadlineArticle(url, title) {
  if (!url || typeof url !== 'string') return false;
  const u = url.toLowerCase().split('?')[0];
  const t = (title || '').toLowerCase();

  // Exclude root domains, category landing pages, and XML feeds
  if (u.endsWith('.com') || u.endsWith('.org') || u.endsWith('.co.uk') || u.endsWith('.net') || u.endsWith('/')) return false;
  if (u.endsWith('/news') || u.endsWith('/world') || u.endsWith('/politics') || u.endsWith('/business') || u.endsWith('/technology') || u.endsWith('/sport')) return false;
  if (u.endsWith('/all.xml') || u.endsWith('/rss.xml') || u.endsWith('/rss')) return false;

  // Exclude rolling live coverage, match liveblogs, photo galleries
  if (u.includes('/live/') || u.includes('/liveblog/') || u.includes('/gallery/') || u.includes('/interactive/')) return false;
  if (t.startsWith('live:') || t.startsWith('live updates:') || t.includes(' - live') || t.includes('rolling coverage')) return false;

  // Must match standard discrete headline article formats:
  const isBbcArticle = u.includes('bbc.co.uk/news/articles/') || u.includes('bbc.com/news/articles/');
  const isNytArticle = u.includes('nytimes.com/') && u.endsWith('.html');
  const isGuardianArticle = u.includes('theguardian.com/') && u.split('/').length >= 6;
  const isAlJazeeraArticle = u.includes('aljazeera.com/news/') || u.includes('aljazeera.com/opinions/') || u.includes('aljazeera.com/features/');
  const isNprArticle = u.includes('npr.org/') && /\/\d{4}\/\d{2}\/\d{2}\//.test(u);
  const hasSlug = u.split('/').pop().includes('-');

  return isBbcArticle || isNytArticle || isGuardianArticle || isAlJazeeraArticle || isNprArticle || hasSlug;
}

/**
 * Parse an individual RSS feed URL safely
 */
async function fetchSingleFeed(feedMeta, country, topic) {
  try {
    const res = await fetch(feedMeta.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      }
    });

    if (!res.ok) return [];

    const xml = await res.text();
    const parsed = xmlParser.parse(xml);
    const rawItems = parsed?.rss?.channel?.item || [];
    const itemsArray = Array.isArray(rawItems) ? rawItems : [rawItems];

    const results = [];
    for (const item of itemsArray.slice(0, 15)) {
      if (!item.title) continue;

      let rawLink = typeof item.link === 'string' 
        ? item.link 
        : item.guid?.['#text'] || item.guid || '';

      if (!rawLink || rawLink.startsWith('urn:')) {
        if (typeof item.link === 'object' && item.link?.['#text']) {
          rawLink = item.link['#text'];
        }
      }

      if (!rawLink || !rawLink.startsWith('http')) continue;

      const directUrl = cleanArticleUrl(rawLink);

      // Validate that this is an exact discrete headline article and not a section portal or liveblog
      if (!isDiscreteHeadlineArticle(directUrl, item.title)) continue;

      // Clean HTML tags from description
      let cleanDesc = item.description || '';
      cleanDesc = cleanDesc.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
      if (!cleanDesc) cleanDesc = item.title;

      const pubDate = item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString();

      const newsEntity = {
        title: item.title.trim(),
        description: cleanDesc,
        url: directUrl,
        country: country.toLowerCase(),
        topic: topic === 'all' ? determineTopic(item.title + ' ' + cleanDesc) : topic,
        source: feedMeta.source,
        sentiment: analyzeSentiment(item.title + ' ' + cleanDesc),
        created_at: pubDate
      };

      results.push(newsEntity);

      // Evaluate for security alerts
      const potentialAlert = evaluateNewsForAlerts(newsEntity);
      if (potentialAlert) {
        persistAlert(potentialAlert);
      }
    }

    return results;
  } catch (err) {
    console.warn(`⚠️ [Feed Registry] Could not parse feed ${feedMeta.url}: ${err.message}`);
    return [];
  }
}

/**
 * Determine likely topic tag
 */
function determineTopic(text) {
  const t = text.toLowerCase();
  if (t.includes('cyber') || t.includes('tech') || t.includes('ai') || t.includes('chip') || t.includes('hacked')) return 'Cyber';
  if (t.includes('economy') || t.includes('inflation') || t.includes('tariff') || t.includes('trade') || t.includes('market')) return 'Economy';
  if (t.includes('military') || t.includes('defense') || t.includes('weapon') || t.includes('missile') || t.includes('strike')) return 'Defense';
  if (t.includes('oil') || t.includes('gas') || t.includes('nuclear') || t.includes('pipeline') || t.includes('energy')) return 'Energy';
  return 'Geopolitics';
}

/**
 * Basic sentiment analysis helper
 */
function analyzeSentiment(text) {
  const lower = text.toLowerCase();
  const negativeWords = ['crisis', 'war', 'attack', 'conflict', 'decline', 'drop', 'inflation', 'sanctions', 'casualty', 'disaster', 'threat', 'tensions'];
  const positiveWords = ['growth', 'peace', 'agreement', 'recovery', 'treaty', 'breakthrough', 'gains', 'alliance', 'stability', 'surplus'];

  let score = 0;
  for (const w of negativeWords) if (lower.includes(w)) score -= 1;
  for (const w of positiveWords) if (lower.includes(w)) score += 1;

  if (score < -1) return 'Hostile / Risk';
  if (score < 0) return 'Tense';
  if (score > 1) return 'Positive / Stable';
  if (score > 0) return 'Constructive';
  return 'Neutral';
}

/**
 * Fetch real news from multi-source direct feeds
 */
export async function fetchLiveNews(country = 'global', topic = 'all') {
  const normalizedCountry = (country || 'global').toLowerCase();
  
  // Select matching feeds
  let targetFeeds = FEED_REGISTRY[normalizedCountry] || FEED_REGISTRY['global'];

  // If topic is Cyber or Economy, add topic-specific feeds
  const lowerTopic = (topic || '').toLowerCase();
  if (lowerTopic === 'cyber' && FEED_REGISTRY['cyber']) {
    targetFeeds = [...FEED_REGISTRY['cyber'], ...targetFeeds];
  } else if (lowerTopic === 'economy' && FEED_REGISTRY['economy']) {
    targetFeeds = [...FEED_REGISTRY['economy'], ...targetFeeds];
  }

  try {
    // Ingest all target feeds concurrently
    const feedPromises = targetFeeds.map(f => fetchSingleFeed(f, normalizedCountry, topic));
    const feedResults = await Promise.allSettled(feedPromises);

    let aggregated = [];
    for (const res of feedResults) {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        aggregated = aggregated.concat(res.value);
      }
    }

    // Deduplicate by URL
    const seenUrls = new Set();
    const uniqueNews = [];
    for (const item of aggregated) {
      if (!seenUrls.has(item.url)) {
        seenUrls.add(item.url);
        uniqueNews.push(item);
      }
    }

    // Sort by publication date descending (newest dispatches first)
    uniqueNews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const finalArticles = uniqueNews.slice(0, 30);

    lastSyncTimestamp = new Date().toISOString();

    // Persist batch to Supabase if configured
    if (isSupabaseConfigured && supabase && finalArticles.length > 0) {
      try {
        await supabase
          .from('news')
          .upsert(
            finalArticles.map(n => ({
              title: n.title,
              description: n.description,
              url: n.url,
              country: n.country,
              topic: n.topic,
              source: n.source,
              sentiment: n.sentiment,
              created_at: n.created_at
            })),
            { onConflict: 'url', ignoreDuplicates: true }
          );
      } catch (err) {
        console.error('⚠️ [News Service] Supabase batch upsert error:', err.message);
      }
    }

    // Update in-memory fallback cache
    for (const item of finalArticles) {
      if (!memoryNewsCache.some(m => m.url === item.url)) {
        memoryNewsCache.unshift(item);
      }
    }
    if (memoryNewsCache.length > 250) memoryNewsCache = memoryNewsCache.slice(0, 250);

    return finalArticles.length > 0 ? finalArticles : memoryNewsCache.slice(0, 25);
  } catch (err) {
    console.error(`⚠️ [News Service] Error in live ingestion for ${country}:`, err.message);
    const filtered = memoryNewsCache.filter(n => 
      normalizedCountry === 'global' || n.country === normalizedCountry
    );
    return filtered.length > 0 ? filtered : memoryNewsCache.slice(0, 20);
  }
}

export function getLastSyncTimestamp() {
  return lastSyncTimestamp;
}
