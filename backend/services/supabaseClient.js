import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseKey && 
  !supabaseUrl.includes('your-project.supabase.co') &&
  !supabaseKey.includes('your-anon')
);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

if (isSupabaseConfigured) {
  console.log('⚡ [UGI Backend] Supabase client initialized successfully with live database connection.');
} else {
  console.warn('⚠️ [UGI Backend] Supabase credentials not set or using default placeholders. Real-time news ingestion will operate with active memory cache until .env is configured.');
}
