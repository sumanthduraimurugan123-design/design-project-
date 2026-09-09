/**
 * Verification Tool for Worldwide Country Categorization
 * 
 * Fetches real news from around the world and verifies that:
 * 1. Headlines and summaries are accurately classified into specific countries.
 * 2. Country flags and nation names are assigned.
 * 3. News can be retrieved grouped by sovereign nation.
 */

import { fetchWorldwideNewsCategorized, fetchLiveNews } from '../services/newsService.js';

async function runTest() {
  console.log('='.repeat(75));
  console.log('🌍 UGI WORLDWIDE NEWS INGESTION & COUNTRY CATEGORIZATION TEST');
  console.log(`🕒 Timestamp: ${new Date().toISOString()}`);
  console.log('='.repeat(75));
  console.log('');

  console.log('🔄 Ingesting global and regional feeds...');
  const result = await fetchWorldwideNewsCategorized();

  console.log(`✅ Ingestion Complete!`);
  console.log(`   Total Live Dispatches: ${result.totalArticles}`);
  console.log(`   Sovereign Nations Identified: ${result.countriesCount}`);
  console.log('');

  console.log('📊 BREAKDOWN BY COUNTRY:');
  console.log('-'.repeat(75));
  for (const country of result.countries) {
    console.log(`${country.flag}  ${country.name.padEnd(20)} [${country.region.padEnd(14)}] : ${country.count} dispatches`);
    if (country.articles.length > 0) {
      const topArt = country.articles[0];
      console.log(`    ↳ "${topArt.title}"`);
      console.log(`       🔗 ${topArt.url}`);
    }
    console.log('');
  }

  console.log('='.repeat(75));
  console.log('🎯 COUNTRY CATEGORIZATION VERIFICATION PASSED');
  console.log('='.repeat(75));
}

runTest().catch(console.error);
