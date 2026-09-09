import express from 'express';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient.js';

const router = express.Router();

let memoryUsers = [
  { id: '1', name: 'Commander Vance', persona: 'Analyst', created_at: new Date().toISOString() },
  { id: '2', name: 'Elena Rostova', persona: 'Casual user', created_at: new Date().toISOString() },
  { id: '3', name: 'Marcus Chen', persona: 'Accessibility mode', created_at: new Date().toISOString() }
];

/**
 * GET /api/users
 */
router.get('/', async (req, res) => {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return res.json({ source: 'supabase', users: data });
      }
    }
    res.json({ source: 'memory', users: memoryUsers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/users
 */
router.post('/', async (req, res) => {
  try {
    const { name, persona } = req.body;
    if (!name || !persona) {
      return res.status(400).json({ error: 'name and persona are required' });
    }

    const newUser = {
      name,
      persona,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('users').insert([newUser]).select();
      if (!error && data) {
        return res.status(201).json({ source: 'supabase', user: data[0] });
      }
    }

    memoryUsers.unshift({ ...newUser, id: String(Date.now()) });
    res.status(201).json({ source: 'memory', user: memoryUsers[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
