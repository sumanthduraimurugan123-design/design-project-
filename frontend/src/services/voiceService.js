/**
 * Voice & Accessibility Subsystem (UGI)
 * 
 * Comprehensive Web Speech API (STT & TTS), Web Audio API Earcons,
 * Continuous News Radio Player, Natural Language Command Parser,
 * Geolocation Auto-Detection, and Unauthenticated Audio Alerts.
 */

// ============================================================================
// 1. WEB AUDIO API EARCONS (Zero-asset instant sound feedback)
// ============================================================================

let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
    if (AudioCtxClass) {
      audioCtx = new AudioCtxClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play pleasant auditory cues for visually impaired and illiterate users
 * @param {'mic-on' | 'mic-off' | 'alert' | 'success' | 'click'} type 
 */
export function playEarcon(type) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (type === 'mic-on') {
      // Ascending two-tone chime (Listening started)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'mic-off') {
      // Descending tone (Listening ended)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.exponentialRampToValueAtTime(350, now + 0.18);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'alert') {
      // Two-pulse alert warning
      [0, 0.15].forEach(offset => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(850, now + offset);
        gain.gain.setValueAtTime(0.25, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.12);
      });
    } else if (type === 'success') {
      // Pleasant major chord
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.05);
        gain.gain.setValueAtTime(0.15, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.05);
        osc.stop(now + 0.35);
      });
    }
  } catch (e) {
    console.warn('Earcon audio failure:', e);
  }
}

// ============================================================================
// 2. TEXT-TO-SPEECH (TTS) ENGINE WITH MULTI-LANGUAGE VOICES
// ============================================================================

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', speechCode: 'en-IN', flag: '🇬🇧' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', speechCode: 'ta-IN', flag: '🇮🇳' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', speechCode: 'hi-IN', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', speechCode: 'te-IN', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', speechCode: 'bn-IN', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', speechCode: 'mr-IN', flag: '🇮🇳' }
];

let availableVoices = [];

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  availableVoices = window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    availableVoices = window.speechSynthesis.getVoices();
  };
}

/**
 * Find best installed voice for requested language
 */
export function getBestVoiceForLanguage(langCode = 'en') {
  if (availableVoices.length === 0 && typeof window !== 'undefined' && 'speechSynthesis' in window) {
    availableVoices = window.speechSynthesis.getVoices();
  }

  const prefix = ['ta', 'hi', 'te', 'bn', 'mr'].includes(langCode) ? langCode : 'en';
  
  // Try exact match (e.g. ta-IN, te-IN, bn-IN, mr-IN, hi-IN)
  let matched = availableVoices.find(v => v.lang.toLowerCase().startsWith(prefix));
  if (!matched && langCode === 'en') {
    matched = availableVoices.find(v => v.lang.toLowerCase().includes('en'));
  }
  return matched || null;
}

let activeUtterance = null;

/**
 * Speak text aloud in requested language
 */
export function speakInLanguage(text, options = {}) {
  const {
    language = 'en',
    rate = 1.0,
    pitch = 1.0,
    onStart = null,
    onEnd = null,
    onError = null
  } = options;

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('SpeechSynthesis is not supported.');
    if (onError) onError(new Error('SpeechSynthesis not supported'));
    return;
  }

  // Cancel any running speech
  window.speechSynthesis.cancel();
  if (!text) {
    if (onEnd) onEnd();
    return;
  }

  const SPEECH_LANG_MAP = {
    ta: 'ta-IN',
    hi: 'hi-IN',
    te: 'te-IN',
    bn: 'bn-IN',
    mr: 'mr-IN',
    en: 'en-IN'
  };
  const speechLang = SPEECH_LANG_MAP[language] || 'en-IN';
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = speechLang;
  utterance.rate = rate;
  utterance.pitch = pitch;

  const bestVoice = getBestVoiceForLanguage(language);
  if (bestVoice) {
    utterance.voice = bestVoice;
  }

  utterance.onstart = () => {
    if (onStart) onStart();
  };

  utterance.onend = () => {
    activeUtterance = null;
    if (onEnd) onEnd();
  };

  utterance.onerror = (err) => {
    activeUtterance = null;
    if (onError) onError(err);
    else if (onEnd) onEnd();
  };

  activeUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    activeUtterance = null;
  }
}

export function isSpeechActive() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  return window.speechSynthesis.speaking;
}

// ============================================================================
// 3. SPEECH-TO-TEXT (STT) & NATURAL LANGUAGE COMMAND PARSER
// ============================================================================

const SpeechRecognitionClass = typeof window !== 'undefined' 
  ? (window.SpeechRecognition || window.webkitSpeechRecognition) 
  : null;

export const isVoiceInputSupported = Boolean(SpeechRecognitionClass);

let activeRecognition = null;

/**
 * Start listening for voice input
 */
export function startVoiceRecognition({
  language = 'en',
  onResult,
  onStart,
  onEnd,
  onError
}) {
  if (!SpeechRecognitionClass) {
    if (onError) onError(new Error('Voice recognition is not supported in this browser. Please use Chrome or Edge.'));
    return null;
  }

  if (activeRecognition) {
    try { activeRecognition.stop(); } catch (e) {}
  }

  const SPEECH_LANG_MAP = {
    ta: 'ta-IN',
    hi: 'hi-IN',
    te: 'te-IN',
    bn: 'bn-IN',
    mr: 'mr-IN',
    en: 'en-IN'
  };
  const recognition = new SpeechRecognitionClass();
  recognition.lang = SPEECH_LANG_MAP[language] || 'en-IN';
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    playEarcon('mic-on');
    if (onStart) onStart();
  };

  recognition.onresult = (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript || '';
    playEarcon('mic-off');
    if (onResult) onResult(transcript.trim());
  };

  recognition.onerror = (err) => {
    playEarcon('mic-off');
    if (onError) onError(err);
  };

  recognition.onend = () => {
    activeRecognition = null;
    if (onEnd) onEnd();
  };

  activeRecognition = recognition;
  try {
    recognition.start();
  } catch (e) {
    console.error('Recognition start error:', e);
  }

  return recognition;
}

export function stopVoiceRecognition() {
  if (activeRecognition) {
    try {
      activeRecognition.stop();
      playEarcon('mic-off');
    } catch (e) {}
    activeRecognition = null;
  }
}

/**
 * Parse natural language voice commands
 * Handles: "I am from Chennai, show me local news", "Play news", "Stop", "Explain news", etc.
 */
export function parseVoiceCommand(transcript = '', currentLanguage = 'en') {
  const text = (transcript || '').toLowerCase().trim();

  // Known location keywords
  const LOCATIONS = [
    { key: 'chennai', names: ['chennai', 'madras', 'மெட்ராஸ்', 'சென்னை', 'चेन्नई', 'చెన్నై', 'চেন্নাই'] },
    { key: 'delhi', names: ['delhi', 'new delhi', 'டெல்லி', 'दिल्ली', 'ఢిల్లీ', 'দিল্লি', 'दिल्ली'] },
    { key: 'mumbai', names: ['mumbai', 'bombay', 'மும்பை', 'मुंबई', 'ముంబై', 'মুম্বই'] },
    { key: 'bengaluru', names: ['bengaluru', 'bangalore', 'பெங்களூரு', 'बैंगलोर', 'బెంగుళూరు', 'বেঙ্গালুরু'] },
    { key: 'india', names: ['india', 'indian', 'இந்தியா', 'भारत', 'हिन्दुस्तान', 'భారతదేశం', 'ভারত'] },
    { key: 'tamil nadu', names: ['tamil nadu', 'தமிழ்நாடு', 'तमिलनाडु', 'తమిళనాడు', 'তামিলনাড়ু'] },
    { key: 'hyderabad', names: ['hyderabad', 'హైదరాబాద్', 'ஹைதராபாத்', 'हैदराबाद'] },
    { key: 'kolkata', names: ['kolkata', 'calcutta', 'কলকাতা', 'கொல்கத்தா', 'कोलकाता'] },
    { key: 'pune', names: ['pune', 'पुणे', 'புனே', 'పూణే'] },
    { key: 'ukraine', names: ['ukraine', 'யுக்ரேன்', 'यूक्रेन'] },
    { key: 'russia', names: ['russia', 'ரஷ்யா', 'रूस'] },
    { key: 'israel', names: ['israel', 'இஸ்ரேல்', 'इजराइल'] },
    { key: 'us', names: ['united states', 'usa', 'america', 'அமெரிக்கா', 'अमेरिका'] },
    { key: 'china', names: ['china', 'சீனா', 'चीन'] },
    { key: 'uk', names: ['united kingdom', 'britain', 'london', 'இங்கிலாந்து', 'ब्रिटेन', 'लंदन'] }
  ];

  // Helper for localized reply string
  const getLangReply = (en, ta, hi, te, bn, mr) => {
    if (currentLanguage === 'ta') return ta;
    if (currentLanguage === 'hi') return hi;
    if (currentLanguage === 'te') return te;
    if (currentLanguage === 'bn') return bn;
    if (currentLanguage === 'mr') return mr;
    return en;
  };

  // 1. Language switch commands (All 6 Languages)
  if (text.includes('tamil') || text.includes('தமிழ்') || text.includes('தமிழுக்கு மாற்று')) {
    return {
      intent: 'switch_language',
      language: 'ta',
      reply: 'தமிழ் மொழி தேர்ந்தெடுக்கப்பட்டது. வணக்கம்!'
    };
  }
  if (text.includes('hindi') || text.includes('हिंदी') || text.includes('हिन्दी') || text.includes('हिंदी में')) {
    return {
      intent: 'switch_language',
      language: 'hi',
      reply: 'हिंदी भाषा चुनी गई है। नमस्ते!'
    };
  }
  if (text.includes('telugu') || text.includes('తెలుగు') || text.includes('తెలుగులో')) {
    return {
      intent: 'switch_language',
      language: 'te',
      reply: 'తెలుగు భాష ఎంపిక చేయబడింది. నమస్కారం!'
    };
  }
  if (text.includes('bengali') || text.includes('bangla') || text.includes('বাংলা') || text.includes('বাংলায়')) {
    return {
      intent: 'switch_language',
      language: 'bn',
      reply: 'বাংলা ভাষা নির্বাচন করা হয়েছে। নমস্কার!'
    };
  }
  if (text.includes('marathi') || text.includes('मराठी') || text.includes('मराठीत')) {
    return {
      intent: 'switch_language',
      language: 'mr',
      reply: 'मराठी भाषा निवडली आहे. नमस्कार!'
    };
  }
  if (text.includes('english') || text.includes('ஆங்கிலம்') || text.includes('अंग्रेजी')) {
    return {
      intent: 'switch_language',
      language: 'en',
      reply: 'Language changed to English.'
    };
  }

  // 2. Repeat current news ("Repeat", "Read again")
  if (
    text.includes('repeat') || text.includes('again') || text.includes('read again') ||
    text.includes('one more time') || text.includes('மீண்டும்') || text.includes('திரும்ப') ||
    text.includes('फिर से') || text.includes('दोहराओ') || text.includes('మళ్ళీ') || text.includes('మరల') ||
    text.includes('আবার') || text.includes('পুনরায়') || text.includes('पुन्हा') || text.includes('परत')
  ) {
    const reply = getLangReply(
      'Repeating this news dispatch.',
      'இந்த செய்தியை மீண்டும் வாசிக்கிறேன்.',
      'इस समाचार को दोबारा पढ़ रहे हैं।',
      'ఈ వార్తను మళ్ళీ చదువుతున్నాను.',
      'এই সংবাদটি আবার পড়ছি।',
      'ही बातमी पुन्हा वाचत आहे.'
    );
    return { intent: 'repeat', reply };
  }

  // 3. Explain news ("Explain again", "Explain this news", "Simple words")
  if (
    text.includes('explain again') || text.includes('explain') || text.includes('what happened') || text.includes('simple words') ||
    text.includes('விளக்கம்') || text.includes('எளிதாக சொல்') ||
    text.includes('समझाओ') || text.includes('सरल शब्दों में') ||
    text.includes('వివరించు') || text.includes('సులభంగా చెప్పు') ||
    text.includes('ব্যাখ্যা') || text.includes('সহজ করে বল') ||
    text.includes('स्पष्ट करा') || text.includes('सोप्या भाषेत सांगा')
  ) {
    const reply = getLangReply(
      'Explaining this news in simple words.',
      'செய்தியை எளிய தமிழில் விளக்குகிறேன்.',
      'इस खबर को सरल शब्दों में समझा रहे हैं।',
      'ఈ వార్తను సులభమైన మాటల్లో వివరిస్తున్నాను.',
      'এই খবরটি সহজ ভাষায় ব্যাখ্যা করছি।',
      'ही बातमी सोप्या भाषेत समजावून सांगत आहे.'
    );
    return { intent: 'explain', reply };
  }

  // 4. Play continuous radio news ("Start News Radio", "Play news")
  if (
    text.includes('play news') || text.includes('start radio') || text.includes('read news') ||
    text.includes('start news radio') || text.includes('play today') || text.includes('important news') ||
    text.includes('செய்தி வாசி') || text.includes('வானொலி') ||
    text.includes('समाचार पढ़ो') || text.includes('खबरें सुनाओ') || text.includes('रेडियो') ||
    text.includes('వార్తలు చదువు') || text.includes('రేడియో') ||
    text.includes('খবর পড়ো') || text.includes('রেডিও') ||
    text.includes('बातम्या ऐकवा') || text.includes('रेडिओ')
  ) {
    const reply = getLangReply(
      'Starting continuous radio news playback.',
      'தொடர் வானொலி செய்தி வாசிப்பு தொடங்குகிறது.',
      'समाचार वाचन शुरू हो रहा है।',
      'నిరంతర రేడియో వార్తలు ప్రారంభమవుతున్నాయి.',
      'টানা রেডিও সংবাদ পাঠ শুরু হচ্ছে।',
      'सलग बातम्या वाचन सुरू होत आहे.'
    );
    return { intent: 'play_radio', reply };
  }

  // 5. Stop / Pause ("Stop")
  if (
    text.includes('stop') || text.includes('pause') || text.includes('quiet') ||
    text.includes('நிறுத்து') || text.includes('போதும்') ||
    text.includes('रुको') || text.includes('बंद करो') ||
    text.includes('ఆపు') || text.includes('చాలు') ||
    text.includes('থামো') || text.includes('বন্ধ করো') ||
    text.includes('थांबा') || text.includes('बंद करा')
  ) {
    const reply = getLangReply(
      'Stopped audio.',
      'ஒலி நிறுத்தப்பட்டது.',
      'ऑडियो बंद कर दिया गया है।',
      'ఆడియో ఆపివేయబడింది.',
      'অডিও বন্ধ করা হয়েছে।',
      'ऑडिओ थांबवला आहे.'
    );
    return { intent: 'stop', reply };
  }

  // 6. Next story ("Next news")
  if (
    text.includes('next') || text.includes('skip') ||
    text.includes('அடுத்த செய்தி') || text.includes('அடுத்து') ||
    text.includes('अगला') || text.includes('आगे बढ़ो') ||
    text.includes('తదుపరి') || text.includes('తరువాత') ||
    text.includes('পরের খবর') || text.includes('সামনে চলো') ||
    text.includes('पुढची बातमी') || text.includes('पुढे चला')
  ) {
    const reply = getLangReply(
      'Moving to next story.',
      'அடுத்த செய்திக்கு செல்கிறது.',
      'अगली खबर पर जा रहे हैं।',
      'తదుపరి వార్తకు వెళ్తున్నాము.',
      'পরবর্তী খবরে যাচ্ছি।',
      'पुढील बातमीकडे जात आहोत.'
    );
    return { intent: 'next', reply };
  }

  // 7. Pictorial Categories: Agriculture, Weather, Alerts, Health
  if (
    text.includes('agriculture') || text.includes('farming') || text.includes('farmer') || text.includes('crop') ||
    text.includes('விவசாயம்') || text.includes('பயிர்') ||
    text.includes('कृषि') || text.includes('खेती') || text.includes('किसान') ||
    text.includes('వ్యవసాయం') || text.includes('రైతు') ||
    text.includes('কৃষি') || text.includes('চাষাবাদ') ||
    text.includes('शेती') || text.includes('शेतकरी')
  ) {
    const reply = getLangReply(
      'Showing Agriculture and farming updates.',
      'விவசாயம் மற்றும் பயிர் செய்திகளை காண்பிக்கிறேன்.',
      'कृषि और खेती के समाचार दिखाए जा रहे हैं।',
      'వ్యవసాయ వార్తలు చూపబడుతున్నాయి.',
      'কৃষি সম্পর্কিত সংবাদ দেখানো হচ্ছে।',
      'शेती विषयक बातम्या दाखवत आहोत.'
    );
    return { intent: 'filter_category', category: 'agriculture', reply };
  }

  if (
    text.includes('weather') || text.includes('rain') || text.includes('cyclone') || text.includes('storm') ||
    text.includes('வானிலை') || text.includes('மழை') || text.includes('புயல்') ||
    text.includes('मौसम') || text.includes('बारिश') || text.includes('तूफान') ||
    text.includes('వాతావరణం') || text.includes('వర్షం') || text.includes('తుఫాను') ||
    text.includes('আবহাওয়া') || text.includes('বৃষ্টি') || text.includes('ঝড়') ||
    text.includes('हवामान') || text.includes('पाऊस') || text.includes('वादळ')
  ) {
    const reply = getLangReply(
      'Showing Weather and rain updates.',
      'வானிலை மற்றும் மழை செய்திகளை காண்பிக்கிறேன்.',
      'मौसम और बारिश के समाचार दिखाए जा रहे हैं।',
      'వాతావరణ సమాచారం చూపబడుతోంది.',
      'আবহাওয়া ও বৃষ্টির খবর দেখানো হচ্ছে।',
      'हवामान आणि पावसाच्या बातम्या दाखवत आहोत.'
    );
    return { intent: 'filter_category', category: 'weather', reply };
  }

  if (
    text.includes('health') || text.includes('hospital') || text.includes('medicine') || text.includes('doctor') ||
    text.includes('சுகாதாரம்') || text.includes('மருத்துவம்') ||
    text.includes('स्वास्थ्य') || text.includes('चिकित्सा') || text.includes('दवा') ||
    text.includes('ఆరోగ్యం') || text.includes('వైద్యం') ||
    text.includes('স্বাস্থ্য') || text.includes('চিকিৎসা') ||
    text.includes('आरोग्य') || text.includes('वैद्यकीय')
  ) {
    const reply = getLangReply(
      'Showing Health and medical updates.',
      'சுகாதாரம் மற்றும் மருத்துவ செய்திகளை காண்பிக்கிறேன்.',
      'स्वास्थ्य और चिकित्सा से जुड़े समाचार दिखाए जा रहे हैं।',
      'ఆరోగ్య సమాచారం చూపబడుతోంది.',
      'স্বাস্থ্য সংক্রান্ত খবর দেখানো হচ্ছে।',
      'आरोग्य विषयक बातम्या दाखवत आहोत.'
    );
    return { intent: 'filter_category', category: 'health', reply };
  }

  // 8. Read Alerts
  if (
    text.includes('alert') || text.includes('warning') || text.includes('danger') ||
    text.includes('எச்சரிக்கை') || text.includes('ஆபத்து') ||
    text.includes('अलर्ट') || text.includes('चेतावनी') ||
    text.includes('హెచ్చరిక') || text.includes('ప్రమాదం') ||
    text.includes('সতর্কতা') || text.includes('বিপদ') ||
    text.includes('धोका') || text.includes('इशारा')
  ) {
    const reply = getLangReply(
      'Reading active emergency alerts in your area.',
      'நடப்பு அவசர எச்சரிக்கைகளை வாசிக்கிறேன்.',
      'सक्रिय आपातकालीन अलर्ट पढ़े जा रहे हैं।',
      'మీ ప్రాంతంలోని హెచ్చరికలు చదువుతున్నాను.',
      'সক্রিয় সতর্কবার্তা পড়া হচ্ছে।',
      'आपल्या भागातील आणीबाणीचे इशारे वाचत आहे.'
    );
    return { intent: 'read_alerts', reply };
  }

  // 9. Easy Mode / Simple UI Mode
  if (
    text.includes('easy mode') || text.includes('simple mode') || text.includes('big button') ||
    text.includes('எளிய முறை') || text.includes('பெரிய எழுத்து') ||
    text.includes('सरल मोड') || text.includes('ईजी मोड')
  ) {
    const reply = getLangReply(
      'Switching to Easy Mode.',
      'எளிய பார்வை முறைக்கு மாற்றப்படுகிறது.',
      'सरल मोड सक्रिय किया जा रहा है।',
      'సులభమైన మోడ్‌కు మారుస్తున్నాను.',
      'সহজ মোড চালু করা হচ্ছে।',
      'सोप्या मोडमध्ये बदलत आहे.'
    );
    return { intent: 'easy_mode', reply };
  }

  // 10. Location-based matching: "I am from Chennai", "Show local news", etc.
  for (const loc of LOCATIONS) {
    for (const name of loc.names) {
      if (text.includes(name)) {
        let reply = `Location set to ${loc.key.toUpperCase()}. Fetching your local news feed.`;
        if (currentLanguage === 'ta') reply = `${loc.key.toUpperCase()} பகுதி தேர்ந்தெடுக்கப்பட்டது. உங்கள் உள்ளூர் செய்திகளை ஏற்றுகிறேன்.`;
        if (currentLanguage === 'hi') reply = `${loc.key.toUpperCase()} क्षेत्र चुना गया। आपके स्थानीय समाचार लोड हो रहे हैं।`;
        if (currentLanguage === 'te') reply = `${loc.key.toUpperCase()} ప్రాంతం ఎంపిక చేయబడింది. స్థానిక వార్తలు వస్తున్నాయి.`;
        if (currentLanguage === 'bn') reply = `${loc.key.toUpperCase()} অঞ্চল নির্বাচিত। স্থানীয় খবর লোড হচ্ছে।`;
        if (currentLanguage === 'mr') reply = `${loc.key.toUpperCase()} भाग निवडला गेला. स्थानिक बातम्या लोड होत आहेत.`;

        return {
          intent: 'set_location',
          location: loc.key,
          reply
        };
      }
    }
  }

  // Fallback search or query
  let reply = `Searching news for "${transcript}".`;
  if (currentLanguage === 'ta') reply = `"${transcript}" குறித்து தேடுகிறேன்.`;
  if (currentLanguage === 'hi') reply = `"${transcript}" के बारे में खोजा जा रहा है।`;
  if (currentLanguage === 'te') reply = `"${transcript}" గురించి వెతుకుతున్నాను.`;
  if (currentLanguage === 'bn') reply = `"${transcript}" সম্পর্কে অনুসন্ধান করা হচ্ছে।`;
  if (currentLanguage === 'mr') reply = `"${transcript}" संदर्भात शोधत आहे.`;

  return {
    intent: 'search',
    query: transcript,
    reply
  };
}

// ============================================================================
// 4. CONTINUOUS NEWS PLAY MODE (RADIO ENGINE)
// ============================================================================

export class RadioEngine {
  constructor() {
    this.playlist = [];
    this.currentIndex = 0;
    this.isPlaying = false;
    this.isPaused = false;
    this.language = 'en';
    this.onStateChange = null;
    this.timer = null;
  }

  init(playlist = [], language = 'en', onStateChange = null) {
    this.playlist = playlist;
    this.language = language;
    this.onStateChange = onStateChange;
    this.currentIndex = 0;
  }

  start() {
    if (!this.playlist || this.playlist.length === 0) return;
    this.isPlaying = true;
    this.isPaused = false;
    this.playCurrentStory();
  }

  playCurrentStory() {
    if (!this.isPlaying || this.currentIndex >= this.playlist.length) {
      this.stop();
      return;
    }

    const item = this.playlist[this.currentIndex];
    this.notifyState();

    const storyNumber = this.currentIndex + 1;
    const totalStories = this.playlist.length;

    let intro = `Story ${storyNumber} of ${totalStories}. `;
    if (this.language === 'ta') intro = `செய்தி ${storyNumber} / ${totalStories}. `;
    if (this.language === 'hi') intro = `खबर नंबर ${storyNumber} / कुल ${totalStories}. `;
    if (this.language === 'te') intro = `వార్త ${storyNumber} / మొత్తం ${totalStories}. `;
    if (this.language === 'bn') intro = `সংবাদ ${storyNumber} / মোট ${totalStories}. `;
    if (this.language === 'mr') intro = `बातमी क्रमांक ${storyNumber} / एकूण ${totalStories}. `;

    const cleanTitle = (item.title || '').split(' - ')[0];
    const sourceInfo = item.source ? `Reported by ${item.source}. ` : '';
    const desc = item.description ? `${item.description}. ` : '';

    const textToRead = `${intro} ${cleanTitle}. ${sourceInfo} ${desc}`;

    speakInLanguage(textToRead, {
      language: this.language,
      rate: 0.95,
      onEnd: () => {
        if (!this.isPlaying) return;

        // Brief delay before moving to next story
        this.timer = setTimeout(() => {
          if (!this.isPlaying) return;
          this.next();
        }, 1800);
      },
      onError: () => {
        if (!this.isPlaying) return;
        this.next();
      }
    });
  }

  repeatCurrentStory() {
    if (this.timer) clearTimeout(this.timer);
    stopSpeaking();
    this.playCurrentStory();
  }

  next() {
    if (this.timer) clearTimeout(this.timer);
    if (this.currentIndex < this.playlist.length - 1) {
      this.currentIndex++;
      this.playCurrentStory();
    } else {
      let fin = 'All top news dispatches have been read.';
      if (this.language === 'ta') fin = 'அனைத்து முக்கிய செய்திகளும் வாசிக்கப்பட்டன.';
      if (this.language === 'hi') fin = 'सभी मुख्य समाचार समाप्त हो गए हैं।';
      if (this.language === 'te') fin = 'అన్ని ముఖ్య వార్తలు ముగిశాయి.';
      if (this.language === 'bn') fin = 'সব প্রধান সংবাদ শেষ হয়েছে।';
      if (this.language === 'mr') fin = 'सर्व मुख्य बातम्या वाचून झाल्या आहेत.';
      speakInLanguage(fin, { language: this.language });
      this.stop();
    }
  }

  prev() {
    if (this.timer) clearTimeout(this.timer);
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.playCurrentStory();
    }
  }

  pause() {
    this.isPaused = true;
    if (this.timer) clearTimeout(this.timer);
    stopSpeaking();
    this.notifyState();
  }

  resume() {
    this.isPaused = false;
    this.playCurrentStory();
  }

  stop() {
    this.isPlaying = false;
    this.isPaused = false;
    if (this.timer) clearTimeout(this.timer);
    stopSpeaking();
    this.notifyState();
  }

  getCurrentStory() {
    return this.playlist[this.currentIndex] || null;
  }

  notifyState() {
    if (this.onStateChange) {
      this.onStateChange({
        isPlaying: this.isPlaying,
        isPaused: this.isPaused,
        currentIndex: this.currentIndex,
        total: this.playlist.length,
        currentStory: this.getCurrentStory()
      });
    }
  }
}

export const globalRadioEngine = new RadioEngine();

// ============================================================================
// 5. GEOLOCATION & REVERSE GEOCODING
// ============================================================================

/**
 * Detect user's current city and nation via browser Geolocation
 */
export async function detectUserLocation() {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve({ success: false, city: 'chennai', country: 'india', label: 'Chennai, India (Default)' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          // Free reverse geocode from bigdatacloud or openstreetmap
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          if (res.ok) {
            const data = await res.json();
            const city = (data.city || data.locality || data.principalSubdivision || 'chennai').toLowerCase();
            const country = (data.countryName || 'India').toLowerCase();
            resolve({
              success: true,
              city,
              country,
              latitude,
              longitude,
              label: `${data.city || data.locality || 'Local'}, ${data.countryName || 'India'}`
            });
            return;
          }
        } catch (e) {
          console.warn('Reverse geocode lookup error:', e);
        }

        resolve({
          success: true,
          city: 'chennai',
          country: 'india',
          label: 'Chennai, India'
        });
      },
      (err) => {
        console.warn('Geolocation denied or failed:', err.message);
        resolve({
          success: false,
          city: 'chennai',
          country: 'india',
          label: 'Chennai, India'
        });
      },
      { timeout: 8000, enableHighAccuracy: false }
    );
  });
}

// ============================================================================
// 6. LIVE AUDIO ALERTS & DESKTOP PUSH NOTIFICATIONS
// ============================================================================

export async function requestNotificationPermission() {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'default') {
      const perm = await Notification.requestPermission();
      return perm === 'granted';
    }
    return Notification.permission === 'granted';
  }
  return false;
}

/**
 * Trigger an audio alert chime and voice reading
 */
export function triggerAudioAlert(alertItem, language = 'en') {
  playEarcon('alert');

  let alertPrefix = 'Attention! Critical alert.';
  if (language === 'ta') alertPrefix = 'கவனம்! அவசர எச்சரிக்கை.';
  if (language === 'hi') alertPrefix = 'सावधान! महत्वपूर्ण अलर्ट.';
  if (language === 'te') alertPrefix = 'జాగ్రత్త! అత్యవసర హెచ్చరిక.';
  if (language === 'bn') alertPrefix = 'মনোযোগ দিন! জরুরি সতর্কতা.';
  if (language === 'mr') alertPrefix = 'लक्ष द्या! आणीबाणीचा इशारा.';

  const fullText = `${alertPrefix} ${alertItem.message || 'Threat flagged in this region.'}`;
  
  setTimeout(() => {
    speakInLanguage(fullText, { language, rate: 1.05 });
  }, 400);

  // Desktop notification if permitted
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification('🚨 UGI Crisis Alert', {
        body: alertItem.message,
        icon: '/favicon.ico'
      });
    } catch (e) {}
  }
}
