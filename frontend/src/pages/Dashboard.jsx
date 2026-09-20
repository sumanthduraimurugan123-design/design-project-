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

export default function Dashboard() {
  // Core Dashboard State
  const [selectedCountry, setSelectedCountry] = useState('global');
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
  const loadTelemetryData = useCallback(async (force = false) => {
    setIsRefreshing(true);
    try {
      const [fetchedNews, fetchedAlerts] = await Promise.all([
        fetchNewsStream(selectedCountry, activeTopic, force, null, currentLanguage),
        fetchActiveAlerts(selectedCountry)
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
  }, [selectedCountry, activeTopic, currentLanguage, isAudioAlertsEnabled]);

  // Initial load and reload when country, topic, or language changes
  useEffect(() => {
    loadTelemetryData(false);
    setCountdown(30);
    logTelemetryAction(`Sector focus switched to: ${selectedCountry.toUpperCase()}`, persona, { 
      topic: activeTopic,
      language: currentLanguage 
    });
  }, [selectedCountry, activeTopic, currentLanguage, loadTelemetryData]);

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

  // Handle Country/Location Selection
  const handleSelectCountry = (countryId) => {
    setSelectedCountry(countryId);
    stopSpeaking();
    setIsSpeaking(false);
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

    const target = loc.city || loc.country || 'chennai';
    setSelectedCountry(target);

    let confirmMsg = `Location detected as ${loc.label}. Loading your local news now.`;
    if (currentLanguage === 'ta') confirmMsg = `உங்கள் பகுதி ${loc.label}. உள்ளூர் செய்திகளை ஏற்றுகிறேன்.`;
    if (currentLanguage === 'hi') confirmMsg = `आपकी लोकेशन ${loc.label} मिली। स्थानीय समाचार लोड हो रहे हैं।`;
    
    speakInLanguage(confirmMsg, { language: currentLanguage });
    logTelemetryAction(`GPS auto-personalization: ${target}`, persona);
  };

  // Voice Summary Synthesis
  const handleTriggerVoiceSummary = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    if (!news || news.length === 0) {
      speakInLanguage(
        currentLanguage === 'ta' 
          ? 'செய்திகள் எதுவும் கிடைக்கவில்லை. தயவுசெய்து புதுப்பிக்கவும்.' 
          : `No dispatches available for ${selectedCountry}. Please refresh.`,
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

    let fullBrief = `Planetary Telemetry Briefing for sector ${selectedCountry.toUpperCase()}. ${alertSummary} Here are the top verified headlines. ${topStories} Briefing completed.`;
    
    if (currentLanguage === 'ta') {
      const taStories = news.slice(0, 3).map((n, i) => `செய்தி ${i + 1}: ${n.title}.`).join(' ');
      fullBrief = `${selectedCountry.toUpperCase()} பகுதிக்கான முக்கிய செய்தி அறிக்கை. ${criticalAlertsCount > 0 ? `${criticalAlertsCount} அவசர எச்சரிக்கைகள் உள்ளன.` : ''} முக்கிய செய்திகள்: ${taStories} அறிக்கை நிறைவடைந்தது.`;
    } else if (currentLanguage === 'hi') {
      const hiStories = news.slice(0, 3).map((n, i) => `खबर ${i + 1}: ${n.title}.`).join(' ');
      fullBrief = `${selectedCountry.toUpperCase()} क्षेत्र के मुख्य समाचार। ${criticalAlertsCount > 0 ? `${criticalAlertsCount} महत्वपूर्ण अलर्ट हैं।` : ''} मुख्य खबरें: ${hiStories} समाचार समाप्त हुए।`;
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
    }
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
          selectedLocation={selectedCountry}
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

            {/* Row 3: Live Verified Real-time News Stream */}
            <div className="w-full">
              <NewsPanel
                news={news}
                isLoading={isRefreshing && news.length === 0}
                selectedCountry={selectedCountry}
                activeTopic={activeTopic}
                onSelectTopic={setActiveTopic}
                persona={persona}
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
          setSelectedCountry(loc);
          loadTelemetryData(true);
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
