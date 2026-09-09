import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY || '';

export const isConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project.supabase.co') &&
  !supabaseAnonKey.includes('your-anon')
);

// Instantiate Supabase client
export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Fetch records from any of the 4 core Supabase tables
 */
export async function fetchTableData(tableName, limit = 50) {
  if (!isConfigured || !supabase) {
    return { data: null, error: 'Supabase credentials not yet configured in .env' };
  }

  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order(tableName === 'logs' ? 'timestamp' : 'created_at', { ascending: false })
      .limit(limit);

    return { data, error };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

/**
 * Insert a telemetry log into Supabase logs table
 */
export async function logTelemetryAction(action, persona = 'Analyst', metadata = {}) {
  // First try direct Supabase
  if (isConfigured && supabase) {
    try {
      await supabase.from('logs').insert([{
        user_action: action,
        persona,
        metadata,
        timestamp: new Date().toISOString()
      }]);
    } catch (e) {
      console.warn('Direct Supabase log failure, falling back to backend endpoint:', e);
    }
  }

  // Also log to backend endpoint
  try {
    await fetch('http://localhost:5000/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_action: action, persona, metadata })
    });
  } catch (err) {
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_action: action, persona, metadata })
      });
    } catch (e) {
      // Silent fail
    }
  }
}
