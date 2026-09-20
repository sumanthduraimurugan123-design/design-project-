import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from '../components/Navbar';
import AccessibilityToolbar from '../components/AccessibilityToolbar';
import Globe3D from '../components/Globe3D';
import NewsPanel from '../components/NewsPanel';
import AlertSystem from '../components/AlertSystem';
import TelemetryStats from '../components/TelemetryStats';
import PersonaSelector from '../components/PersonaSelector';
import LogsViewer from '../components/LogsViewer';
import VoiceAssistantModal from '../components/VoiceAssistantModal';
import RadioPlayerBar from '../components/RadioPlayerBar';
import EasyModeView from '../components/EasyModeView';
import { fetchNewsStream, fetchActiveAlerts, fetchNewsExplanation } from '../services/newsService';
import { logTelemetryAction } from '../services/supabaseClient';
import { 
  globalRadioEngine, 
  speakInLanguage, 
  stopSpeaking, 
  playEarcon, 
  detectUserLocation, 
  triggerAudioAlert,
  requestNotificationPermission 
} from '../services/voiceService';
import { 
  MapPin, 
  Navigation, 
  Search, 
  Building2, 
  Globe2, 
  Compass, 
  Sparkles, 
  X 
} from 'lucide-react';

const CHENNAI_NEIGHBORHOODS = [
  { id: 'all_chennai', label: 'Chennai Metro', loc: 'chennai', icon: '🏙️' },
  { id: 'velachery', label: 'Velachery', loc: 'velachery', icon: '📍' },
  { id: 'tnagar', label: 'T. Nagar', loc: 't nagar', icon: '🛍️' },
  { id: 'annanagar', label: 'Anna Nagar', loc: 'anna nagar', icon: '🌳' },
  { id: 'adyar', label: 'Adyar', loc: 'adyar', icon: '🌊' },
  { id: 'tambaram', label: 'Tambaram', loc: 'tambaram', icon: '🚆' },
  { id: 'mylapore', label: 'Mylapore', loc: 'mylapore', icon: '🛕' },
  { id: 'omr', label: 'OMR / IT Corridor', loc: 'omr', icon: '💻' },
  { id: 'guindy', label: 'Guindy', loc: 'guindy', icon: '🏭' },
];

export default function Dashboard() {
  // Core Dashboard State
  const [selectedCountry, setSelectedCountry] = useState('global');
  const [selectedLocation, setSelectedLocation] = useState(null); // 'velachery', 't nagar', etc.
  const [customLocationInput, setCustomLocationInput] = useState('');
  const [activeTopic, setActiveTopic] = useState('all');
  const [news, setNews] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState('');
  const [countdown, setCountdown] = useState(30);

  // Voice & Accessibility States
  const [currentLanguage, setCurrentLanguage] = useState('en'); // 'en', 'ta', 'hi'
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isEasyMode, setIsEasyMode] = useState(false);
  const [isAudioAlertsEnabled, setIsAudioAlertsEnabled] = useState(true);
  const [detectedLocationLabel, setDetectedLocationLabel] = useState('Auto');
  const soundedAlertsRef = useRef(new Set());

  // Radio Player State
  const [radioState, setRadioState] = useState({
    isPlaying: false,
    isPaused: false,
    currentIndex: 0,
    total: 0,
    currentStory: null
  });

  // Persona State
  const [persona, setPersona] = useState('Analyst'); // Analyst, Casual user, Accessibility mode
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);

  // Visual Accessibility States
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isLargeText, setIsLargeText] = useState(false);
  const [isCognitiveSimple, setIsCognitiveSimple] = useState(false);

  // Apply accessibility classes to document body
  useEffect(() => {
    if (isHighContrast) {
      document.body.classList.add('high-contrast-mode');
    } else {
      document.body.classList.remove('high-contrast-mode');
    }
  }, [isHighContrast]);

  useEffect(() => {
    if (isLargeText) {
      document.body.classList.add('large-text-mode');
    } else {
      document.body.classList.remove('large-text-mode');
    }
  }, [isLargeText]);

  // Load news and alerts
  const loadTelemetryData = useCallback(async (force = false, overrideCountry = null, overrideLocation = undefined) => {
    setIsRefreshing(true);
    try {
      const locToUse = overrideLocation !== undefined ? overrideLocation : selectedLocation;
      const countryToUse = overrideCountry || selectedCountry;
      const [fetchedNews, fetchedAlerts] = await Promise.all([
        fetchNewsStream(countryToUse, activeTopic, force, locToUse, currentLanguage),
        fetchActiveAlerts(countryToUse)
      ]);

      setNews(fetchedNews);
      setAlerts(fetchedAlerts);
      setLastUpdatedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

      // Check for new critical alerts for audio announcement
      if (isAudioAlertsEnabled && fetchedAlerts && fetchedAlerts.length > 0) {
        const criticalAlerts = fetchedAlerts.filter(a => a.severity === 'CRITICAL');
        for (const cAlert of criticalAlerts) {
          const alertKey = cAlert.id || cAlert.message;
          if (!soundedAlertsRef.current.has(alertKey)) {
            soundedAlertsRef.current.add(alertKey);
            triggerAudioAlert(cAlert, currentLanguage);
            break; // Speak top alert first
          }
        }
      }
    } catch (err) {
      console.error('Error loading telemetry data:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedCountry, selectedLocation, activeTopic, currentLanguage, isAudioAlertsEnabled]);

  // Initial load and reload when country, location, topic, or language changes
  useEffect(() => {
    loadTelemetryData(false);
    setCountdown(30);
    const focusLabel = selectedLocation ? `${selectedLocation.toUpperCase()} (${selectedCountry.toUpperCase()})` : selectedCountry.toUpperCase();
    logTelemetryAction(`Sector focus switched to: ${focusLabel}`, persona, { 
      topic: activeTopic,
      language: currentLanguage,
      location: selectedLocation 
    });
  }, [selectedCountry, selectedLocation, activeTopic, currentLanguage, loadTelemetryData]);

  // Real-time 30-second countdown loop
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          loadTelemetryData(true);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loadTelemetryData]);

  // Sync Radio playlist with news updates
  useEffect(() => {
    if (news && news.length > 0) {
      globalRadioEngine.init(news, currentLanguage, setRadioState);
    }
  }, [news, currentLanguage]);

  // Handle manual refresh
  const handleManualRefresh = () => {
    setCountdown(30);
    loadTelemetryData(true);
  };

  // Handle Country/Location Selection from 3D Globe or Navigation
  const handleSelectCountry = (countryId) => {
    setSelectedCountry(countryId);
    setSelectedLocation(null);
    stopSpeaking();
    setIsSpeaking(false);
    loadTelemetryData(true, countryId, null);
  };

  // Handle Specific Locality / Micro-area Selection (e.g. Velachery, T. Nagar)
  const handleSelectLocation = (locName) => {
    playEarcon('click');
    setSelectedLocation(locName);
    setActiveTopic('all');
    if (locName) {
      setSelectedCountry('india');
    }
    stopSpeaking();
    setIsSpeaking(false);
    loadTelemetryData(true, locName ? 'india' : selectedCountry, locName || null);
  };

  // Handle Custom Locality Search
  const handleCustomLocSubmit = (e) => {
    e.preventDefault();
    if (!customLocationInput.trim()) return;
    handleSelectLocation(customLocationInput.trim().toLowerCase());
  };

  // Auto-Detect GPS Location
  const handleDetectLocation = async () => {
    playEarcon('click');
    let msg = 'Detecting your location via GPS...';
    if (currentLanguage === 'ta') msg = 'உங்கள் இருப்பிடத்தை கண்டறிகிறேன்...';
    if (currentLanguage === 'hi') msg = 'आपकी लोकेशन का पता लगाया जा रहा है...';
    speakInLanguage(msg, { language: currentLanguage });

    const loc = await detectUserLocation();
    setDetectedLocationLabel(loc.label);

    const targetLoc = loc.locality || loc.city || 'velachery';
    const targetCountry = loc.country || 'india';

    setSelectedCountry(targetCountry);
    setSelectedLocation(targetLoc);
    setActiveTopic('all');

    let confirmMsg = `Location detected as ${loc.label}. Loading local dispatches for ${targetLoc}.`;
    if (currentLanguage === 'ta') confirmMsg = `உங்கள் பகுதி ${loc.label}. ${targetLoc} பகுதிக்கான செய்திகள் ஏற்றப்படுகின்றன.`;
    if (currentLanguage === 'hi') confirmMsg = `आपकी लोकेशन ${loc.label} मिली। ${targetLoc} के स्थानीय समाचार लोड हो रहे हैं।`;
    
    speakInLanguage(confirmMsg, { language: currentLanguage });
    logTelemetryAction(`GPS auto-personalization: ${loc.label}`, persona);
    loadTelemetryData(true, targetCountry, targetLoc);
  };

  // Voice Summary Synthesis
  const handleTriggerVoiceSummary = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    const activeLabel = selectedLocation ? `${selectedLocation.toUpperCase()} (CHENNAI)` : selectedCountry.toUpperCase();

    if (!news || news.length === 0) {
      speakInLanguage(
        currentLanguage === 'ta' 
          ? `${activeLabel} பகுதியில் செய்திகள் எதுவும் கிடைக்கவில்லை. தயவுசெய்து புதுப்பிக்கவும்.` 
          : `No dispatches available for ${activeLabel}. Please refresh.`,
        { language: currentLanguage }
      );
      return;
    }

    setIsSpeaking(true);
    const topStories = news.slice(0, 3).map((n, i) => `Story ${i + 1}: ${n.title} reported by ${n.source || 'wire'}.`).join(' ');
    const criticalAlertsCount = alerts.filter(a => a.severity === 'CRITICAL').length;
    const alertSummary = criticalAlertsCount > 0 
      ? `Attention: There are ${criticalAlertsCount} critical alerts active in this sector.` 
      : 'No critical alerts active.';

    let fullBrief = `Planetary Telemetry Briefing for sector ${activeLabel}. ${alertSummary} Here are the top verified headlines. ${topStories} Briefing completed.`;
    
    if (currentLanguage === 'ta') {
      const taStories = news.slice(0, 3).map((n, i) => `செய்தி ${i + 1}: ${n.title}.`).join(' ');
      fullBrief = `${activeLabel} பகுதிக்கான முக்கிய செய்தி அறிக்கை. ${criticalAlertsCount > 0 ? `${criticalAlertsCount} அவசர எச்சரிக்கைகள் உள்ளன.` : ''} முக்கிய செய்திகள்: ${taStories} அறிக்கை நிறைவடைந்தது.`;
    } else if (currentLanguage === 'hi') {
      const hiStories = news.slice(0, 3).map((n, i) => `खबर ${i + 1}: ${n.title}.`).join(' ');
      fullBrief = `${activeLabel} क्षेत्र के मुख्य समाचार। ${criticalAlertsCount > 0 ? `${criticalAlertsCount} महत्वपूर्ण अलर्ट हैं।` : ''} मुख्य खबरें: ${hiStories} समाचार समाप्त हुए।`;
    }

    speakInLanguage(fullBrief, {
      language: currentLanguage,
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false)
    });

    logTelemetryAction(`Voice summary briefing triggered for ${selectedCountry}`, persona);
  };

  // Read Alerts aloud
  const handleReadAlerts = () => {
    playEarcon('click');
    if (!alerts || alerts.length === 0) {
      let noAlertMsg = `No active crisis alerts reported for sector ${selectedCountry.toUpperCase()}.`;
      if (currentLanguage === 'ta') noAlertMsg = `${selectedCountry.toUpperCase()} பகுதியில் எந்த அவசர எச்சரிக்கையும் இல்லை.`;
      if (currentLanguage === 'hi') noAlertMsg = `${selectedCountry.toUpperCase()} क्षेत्र में कोई अलर्ट नहीं है।`;
      speakInLanguage(noAlertMsg, { language: currentLanguage });
      return;
    }

    const alertList = alerts.slice(0, 4).map((a, i) => `Alert ${i + 1}: ${a.severity} priority in ${a.country}. ${a.message}`).join('. ');
    let intro = `Active security alerts for ${selectedCountry.toUpperCase()}: ${alertList}`;
    if (currentLanguage === 'ta') {
      intro = `${selectedCountry.toUpperCase()} பகுதிக்கான அவசர எச்சரிக்கைகள்: ${alerts.slice(0, 4).map(a => a.message).join('. ')}`;
    }
    speakInLanguage(intro, { language: currentLanguage });
  };

  // Start Radio Mode
  const handleStartRadio = () => {
    if (!news || news.length === 0) return;
    playEarcon('click');
    globalRadioEngine.init(news, currentLanguage, setRadioState);
    globalRadioEngine.start();
  };

  // Toggle Live Audio Alerts
  const handleToggleAudioAlerts = async () => {
    playEarcon('click');
    const newState = !isAudioAlertsEnabled;
    setIsAudioAlertsEnabled(newState);
    if (newState) {
      await requestNotificationPermission();
      let onMsg = 'Live audio alerts are now enabled.';
      if (currentLanguage === 'ta') onMsg = 'நேரலை குரல் எச்சரிக்கை இயக்கப்பட்டது.';
      if (currentLanguage === 'hi') onMsg = 'लाइव आवाज अलर्ट सक्रिय हो गए हैं।';
      speakInLanguage(onMsg, { language: currentLanguage });
    }
  };

  // Handle Persona Change
  const handlePersonaChange = (newPersona) => {
    setPersona(newPersona);
    if (newPersona === 'Accessibility mode') {
      setIsHighContrast(true);
      setIsLargeText(true);
      setIsCognitiveSimple(true);
      setIsEasyMode(true);
    } else {
      if (isEasyMode && persona === 'Accessibility mode') {
        setIsEasyMode(false);
      }
    }
    logTelemetryAction(`Persona switched to: ${newPersona}`, newPersona);
  };

  // Handle Easy Mode Toggle
  const handleToggleEasyMode = (val) => {
    playEarcon('click');
    setIsEasyMode(val);
    if (val) {
      let msg = 'Switched to Easy Voice Mode with large buttons.';
      if (currentLanguage === 'ta') msg = 'எளிய குரல் வழி பார்வை முறைக்கு மாற்றப்பட்டது.';
      if (currentLanguage === 'hi') msg = 'बटन और आवाज वाले सरल मोड में बदल दिया गया है।';
      speakInLanguage(msg, { language: currentLanguage });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-wire-base text-wire-fg">
      
      {/* If Easy Mode is active, render full-screen EasyModeView */}
      {isEasyMode ? (
        <EasyModeView
          news={news}
          alerts={alerts}
          isLoading={isRefreshing}
          selectedLocation={selectedLocation}
          selectedCountry={selectedCountry}
          onSelectLocation={handleSelectLocation}
          currentLanguage={currentLanguage}
          onSelectLanguage={setCurrentLanguage}
          onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
          onStartRadio={handleStartRadio}
          onReadAlerts={handleReadAlerts}
          onDetectLocation={handleDetectLocation}
          onRefresh={handleManualRefresh}
          onExitEasyMode={() => handleToggleEasyMode(false)}
          isAudioAlertsEnabled={isAudioAlertsEnabled}
          onToggleAudioAlerts={handleToggleAudioAlerts}
        />
      ) : (
        <>
          {/* Top HUD Navigation */}
          <Navbar
            selectedCountry={selectedCountry}
            onRefresh={handleManualRefresh}
            isRefreshing={isRefreshing}
            persona={persona}
            onOpenPersonaModal={() => setIsPersonaModalOpen(true)}
            onOpenDbModal={() => setIsDbModalOpen(true)}
            onToggleVoiceSummary={handleTriggerVoiceSummary}
            isSpeaking={isSpeaking}
            lastUpdatedTime={lastUpdatedTime}
            countdown={countdown}
            currentLanguage={currentLanguage}
            onSelectLanguage={setCurrentLanguage}
            onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
            onToggleEasyMode={handleToggleEasyMode}
            isEasyMode={isEasyMode}
          />

          {/* Accessibility & Voice Controls Bar */}
          <AccessibilityToolbar
            isHighContrast={isHighContrast}
            onToggleHighContrast={() => setIsHighContrast(!isHighContrast)}
            isLargeText={isLargeText}
            onToggleLargeText={() => setIsLargeText(!isLargeText)}
            isCognitiveSimple={isCognitiveSimple}
            onToggleCognitiveSimple={() => setIsCognitiveSimple(!isCognitiveSimple)}
            onTriggerVoiceSummary={handleTriggerVoiceSummary}
            isSpeaking={isSpeaking}
            onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
            onStartRadio={handleStartRadio}
            isRadioPlaying={radioState.isPlaying}
            isAudioAlertsEnabled={isAudioAlertsEnabled}
            onToggleAudioAlerts={handleToggleAudioAlerts}
            onToggleEasyMode={handleToggleEasyMode}
            isEasyMode={isEasyMode}
            currentLanguage={currentLanguage}
          />

          {/* Main Dashboard Grid */}
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-5 space-y-4">
            
            {/* Row 1: Key Indicators */}
            <TelemetryStats
              selectedCountry={selectedCountry}
              newsCount={news.length}
              alertsCount={alerts.length}
              news={news}
              alerts={alerts}
              persona={persona}
            />

            {/* Row 2: 3D Planetary Globe & Real-time Alert System */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* 3D Globe: 7 columns on desktop */}
              <div className="lg:col-span-7 flex flex-col">
                <Globe3D
                  selectedCountry={selectedCountry}
                  onSelectCountry={handleSelectCountry}
                />
              </div>

              {/* Alert System: 5 columns on desktop */}
              <div className="lg:col-span-5 flex flex-col">
                <AlertSystem
                  alerts={alerts}
                  selectedCountry={selectedCountry}
                  onSelectCountry={handleSelectCountry}
                />
              </div>

            </div>

            {/* Row 3: Hyper-Local Neighborhood Telemetry Focus Strip */}
            <div className="bg-wire-surface border border-wire-border p-3.5 shadow-md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-wire-border/60">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-mono text-xs font-bold text-wire-fg tracking-wide uppercase flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-wire-amber" />
                    Hyper-Local Telemetry & Neighborhood Focus
                  </span>
                  {selectedLocation ? (
                    <span className="px-2 py-0.5 bg-wire-amber text-wire-base font-mono text-[11px] font-bold rounded-sm uppercase flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {selectedLocation} (Chennai / India)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-slate-900 border border-slate-700 font-mono text-[11px] text-slate-300 rounded-sm uppercase">
                      {selectedCountry === 'india' ? '🇮🇳 All India' : (selectedCountry === 'global' ? '🌐 Worldwide' : selectedCountry.toUpperCase())}
                    </span>
                  )}
                </div>

                {/* GPS Auto-Detect Button & Reset Button */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDetectLocation}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-wire-amber text-slate-200 hover:text-wire-amber font-mono text-xs font-semibold rounded-sm transition-all flex items-center gap-1.5"
                    title="Detect precise GPS neighborhood"
                  >
                    <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                    <span>GPS Auto-Locate</span>
                    <span className="text-[10px] text-wire-subtle">({detectedLocationLabel})</span>
                  </button>

                  {selectedLocation && (
                    <button
                      onClick={() => handleSelectLocation(null)}
                      className="px-2 py-1.5 text-xs font-mono text-wire-subtle hover:text-wire-red border border-wire-border hover:border-wire-red/40 rounded-sm transition-colors flex items-center gap-1"
                      title="Reset to global / country view"
                    >
                      <X className="w-3 h-3" />
                      <span>Clear Local Focus</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Neighborhood Quick Chips & Custom Search */}
              <div className="mt-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Chennai Neighborhood Quick Chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono text-[11px] text-wire-subtle mr-1">Quick Focus:</span>
                  
                  <button
                    onClick={() => handleSelectCountry('global')}
                    className={`px-2.5 py-1 text-xs font-mono rounded-sm border transition-all ${
                      !selectedLocation && selectedCountry === 'global'
                        ? 'bg-wire-amber text-wire-base font-bold border-wire-amber shadow-sm'
                        : 'bg-wire-base text-wire-subtle border-wire-border hover:text-white hover:border-slate-600'
                    }`}
                  >
                    🌐 Worldwide
                  </button>

                  <button
                    onClick={() => {
                      setSelectedCountry('india');
                      setSelectedLocation(null);
                      loadTelemetryData(true, 'india', null);
                    }}
                    className={`px-2.5 py-1 text-xs font-mono rounded-sm border transition-all ${
                      !selectedLocation && selectedCountry === 'india'
                        ? 'bg-wire-amber text-wire-base font-bold border-wire-amber shadow-sm'
                        : 'bg-wire-base text-wire-subtle border-wire-border hover:text-white hover:border-slate-600'
                    }`}
                  >
                    🇮🇳 India
                  </button>

                  {CHENNAI_NEIGHBORHOODS.map(hood => {
                    const isSelected = selectedLocation === hood.loc;
                    return (
                      <button
                        key={hood.id}
                        onClick={() => handleSelectLocation(hood.loc)}
                        className={`px-2.5 py-1 text-xs font-mono rounded-sm border transition-all flex items-center gap-1 ${
                          isSelected
                            ? 'bg-wire-amber text-wire-base font-bold border-wire-amber shadow-sm scale-105'
                            : 'bg-wire-base text-wire-subtle border-wire-border hover:text-white hover:border-slate-600'
                        }`}
                      >
                        <span>{hood.icon}</span>
                        <span>{hood.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Neighborhood / Area search form */}
                <form onSubmit={handleCustomLocSubmit} className="flex items-center gap-1 min-w-[240px]">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={customLocationInput}
                      onChange={(e) => setCustomLocationInput(e.target.value)}
                      placeholder="Type area (e.g. Madipakkam)..."
                      className="w-full bg-slate-950 border border-wire-border px-2.5 py-1 text-xs font-mono text-wire-fg placeholder:text-wire-subtle focus:outline-none focus:border-wire-amber rounded-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-wire-raised hover:bg-wire-amber hover:text-wire-base border border-wire-border text-wire-fg font-mono text-xs font-semibold rounded-sm transition-all flex items-center gap-1"
                  >
                    <Search className="w-3 h-3" />
                    <span>Scan</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Row 4: Live Verified Real-time News Stream */}
            <div className="w-full">
              <NewsPanel
                news={news}
                isLoading={isRefreshing && news.length === 0}
                selectedCountry={selectedCountry}
                selectedLocation={selectedLocation}
                onSelectLocation={handleSelectLocation}
                activeTopic={activeTopic}
                onSelectTopic={setActiveTopic}
                persona={persona}
                onSelectPersona={handlePersonaChange}
                isCognitiveSimple={isCognitiveSimple}
                currentLanguage={currentLanguage}
                lastUpdatedTime={lastUpdatedTime}
                countdown={countdown}
              />
            </div>

          </main>

          {/* Footer */}
          <footer className="w-full border-t border-wire-border py-3 px-6 bg-wire-base">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
              <span className="font-serif text-wire-subtle text-xs">Global Intelligence Wire · Voice Subsystem Active</span>
              <span className="font-mono text-[10px] text-wire-muted tabular-nums">
                Auto-sync in {countdown}s
              </span>
              <span className="font-mono text-[10px] text-wire-muted">
                Speech API Ready (EN / தமிழ் / हिंदी)
              </span>
            </div>
          </footer>
        </>
      )}

      {/* Persistent Continuous News Radio Player Bar (Active in both views) */}
      <RadioPlayerBar
        isPlaying={radioState.isPlaying}
        isPaused={radioState.isPaused}
        currentIndex={radioState.currentIndex}
        totalStories={radioState.total}
        currentStory={radioState.currentStory}
        language={currentLanguage}
        onPlay={() => globalRadioEngine.resume()}
        onPause={() => globalRadioEngine.pause()}
        onNext={() => globalRadioEngine.next()}
        onPrev={() => globalRadioEngine.prev()}
        onStop={() => globalRadioEngine.stop()}
      />

      {/* Voice Assistant Speech Recognition Dialog */}
      <VoiceAssistantModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        currentLanguage={currentLanguage}
        onSelectLanguage={setCurrentLanguage}
        onLocationChange={(loc) => {
          const locLower = (loc || '').toLowerCase().trim();
          const chennaiAreas = ['velachery', 't nagar', 'tnagar', 'adyar', 'anna nagar', 'tambaram', 'mylapore', 'guindy', 'omr', 'chennai', 'madipakkam', 'porur', 'thiruvanmiyur'];
          if (chennaiAreas.includes(locLower)) {
            handleSelectLocation(locLower === 'tnagar' ? 't nagar' : locLower);
          } else {
            handleSelectCountry(locLower);
          }
        }}
        onStartRadio={handleStartRadio}
        onReadAlerts={handleReadAlerts}
        onToggleEasyMode={handleToggleEasyMode}
        onTriggerExplain={() => {
          if (news.length > 0) {
            fetchNewsExplanation(news[0].title, news[0].description, currentLanguage)
              .then(data => speakInLanguage(data.simpleText, { language: currentLanguage }));
          }
        }}
        onRepeat={() => {
          if (radioState.isPlaying) {
            globalRadioEngine.repeatCurrentStory();
          } else if (news.length > 0) {
            speakInLanguage(`${news[0].title}. ${news[0].description || ''}`, { language: currentLanguage });
          }
        }}
        onSelectTopic={(cat) => {
          setActiveTopic(cat);
          loadTelemetryData(true);
        }}
      />

      {/* Persona Selection Modal */}
      <PersonaSelector
        isOpen={isPersonaModalOpen}
        onClose={() => setIsPersonaModalOpen(false)}
        currentPersona={persona}
        onSelectPersona={handlePersonaChange}
      />

      {/* Supabase Table & Live Rows Inspector Modal */}
      <LogsViewer
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
      />

    </div>
  );
}
