import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Square, Radio, Volume2, X } from 'lucide-react';

export default function RadioPlayerBar({
  isPlaying,
  isPaused,
  currentIndex = 0,
  totalStories = 0,
  currentStory = null,
  language = 'en',
  onPlay,
  onPause,
  onNext,
  onPrev,
  onStop
}) {
  if (!isPlaying && !isPaused) return null;

  return (
    <aside 
      className="fixed bottom-0 left-0 right-0 z-40 bg-wire-surface/95 border-t-2 border-wire-amber shadow-2xl backdrop-blur-md px-4 py-3 text-wire-fg"
      aria-label="Continuous News Radio Player"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* Left: Radio badge + Soundwave + Current story title */}
        <div className="flex items-center gap-3 w-full sm:w-auto overflow-hidden">
          <div className="flex items-center gap-2 shrink-0">
            <span className="p-1.5 bg-wire-amber text-wire-base rounded-sm flex items-center justify-center">
              <Radio className="w-4 h-4 animate-pulse" />
            </span>
            <div className="hidden md:flex items-center gap-0.5 h-4 px-1">
              {[40, 90, 60, 100, 70, 30].map((h, i) => (
                <span
                  key={i}
                  className={`w-0.5 bg-wire-amber transition-all duration-300 ${isPlaying ? 'animate-pulse' : 'opacity-40'}`}
                  style={{ height: isPlaying ? `${h}%` : '20%' }}
                />
              ))}
            </div>
          </div>

          <div className="truncate">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-wire-amber uppercase tracking-wider font-semibold">
                Radio Mode · {currentIndex + 1} of {totalStories}
              </span>
              {currentStory?.source && (
                <span className="font-mono text-[10px] text-wire-subtle truncate">
                  · {currentStory.source}
                </span>
              )}
            </div>
            <p className="font-serif text-xs sm:text-sm text-wire-fg font-medium truncate">
              {currentStory?.title || 'Loading next dispatch...'}
            </p>
          </div>
        </div>

        {/* Center/Right: Big controls */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Previous Button */}
          <button
            onClick={onPrev}
            disabled={currentIndex <= 0}
            className="p-2 bg-wire-base border border-wire-border hover:border-wire-amber text-wire-fg hover:text-wire-amber rounded-sm transition-colors disabled:opacity-40 disabled:hover:border-wire-border"
            title="Previous story"
            aria-label="Previous story"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Play / Pause Toggle Button */}
          {isPlaying ? (
            <button
              onClick={onPause}
              className="flex items-center gap-1.5 px-4 py-2 bg-wire-amber text-wire-base font-mono text-xs font-semibold rounded-sm shadow-md hover:bg-wire-amber/90 transition-transform active:scale-95"
              title="Pause radio"
              aria-label="Pause radio"
            >
              <Pause className="w-4 h-4 fill-current" />
              <span>PAUSE</span>
            </button>
          ) : (
            <button
              onClick={onPlay}
              className="flex items-center gap-1.5 px-4 py-2 bg-wire-green text-wire-base font-mono text-xs font-semibold rounded-sm shadow-md hover:bg-wire-green/90 transition-transform active:scale-95"
              title="Resume radio"
              aria-label="Resume radio"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>RESUME</span>
            </button>
          )}

          {/* Next Button */}
          <button
            onClick={onNext}
            disabled={currentIndex >= totalStories - 1}
            className="p-2 bg-wire-base border border-wire-border hover:border-wire-amber text-wire-fg hover:text-wire-amber rounded-sm transition-colors disabled:opacity-40 disabled:hover:border-wire-border"
            title="Next story"
            aria-label="Next story"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Stop Button */}
          <button
            onClick={onStop}
            className="p-2 bg-wire-base border border-wire-border hover:border-wire-red text-wire-subtle hover:text-wire-red rounded-sm transition-colors ml-1"
            title="Stop playback"
            aria-label="Stop playback"
          >
            <Square className="w-4 h-4 fill-current" />
          </button>

          {/* Close/Dismiss */}
          <button
            onClick={onStop}
            className="p-2 text-wire-subtle hover:text-wire-fg rounded-sm transition-colors ml-1"
            title="Close radio bar"
            aria-label="Close radio bar"
          >
            <X className="w-4 h-4" />
          </button>

        </div>

      </div>
    </aside>
  );
}
