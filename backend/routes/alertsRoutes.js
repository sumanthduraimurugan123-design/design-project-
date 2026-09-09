import express from 'express';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient.js';
import { getCachedAlerts, persistAlert } from '../services/alertEngine.js';

const router = express.Router();

/**
 * GET /api/alerts
 * Fetch active alerts from Supabase or fallback cache
 */
router.get('/', async (req, res) => {
  try {
    const country = req.query.country ? req.query.country.toLowerCase() : null;

    if (isSupabaseConfigured && supabase) {
      let query = supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      if (country && country !== 'global') {
        query = query.eq('country', country);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return res.json({
          source: 'supabase',
          alerts: data
        });
      }
    }

    // Fallback to in-memory alerts
    let memoryList = getCachedAlerts();
    if (country && country !== 'global') {
      memoryList = memoryList.filter(a => a.country === country);
    }

    return res.json({
      source: 'memory_cache',
      alerts: memoryList
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/alerts
 * Create a new telemetry alert and save to Supabase
 */
router.post('/', async (req, res) => {
  try {
    const { message, severity, country, source_url } = req.body;
    if (!message || !severity || !country) {
      return res.status(400).json({ error: 'message, severity, and country are required' });
    }

    const newAlert = {
      message,
      severity: severity.toUpperCase(),
      country: country.toLowerCase(),
      source_url: source_url || ''
    };

    const saved = await persistAlert(newAlert);
    res.status(201).json({ success: true, alert: saved });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
