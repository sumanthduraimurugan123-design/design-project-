/**
 * Geopolitical Entity Resolution & Country Classifier
 * 
 * Inspects article titles, descriptions, and URLs to accurately classify
 * news into sovereign nations and regional blocs using demonyms, capitals,
 * political leaders, key institutions, and geographic terminology.
 */

export const COUNTRY_LEXICON = [
  // Europe
  {
    id: 'ukraine',
    name: 'Ukraine',
    flag: '🇺🇦',
    region: 'Europe',
    keywords: ['ukraine', 'ukrainian', 'kyiv', 'kiev', 'zelensky', 'zelenskyy', 'donbas', 'donetsk', 'luhansk', 'kharkiv', 'odesa', 'zaporizhzhia', 'crimea', 'dnipro']
  },
  {
    id: 'russia',
    name: 'Russia',
    flag: '🇷🇺',
    region: 'Europe',
    keywords: ['russia', 'russian', 'moscow', 'putin', 'kremlin', 'duma', 'fsb', 'shoigu', 'st petersburg', 'belgorod', 'kursk', 'siberia']
  },
  {
    id: 'germany',
    name: 'Germany',
    flag: '🇩🇪',
    region: 'Europe',
    keywords: ['germany', 'german', 'berlin', 'scholz', 'merz', 'bundestag', 'afd', 'bundesrat', 'frankfurt', 'munich', 'bavaria']
  },
  {
    id: 'uk',
    name: 'United Kingdom',
    flag: '🇬🇧',
    region: 'Europe',
    keywords: ['united kingdom', 'britain', 'british', 'uk', 'london', 'starmer', 'downing street', 'westminster', 'parliament', 'scotland', 'wales', 'tory', 'labour']
  },
  {
    id: 'france',
    name: 'France',
    flag: '🇫🇷',
    region: 'Europe',
    keywords: ['france', 'french', 'paris', 'macron', 'elysee', 'barnier', 'marseille', 'le pen']
  },
  {
    id: 'italy',
    name: 'Italy',
    flag: '🇮🇹',
    region: 'Europe',
    keywords: ['italy', 'italian', 'rome', 'meloni', 'milan', 'vatican']
  },
  {
    id: 'poland',
    name: 'Poland',
    flag: '🇵🇱',
    region: 'Europe',
    keywords: ['poland', 'polish', 'warsaw', 'tusk', 'duda']
  },

  // Middle East & North Africa
  {
    id: 'israel',
    name: 'Israel',
    flag: '🇮🇱',
    region: 'Middle East',
    keywords: ['israel', 'israeli', 'tel aviv', 'jerusalem', 'netanyahu', 'knesset', 'idf', 'mossad', 'gaza', 'west bank', 'hamas', 'hezbollah', 'rafah', 'sinwar']
  },
  {
    id: 'iran',
    name: 'Iran',
    flag: '🇮🇷',
    region: 'Middle East',
    keywords: ['iran', 'iranian', 'tehran', 'khamenei', 'irgc', 'pezeshkian', 'enrichment', 'persian gulf', 'natanz', 'fordow', 'houthi']
  },
  {
    id: 'syria',
    name: 'Syria',
    flag: '🇸🇾',
    region: 'Middle East',
    keywords: ['syria', 'syrian', 'damascus', 'idlib', 'assad', 'aleppo']
  },
  {
    id: 'saudi arabia',
    name: 'Saudi Arabia',
    flag: '🇸🇦',
    region: 'Middle East',
    keywords: ['saudi arabia', 'saudi', 'riyadh', 'mbs', 'aramco']
  },
  {
    id: 'turkey',
    name: 'Turkey',
    flag: '🇹🇷',
    region: 'Middle East',
    keywords: ['turkey', 'turkish', 'turkiye', 'ankara', 'erdogan', 'istanbul', 'bosphorus']
  },
  {
    id: 'egypt',
    name: 'Egypt',
    flag: '🇪🇬',
    region: 'Middle East',
    keywords: ['egypt', 'egyptian', 'cairo', 'sisi', 'suez']
  },

  // Asia-Pacific
  {
    id: 'china',
    name: 'China',
    flag: '🇨🇳',
    region: 'Asia-Pacific',
    keywords: ['china', 'chinese', 'beijing', 'xi jinping', 'pla', 'ccp', 'shanghai', 'hong kong', 'south china sea', 'xinjiang', 'tibet']
  },
  {
    id: 'taiwan',
    name: 'Taiwan',
    flag: '🇹🇼',
    region: 'Asia-Pacific',
    keywords: ['taiwan', 'taiwanese', 'taipei', 'tsmc', 'lai ching-te', 'taiwan strait']
  },
  {
    id: 'india',
    name: 'India',
    flag: '🇮🇳',
    region: 'Asia-Pacific',
    keywords: ['india', 'indian', 'new delhi', 'delhi', 'chennai', 'tamil nadu', 'mumbai', 'bengaluru', 'bangalore', 'hyderabad', 'kolkata', 'modi', 'bjp', 'kashmir', 'ladakh', 'rupee', 'kerala', 'punjab']
  },
  {
    id: 'japan',
    name: 'Japan',
    flag: '🇯🇵',
    region: 'Asia-Pacific',
    keywords: ['japan', 'japanese', 'tokyo', 'ishiba', 'kishida', 'diet', 'yen']
  },
  {
    id: 'south korea',
    name: 'South Korea',
    flag: '🇰🇷',
    region: 'Asia-Pacific',
    keywords: ['south korea', 'korean', 'seoul', 'yoon', 'dmz', 'pyongyang', 'north korea', 'kim jong un']
  },
  {
    id: 'australia',
    name: 'Australia',
    flag: '🇦🇺',
    region: 'Asia-Pacific',
    keywords: ['australia', 'australian', 'canberra', 'albanese', 'sydney', 'melbourne', 'aukus']
  },
  {
    id: 'philippines',
    name: 'Philippines',
    flag: '🇵🇭',
    region: 'Asia-Pacific',
    keywords: ['philippines', 'filipino', 'manila', 'marcos', 'second thomas shoal']
  },

  // Americas
  {
    id: 'us',
    name: 'United States',
    flag: '🇺🇸',
    region: 'Americas',
    keywords: ['united states', 'u.s.', 'usa', 'america', 'american', 'washington', 'biden', 'trump', 'white house', 'capitol hill', 'pentagon', 'congress', 'senate', 'fbi', 'cia']
  },
  {
    id: 'canada',
    name: 'Canada',
    flag: '🇨🇦',
    region: 'Americas',
    keywords: ['canada', 'canadian', 'ottawa', 'trudeau', 'toronto', 'montreal', 'vancouver']
  },
  {
    id: 'brazil',
    name: 'Brazil',
    flag: '🇧🇷',
    region: 'Americas',
    keywords: ['brazil', 'brazilian', 'brasilia', 'lula', 'sao paulo', 'amazon']
  },
  {
    id: 'mexico',
    name: 'Mexico',
    flag: '🇲🇽',
    region: 'Americas',
    keywords: ['mexico', 'mexican', 'sheinbaum', 'amlo', 'mexico city']
  },

  // Africa
  {
    id: 'congo',
    name: 'DR Congo',
    flag: '🇨🇩',
    region: 'Africa',
    keywords: ['congo', 'congolese', 'drc', 'kinshasa', 'goma', 'ebola']
  },
  {
    id: 'somalia',
    name: 'Somalia',
    flag: '🇸🇴',
    region: 'Africa',
    keywords: ['somalia', 'somali', 'mogadishu', 'al-shabaab', 'pirates']
  },
  {
    id: 'sudan',
    name: 'Sudan',
    flag: '🇸🇩',
    region: 'Africa',
    keywords: ['sudan', 'sudanese', 'khartoum', 'darfur', 'rsf']
  },
  {
    id: 'nigeria',
    name: 'Nigeria',
    flag: '🇳🇬',
    region: 'Africa',
    keywords: ['nigeria', 'nigerian', 'abuja', 'lagos', 'tinubu']
  },
  {
    id: 'south africa',
    name: 'South Africa',
    flag: '🇿🇦',
    region: 'Africa',
    keywords: ['south africa', 'south african', 'pretoria', 'johannesburg', 'ramaphosa']
  }
];

/**
 * Classify an article into a specific country based on headline, description, and explicit context.
 * 
 * @param {string} title 
 * @param {string} description 
 * @param {string} hintedCountry - Optional country code hint from feed source
 * @returns {object} { id, name, flag, region, confidence }
 */
export function classifyCountry(title = '', description = '', hintedCountry = 'global') {
  const cleanTitle = (title || '').toLowerCase();
  const cleanDesc = (description || '').toLowerCase();
  const fullText = `${cleanTitle} ${cleanDesc}`;

  let bestCountry = null;
  let highestScore = 0;

  for (const c of COUNTRY_LEXICON) {
    let score = 0;

    for (const kw of c.keywords) {
      // Regex word boundary matching to avoid false positives (e.g. 'us' inside 'focus')
      const regex = new RegExp(`\\b${kw.replace('.', '\\.')}\\b`, 'i');

      if (regex.test(cleanTitle)) {
        // High weight for appearance in headline
        score += 5;
      } else if (regex.test(cleanDesc)) {
        // Moderate weight for appearance in summary
        score += 2;
      }
    }

    // Boost if this matches the query/feed hint
    if (hintedCountry && hintedCountry !== 'global' && c.id === hintedCountry.toLowerCase()) {
      score += 4;
    }

    if (score > highestScore) {
      highestScore = score;
      bestCountry = c;
    }
  }

  // If sufficient confidence threshold met, return detected country
  if (bestCountry && highestScore >= 2) {
    return {
      id: bestCountry.id,
      name: bestCountry.name,
      flag: bestCountry.flag,
      region: bestCountry.region,
      confidence: highestScore
    };
  }

  // If a specific hint was provided, try mapping it
  if (hintedCountry && hintedCountry !== 'global') {
    const matchedHint = COUNTRY_LEXICON.find(c => c.id === hintedCountry.toLowerCase());
    if (matchedHint) {
      return {
        id: matchedHint.id,
        name: matchedHint.name,
        flag: matchedHint.flag,
        region: matchedHint.region,
        confidence: 1
      };
    }
  }

  // Multilateral / Planetary fallback
  return {
    id: 'global',
    name: 'Global Wire',
    flag: '🌐',
    region: 'International',
    confidence: 0
  };
}
