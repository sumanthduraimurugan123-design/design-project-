import express from 'express';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient.js';

const router = express.Router();
let memoryLogs = [];

/**
 * GET /api/logs
 * Retrieve recent user actions and system telemetry logs
 */
router.get('/', async (req, res) => {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(40);

      if (!error && data) {
        return res.json({ source: 'supabase', logs: data });
      }
    }

    res.json({ source: 'memory', logs: memoryLogs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/logs
 * Record user action or telemetry event into Supabase
 */
router.post('/', async (req, res) => {
  try {
    const { user_action, persona, metadata } = req.body;
    if (!user_action) {
      return res.status(400).json({ error: 'user_action is required' });
    }

    const logEntry = {
      user_action,
      persona: persona || 'Analyst',
      metadata: metadata || {},
      timestamp: new Date().toISOString()
    };

    memoryLogs.unshift(logEntry);
    if (memoryLogs.length > 100) memoryLogs.pop();

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('logs')
        .insert([logEntry])
        .select();

      if (!error && data) {
        return res.status(201).json({ success: true, log: data[0] });
      }
    }

    res.status(201).json({ success: true, log: logEntry });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
