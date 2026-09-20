import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, X, Sparkles, MapPin, Radio, AlertTriangle } from 'lucide-react';
import { 
  startVoiceRecognition, 
  stopVoiceRecognition, 
  parseVoiceCommand, 
  speakInLanguage, 
  stopSpeaking,
  SUPPORTED_LANGUAGES,
  isVoiceInputSupported 
} from '../services/voiceService';

export default function VoiceAssistantModal({
  isOpen,
  onClose,
  currentLanguage = 'en',
  onSelectLanguage,
  onLocationChange,
  onStartRadio,
  onReadAlerts,
  onToggleEasyMode,
  onTriggerExplain,
  onRepeat,
  onSelectTopic
}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [assistantReply, setAssistantReply] = useState('');
  const [recognitionError, setRecognitionError] = useState('');

  // Initial greeting when opened
  useEffect(() => {
    if (isOpen) {
      setTranscript('');
      setRecognitionError('');
      
      let greeting = 'Hello! Tap the microphone and speak. For example, say: "I am from Chennai, show me local news" or "Play news".';
      if (currentLanguage === 'ta') {
        greeting = 'வணக்கம்! மைக்ரோஃபோனைத் தொட்டு பேசுங்கள். உதாரணமாக: "சென்னை செய்திகளை காட்டு" அல்லது "செய்தி வாசி" என்று கூறுங்கள்.';
      } else if (currentLanguage === 'hi') {
        greeting = 'नमस्ते! माइक दबाकर बोलें। जैसे कहें: "चेन्नई के समाचार दिखाओ" या "समाचार पढ़ो"।';
      } else if (currentLanguage === 'te') {
        greeting = 'నమస్కారం! మైక్ నొక్కి మాట్లాడండి. ఉదాహరణకు: "చెన్నై వార్తలు చూపించు" లేదా "వార్తలు చదువు" అని చెప్పండి.';
      } else if (currentLanguage === 'bn') {
        greeting = 'নমস্কার! মাইক টিপে কথা বলুন। যেমন বলুন: "চেন্নাই এর খবর দেখাও" বা "খবর পড়ো"।';
      } else if (currentLanguage === 'mr') {
        greeting = 'नमस्कार! माइक दाबून बोला. उदा: "चेन्नईच्या बातम्या दाखवा" किंवा "बातम्या वाचा" असे म्हणा.';
      }
      setAssistantReply(greeting);

      // Auto-start listening on open if supported
      if (isVoiceInputSupported) {
        handleStartListening();
      }
    } else {
      stopVoiceRecognition();
      stopSpeaking();
      setIsListening(false);
    }
  }, [isOpen, currentLanguage]);

  const handleStartListening = () => {
    setRecognitionError('');
    setIsListening(true);
    setTranscript('');

    startVoiceRecognition({
      language: currentLanguage,
      onResult: (spokenText) => {
        setTranscript(spokenText);
        setIsListening(false);
        handleProcessCommand(spokenText);
      },
      onStart: () => setIsListening(true),
      onEnd: () => setIsListening(false),
      onError: (err) => {
        setIsListening(false);
        setRecognitionError(err.message || 'Could not understand speech. Please tap to try again.');
      }
    });
  };

  const handleStopListening = () => {
    stopVoiceRecognition();
    setIsListening(false);
  };

  const handleProcessCommand = (spokenText) => {
    const result = parseVoiceCommand(spokenText, currentLanguage);
    setAssistantReply(result.reply || 'Processing your request...');

    // Speak confirmation aloud
    speakInLanguage(result.reply, { language: currentLanguage });

    // Execute intent
    if (result.intent === 'set_location' && result.location) {
      setTimeout(() => {
        onLocationChange(result.location);
        onClose();
      }, 1400);
    } else if (result.intent === 'switch_language' && result.language) {
      onSelectLanguage(result.language);
    } else if (result.intent === 'play_radio') {
      setTimeout(() => {
        onStartRadio();
        onClose();
      }, 1000);
    } else if (result.intent === 'repeat') {
      setTimeout(() => {
        if (onRepeat) onRepeat();
        onClose();
      }, 1000);
    } else if (result.intent === 'filter_category' && result.category) {
      setTimeout(() => {
        if (onSelectTopic) onSelectTopic(result.category);
        onClose();
      }, 1000);
    } else if (result.intent === 'read_alerts') {
      setTimeout(() => {
        onReadAlerts();
        onClose();
      }, 1000);
    } else if (result.intent === 'easy_mode') {
      setTimeout(() => {
        onToggleEasyMode(true);
        onClose();
      }, 1000);
    } else if (result.intent === 'explain') {
      setTimeout(() => {
        onTriggerExplain();
        onClose();
      }, 1000);
    } else if (result.intent === 'stop') {
      stopSpeaking();
    } else if (result.intent === 'search' && result.query) {
      setTimeout(() => {
        onLocationChange(result.query);
        onClose();
      }, 1400);
    }
  };

  const handleQuickPrompt = (promptText) => {
    setTranscript(promptText);
    handleProcessCommand(promptText);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Voice Assistant"
    >
      <div className="relative w-full max-w-lg bg-wire-surface border-2 border-wire-amber shadow-2xl p-6 flex flex-col items-center text-center">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-wire-subtle hover:text-wire-fg hover:bg-wire-raised rounded-full transition-colors"
          aria-label="Close voice assistant"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="inline-flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-wire-amber animate-pulse" />
          <span className="font-mono text-xs text-wire-amber uppercase tracking-widest font-semibold">
            Voice Access Assistant
          </span>
        </div>

        <h2 className="font-serif text-xl sm:text-2xl font-bold text-wire-fg mb-1">
          {currentLanguage === 'ta' ? 'குரல் வழி செய்தி வசதி' : (currentLanguage === 'hi' ? 'आवाज से समाचार सुनें' : (currentLanguage === 'te' ? 'వాయిస్ ద్వారా వార్తలు' : (currentLanguage === 'bn' ? 'ভয়েস দিয়ে সংবাদ' : (currentLanguage === 'mr' ? 'आवाजाने बातम्या ऐका' : 'Speak to Access News'))))}
        </h2>
        <p className="font-sans text-xs text-wire-subtle mb-6 max-w-sm">
          {currentLanguage === 'ta' 
            ? 'தட்டச்சு செய்ய தேவையில்லை. பேசுங்கள், கணினி தானாகவே செய்திகளை எடுத்து தரும்.' 
            : (currentLanguage === 'hi' 
              ? 'टाइप करने की कोई जरूरत नहीं। बोलकर अपनी भाषा में समाचार पाएं।' 
              : 'No typing or reading required. Speak naturally to explore local news and alerts.')}
        </p>

        {/* Central Pulsing Microphone Button */}
        <div className="relative my-4 flex items-center justify-center">
          {isListening && (
            <div className="absolute w-32 h-32 rounded-full bg-wire-amber/20 animate-ping" />
          )}
          {isListening && (
            <div className="absolute w-24 h-24 rounded-full bg-wire-amber/30 animate-pulse" />
          )}
          
          <button
            onClick={isListening ? handleStopListening : handleStartListening}
            className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
              isListening 
                ? 'bg-wire-red text-white ring-4 ring-wire-red/40' 
                : 'bg-wire-amber text-wire-base hover:bg-wire-amber/90 ring-4 ring-wire-amber/30'
            }`}
            aria-label={isListening ? 'Stop listening' : 'Start speaking'}
          >
            {isListening ? (
              <MicOff className="w-9 h-9 animate-pulse" />
            ) : (
              <Mic className="w-9 h-9" />
            )}
          </button>
        </div>

        {/* Status text */}
        <div className="min-h-[28px] mt-2 mb-4">
          {isListening ? (
            <div className="flex items-center justify-center gap-2 text-wire-amber font-mono text-sm animate-pulse">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-wire-amber" />
              {currentLanguage === 'ta' ? 'உங்களை கேட்கிறேன்... பேசுங்கள்' : (currentLanguage === 'hi' ? 'सुन रहे हैं... बोलिए' : (currentLanguage === 'te' ? 'వింటున్నాము... మాట్లాడండి' : (currentLanguage === 'bn' ? 'শুনছি... বলুন' : (currentLanguage === 'mr' ? 'ऐकत आहे... बोला' : 'Listening... speak now'))))}
            </div>
          ) : (
            <div className="text-wire-subtle font-mono text-xs">
              {currentLanguage === 'ta' ? 'பேச மைக் பட்டனை தொடவும்' : (currentLanguage === 'hi' ? 'बोलने के लिए माइक दबाएं' : 'Tap the microphone to speak')}
            </div>
          )}
        </div>

        {/* User Transcript Box */}
        {transcript && (
          <div className="w-full bg-wire-base border border-wire-border p-3.5 mb-3 text-left">
            <span className="font-mono text-[10px] text-wire-subtle block mb-1">
              {currentLanguage === 'ta' ? 'நீங்கள் கூறியது:' : (currentLanguage === 'hi' ? 'आपने कहा:' : 'You said:')}
            </span>
            <p className="font-serif text-sm text-wire-fg font-medium italic">
              "{transcript}"
            </p>
          </div>
        )}

        {/* Assistant Response Box */}
        {assistantReply && (
          <div className="w-full bg-wire-raised border border-wire-amber/40 p-3.5 mb-4 text-left">
            <div className="flex items-center gap-2 mb-1">
              <Volume2 className="w-3.5 h-3.5 text-wire-amber shrink-0" />
              <span className="font-mono text-[10px] text-wire-amber uppercase tracking-wider font-semibold">
                UGI Assistant
              </span>
            </div>
            <p className="font-sans text-xs text-wire-fg leading-relaxed">
              {assistantReply}
            </p>
          </div>
        )}

        {/* Error message */}
        {recognitionError && (
          <div className="w-full bg-wire-red/10 border border-wire-red/40 p-2.5 mb-4 text-wire-red text-xs font-mono">
            {recognitionError}
          </div>
        )}

        {/* Language Quick Switcher */}
        <div className="w-full border-t border-wire-border pt-4 mt-2">
          <span className="font-mono text-[10px] text-wire-subtle uppercase tracking-wider block mb-2">
            Language / மொழி / भाषा / భాష / ভাষা / भाषा
          </span>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isActive = currentLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => onSelectLanguage(lang.code)}
                  className={`px-2.5 py-1 font-mono text-xs rounded-sm border transition-all ${
                    isActive 
                      ? 'bg-wire-amber text-wire-base font-semibold border-wire-amber shadow-sm' 
                      : 'bg-wire-base text-wire-fg border-wire-border hover:border-wire-muted'
                  }`}
                >
                  {lang.flag} {lang.nativeName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Voice Command Chips */}
        <div className="w-full mt-4 pt-3 border-t border-wire-border/60">
          <span className="font-mono text-[10px] text-wire-subtle uppercase tracking-wider block mb-2">
            {currentLanguage === 'ta' ? 'விரைவு கட்டளைகள் (தொட்டு பேசலாம்):' : (currentLanguage === 'hi' ? 'त्वरित निर्देश (टैप करें):' : (currentLanguage === 'te' ? 'త్వరిత ఆదేశాలు (ట్యాప్ చేయండి):' : (currentLanguage === 'bn' ? 'দ্রুত নির্দেশ (ট্যাপ করুন):' : (currentLanguage === 'mr' ? 'जलद सूचना (टॅप करा):' : 'Try saying or tapping:'))))}
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => handleQuickPrompt(
                currentLanguage === 'ta' ? 'நான் சென்னையில் வசிக்கிறேன், உள்ளூர் செய்தி காட்டு' : 
                (currentLanguage === 'hi' ? 'चेन्नई के समाचार दिखाओ' : 
                (currentLanguage === 'te' ? 'చెన్నై వార్తలు చూపించు' : 
                (currentLanguage === 'bn' ? 'চেন্নাই এর খবর দেখাও' : 
                (currentLanguage === 'mr' ? 'चेन्नईच्या बातम्या दाखवा' : 'I am from Chennai, show me local news'))))
              )}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-wire-base border border-wire-border hover:border-wire-amber text-wire-fg hover:text-wire-amber text-xs font-mono rounded-sm transition-colors"
            >
              <MapPin className="w-3 h-3 text-wire-amber" />
              {currentLanguage === 'ta' ? 'சென்னை செய்திகள்' : (currentLanguage === 'hi' ? 'चेन्नई समाचार' : (currentLanguage === 'te' ? 'చెన్నై వార్తలు' : (currentLanguage === 'bn' ? 'চেন্নাই খবর' : (currentLanguage === 'mr' ? 'चेन्नई बातम्या' : 'Chennai News'))))}
            </button>

            <button
              onClick={() => handleQuickPrompt(
                currentLanguage === 'ta' ? 'செய்தி வாசி' : 
                (currentLanguage === 'hi' ? 'समाचार पढ़ो' : 
                (currentLanguage === 'te' ? 'వార్తలు చదువు' : 
                (currentLanguage === 'bn' ? 'খবর পড়ো' : 
                (currentLanguage === 'mr' ? 'बातम्या वाचा' : 'Play news'))))
              )}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-wire-base border border-wire-border hover:border-wire-amber text-wire-fg hover:text-wire-amber text-xs font-mono rounded-sm transition-colors"
            >
              <Radio className="w-3 h-3 text-wire-green" />
              {currentLanguage === 'ta' ? 'செய்தி வாசி (Radio)' : (currentLanguage === 'hi' ? 'समाचार पढ़ो (Radio)' : (currentLanguage === 'te' ? 'రేడియో వార్తలు' : (currentLanguage === 'bn' ? 'রেডিও খবর' : (currentLanguage === 'mr' ? 'रेडिओ बातम्या' : 'Play News (Radio)'))))}
            </button>

            <button
              onClick={() => handleQuickPrompt(
                currentLanguage === 'ta' ? 'விவசாய செய்திகள்' : 
                (currentLanguage === 'hi' ? 'कृषि समाचार' : 
                (currentLanguage === 'te' ? 'వ్యవసాయ వార్తలు' : 
                (currentLanguage === 'bn' ? 'কৃষি খবর' : 
                (currentLanguage === 'mr' ? 'शेती बातम्या' : 'Agriculture news'))))
              )}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-wire-base border border-wire-border hover:border-wire-amber text-wire-fg hover:text-wire-amber text-xs font-mono rounded-sm transition-colors"
            >
              <span>🌾</span>
              {currentLanguage === 'ta' ? 'விவசாயம்' : (currentLanguage === 'hi' ? 'कृषि' : (currentLanguage === 'te' ? 'వ్యవసాయం' : (currentLanguage === 'bn' ? 'কৃষি' : (currentLanguage === 'mr' ? 'शेती' : 'Agriculture'))))}
            </button>

            <button
              onClick={() => handleQuickPrompt(
                currentLanguage === 'ta' ? 'அவசர எச்சரிக்கை' : 
                (currentLanguage === 'hi' ? 'अलर्ट बताओ' : 
                (currentLanguage === 'te' ? 'హెచ్చరికలు చెప్పు' : 
                (currentLanguage === 'bn' ? 'সতর্কতা বলো' : 
                (currentLanguage === 'mr' ? 'इशारे सांगा' : 'Read alerts'))))
              )}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-wire-base border border-wire-border hover:border-wire-amber text-wire-fg hover:text-wire-amber text-xs font-mono rounded-sm transition-colors"
            >
              <AlertTriangle className="w-3 h-3 text-wire-red" />
              {currentLanguage === 'ta' ? 'எச்சரிக்கைகள்' : (currentLanguage === 'hi' ? 'सक्रिय अलर्ट' : (currentLanguage === 'te' ? 'హెచ్చరికలు' : (currentLanguage === 'bn' ? 'সতর্কতা' : (currentLanguage === 'mr' ? 'इशारे' : 'Read Alerts'))))}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
