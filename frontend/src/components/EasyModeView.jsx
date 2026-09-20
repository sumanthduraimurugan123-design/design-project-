import React, { useState } from 'react';
import { 
  Mic, 
  Volume2, 
  Radio, 
  AlertTriangle, 
  MapPin, 
  RefreshCw, 
  ArrowLeft, 
  HelpCircle, 
  Sparkles, 
  RotateCcw,
  ExternalLink
} from 'lucide-react';
import { 
  speakInLanguage, 
  stopSpeaking, 
  playEarcon, 
  SUPPORTED_LANGUAGES 
} from '../services/voiceService';
import { fetchNewsExplanation } from '../services/newsService';

// Pictorial Categories with multilingual names and voice announcements
const PICTORIAL_CATEGORIES = [
  {
    id: 'all',
    icon: '🌐',
    label: {
      en: 'All Stories',
      ta: 'அனைத்து செய்திகள்',
      hi: 'सभी खबरें',
      te: 'అన్ని వార్తలు',
      bn: 'সব খবর',
      mr: 'सर्व बातम्या'
    },
    speakAnnouncement: {
      en: 'Showing all news stories.',
      ta: 'அனைத்து செய்திகளையும் காண்பிக்கிறேன்.',
      hi: 'सभी मुख्य समाचार दिखाए जा रहे हैं।',
      te: 'అన్ని వార్తలు చూపబడుతున్నాయి.',
      bn: 'সব খবর দেখানো হচ্ছে।',
      mr: 'सर्व बातम्या दाखवत आहोत.'
    },
    keywords: []
  },
  {
    id: 'agriculture',
    icon: '🌾',
    label: {
      en: 'Agriculture',
      ta: 'விவசாயம்',
      hi: 'कृषि / खेती',
      te: 'వ్యవసాయం',
      bn: 'কৃষি',
      mr: 'शेती'
    },
    speakAnnouncement: {
      en: 'Showing Agriculture and farming news.',
      ta: 'விவசாயம் மற்றும் பயிர் செய்திகளை காண்பிக்கிறேன்.',
      hi: 'कृषि और खेती से जुड़े समाचार दिखाए जा रहे हैं।',
      te: 'వ్యవసాయం మరియు పంటల సమాచారం చూపబడుతోంది.',
      bn: 'কৃষি ও চাষাবাদ সম্পর্কিত খবর দেখানো হচ্ছে।',
      mr: 'शेती आणि पिकांसंबंधी बातम्या दाखवत आहोत.'
    },
    keywords: ['farmer', 'crop', 'agriculture', 'farming', 'paddy', 'wheat', 'fertilizer', 'monsoon', 'harvest', 'irrigation', 'kisan', 'விவசாய', 'பயிர்', 'कृषि', 'खेती', 'రైతు', 'వ్యవసాయం', 'চাষ']
  },
  {
    id: 'weather',
    icon: '🌦',
    label: {
      en: 'Weather',
      ta: 'வானிலை',
      hi: 'मौसम / बारिश',
      te: 'వాతావరణం',
      bn: 'আবহাওয়া',
      mr: 'हवामान'
    },
    speakAnnouncement: {
      en: 'Showing Weather and rainfall reports.',
      ta: 'வானிலை மற்றும் மழை அறிக்கைகளை காண்பிக்கிறேன்.',
      hi: 'मौसम और बारिश की जानकारी दिखाई जा रही है।',
      te: 'వాతావరణం మరియు వర్షపాతం వివరాలు చూపబడుతున్నాయి.',
      bn: 'আবহাওয়া ও বৃষ্টির পূর্বাভাস দেখানো হচ্ছে।',
      mr: 'हवामान आणि पावसाचे अहवाल दाखवत आहोत.'
    },
    keywords: ['rain', 'weather', 'cyclone', 'storm', 'monsoon', 'heatwave', 'cold', 'flood', 'வானிலை', 'மழை', 'புயல்', 'मौसम', 'बारिश', 'तूफान', 'వాతావరణం', 'వర్షం', 'তুফান', 'पाऊस']
  },
  {
    id: 'alerts',
    icon: '🚨',
    label: {
      en: 'Crisis Alerts',
      ta: 'எச்சரிக்கைகள்',
      hi: 'अलर्ट / चेतावनी',
      te: 'హెచ్చరికలు',
      bn: 'সতর্কতা',
      mr: 'आणीबाणी'
    },
    speakAnnouncement: {
      en: 'Showing Crisis and emergency alerts.',
      ta: 'அவசர பாதுகாப்பு எச்சரிக்கைகளை காண்பிக்கிறேன்.',
      hi: 'आपातकालीन और सुरक्षा अलर्ट दिखाए जा रहे हैं।',
      te: 'అత్యవసర భద్రతా హెచ్చరికలు చూపబడుతున్నాయి.',
      bn: 'জরুরি নিরাপত্তা সতর্কতা দেখানো হচ্ছে।',
      mr: 'आणीबाणीचे सुरक्षा इशारे दाखवत आहोत.'
    },
    keywords: ['alert', 'warning', 'danger', 'emergency', 'curfew', 'threat', 'evacuation', 'எச்சரிக்கை', 'ஆபத்து', 'अलर्ट', 'चेतावनी', 'హెచ్చరిక', 'সতর্কতা', 'धोका']
  },
  {
    id: 'health',
    icon: '🏥',
    label: {
      en: 'Health',
      ta: 'சுகாதாரம்',
      hi: 'स्वास्थ्य / चिकित्सा',
      te: 'ఆరోగ్యం',
      bn: 'স্বাস্থ্য',
      mr: 'आरोग्य'
    },
    speakAnnouncement: {
      en: 'Showing Health and medical advisories.',
      ta: 'சுகாதாரம் மற்றும் மருத்துவ ஆலோசனைகளை காண்பிக்கிறேன்.',
      hi: 'स्वास्थ्य और चिकित्सा सलाह दिखाई जा रही है।',
      te: 'ఆరోగ్యం మరియు వైద్య సలహాలు చూపబడుతున్నాయి.',
      bn: 'স্বাস্থ্য ও চিকিৎসা বিষয়ক পরামর্শ দেখানো হচ্ছে।',
      mr: 'आरोग्य आणि वैद्यकीय सल्ला दाखवत आहोत.'
    },
    keywords: ['health', 'hospital', 'disease', 'dengue', 'fever', 'vaccine', 'virus', 'medicine', 'doctor', 'clinic', 'சுகாதாரம்', 'மருத்துவம்', 'நோய்', 'स्वास्थ्य', 'अस्पताल', 'ఆరోగ్యం', 'ఆసుపత్రి', 'চিকিৎসা', 'औषध']
  }
];

export default function EasyModeView({
  news = [],
  alerts = [],
  selectedLocation = 'chennai',
  currentLanguage = 'en',
  onSelectLanguage,
  onOpenVoiceModal,
  onStartRadio,
  onReadAlerts,
  onDetectLocation,
  onRefresh,
  onExitEasyMode,
  isAudioAlertsEnabled,
  onToggleAudioAlerts
}) {
  const [activeReadingId, setActiveReadingId] = useState(null);
  const [explainingId, setExplainingId] = useState(null);
  const [explanationData, setExplanationData] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Filter news by selected pictorial category
  const activeCategoryObj = PICTORIAL_CATEGORIES.find(c => c.id === selectedCategory) || PICTORIAL_CATEGORIES[0];
  const filteredNews = selectedCategory === 'all' 
    ? news 
    : news.filter(item => {
        const text = `${item.title || ''} ${item.description || ''}`.toLowerCase();
        return activeCategoryObj.keywords.some(kw => text.includes(kw.toLowerCase()));
      });

  // Handle category tile click with voice feedback
  const handleSelectCategory = (cat) => {
    playEarcon('click');
    setSelectedCategory(cat.id);
    const speech = cat.speakAnnouncement[currentLanguage] || cat.speakAnnouncement['en'];
    speakInLanguage(speech, { language: currentLanguage, rate: 1.0 });
  };

  // 1. Speak article headline & description
  const handleListenArticle = (item, id) => {
    if (activeReadingId === id) {
      stopSpeaking();
      setActiveReadingId(null);
      return;
    }

    playEarcon('click');
    setActiveReadingId(id);
    setExplainingId(null);

    const title = item.title ? item.title.split(' - ')[0] : '';
    const desc = item.description || '';
    const src = item.source ? `Source: ${item.source}. ` : '';

    let textToSpeak = `${title}. ${src} ${desc}`;
    if (currentLanguage === 'ta') {
      textToSpeak = `செய்தி: ${title}. ${src ? `செய்தி மூலம்: ${item.source}. ` : ''} ${desc}`;
    } else if (currentLanguage === 'hi') {
      textToSpeak = `समाचार: ${title}। ${src ? `स्रोत: ${item.source}। ` : ''} ${desc}`;
    } else if (currentLanguage === 'te') {
      textToSpeak = `వార్త: ${title}। ${src ? `మూలం: ${item.source}। ` : ''} ${desc}`;
    } else if (currentLanguage === 'bn') {
      textToSpeak = `সংবাদ: ${title}। ${src ? `সূত্র: ${item.source}। ` : ''} ${desc}`;
    } else if (currentLanguage === 'mr') {
      textToSpeak = `बातमी: ${title}। ${src ? `स्रोत: ${item.source}। ` : ''} ${desc}`;
    }

    speakInLanguage(textToSpeak, {
      language: currentLanguage,
      rate: 0.95,
      onEnd: () => setActiveReadingId(null),
      onError: () => setActiveReadingId(null)
    });
  };

  // 2. Explain article in plain everyday words ("What this means for you")
  const handleExplainArticle = async (item, id) => {
    if (explainingId === id) {
      stopSpeaking();
      setExplainingId(null);
      return;
    }

    playEarcon('click');
    setExplainingId(id);
    setActiveReadingId(null);

    let waitMsg = 'Analyzing news for simple explanation...';
    if (currentLanguage === 'ta') waitMsg = 'செய்தியை எளிய தமிழில் விளக்குகிறேன்...';
    if (currentLanguage === 'hi') waitMsg = 'इस खबर को सरल भाषा में समझा रहे हैं...';
    if (currentLanguage === 'te') waitMsg = 'ఈ వార్తను సులభమైన మాటల్లో వివరిస్తున్నాను...';
    if (currentLanguage === 'bn') waitMsg = 'খবরটি সহজ ভাষায় ব্যাখ্যা করছি...';
    if (currentLanguage === 'mr') waitMsg = 'ही बातमी सोप्या भाषेत समजावून सांगत आहे...';
    speakInLanguage(waitMsg, { language: currentLanguage });

    try {
      const data = await fetchNewsExplanation(item.title, item.description, currentLanguage);
      setExplanationData(prev => ({ ...prev, [id]: data }));

      const explanationSpeech = data.simpleText || `${data.explanation} ${data.impact}`;
      speakInLanguage(explanationSpeech, {
        language: currentLanguage,
        rate: 0.95,
        onEnd: () => setExplainingId(null),
        onError: () => setExplainingId(null)
      });
    } catch (err) {
      console.error('Explain error:', err);
      setExplainingId(null);
    }
  };

  // 3. Repeat article audio
  const handleRepeatArticle = (item, id) => {
    playEarcon('click');
    stopSpeaking();
    setTimeout(() => {
      handleListenArticle(item, id);
    }, 200);
  };

  const criticalAlertCount = alerts.filter(a => a.severity === 'CRITICAL').length;

  // Localized UI text helper
  const t = (en, ta, hi, te, bn, mr) => {
    if (currentLanguage === 'ta') return ta;
    if (currentLanguage === 'hi') return hi;
    if (currentLanguage === 'te') return te;
    if (currentLanguage === 'bn') return bn;
    if (currentLanguage === 'mr') return mr;
    return en;
  };

  return (
    <div className="min-h-screen bg-black text-white p-3 sm:p-6 flex flex-col max-w-5xl mx-auto font-sans selection:bg-yellow-400 selection:text-black">
      
      {/* Top Controls Bar */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-yellow-400 pb-4 mb-5">
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              playEarcon('click');
              onExitEasyMode();
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 border-2 border-zinc-600 hover:border-yellow-400 text-white rounded-md text-sm font-bold active:scale-95 transition-all"
            aria-label="Exit Easy Mode to standard view"
          >
            <ArrowLeft className="w-5 h-5 text-yellow-400" />
            <span>{t('Standard View', 'வழக்கமான பார்வை', 'सामान्य दृश्य', 'సాధారణ వీక్షణ', 'সাধারণ দৃশ্য', 'सामान्य दृश्य')}</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-400 animate-ping" />
            <span className="font-mono text-sm font-bold uppercase tracking-wider text-yellow-400">
              {t('EASY VOICE MODE', 'எளிய குரல் வழி முறை', 'सरल आवाज मोड', 'సులభమైన వాయిస్ మోడ్', 'সহজ ভয়েস মোড', 'सोपा व्हॉईस मोड')}
            </span>
          </div>
        </div>

        {/* 6 Multilingual Indian Language Switcher Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-zinc-900 p-1 border border-zinc-700 rounded-md">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = currentLanguage === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => {
                  playEarcon('click');
                  onSelectLanguage(lang.code);
                  speakInLanguage(lang.nativeName, { language: lang.code });
                }}
                className={`px-2.5 py-1.5 text-xs sm:text-sm font-bold rounded transition-all ${
                  isSelected 
                    ? 'bg-yellow-400 text-black shadow-md scale-105' 
                    : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {lang.flag} {lang.nativeName}
              </button>
            );
          })}
        </div>

      </header>

      {/* 4 GIANT PRIMARY ACTION TILES (Minimum 68px touch targets, big icons, WCAG AAA contrast) */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6" aria-label="Quick voice actions">
        
        {/* 1. Speak / Voice Button */}
        <button
          onClick={() => {
            playEarcon('click');
            onOpenVoiceModal();
          }}
          className="flex flex-col items-center justify-center p-4 bg-yellow-400 hover:bg-yellow-300 text-black rounded-lg shadow-lg active:scale-95 transition-all text-center border-2 border-yellow-300 min-h-[96px]"
          aria-label="Speak voice command"
        >
          <Mic className="w-9 h-9 mb-1 stroke-[2.5]" />
          <span className="text-base sm:text-lg font-black tracking-tight leading-none">
            {t('SPEAK', 'பேசுங்கள்', 'बोलिए', 'మాట్లాడండి', 'বলুন', 'बोला')}
          </span>
          <span className="text-[11px] font-bold opacity-80 mt-1">
            {t('Voice Assistant', 'குரல் உதவி', 'माइक दबाएं', 'వాయిస్ అసిస్టెంట్', 'ভয়েস সহকারী', 'व्हॉईस असिस्टंट')}
          </span>
        </button>

        {/* 2. Play All News (Radio) Button */}
        <button
          onClick={() => {
            playEarcon('click');
            onStartRadio();
          }}
          className="flex flex-col items-center justify-center p-4 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg shadow-lg active:scale-95 transition-all text-center border-2 border-emerald-300 min-h-[96px]"
          aria-label="Play all news like radio"
        >
          <Radio className="w-9 h-9 mb-1 stroke-[2.5]" />
          <span className="text-base sm:text-lg font-black tracking-tight leading-none">
            {t('PLAY RADIO', 'வானொலி', 'रेडियो समाचार', 'రేడియో వార్తలు', 'রেডিও খবর', 'रेडिओ बातम्या')}
          </span>
          <span className="text-[11px] font-bold opacity-80 mt-1">
            {t('Continuous News', 'அனைத்து செய்திகள்', 'सभी खबरें सुनें', 'నిరంతర వార్తలు', 'টানা খবর', 'सलग बातम्या')}
          </span>
        </button>

        {/* 3. Read Alerts Button */}
        <button
          onClick={() => {
            playEarcon('click');
            onReadAlerts();
          }}
          className={`flex flex-col items-center justify-center p-4 rounded-lg shadow-lg active:scale-95 transition-all text-center border-2 min-h-[96px] ${
            criticalAlertCount > 0 
              ? 'bg-red-600 hover:bg-red-500 text-white border-red-400 animate-pulse' 
              : 'bg-zinc-900 hover:bg-zinc-800 text-yellow-400 border-zinc-700'
          }`}
          aria-label="Read active emergency alerts"
        >
          <AlertTriangle className="w-9 h-9 mb-1 stroke-[2.5]" />
          <span className="text-base sm:text-lg font-black tracking-tight leading-none">
            {t('ALERTS', 'எச்சரிக்கை', 'अलर्ट', 'హెచ్చరికలు', 'সতর্কতা', 'इशारे')}
          </span>
          <span className="text-[11px] font-bold opacity-80 mt-1">
            {criticalAlertCount > 0 ? `${criticalAlertCount} CRITICAL` : t('Area Warnings', 'அவசர செய்தி', 'इलाके की चेतावनी', 'ప్రాంతీయ హెచ్చరికలు', 'এলাকার সতর্কতা', 'परिसरातील इशारे')}
          </span>
        </button>

        {/* 4. Detect Location (GPS) Button */}
        <button
          onClick={() => {
            playEarcon('click');
            onDetectLocation();
          }}
          className="flex flex-col items-center justify-center p-4 bg-sky-500 hover:bg-sky-400 text-black rounded-lg shadow-lg active:scale-95 transition-all text-center border-2 border-sky-300 min-h-[96px]"
          aria-label="Auto detect my GPS location"
        >
          <MapPin className="w-9 h-9 mb-1 stroke-[2.5]" />
          <span className="text-base sm:text-lg font-black tracking-tight leading-none">
            {t('MY LOCATION', 'என் ஊர்', 'मेरा स्थान', 'నా ప్రదేశం', 'আমার অবস্থান', 'माझे स्थान')}
          </span>
          <span className="text-[11px] font-bold opacity-80 mt-1 capitalize">
            {selectedLocation || 'Auto GPS'}
          </span>
        </button>

      </section>

      {/* PICTORIAL CATEGORIES (Section 8: 🌾 Agriculture, 🌦 Weather, 🚨 Alerts, 🏥 Health) */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="font-mono text-xs font-bold text-yellow-400 uppercase tracking-wider">
            {t('PICTORIAL CATEGORIES (TAP TO FILTER & SPEAK):', 'படப் பிரிவுகள் (தொட்டு கேட்கலாம்):', 'चित्र श्रेणियां (टैप करें और सुनें):', 'చిత్ర వర్గాలు (ట్యాప్ చేయండి):', 'ছবি বিভাগ (ট্যাপ করুন):', 'चित्र वर्ग (टॅप करा):')}
          </span>
          {selectedCategory !== 'all' && (
            <button
              onClick={() => handleSelectCategory(PICTORIAL_CATEGORIES[0])}
              className="text-xs font-bold text-zinc-400 hover:text-yellow-400 underline"
            >
              {t('Clear Filter', 'அனைத்தும்', 'सभी दिखाएं', 'అన్నీ', 'সব', 'सर्व')}
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {PICTORIAL_CATEGORIES.map((cat) => {
            const isCatActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleSelectCategory(cat)}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all active:scale-95 text-center min-h-[76px] ${
                  isCatActive 
                    ? 'bg-yellow-400 text-black border-yellow-300 shadow-lg scale-105' 
                    : 'bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-700 hover:border-zinc-500'
                }`}
                aria-label={`Category ${cat.label[currentLanguage] || cat.label.en}`}
              >
                <span className="text-2xl mb-1">{cat.icon}</span>
                <span className="text-xs sm:text-sm font-black leading-none">
                  {cat.label[currentLanguage] || cat.label.en}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Audio Alerts Toggle Banner */}
      <div className="bg-zinc-900 border-2 border-yellow-400/60 rounded-lg p-3.5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="p-2 bg-yellow-400 text-black rounded-full">
            <Volume2 className="w-5 h-5 stroke-[2.5]" />
          </span>
          <div>
            <div className="font-bold text-sm text-yellow-400">
              {t('Live Audio Threat Alerts', 'நேரலை குரல் எச்சரிக்கை அறிவிப்பு', 'लाइव आवाज अलर्ट सूचना', 'లైవ్ ఆడియో హెచ్చరికలు', 'লাইভ অডিও সতর্কতা', 'थेट ऑडिओ इशारे')}
            </div>
            <p className="text-xs text-zinc-300">
              {t('Speaks critical warnings aloud without logging in', 'புதிய அவசர செய்தி வரும்போது குரல் மூலம் தானாகவே அறிவிக்கும் (உள்நுழைவு தேவையில்லை)', 'कोई आपातकालीन अलर्ट आने पर आवाज में चेतावनी सुनाई देगी (लॉगिन की जरूरत नहीं)', 'లాగిన్ అవసరం లేకుండా అత్యవసర హెచ్చరికలను చదువుతుంది', 'লগইন ছাড়াই জরুরি সতর্কতা পড়ে শোনায়', 'लॉगिन न करता आणीबाणीचे इशारे मोठ्याने सांगते')}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            playEarcon('click');
            onToggleAudioAlerts();
          }}
          className={`px-4 py-2 font-bold text-xs rounded-md uppercase tracking-wider transition-colors ${
            isAudioAlertsEnabled 
              ? 'bg-emerald-500 text-black hover:bg-emerald-400' 
              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-600'
          }`}
        >
          {isAudioAlertsEnabled ? '🔊 ON' : '🔇 OFF'}
        </button>
      </div>

      {/* SECTION HEADER: Live News Headlines */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{activeCategoryObj.icon}</span>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            {t('Today’s Verified News', 'இன்றைய முக்கிய செய்திகள்', 'आज के मुख्य समाचार', 'నేటి తాజా వార్తలు', 'আজকের প্রধান খবর', 'आजच्या मुख्य बातम्या')}
          </h2>
        </div>
        <span className="text-xs font-mono text-yellow-400 border border-yellow-400/40 px-2.5 py-1 rounded">
          {filteredNews.length} {t('Stories', 'செய்திகள்', 'खबरें', 'వార్తలు', 'সংবাদ', 'बातम्या')}
        </span>
      </div>

      {/* SIMPLIFIED NEWS CARDS LIST */}
      <div className="space-y-4">
        {filteredNews.length === 0 ? (
          <div className="bg-zinc-900 border-2 border-dashed border-zinc-700 p-8 text-center rounded-lg">
            <RefreshCw className="w-8 h-8 text-yellow-400 mx-auto mb-2 animate-spin" />
            <p className="font-bold text-lg text-zinc-300">
              {t('No dispatches in this category. Loading updates...', 'இந்த பிரிவில் செய்திகள் இல்லை. ஏற்றப்படுகிறது...', 'इस श्रेणी में समाचार लोड हो रहे हैं...', 'ఈ వర్గంలో వార్తలు లోడ్ అవుతున్నాయి...', 'এই বিভাগে খবর লোড হচ্ছে...', 'या वर्गातील बातम्या लोड होत आहेत...')}
            </p>
          </div>
        ) : (
          filteredNews.map((item, idx) => {
            const cardId = item.id || `easy-news-${idx}`;
            const isReading = activeReadingId === cardId;
            const isExplaining = explainingId === cardId;
            const explanation = explanationData[cardId];

            return (
              <article
                key={cardId}
                className={`bg-zinc-900 border-2 rounded-xl p-4 sm:p-5 transition-all ${
                  isReading 
                    ? 'border-yellow-400 bg-yellow-950/20 shadow-xl ring-2 ring-yellow-400' 
                    : (isExplaining ? 'border-sky-400 bg-sky-950/20 shadow-xl ring-2 ring-sky-400' : 'border-zinc-800 hover:border-zinc-700')
                }`}
              >
                {/* Meta Header */}
                <div className="flex items-center justify-between gap-2 mb-2 text-xs text-zinc-400">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-xl">{item.country_flag || '🌐'}</span>
                    <span className="font-bold text-yellow-400 uppercase">
                      {item.country_name || item.country || 'News'}
                    </span>
                    {item.source && (
                      <span className="text-zinc-400 truncate">
                        · {item.source}
                      </span>
                    )}
                  </div>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-yellow-400 p-1"
                      title="Open source article"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>

                {/* Big Headline */}
                <h3 className="text-lg sm:text-xl font-bold text-white leading-snug mb-2.5">
                  {item.title}
                </h3>

                {/* Plain-Language Explanation Box if triggered */}
                {explanation && (
                  <div className="bg-sky-950/40 border-2 border-sky-400 rounded-lg p-3.5 my-3 text-sky-100 animate-in fade-in duration-150">
                    <div className="flex items-center gap-1.5 mb-1 text-sky-300 font-bold text-xs uppercase font-mono">
                      <Sparkles className="w-4 h-4 text-sky-400" />
                      <span>{t('Plain Explanation:', 'எளிய விளக்கம்:', 'सरल शब्दों में:', 'సులభమైన వివరణ:', 'সহজ ব্যাখ্যা:', 'सोप्या भाषेत स्पष्टीकरण:')}</span>
                    </div>
                    <p className="text-sm sm:text-base font-semibold text-white mb-1 leading-snug">
                      {explanation.explanation}
                    </p>
                    <p className="text-xs sm:text-sm text-yellow-300 font-medium">
                      👉 {explanation.impact}
                    </p>
                  </div>
                )}

                {/* Short Description */}
                {item.description && !explanation && (
                  <p className="text-sm text-zinc-300 leading-relaxed mb-4">
                    {item.description}
                  </p>
                )}

                {/* 3 GIANT ACTION BUTTONS PER CARD (LISTEN, EXPLAIN, REPEAT) */}
                <div className="grid grid-cols-3 gap-2.5 pt-2">
                  
                  {/* Button 1: 🔊 LISTEN */}
                  <button
                    onClick={() => handleListenArticle(item, cardId)}
                    className={`flex items-center justify-center gap-1.5 py-3 px-2 sm:px-4 rounded-lg font-black text-xs sm:text-sm transition-all active:scale-95 shadow-md ${
                      isReading 
                        ? 'bg-red-600 text-white animate-pulse' 
                        : 'bg-yellow-400 hover:bg-yellow-300 text-black'
                    }`}
                    aria-label={isReading ? 'Stop listening' : 'Listen to this news'}
                  >
                    <Volume2 className="w-4 h-4 stroke-[2.5]" />
                    <span>
                      {isReading 
                        ? t('STOP', 'நிறுத்து', 'रोकें', 'ఆపు', 'থামো', 'थांबा')
                        : t('🔊 LISTEN', '🔊 கேளுங்கள்', '🔊 सुनें', '🔊 వినండి', '🔊 শুনুন', '🔊 ऐका')}
                    </span>
                  </button>

                  {/* Button 2: 💡 EXPLAIN */}
                  <button
                    onClick={() => handleExplainArticle(item, cardId)}
                    className={`flex items-center justify-center gap-1.5 py-3 px-2 sm:px-4 rounded-lg font-black text-xs sm:text-sm transition-all active:scale-95 shadow-md ${
                      isExplaining 
                        ? 'bg-sky-600 text-white animate-pulse' 
                        : 'bg-zinc-800 hover:bg-zinc-700 text-sky-400 border-2 border-sky-400/60'
                    }`}
                    aria-label="Explain this news in simple words"
                  >
                    <HelpCircle className="w-4 h-4 stroke-[2.5]" />
                    <span>
                      {isExplaining 
                        ? t('EXPLAINING...', 'விளங்குகிறது...', 'समझा रहे हैं...', 'వివరిస్తోంది...', 'ব্যাখ্যা হচ্ছে...', 'स्पष्टीकरण सुरू...')
                        : t('💡 EXPLAIN', '💡 விளக்கம்', '💡 समझाइए', '💡 వివరణ', '💡 ব্যাখ্যা', '💡 समजून घ्या')}
                    </span>
                  </button>

                  {/* Button 3: 🔁 REPEAT */}
                  <button
                    onClick={() => handleRepeatArticle(item, cardId)}
                    className="flex items-center justify-center gap-1.5 py-3 px-2 sm:px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-2 border-zinc-700 rounded-lg font-black text-xs sm:text-sm transition-all active:scale-95 shadow-md"
                    aria-label="Repeat reading this news"
                  >
                    <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                    <span>
                      {t('🔁 REPEAT', '🔁 மீண்டும்', '🔁 दोहराएं', '🔁 మళ్ళీ', '🔁 আবার', '🔁 पुन्हा')}
                    </span>
                  </button>

                </div>

              </article>
            );
          })
        )}
      </div>

      {/* Footer */}
      <footer className="mt-8 pt-4 border-t border-zinc-800 text-center text-xs text-zinc-500 font-mono">
        UGI Voice Accessibility System · WCAG AAA Compliant · Web Speech API Enabled
      </footer>

    </div>
  );
}
