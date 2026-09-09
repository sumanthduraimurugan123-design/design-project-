import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from '../components/Navbar';
import AccessibilityToolbar from '../components/AccessibilityToolbar';
import Globe3D from '../components/Globe3D';
import NewsPanel from '../components/NewsPanel';
import AlertSystem from '../components/AlertSystem';
import TelemetryStats from '../components/TelemetryStats';
import PersonaSelector from '../components/PersonaSelector';
import LogsViewer from '../components/LogsViewer';
import { fetchNewsStream, fetchActiveAlerts, speakText, stopSpeech } from '../services/newsService';
import { logTelemetryAction } from '../services/supabaseClient';

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

  // Persona State
  const [persona, setPersona] = useState('Analyst'); // Analyst, Casual user, Accessibility mode
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);

  // Accessibility States
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
        fetchNewsStream(selectedCountry, activeTopic, force),
        fetchActiveAlerts(selectedCountry)
      ]);

      setNews(fetchedNews);
      setAlerts(fetchedAlerts);
      setLastUpdatedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Error loading telemetry data:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedCountry, activeTopic]);

  // Initial load and reload when country or topic changes
  useEffect(() => {
    loadTelemetryData(false);
    setCountdown(30);
    logTelemetryAction(`Sector focus switched to: ${selectedCountry.toUpperCase()}`, persona, { topic: activeTopic });
  }, [selectedCountry, activeTopic, loadTelemetryData]);

  // Real-time 30-second countdown loop
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          console.log('⏱️ [UGI Dashboard] Auto-refresh triggered (30s interval reached)');
          loadTelemetryData(true);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loadTelemetryData]);

  // Handle manual refresh
  const handleManualRefresh = () => {
    setCountdown(30);
    loadTelemetryData(true);
  };

  // Handle Country Selection from 3D Globe or Pills
  const handleSelectCountry = (countryId) => {
    setSelectedCountry(countryId);
    stopSpeech();
    setIsSpeaking(false);
  };

  // Voice Summary Synthesis (narrates current sector and top 3 intelligence dispatches)
  const handleTriggerVoiceSummary = () => {
    if (isSpeaking) {
      stopSpeech();
      setIsSpeaking(false);
      return;
    }

    if (!news || news.length === 0) {
      speakText(`No dispatches available for ${selectedCountry}. Please refresh.`);
      return;
    }

    setIsSpeaking(true);
    const topStories = news.slice(0, 3).map((n, i) => `Story ${i + 1}: ${n.title} reported by ${n.source}.`).join(' ');
    const criticalAlertsCount = alerts.filter(a => a.severity === 'CRITICAL').length;
    const alertSummary = criticalAlertsCount > 0 
      ? `Attention: There are ${criticalAlertsCount} critical alerts active in this sector.` 
      : 'No critical alerts active.';

    const fullBrief = `Planetary Telemetry Briefing for sector ${selectedCountry.toUpperCase()}. ${alertSummary} Here are the top verified headlines. ${topStories} Briefing completed.`;

    speakText(fullBrief, () => {
      setIsSpeaking(false);
    });

    logTelemetryAction(`Voice summary briefing triggered for ${selectedCountry}`, persona);
  };

  // Handle Persona Change
  const handlePersonaChange = (newPersona) => {
    setPersona(newPersona);
    if (newPersona === 'Accessibility mode') {
      setIsHighContrast(true);
      setIsLargeText(true);
      setIsCognitiveSimple(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#040711] text-slate-100 cyber-grid-bg">
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
      />

      {/* Accessibility Controls Bar */}
      <AccessibilityToolbar
        isHighContrast={isHighContrast}
        onToggleHighContrast={() => setIsHighContrast(!isHighContrast)}
        isLargeText={isLargeText}
        onToggleLargeText={() => setIsLargeText(!isLargeText)}
        isCognitiveSimple={isCognitiveSimple}
        onToggleCognitiveSimple={() => setIsCognitiveSimple(!isCognitiveSimple)}
        onTriggerVoiceSummary={handleTriggerVoiceSummary}
        isSpeaking={isSpeaking}
      />

      {/* Main Dashboard Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-6">
        
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
            lastUpdatedTime={lastUpdatedTime}
            countdown={countdown}
          />
        </div>

      </main>

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

      {/* Footer System Status */}
      <footer className="w-full border-t border-cyber-border py-4 px-6 text-center text-xs font-mono text-slate-500 bg-[#040711]/95">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>GLOBAL INTEL & TELEMETRY (UGI) • CLASSIFIED SENTINEL NETWORK</span>
          <span className="text-cyber-cyan font-bold">
            LIVE DIRECT CANONICAL DISPATCHES • AUTO-SYNC: {countdown}s
          </span>
          <span>POSTGRESQL PERSISTENCE: READY</span>
        </div>
      </footer>
    </div>
  );
}
