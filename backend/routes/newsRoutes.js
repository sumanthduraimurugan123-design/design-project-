import express from 'express';
import { fetchLiveNews, fetchWorldwideNewsCategorized, getLastSyncTimestamp, COUNTRY_LEXICON } from '../services/newsService.js';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient.js';
import { explainNews, generatePersonalizedOpinion } from '../services/newsExplainer.js';

const router = express.Router();

/**
 * GET /api/news/by-country
 * Returns dispatches categorized and grouped by sovereign nations
 */
router.get('/by-country', async (req, res) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  try {
    const data = await fetchWorldwideNewsCategorized();
    res.json(data);
  } catch (error) {
    console.error('❌ [News By-Country Error]:', error);
    res.status(500).json({ error: 'Failed to retrieve categorized news', details: error.message });
  }
});

/**
 * GET /api/news/countries-list
 * Returns the lexicon of supported countries with their flags and regions
 */
router.get('/countries-list', (req, res) => {
  res.json({
    count: COUNTRY_LEXICON.length,
    countries: COUNTRY_LEXICON.map(c => ({
      id: c.id,
      name: c.name,
      flag: c.flag,
      region: c.region
    }))
  });
});

/**
 * POST /api/news/explain
 * Returns a smart plain-language explanation and everyday impact in English, Hindi, or Tamil
 */
router.post('/explain', (req, res) => {
  try {
    const { title, description, language } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }
    const explanation = explainNews(title, description, language || 'en');
    res.json({
      success: true,
      title,
      ...explanation
    });
  } catch (err) {
    console.error('❌ [News Explain Error]:', err);
    res.status(500).json({ error: 'Failed to generate explanation', details: err.message });
  }
});

/**
 * POST /api/news/opinion
 * Returns personalized AI-based opinion tailored to persona (Analyst vs Casual user vs Accessibility mode)
 */
router.post('/opinion', (req, res) => {
  try {
    const { title, description, persona, language } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }
    const opinionData = generatePersonalizedOpinion(title, description, persona || 'Casual user', language || 'en');
    res.json({
      success: true,
      title,
      ...opinionData
    });
  } catch (err) {
    console.error('❌ [News Opinion Error]:', err);
    res.status(500).json({ error: 'Failed to generate personalized opinion', details: err.message });
  }
});

/**
 * GET /api/news/opinion
 */
router.get('/opinion', (req, res) => {
  try {
    const { title, description, persona, language } = req.query;
    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }
    const opinionData = generatePersonalizedOpinion(title, description, persona || 'Casual user', language || 'en');
    res.json({
      success: true,
      title,
      ...opinionData
    });
  } catch (err) {
    console.error('❌ [News Opinion Error]:', err);
    res.status(500).json({ error: 'Failed to generate personalized opinion', details: err.message });
  }
});

/**
 * GET /api/news
 * Query parameters: country (default: 'global'), topic (default: 'all'), location (optional city/area), language ('en', 'hi', 'ta'), refresh (boolean)
 */
router.get('/', async (req, res) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  try {
    const location = req.query.location ? req.query.location.toLowerCase().trim() : null;
    const country = (location || req.query.country || 'global').toLowerCase().trim();
    const language = (req.query.language || 'en').toLowerCase();
    const topic = req.query.topic || 'all';
    const forceRefresh = req.query.refresh === 'true';

    // If Supabase is connected and not forcing refresh and no micro-location filter, try to read from Supabase first
    if (isSupabaseConfigured && supabase && !forceRefresh && !location) {
      let query = supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      if (country !== 'global') {
        query = query.eq('country', country);
      }

      if (topic !== 'all') {
        query = query.ilike('topic', `%${topic}%`);
      }

      const { data, error } = await query;

      if (!error && data && data.length >= 5) {
        const newestArticleTime = new Date(data[0].created_at).getTime();
        const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
        // Only return from DB if data is fresh (within last 2 hours)
        if (newestArticleTime > twoHoursAgo) {
          return res.json({
            source: 'supabase',
            count: data.length,
            country,
            location,
            topic,
            language,
            lastUpdated: getLastSyncTimestamp(),
            news: data
          });
        }
      }
    }

    // Otherwise fetch live from direct authentic feeds and store in Supabase
    const liveArticles = await fetchLiveNews(country, topic, location, language);

    return res.json({
      source: 'live_feed_upserted_to_supabase',
      count: liveArticles.length,
      country,
      location,
      topic,
      language,
      lastUpdated: getLastSyncTimestamp(),
      news: liveArticles
    });
  } catch (error) {
    console.error('❌ [News Route Error]:', error);
    res.status(500).json({ error: 'Failed to retrieve news stream', details: error.message });
  }
});

/**
 * POST /api/news/refresh
 * Force instant refresh and ingestion for all key geopolitical hotspots
 */
router.post('/refresh', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const country = req.body.country || 'global';
    const topic = req.body.topic || 'all';
    const location = req.body.location || null;
    const language = req.body.language || 'en';
    const freshData = await fetchLiveNews(country, topic, location, language);
    res.json({
      success: true,
      refreshedAt: new Date().toISOString(),
      count: freshData.length,
      news: freshData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
