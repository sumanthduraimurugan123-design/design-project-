import React, { useEffect, useRef, useState } from 'react';
import Globe from 'globe.gl';
import { Crosshair, ZoomIn, ZoomOut, RotateCcw, MapPin } from 'lucide-react';

// Key geopolitical sensor nodes with coordinates and threat metrics
const GLOBAL_HOTSPOTS = [
  { id: 'us', name: 'United States', lat: 38.8951, lng: -77.0364, threat: 'ELEVATED', color: '#00f3ff', size: 1.2 },
  { id: 'uk', name: 'United Kingdom', lat: 51.5074, lng: -0.1278, threat: 'MONITORED', color: '#00ff9d', size: 1.0 },
  { id: 'ukraine', name: 'Ukraine', lat: 50.4501, lng: 30.5234, threat: 'CRITICAL', color: '#ff0055', size: 1.6 },
  { id: 'russia', name: 'Russia', lat: 55.7558, lng: 37.6173, threat: 'HIGH', color: '#ff5500', size: 1.5 },
  { id: 'china', name: 'China', lat: 39.9042, lng: 116.4074, threat: 'ELEVATED', color: '#ffb800', size: 1.4 },
  { id: 'taiwan', name: 'Taiwan', lat: 25.0330, lng: 121.5654, threat: 'HIGH', color: '#ff0055', size: 1.4 },
  { id: 'israel', name: 'Israel', lat: 31.7683, lng: 35.2137, threat: 'CRITICAL', color: '#ff0055', size: 1.5 },
  { id: 'india', name: 'India', lat: 28.6139, lng: 77.2090, threat: 'MONITORED', color: '#00f3ff', size: 1.2 },
  { id: 'germany', name: 'Germany', lat: 52.5200, lng: 13.4050, threat: 'STABLE', color: '#00ff9d', size: 1.0 },
  { id: 'japan', name: 'Japan', lat: 35.6762, lng: 139.6503, threat: 'MONITORED', color: '#00f3ff', size: 1.1 }
];

// Telemetry signal arcs connecting planetary intel hubs
const TELEMETRY_ARCS = [
  { startLat: 38.8951, startLng: -77.0364, endLat: 51.5074, endLng: -0.1278, color: ['#00f3ff', '#00ff9d'] },
  { startLat: 51.5074, startLng: -0.1278, endLat: 50.4501, endLng: 30.5234, color: ['#00ff9d', '#ff0055'] },
  { startLat: 38.8951, startLng: -77.0364, endLat: 25.0330, endLng: 121.5654, color: ['#00f3ff', '#ffb800'] },
  { startLat: 39.9042, startLng: 116.4074, endLat: 55.7558, endLng: 37.6173, color: ['#ffb800', '#ff5500'] },
  { startLat: 31.7683, startLng: 35.2137, endLat: 50.4501, endLng: 30.5234, color: ['#ff0055', '#ff0055'] },
  { startLat: 28.6139, startLng: 77.2090, endLat: 35.6762, endLng: 139.6503, color: ['#00f3ff', '#00f3ff'] }
];

export default function Globe3D({ selectedCountry, onSelectCountry }) {
  const globeContainerRef = useRef(null);
  const globeInstanceRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [webGlAvailable, setWebGlAvailable] = useState(true);

  useEffect(() => {
    if (!globeContainerRef.current) return;

    try {
      // Initialize 3D Globe with Cyber theme
      const globe = Globe()(globeContainerRef.current)
        .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
        .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
        .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
        .showAtmosphere(true)
        .atmosphereColor('#00f3ff')
        .atmosphereAltitude(0.22)
        // Telemetry Hotspot Points
        .pointsData(GLOBAL_HOTSPOTS)
        .pointLat(d => d.lat)
        .pointLng(d => d.lng)
        .pointColor(d => d.color)
        .pointAltitude(0.06)
        .pointRadius(d => d.size * 0.9)
        .pointLabel(d => `
          <div style="background:#070c1e;border:1px solid #00f3ff;color:#fff;padding:6px 10px;border-radius:4px;font-family:monospace;font-size:12px;box-shadow:0 0 10px #00f3ff;">
            <div style="font-weight:bold;color:#00f3ff">${d.name.toUpperCase()}</div>
            <div>STATUS: <span style="color:${d.color}">${d.threat}</span></div>
            <div style="color:#aaa;font-size:10px">CLICK TO FOCUS TELEMETRY</div>
          </div>
        `)
        .onPointClick(point => {
          if (point?.id) {
            onSelectCountry(point.id);
            globe.pointOfView({ lat: point.lat, lng: point.lng, altitude: 1.8 }, 1200);
          }
        })
        .onPointHover(node => setHoveredNode(node || null))
        // Pulse Rings for Heatmap Threat Effect
        .ringsData(GLOBAL_HOTSPOTS)
        .ringLat(d => d.lat)
        .ringLng(d => d.lng)
        .ringColor(d => () => d.color)
        .ringMaxRadius(d => d.threat === 'CRITICAL' ? 7 : 4.5)
        .ringPropagationSpeed(d => d.threat === 'CRITICAL' ? 3 : 1.8)
        .ringRepeatPeriod(900)
        // Cyber Telemetry Communication Arcs
        .arcsData(TELEMETRY_ARCS)
        .arcStartLat(d => d.startLat)
        .arcStartLng(d => d.startLng)
        .arcEndLat(d => d.endLat)
        .arcEndLng(d => d.endLng)
        .arcColor(d => d.color)
        .arcDashLength(0.4)
        .arcDashGap(0.2)
        .arcDashAnimateTime(1800)
        .arcAltitude(0.25);

      // Auto-rotation
      globe.controls().autoRotate = true;
      globe.controls().autoRotateSpeed = 0.6;
      globe.controls().enableZoom = true;

      // Fit container size
      const updateDimensions = () => {
        if (globeContainerRef.current) {
          const { clientWidth, clientHeight } = globeContainerRef.current;
          globe.width(clientWidth).height(clientHeight || 450);
        }
      };
      updateDimensions();
      window.addEventListener('resize', updateDimensions);

      globeInstanceRef.current = globe;

      return () => {
        window.removeEventListener('resize', updateDimensions);
        // Clean up globe
        if (globeContainerRef.current) {
          globeContainerRef.current.innerHTML = '';
        }
      };
    } catch (err) {
      console.warn('3D WebGL Globe initialization fallback:', err);
      setWebGlAvailable(false);
    }
  }, []);

  // When selectedCountry changes, animate camera towards target hotspot
  useEffect(() => {
    if (!globeInstanceRef.current || !selectedCountry) return;
    const target = GLOBAL_HOTSPOTS.find(h => h.id === selectedCountry.toLowerCase());
    if (target) {
      globeInstanceRef.current.pointOfView(
        { lat: target.lat, lng: target.lng, altitude: 1.9 },
        1400
      );
    } else if (selectedCountry === 'global') {
      globeInstanceRef.current.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 1200);
    }
  }, [selectedCountry]);

  // View control buttons
  const handleResetView = () => {
    if (globeInstanceRef.current) {
      globeInstanceRef.current.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 1000);
      onSelectCountry('global');
    }
  };

  const handleZoom = (direction) => {
    if (!globeInstanceRef.current) return;
    const current = globeInstanceRef.current.pointOfView();
    const newAltitude = direction === 'in' ? Math.max(0.6, current.altitude - 0.5) : Math.min(4.0, current.altitude + 0.5);
    globeInstanceRef.current.pointOfView({ ...current, altitude: newAltitude }, 400);
  };

  return (
    <div className="relative w-full h-[400px] lg:h-[480px] rounded-xl overflow-hidden cyber-panel cyber-panel-glow border border-cyber-cyan/30 flex flex-col">
      {/* Top HUD Overlay */}
      <div className="absolute top-3 left-3 z-10 flex items-center space-x-2 bg-cyber-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyber-border">
        <Crosshair className="w-4 h-4 text-cyber-cyan animate-pulse" />
        <span className="text-xs font-mono font-bold tracking-wider text-white">PLANETARY TELEMETRY MATRIX</span>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/30">
          3D ORBITAL
        </span>
      </div>

      {/* Quick Region Selector Pills */}
      <div className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-1.5 max-w-[80%] bg-cyber-950/85 backdrop-blur-md p-2 rounded-lg border border-cyber-border/80">
        <span className="text-[11px] font-mono text-slate-400 self-center mr-1">HOTSPOTS:</span>
        {GLOBAL_HOTSPOTS.slice(0, 6).map(h => (
          <button
            key={h.id}
            onClick={() => onSelectCountry(h.id)}
            className={`text-xs font-mono px-2 py-1 rounded transition-all ${
              selectedCountry.toLowerCase() === h.id
                ? 'bg-cyber-cyan text-cyber-950 font-bold shadow-glow-cyan'
                : 'bg-cyber-900/90 text-slate-300 hover:text-white border border-cyber-border hover:border-cyber-cyan/40'
            }`}
          >
            {h.name}
          </button>
        ))}
      </div>

      {/* Camera Controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col space-y-1.5 bg-cyber-950/80 backdrop-blur-md p-1.5 rounded-lg border border-cyber-border">
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
          title="Reset Planetary View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* 3D WebGL Canvas Container */}
      <div 
        ref={globeContainerRef} 
        className="w-full h-full cursor-grab active:cursor-grabbing bg-[#040711]"
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
