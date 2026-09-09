import { supabase, isSupabaseConfigured } from './supabaseClient.js';

// Keywords mapped to severity levels
const CRITICAL_KEYWORDS = ['war', 'missile', 'nuclear', 'invasion', 'airstrike', 'earthquake', 'tsunami', 'terrorist', 'martial law'];
const HIGH_KEYWORDS = ['cyberattack', 'crisis', 'sanctions', 'inflation', 'protest', 'emergency', 'blackout', 'outbreak', 'coup'];
const MEDIUM_KEYWORDS = ['tensions', 'tariff', 'recession', 'hacked', 'disruption', 'border dispute', 'summit'];

/**
 * Scan a news item for alert triggers based on title and description keywords
 */
export function evaluateNewsForAlerts(newsItem) {
  const text = `${newsItem.title || ''} ${newsItem.description || ''}`.toLowerCase();
  
  for (const kw of CRITICAL_KEYWORDS) {
    if (text.includes(kw)) {
      return {
        message: `CRITICAL ALERT [${newsItem.country.toUpperCase()}]: Potential flashpoint detected - "${newsItem.title.slice(0, 100)}"`,
        severity: 'CRITICAL',
        country: newsItem.country,
        source_url: newsItem.url
      };
    }
  }

  for (const kw of HIGH_KEYWORDS) {
    if (text.includes(kw)) {
      return {
        message: `HIGH PRIORITY [${newsItem.country.toUpperCase()}]: Telemetry flagged keyword '${kw}' - "${newsItem.title.slice(0, 100)}"`,
        severity: 'HIGH',
        country: newsItem.country,
        source_url: newsItem.url
      };
    }
  }

  for (const kw of MEDIUM_KEYWORDS) {
    if (text.includes(kw)) {
      return {
        message: `ELEVATED NOTICE [${newsItem.country.toUpperCase()}]: Regional development - "${newsItem.title.slice(0, 100)}"`,
        severity: 'MEDIUM',
        country: newsItem.country,
        source_url: newsItem.url
      };
    }
  }

  return null;
}

const memoryAlerts = [];

export function getCachedAlerts() {
  return memoryAlerts;
}

export function addCachedAlert(alert) {
  if (!alert) return;
  memoryAlerts.unshift(alert);
  if (memoryAlerts.length > 50) memoryAlerts.pop();
}

/**
 * Persist generated alerts to Supabase
 */
export async function persistAlert(alert) {
  if (!alert) return null;
  addCachedAlert(alert);

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .insert([{
          message: alert.message,
          severity: alert.severity,
          country: alert.country,
          source_url: alert.source_url
        }])
        .select();

      if (error) {
        console.error('⚠️ [Alert Engine] Error persisting alert to Supabase:', error.message);
      } else {
        console.log(`🚨 [Alert Engine] Alert saved to Supabase [${alert.severity}]: ${alert.country}`);
        return data?.[0];
      }
    } catch (err) {
      console.error('⚠️ [Alert Engine] Exception inserting alert:', err.message);
    }
  }
  return alert;
}
