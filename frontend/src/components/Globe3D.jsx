import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Crosshair, ZoomIn, ZoomOut, RotateCcw, Flame, Eye, Sparkles, Radio } from 'lucide-react';

// Hotspot sensor nodes with coordinates, threat metrics, and glowing heatmap radiuses
const GLOBAL_HOTSPOTS = [
  { id: 'ukraine', name: 'Ukraine', lat: 50.4501, lng: 30.5234, threat: 'CRITICAL', color: 0xff0055, colorHex: '#ff0055', pulseSpeed: 3.0, maxScale: 4.5 },
  { id: 'israel', name: 'Israel & Levant', lat: 31.7683, lng: 35.2137, threat: 'CRITICAL', color: 0xff0055, colorHex: '#ff0055', pulseSpeed: 3.0, maxScale: 4.2 },
  { id: 'syria', name: 'Syria', lat: 33.5138, lng: 36.2765, threat: 'HIGH', color: 0xff3366, colorHex: '#ff3366', pulseSpeed: 2.6, maxScale: 3.8 },
  { id: 'iran', name: 'Iran', lat: 35.6892, lng: 51.3890, threat: 'HIGH', color: 0xff5500, colorHex: '#ff5500', pulseSpeed: 2.5, maxScale: 4.0 },
  { id: 'russia', name: 'Russia', lat: 55.7558, lng: 37.6173, threat: 'HIGH', color: 0xff5500, colorHex: '#ff5500', pulseSpeed: 2.5, maxScale: 4.0 },
  { id: 'taiwan', name: 'Taiwan Strait', lat: 25.0330, lng: 121.5654, threat: 'HIGH', color: 0xff0055, colorHex: '#ff0055', pulseSpeed: 2.7, maxScale: 3.8 },
  { id: 'sudan', name: 'Sudan', lat: 15.5007, lng: 32.5599, threat: 'HIGH', color: 0xff4444, colorHex: '#ff4444', pulseSpeed: 2.4, maxScale: 3.6 },
  { id: 'south korea', name: 'Korean Peninsula', lat: 37.5665, lng: 126.9780, threat: 'ELEVATED', color: 0xffb800, colorHex: '#ffb800', pulseSpeed: 2.0, maxScale: 3.4 },
  { id: 'china', name: 'China', lat: 39.9042, lng: 116.4074, threat: 'ELEVATED', color: 0xffb800, colorHex: '#ffb800', pulseSpeed: 2.0, maxScale: 3.5 },
  { id: 'us', name: 'United States', lat: 38.8951, lng: -77.0364, threat: 'ELEVATED', color: 0x00f3ff, colorHex: '#00f3ff', pulseSpeed: 1.8, maxScale: 3.2 },
  { id: 'india', name: 'India', lat: 28.6139, lng: 77.2090, threat: 'MONITORED', color: 0x00f3ff, colorHex: '#00f3ff', pulseSpeed: 1.6, maxScale: 3.0 },
  { id: 'japan', name: 'Japan', lat: 35.6762, lng: 139.6503, threat: 'MONITORED', color: 0x00f3ff, colorHex: '#00f3ff', pulseSpeed: 1.5, maxScale: 2.8 },
  { id: 'uk', name: 'United Kingdom', lat: 51.5074, lng: -0.1278, threat: 'MONITORED', color: 0x00ff9d, colorHex: '#00ff9d', pulseSpeed: 1.4, maxScale: 2.8 },
  { id: 'france', name: 'France', lat: 48.8566, lng: 2.3522, threat: 'MONITORED', color: 0x00ff9d, colorHex: '#00ff9d', pulseSpeed: 1.4, maxScale: 2.8 },
  { id: 'germany', name: 'Germany', lat: 52.5200, lng: 13.4050, threat: 'STABLE', color: 0x00ff9d, colorHex: '#00ff9d', pulseSpeed: 1.2, maxScale: 2.5 },
  { id: 'congo', name: 'DR Congo', lat: -4.4419, lng: 15.2663, threat: 'ELEVATED', color: 0xffb800, colorHex: '#ffb800', pulseSpeed: 1.8, maxScale: 3.0 },
  { id: 'australia', name: 'Australia', lat: -35.2809, lng: 149.1300, threat: 'STABLE', color: 0x00ff9d, colorHex: '#00ff9d', pulseSpeed: 1.2, maxScale: 2.5 },
  { id: 'brazil', name: 'Brazil', lat: -15.7975, lng: -47.8919, threat: 'STABLE', color: 0x00ff9d, colorHex: '#00ff9d', pulseSpeed: 1.2, maxScale: 2.5 },
  { id: 'canada', name: 'Canada', lat: 45.4215, lng: -75.6972, threat: 'STABLE', color: 0x00ff9d, colorHex: '#00ff9d', pulseSpeed: 1.2, maxScale: 2.5 }
];

// Telemetry communication arcs between planetary nodes
const TELEMETRY_CONNECTIONS = [
  { from: 'us', to: 'uk' },
  { from: 'uk', to: 'ukraine' },
  { from: 'us', to: 'taiwan' },
  { from: 'china', to: 'russia' },
  { from: 'israel', to: 'ukraine' },
  { from: 'india', to: 'japan' },
  { from: 'iran', to: 'israel' },
  { from: 'france', to: 'ukraine' },
  { from: 'australia', to: 'us' },
  { from: 'brazil', to: 'us' }
];

// Convert latitude and longitude to 3D Cartesian coordinates
function latLngToVector3(lat, lng, radius, altitude = 0) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const r = radius + altitude;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

// Procedural fallback Earth canvas texture to guarantee the globe is NEVER blank or missing
function createProceduralEarthTexture(isNight = false) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Deep Ocean gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  if (isNight) {
    oceanGrad.addColorStop(0, '#020612');
    oceanGrad.addColorStop(0.5, '#040b1e');
    oceanGrad.addColorStop(1, '#02050f');
  } else {
    oceanGrad.addColorStop(0, '#0c2444');
    oceanGrad.addColorStop(0.5, '#0d3268');
    oceanGrad.addColorStop(1, '#081f3d');
  }
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid lines (Longitude / Latitude)
  ctx.strokeStyle = isNight ? 'rgba(0, 243, 255, 0.15)' : 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= canvas.width; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Draw stylized continental landmass approximations
  ctx.fillStyle = isNight ? '#091c38' : '#1e4b38';
  ctx.strokeStyle = isNight ? '#00f3ff' : '#4ade80';
  ctx.lineWidth = 1.5;

  const drawLandBlob = (x, y, w, h) => {
    ctx.beginPath();
    ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  };

  // Americas
  drawLandBlob(250, 180, 80, 50); // North America
  drawLandBlob(320, 340, 50, 80); // South America
  // Eurasia & Africa
  drawLandBlob(540, 160, 120, 60); // Europe & Russia
  drawLandBlob(520, 280, 70, 90);  // Africa
  drawLandBlob(720, 200, 110, 70); // Asia
  // Australia
  drawLandBlob(820, 360, 50, 40);

  // If night mode, add bright glowing city lights
  if (isNight) {
    ctx.fillStyle = '#ffea79';
    for (let i = 0; i < 200; i++) {
      const rx = (Math.random() * 0.7 + 0.15) * canvas.width;
      const ry = (Math.random() * 0.6 + 0.2) * canvas.height;
      ctx.beginPath();
      ctx.arc(rx, ry, Math.random() * 2 + 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export default function Globe3D({ selectedCountry = 'global', onSelectCountry }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const globeMeshRef = useRef(null);
  const heatRingsRef = useRef([]);
  const beaconMeshesRef = useRef([]);
  const targetCamPos = useRef(null);

  const [globeMode, setGlobeMode] = useState('space'); // 'space' (Realistic Blue Marble) or 'cyber' (Night Lights)
  const [heatmapGlow, setHeatmapGlow] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [hoveredHotspot, setHoveredHotspot] = useState(null);

  const GLOBE_RADIUS = 100;

  // Initialize Three.js Scene
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = container.clientWidth || 700;
    const height = container.clientHeight || 480;

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    camera.position.set(0, 40, 280);
    cameraRef.current = camera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.6;
    controls.zoomSpeed = 0.8;
    controls.minDistance = 125;
    controls.maxDistance = 500;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 0.6;
    controlsRef.current = controls;

    // 5. Lighting (Sunlight + Atmospheric Glow + Rim Light)
    const ambientLight = new THREE.AmbientLight(0x334466, 1.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
    sunLight.position.set(300, 150, 200);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x00f3ff, 1.0);
    rimLight.position.set(-200, -100, -200);
    scene.add(rimLight);

    // 6. Deep Space Starfield (2,000 Glowing Stars)
    const starsGeo = new THREE.BufferGeometry();
    const starsCount = 2000;
    const starPositions = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount * 3; i += 3) {
      const radius = 600 + Math.random() * 400;
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      starPositions[i] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i + 2] = radius * Math.cos(phi);
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.2, transparent: true, opacity: 0.8 });
    const starsMesh = new THREE.Points(starsGeo, starsMat);
    scene.add(starsMesh);

    // 7. Earth Mesh with Photorealistic Textures & Immediate Procedural Fallback
    const earthGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
    
    // Start immediately with procedural canvas texture so globe is never invisible
    const initialTexture = createProceduralEarthTexture(globeMode === 'cyber');
    const earthMat = new THREE.MeshStandardMaterial({
      map: initialTexture,
      roughness: 0.5,
      metalness: 0.1
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earthMesh);
    globeMeshRef.current = earthMesh;

    // Load High-Res NASA Earth Texture asynchronously
    const textureLoader = new THREE.TextureLoader();
    const targetUrl = globeMode === 'space'
      ? 'https://unpkg.com/three-globe@2.31.0/example/img/earth-blue-marble.jpg'
      : 'https://unpkg.com/three-globe@2.31.0/example/img/earth-night.jpg';

    textureLoader.load(
      targetUrl,
      (loadedTex) => {
        loadedTex.wrapS = THREE.RepeatWrapping;
        loadedTex.wrapT = THREE.ClampToEdgeWrapping;
        earthMat.map = loadedTex;
        earthMat.needsUpdate = true;
      },
      undefined,
      (err) => {
        console.log('Using procedural Earth texture:', err);
      }
    );

    // 8. Luminous Atmospheric Space Halo Shader
    const atmosphereGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.04, 64, 64);
    const atmosphereMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        uniform vec3 color;
        void main() {
          float intensity = pow(0.62 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
          gl_FragColor = vec4(color, 1.0) * intensity;
        }
      `,
      uniforms: {
        color: { value: new THREE.Color(globeMode === 'space' ? 0x38bdf8 : 0x00f3ff) }
      },
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    scene.add(atmosphereMesh);

    // 9. Hotspot Glowing Beacons & Concentric Radiant Heatwaves
    const ringsList = [];
    const beaconsList = [];

    GLOBAL_HOTSPOTS.forEach(h => {
      const pos = latLngToVector3(h.lat, h.lng, GLOBE_RADIUS);
      const normal = pos.clone().normalize();

      // Beacon Pin Base & Floating Glowing Beacon
      const beaconGroup = new THREE.Group();
      beaconGroup.position.copy(pos);
      beaconGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

      // Vertical laser beam
      const beamGeo = new THREE.CylinderGeometry(0.3, 0.3, 8, 8);
      beamGeo.translate(0, 4, 0);
      const beamMat = new THREE.MeshBasicMaterial({ color: h.color, transparent: true, opacity: 0.8 });
      const beamMesh = new THREE.Mesh(beamGeo, beamMat);
      beaconGroup.add(beamMesh);

      // Top glowing sphere
      const sphereGeo = new THREE.SphereGeometry(1.8, 16, 16);
      sphereGeo.translate(0, 8, 0);
      const sphereMat = new THREE.MeshBasicMaterial({ color: h.color });
      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
      sphereMesh.userData = h; // Store hotspot data for click raycasting
      beaconGroup.add(sphereMesh);
      beaconsList.push(sphereMesh);

      scene.add(beaconGroup);

      // Glowing Heatmap Wave Rings (Pulsating concentric shockwaves)
      const ringCount = h.threat === 'CRITICAL' ? 3 : 2;
      for (let r = 0; r < ringCount; r++) {
        const ringGeo = new THREE.RingGeometry(1.5, 3.2, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: h.color,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8,
          blending: THREE.AdditiveBlending
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.copy(pos.clone().add(normal.clone().multiplyScalar(0.4)));
        ringMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
        
        ringMesh.userData = {
          baseScale: 1.0,
          scale: 1.0 + (r * 0.8),
          speed: h.pulseSpeed * 0.012,
          maxScale: h.maxScale,
          initialOpacity: 0.85
        };

        scene.add(ringMesh);
        ringsList.push(ringMesh);
      }
    });

    heatRingsRef.current = ringsList;
    beaconMeshesRef.current = beaconsList;

    // 10. Glowing Orbital Telemetry Arcs
    TELEMETRY_CONNECTIONS.forEach(conn => {
      const fromNode = GLOBAL_HOTSPOTS.find(h => h.id === conn.from);
      const toNode = GLOBAL_HOTSPOTS.find(h => h.id === conn.to);
      if (!fromNode || !toNode) return;

      const p1 = latLngToVector3(fromNode.lat, fromNode.lng, GLOBE_RADIUS);
      const p2 = latLngToVector3(toNode.lat, toNode.lng, GLOBE_RADIUS);

      // Calculate mid-point arched into orbit
      const mid = p1.clone().add(p2).multiplyScalar(0.5);
      const dist = p1.distanceTo(p2);
      const arcAltitude = Math.min(60, dist * 0.35);
      mid.normalize().multiplyScalar(GLOBE_RADIUS + arcAltitude);

      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      const points = curve.getPoints(40);
      const arcGeo = new THREE.BufferGeometry().setFromPoints(points);
      const arcMat = new THREE.LineBasicMaterial({
        color: 0x00f3ff,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending
      });
      const arcLine = new THREE.Line(arcGeo, arcMat);
      scene.add(arcLine);
    });

    // 11. Handle Window / Container Resizing
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || 700;
      const h = container.clientHeight || 480;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 12. Click & Hover Raycasting
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleCanvasClick = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(beaconMeshesRef.current);

      if (intersects.length > 0) {
        const clickedNode = intersects[0].object.userData;
        if (clickedNode && clickedNode.id) {
          onSelectCountry(clickedNode.id);
        }
      }
    };
    renderer.domElement.addEventListener('click', handleCanvasClick);

    // 13. Render & Animation Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth camera interpolation towards target country
      if (targetCamPos.current) {
        camera.position.lerp(targetCamPos.current, 0.05);
        if (camera.position.distanceTo(targetCamPos.current) < 2) {
          targetCamPos.current = null;
        }
      }

      controls.update();

      // Pulsate glowing heatwave rings
      if (heatmapGlow) {
        heatRingsRef.current.forEach(ring => {
          ring.userData.scale += ring.userData.speed;
          if (ring.userData.scale > ring.userData.maxScale) {
            ring.userData.scale = 1.0;
          }
          ring.scale.set(ring.userData.scale, ring.userData.scale, 1.0);
          
          // Fade opacity as wave expands outward
          const progress = (ring.userData.scale - 1.0) / (ring.userData.maxScale - 1.0);
          ring.material.opacity = (1.0 - progress) * 0.85;
        });
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', handleCanvasClick);
      renderer.dispose();
      if (container) container.innerHTML = '';
    };
  }, [globeMode, heatmapGlow]);

  // Update camera position smoothly when selectedCountry changes
  useEffect(() => {
    if (!selectedCountry) return;
    const target = GLOBAL_HOTSPOTS.find(h => h.id === selectedCountry.toLowerCase());
    if (target && cameraRef.current) {
      const pos = latLngToVector3(target.lat, target.lng, GLOBE_RADIUS, 140);
      targetCamPos.current = pos;
    } else if (selectedCountry === 'global' && cameraRef.current) {
      targetCamPos.current = new THREE.Vector3(0, 40, 280);
    }
  }, [selectedCountry]);

  // Toggle Auto-rotation
  const toggleAutoRotate = () => {
    const next = !autoRotate;
    if (controlsRef.current) {
      controlsRef.current.autoRotate = next;
    }
    setAutoRotate(next);
  };

  // Zoom controls
  const handleZoom = (direction) => {
    if (!cameraRef.current) return;
    const factor = direction === 'in' ? 0.8 : 1.25;
    cameraRef.current.position.multiplyScalar(factor);
    if (cameraRef.current.position.length() < 125) cameraRef.current.position.setLength(125);
    if (cameraRef.current.position.length() > 500) cameraRef.current.position.setLength(500);
  };

  const handleResetView = () => {
    targetCamPos.current = new THREE.Vector3(0, 40, 280);
    onSelectCountry('global');
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
            title="Real Blue Marble Earth from space with atmosphere"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>REAL EARTH</span>
          </button>
          <button
            onClick={() => setGlobeMode('cyber')}
            className={`px-2.5 py-1 rounded flex items-center gap-1 transition-all ${
              globeMode === 'cyber' ? 'bg-cyan-500 text-slate-950 font-bold shadow-glow-cyan' : 'text-slate-400 hover:text-white'
            }`}
            title="Earth at night with city telemetry lights"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>NIGHT LIGHTS</span>
          </button>
        </div>
      </div>

      {/* Top Right HUD Controls */}
      <div className="absolute top-3 right-3 z-10 flex items-center space-x-1.5 bg-cyber-950/90 backdrop-blur-md p-1.5 rounded-lg border border-cyber-border shadow-lg">
        {/* Glowing Heatmap Shockwave Toggle */}
        <button
          onClick={() => setHeatmapGlow(!heatmapGlow)}
          className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition-all ${
            heatmapGlow ? 'bg-crimson-900/80 text-cyber-crimson border border-cyber-crimson font-bold shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
          title="Toggle Radiant Heatwave Rings"
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

        {/* Camera Zoom & Reset */}
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
          <Flame className="w-3 h-3 text-cyber-crimson" /> HEATMAP NODES:
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
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: h.colorHex }} />
            <span>{h.name}</span>
          </button>
        ))}
      </div>

      {/* Native 3D WebGL Canvas Container */}
      <div 
        ref={mountRef} 
        className="flex-1 w-full h-full min-h-[460px] cursor-grab active:cursor-grabbing bg-[#02050e]"
      />
    </div>
  );
}
