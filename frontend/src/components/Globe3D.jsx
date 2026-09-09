import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import Globe from 'globe.gl';
import { Crosshair, ZoomIn, ZoomOut, RotateCcw, Flame, Eye, Sparkles, MapPin, Radio } from 'lucide-react';

// Geopolitical sensor hotspots with coordinates, threat metrics, and glowing heatmap radiuses
const GLOBAL_HOTSPOTS = [
  { id: 'ukraine', name: 'Ukraine', lat: 50.4501, lng: 30.5234, threat: 'CRITICAL', intensity: 1.0, color: '#ff0055', pulseSpeed: 3.5, maxRadius: 9.0, size: 1.6 },
  { id: 'israel', name: 'Israel & Levant', lat: 31.7683, lng: 35.2137, threat: 'CRITICAL', intensity: 1.0, color: '#ff0055', pulseSpeed: 3.5, maxRadius: 8.5, size: 1.6 },
  { id: 'syria', name: 'Syria', lat: 33.5138, lng: 36.2765, threat: 'HIGH', intensity: 0.85, color: '#ff3366', pulseSpeed: 2.8, maxRadius: 7.0, size: 1.4 },
  { id: 'iran', name: 'Iran', lat: 35.6892, lng: 51.3890, threat: 'HIGH', intensity: 0.85, color: '#ff5500', pulseSpeed: 2.6, maxRadius: 7.5, size: 1.5 },
  { id: 'russia', name: 'Russia', lat: 55.7558, lng: 37.6173, threat: 'HIGH', intensity: 0.85, color: '#ff5500', pulseSpeed: 2.5, maxRadius: 8.0, size: 1.5 },
  { id: 'taiwan', name: 'Taiwan Strait', lat: 25.0330, lng: 121.5654, threat: 'HIGH', intensity: 0.85, color: '#ff0055', pulseSpeed: 2.7, maxRadius: 7.0, size: 1.4 },
  { id: 'sudan', name: 'Sudan', lat: 15.5007, lng: 32.5599, threat: 'HIGH', intensity: 0.8, color: '#ff4444', pulseSpeed: 2.4, maxRadius: 6.5, size: 1.3 },
  { id: 'south korea', name: 'Korean Peninsula', lat: 37.5665, lng: 126.9780, threat: 'ELEVATED', intensity: 0.7, color: '#ffb800', pulseSpeed: 2.0, maxRadius: 6.0, size: 1.3 },
  { id: 'china', name: 'China', lat: 39.9042, lng: 116.4074, threat: 'ELEVATED', intensity: 0.7, color: '#ffb800', pulseSpeed: 2.0, maxRadius: 6.5, size: 1.4 },
  { id: 'us', name: 'United States', lat: 38.8951, lng: -77.0364, threat: 'ELEVATED', intensity: 0.65, color: '#00f3ff', pulseSpeed: 1.8, maxRadius: 5.5, size: 1.3 },
  { id: 'india', name: 'India', lat: 28.6139, lng: 77.2090, threat: 'MONITORED', intensity: 0.5, color: '#00f3ff', pulseSpeed: 1.5, maxRadius: 5.0, size: 1.2 },
  { id: 'japan', name: 'Japan', lat: 35.6762, lng: 139.6503, threat: 'MONITORED', intensity: 0.5, color: '#00f3ff', pulseSpeed: 1.5, maxRadius: 4.5, size: 1.1 },
  { id: 'uk', name: 'United Kingdom', lat: 51.5074, lng: -0.1278, threat: 'MONITORED', intensity: 0.5, color: '#00ff9d', pulseSpeed: 1.4, maxRadius: 4.5, size: 1.1 },
  { id: 'france', name: 'France', lat: 48.8566, lng: 2.3522, threat: 'MONITORED', intensity: 0.45, color: '#00ff9d', pulseSpeed: 1.4, maxRadius: 4.5, size: 1.1 },
  { id: 'germany', name: 'Germany', lat: 52.5200, lng: 13.4050, threat: 'STABLE', intensity: 0.35, color: '#00ff9d', pulseSpeed: 1.2, maxRadius: 4.0, size: 1.0 },
  { id: 'congo', name: 'DR Congo', lat: -4.4419, lng: 15.2663, threat: 'ELEVATED', intensity: 0.6, color: '#ffb800', pulseSpeed: 1.8, maxRadius: 5.0, size: 1.2 },
  { id: 'australia', name: 'Australia', lat: -35.2809, lng: 149.1300, threat: 'STABLE', intensity: 0.3, color: '#00ff9d', pulseSpeed: 1.2, maxRadius: 4.0, size: 1.0 },
  { id: 'brazil', name: 'Brazil', lat: -15.7975, lng: -47.8919, threat: 'STABLE', intensity: 0.3, color: '#00ff9d', pulseSpeed: 1.2, maxRadius: 4.0, size: 1.0 },
  { id: 'canada', name: 'Canada', lat: 45.4215, lng: -75.6972, threat: 'STABLE', intensity: 0.3, color: '#00ff9d', pulseSpeed: 1.2, maxRadius: 4.0, size: 1.0 }
];

// Telemetry signal arcs connecting planetary command nodes
const TELEMETRY_ARCS = [
  { startLat: 38.8951, startLng: -77.0364, endLat: 51.5074, endLng: -0.1278, color: ['#00f3ff', '#00ff9d'] },
  { startLat: 51.5074, startLng: -0.1278, endLat: 50.4501, endLng: 30.5234, color: ['#00ff9d', '#ff0055'] },
  { startLat: 38.8951, startLng: -77.0364, endLat: 25.0330, endLng: 121.5654, color: ['#00f3ff', '#ff0055'] },
  { startLat: 39.9042, startLng: 116.4074, endLat: 55.7558, endLng: 37.6173, color: ['#ffb800', '#ff5500'] },
  { startLat: 31.7683, startLng: 35.2137, endLat: 50.4501, endLng: 30.5234, color: ['#ff0055', '#ff0055'] },
  { startLat: 28.6139, startLng: 77.2090, endLat: 35.6762, endLng: 139.6503, color: ['#00f3ff', '#00f3ff'] },
  { startLat: 35.6892, startLng: 51.3890, endLat: 31.7683, endLng: 35.2137, color: ['#ff5500', '#ff0055'] },
  { startLat: -35.2809, startLng: 149.1300, endLat: 38.8951, endLng: -77.0364, color: ['#00ff9d', '#00f3ff'] },
  { startLat: -15.7975, startLng: -47.8919, endLat: 38.8951, endLng: -77.0364, color: ['#00ff9d', '#00f3ff'] },
  { startLat: 33.5138, startLng: 36.2765, endLat: 31.7683, endLng: 35.2137, color: ['#ff3366', '#ff0055'] },
  { startLat: 48.8566, startLng: 2.3522, endLat: 50.4501, endLng: 30.5234, color: ['#00f3ff', '#ff0055'] }
];

// Earth Space View Textures
const TEXTURES = {
  space: {
    globe: 'https://unpkg.com/three-globe@2.31.0/example/img/earth-blue-marble.jpg',
    bump: 'https://unpkg.com/three-globe@2.31.0/example/img/earth-topology.png',
    background: 'https://unpkg.com/three-globe@2.31.0/example/img/night-sky.png',
    atmosphere: '#4cc9f0',
    altitude: 0.28
  },
  cyber: {
    globe: 'https://unpkg.com/three-globe@2.31.0/example/img/earth-night.jpg',
    bump: 'https://unpkg.com/three-globe@2.31.0/example/img/earth-topology.png',
    background: 'https://unpkg.com/three-globe@2.31.0/example/img/night-sky.png',
    atmosphere: '#00f3ff',
    altitude: 0.22
  }
};

export default function Globe3D({ selectedCountry = 'global', onSelectCountry }) {
  const globeContainerRef = useRef(null);
  const globeInstanceRef = useRef(null);
  const [globeMode, setGlobeMode] = useState('space'); // 'space' (Blue Marble from orbit) or 'cyber' (Night lights)
  const [heatmapGlow, setHeatmapGlow] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [webGlAvailable, setWebGlAvailable] = useState(true);

  // Initialize and mount Globe
  useEffect(() => {
    if (!globeContainerRef.current) return;

    let globe = null;
    let resizeObserver = null;

    try {
      const container = globeContainerRef.current;
      container.innerHTML = '';

      // Determine initial dimensions
      const initialWidth = container.clientWidth || container.parentElement?.clientWidth || 720;
      const initialHeight = container.clientHeight || 480;

      const currentTexture = TEXTURES[globeMode];

      // Initialize Three-Globe instance with space styling
      globe = Globe()(container)
        .width(initialWidth)
        .height(initialHeight)
        .globeImageUrl(currentTexture.globe)
        .bumpImageUrl(currentTexture.bump)
        .backgroundImageUrl(currentTexture.background)
        .showAtmosphere(true)
        .atmosphereColor(currentTexture.atmosphere)
        .atmosphereAltitude(currentTexture.altitude)

        // 1. Telemetry Hotspot Beacons
        .pointsData(GLOBAL_HOTSPOTS)
        .pointLat(d => d.lat)
        .pointLng(d => d.lng)
        .pointColor(d => d.color)
        .pointAltitude(d => d.threat === 'CRITICAL' ? 0.12 : d.threat === 'HIGH' ? 0.09 : 0.06)
        .pointRadius(d => d.size * (heatmapGlow ? 1.1 : 0.8))
        .pointLabel(d => `
          <div style="background:rgba(4,7,17,0.92);border:1px solid ${d.color};color:#fff;padding:8px 12px;border-radius:8px;font-family:monospace;font-size:12px;box-shadow:0 0 15px ${d.color};min-width:160px;">
            <div style="font-weight:bold;font-size:13px;color:${d.color};display:flex;align-items:center;gap:6px;">
              <span>🚨</span> <span>${d.name.toUpperCase()}</span>
            </div>
            <div style="margin-top:4px;color:#cbd5e1;">STATUS: <strong style="color:${d.color}">${d.threat}</strong></div>
            <div style="color:#94a3b8;font-size:10px;margin-top:2px;">HEATMAP INTENSITY: ${(d.intensity * 100).toFixed(0)}%</div>
            <div style="color:#00f3ff;font-size:10px;margin-top:6px;border-top:1px solid rgba(255,255,255,0.1);padding-top:4px;">CLICK TO FOCUS DISPATCHES</div>
          </div>
        `)
        .onPointClick(point => {
          if (point?.id) {
            onSelectCountry(point.id);
            globe.pointOfView({ lat: point.lat, lng: point.lng, altitude: 1.8 }, 1200);
          }
        })

        // 2. Glowing Threat Heatmap Rings (concentric radiation waves)
        .ringsData(heatmapGlow ? GLOBAL_HOTSPOTS : [])
        .ringLat(d => d.lat)
        .ringLng(d => d.lng)
        .ringColor(d => () => d.color)
        .ringMaxRadius(d => d.maxRadius)
        .ringPropagationSpeed(d => d.pulseSpeed)
        .ringRepeatPeriod(750)

        // 3. Orbital Telemetry Communication Arcs
        .arcsData(TELEMETRY_ARCS)
        .arcStartLat(d => d.startLat)
        .arcStartLng(d => d.startLng)
        .arcEndLat(d => d.endLat)
        .arcEndLng(d => d.endLng)
        .arcColor(d => d.color)
        .arcDashLength(0.4)
        .arcDashGap(0.2)
        .arcDashAnimateTime(1600)
        .arcAltitude(0.22);

      // Camera & Controls setup
      globe.controls().autoRotate = autoRotate;
      globe.controls().autoRotateSpeed = 0.5;
      globe.controls().enableZoom = true;

      // Set initial orbital vantage point
      globe.pointOfView({ lat: 25, lng: 20, altitude: 2.4 }, 1000);

      globeInstanceRef.current = globe;

      // Robust Resize Observer to dynamically adapt canvas to any layout/screen resize
      resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 50 && globe) {
            globe.width(width).height(height || 480);
          }
        }
      });
      resizeObserver.observe(container);

      // Force dimension update after layout paints
      requestAnimationFrame(() => {
        if (container && globe) {
          const w = container.clientWidth || container.parentElement?.clientWidth;
          const h = container.clientHeight || 480;
          if (w > 50) globe.width(w).height(h);
        }
      });

    } catch (err) {
      console.warn('WebGL Globe initialization warning:', err);
      setWebGlAvailable(false);
    }

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      if (globeContainerRef.current) {
        globeContainerRef.current.innerHTML = '';
      }
    };
  }, [globeMode, heatmapGlow]);

  // Handle camera shift on country selection
  useEffect(() => {
    if (!globeInstanceRef.current || !selectedCountry) return;
    const target = GLOBAL_HOTSPOTS.find(h => h.id === selectedCountry.toLowerCase());
    if (target) {
      globeInstanceRef.current.pointOfView(
        { lat: target.lat, lng: target.lng, altitude: 1.85 },
        1400
      );
    } else if (selectedCountry === 'global') {
      globeInstanceRef.current.pointOfView({ lat: 25, lng: 20, altitude: 2.4 }, 1200);
    }
  }, [selectedCountry]);

  // Toggle Auto-rotation
  const toggleAutoRotate = () => {
    if (globeInstanceRef.current) {
      const next = !autoRotate;
      globeInstanceRef.current.controls().autoRotate = next;
      setAutoRotate(next);
    }
  };

  // Zoom controls
  const handleZoom = (direction) => {
    if (!globeInstanceRef.current) return;
    const current = globeInstanceRef.current.pointOfView();
    const newAltitude = direction === 'in' ? Math.max(0.6, current.altitude - 0.5) : Math.min(4.2, current.altitude + 0.5);
    globeInstanceRef.current.pointOfView({ ...current, altitude: newAltitude }, 400);
  };

  const handleResetView = () => {
    if (globeInstanceRef.current) {
      globeInstanceRef.current.pointOfView({ lat: 25, lng: 20, altitude: 2.4 }, 1000);
      onSelectCountry('global');
    }
  };

  return (
    <div className="relative w-full h-[460px] lg:h-[520px] rounded-xl overflow-hidden cyber-panel cyber-panel-glow border border-cyber-cyan/40 flex flex-col bg-[#02050e]">
      
      {/* Top Left HUD Overlay */}
      <div className="absolute top-3 left-3 z-10 flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <div className="flex items-center space-x-2 bg-cyber-950/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyber-cyan/40 shadow-lg">
          <Crosshair className="w-4 h-4 text-cyber-cyan animate-pulse" />
          <span className="text-xs font-mono font-bold tracking-wider text-white">ORBITAL SPACE SENTINEL</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
            {globeMode === 'space' ? 'EARTH FROM SPACE' : 'CYBER NIGHT'}
          </span>
        </div>

        {/* Space Texture / Cyber Toggle */}
        <div className="flex items-center bg-cyber-950/90 backdrop-blur-md p-1 rounded-lg border border-cyber-border text-xs font-mono">
          <button
            onClick={() => setGlobeMode('space')}
            className={`px-2.5 py-1 rounded flex items-center gap-1 transition-all ${
              globeMode === 'space' ? 'bg-cyan-500 text-slate-950 font-bold shadow-glow-cyan' : 'text-slate-400 hover:text-white'
            }`}
            title="Real Earth viewed from space with oceans, atmosphere, and topology"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>REAL EARTH</span>
          </button>
          <button
            onClick={() => setGlobeMode('cyber')}
            className={`px-2.5 py-1 rounded flex items-center gap-1 transition-all ${
              globeMode === 'cyber' ? 'bg-cyan-500 text-slate-950 font-bold shadow-glow-cyan' : 'text-slate-400 hover:text-white'
            }`}
            title="Earth night lights with illuminated urban telemetry"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>NIGHT LIGHTS</span>
          </button>
        </div>
      </div>

      {/* Top Right HUD Controls */}
      <div className="absolute top-3 right-3 z-10 flex items-center space-x-1.5 bg-cyber-950/90 backdrop-blur-md p-1.5 rounded-lg border border-cyber-border shadow-lg">
        {/* Glowing Heatmap Toggle */}
        <button
          onClick={() => setHeatmapGlow(!heatmapGlow)}
          className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition-all ${
            heatmapGlow ? 'bg-crimson-900/80 text-cyber-crimson border border-cyber-crimson font-bold shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
          title="Toggle Glowing Conflict Heatmaps"
        >
          <Flame className={`w-3.5 h-3.5 ${heatmapGlow ? 'animate-bounce text-cyber-crimson' : ''}`} />
          <span className="hidden sm:inline">GLOWING HEATMAP</span>
        </button>

        {/* Orbit Auto-Rotation Toggle */}
        <button
          onClick={toggleAutoRotate}
          className={`p-1.5 rounded hover:bg-cyber-850 text-xs font-mono transition-all ${
            autoRotate ? 'text-cyber-cyan' : 'text-slate-500 hover:text-slate-300'
          }`}
          title={autoRotate ? 'Pause Rotation' : 'Resume Planetary Rotation'}
        >
          <Radio className={`w-4 h-4 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
        </button>

        {/* Zoom Controls */}
        <button
          onClick={() => handleZoom('in')}
          className="p-1.5 rounded hover:bg-cyber-850 text-slate-300 hover:text-cyber-cyan transition-all"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom('out')}
          className="p-1.5 rounded hover:bg-cyber-850 text-slate-300 hover:text-cyber-cyan transition-all"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetView}
          className="p-1.5 rounded hover:bg-cyber-850 text-slate-300 hover:text-cyber-amber transition-all"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Hotspots Quick Bar */}
      <div className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-1.5 max-w-[85%] bg-cyber-950/90 backdrop-blur-md p-2 rounded-lg border border-cyber-border/80 shadow-lg">
        <span className="text-[11px] font-mono text-slate-400 self-center mr-1 flex items-center gap-1">
          <Flame className="w-3 h-3 text-cyber-crimson" /> HEAT ZONES:
        </span>
        {GLOBAL_HOTSPOTS.slice(0, 7).map(h => (
          <button
            key={h.id}
            onClick={() => onSelectCountry(h.id)}
            className={`text-xs font-mono px-2.5 py-1 rounded transition-all flex items-center gap-1.5 ${
              selectedCountry.toLowerCase() === h.id
                ? 'bg-cyber-cyan text-cyber-950 font-bold shadow-glow-cyan'
                : 'bg-cyber-900/90 text-slate-300 hover:text-white border border-cyber-border hover:border-cyber-cyan/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: h.color }} />
            <span>{h.name}</span>
          </button>
        ))}
      </div>

      {/* 3D WebGL Canvas Container */}
      <div 
        ref={globeContainerRef} 
        className="flex-1 w-full h-full min-h-[460px] cursor-grab active:cursor-grabbing bg-[#02050e]"
      />

      {/* Fallback if WebGL is unavailable */}
      {!webGlAvailable && (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-cyber-900/90">
          <MapPin className="w-12 h-12 text-cyber-cyan mb-2 animate-bounce" />
          <p className="text-sm font-mono text-cyber-cyan font-semibold">2D Interactive Telemetry Grid Active</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Select a monitored node below to stream real-time geopolitical intelligence.
          </p>
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            {GLOBAL_HOTSPOTS.map(h => (
              <button
                key={h.id}
                onClick={() => onSelectCountry(h.id)}
                className="px-3 py-1.5 rounded bg-cyber-850 border border-cyber-cyan/40 text-xs font-mono text-white hover:bg-cyber-cyan hover:text-cyber-950"
              >
                {h.name} ({h.threat})
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
