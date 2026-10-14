import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  ArrowLeft,
  ArrowRight,
  Eye,
  Crosshair,
  Volume2,
  VolumeX,
  Sparkles,
} from 'lucide-react';
import { sound } from '../utils/audio';

export interface InteractiveObjectData {
  type: 'INSPECT_BREAKER' | 'INSPECT_OSCILLOSCOPE' | 'INSPECT_RELAY' | 'INSPECT_VAULT_HANDLE' | 'MATCHSTICK_CRT' | 'KEY_LOCKBOX' | 'TECH_TERMINAL' | 'DECOY' | 'FLAG';
  name: string;
  description: string;
  letterCode?: string;
  venueClue?: string;
}

interface HauntedHouse3DProps {
  currentRoomId: number;
  stage: 'INSPECTION' | 'KEY_VERIFICATION' | 'TECH_CHALLENGE' | 'DOOR_UNBOLTED' | 'COMPLETED';
  step1Solved: boolean;
  step2Verified: boolean;
  step3Completed: boolean;
  flagCaptured: boolean;
  onInspectTarget: (data: InteractiveObjectData) => void;
  onOpenKeyLockbox: () => void;
  onOpenTechTerminal: () => void;
  onOpenMatchstickCRT?: () => void;
  onCaptureFlag?: () => void;
  isInspectingModalOpen: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

// Procedural texture generators
function createRustMetalTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#141820';
  ctx.fillRect(0, 0, 512, 512);

  // Metal plates with rust streaks
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const size = 10 + Math.random() * 40;
    const rustColors = ['#3d1a0d', '#5a2512', '#783516', '#261208', '#1a202c'];
    ctx.fillStyle = rustColors[Math.floor(Math.random() * rustColors.length)];
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Corrugated rivets / seams
  ctx.globalAlpha = 1.0;
  ctx.strokeStyle = '#0a0d14';
  ctx.lineWidth = 3;
  ctx.strokeRect(4, 4, 504, 504);
  ctx.strokeRect(128, 4, 256, 504);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

function createDistressedStoneTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0f1118';
  ctx.fillRect(0, 0, 512, 512);

  const rowH = 64;
  for (let r = 0; r < 512; r += rowH) {
    for (let c = 0; c < 512; c += 128) {
      const shade = 14 + Math.floor(Math.random() * 12);
      ctx.fillStyle = `rgb(${shade}, ${shade + 2}, ${shade + 6})`;
      ctx.fillRect(c + 2, r + 2, 124, rowH - 4);

      // Water damage and mold grime
      if (Math.random() < 0.4) {
        ctx.fillStyle = 'rgba(6, 40, 30, 0.35)';
        ctx.fillRect(c + 2, r + 2, 124, rowH - 4);
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  return tex;
}

function createOscilloscopeTexture(phase: number = 0): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#021008';
  ctx.fillRect(0, 0, 256, 256);

  // Phosphor grid
  ctx.strokeStyle = '#052912';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 256; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 256);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(256, i);
    ctx.stroke();
  }

  // Phosphor waveform
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = '#34d399';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  for (let x = 0; x < 256; x++) {
    const y = 128 + Math.sin((x * 0.08) + phase) * 45 + (Math.random() - 0.5) * 8;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // CRT scanlines
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  for (let y = 0; y < 256; y += 4) {
    ctx.fillRect(0, y, 256, 2);
  }

  // Label text
  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('CAN BUS CH-02 [S2 ACTIVE]', 12, 28);
  ctx.fillText('100 kbit/s DOMINANT', 12, 240);

  return new THREE.CanvasTexture(canvas);
}

function createCRTMonitorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#05111b';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 1;
  ctx.strokeRect(6, 6, 244, 244);

  ctx.fillStyle = '#22d3ee';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('TERMINAL CYPHER NODE', 16, 32);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '10px monospace';
  ctx.fillText('> SYSTEM PROTOCOL: LOCKED', 16, 60);
  ctx.fillText('> REARRANGE 6 MATCHSTICKS', 16, 80);
  ctx.fillText('> MAKE "NOTHING" [N-I-L]', 16, 100);
  ctx.fillText('> CLICK CRT TO SOLVE CYPHER', 16, 130);

  // Matchstick icon graphic
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(50, 160, 156, 12);
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(206, 166, 10, 0, Math.PI * 2);
  ctx.fill();

  return new THREE.CanvasTexture(canvas);
}

function createBreakerStickerTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#261b14';
  ctx.fillRect(0, 0, 256, 256);

  // Hazard borders
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(8, 8, 240, 24);
  ctx.fillStyle = '#000';
  ctx.font = 'bold 14px monospace';
  ctx.fillText('HIGH VOLTAGE // INTAKE', 16, 25);

  // Scratched stencil: "L1"
  ctx.fillStyle = '#22d3ee';
  ctx.font = 'bold 64px monospace';
  ctx.shadowColor = '#06b6d4';
  ctx.shadowBlur = 12;
  ctx.fillText('L1', 80, 135);

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#cbd5e1';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('[LAB BENCH 1]', 75, 175);
  ctx.fillText('KEY: DOOR-KEY-91', 65, 205);

  return new THREE.CanvasTexture(canvas);
}

function createCobwebTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 256);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 1;

  // Concentric radial cobweb lines
  for (let r = 20; r <= 140; r += 20) {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI / 2);
    ctx.stroke();
  }

  // Radiating spokes
  for (let a = 0; a <= Math.PI / 2; a += Math.PI / 16) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * 160, Math.sin(a) * 160);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

export const HauntedHouse3D: React.FC<HauntedHouse3DProps> = ({
  currentRoomId,
  stage,
  step1Solved,
  step2Verified,
  step3Completed,
  flagCaptured,
  onInspectTarget,
  onOpenKeyLockbox,
  onOpenTechTerminal,
  onOpenMatchstickCRT,
  onCaptureFlag,
  isInspectingModalOpen,
  soundEnabled,
  onToggleSound,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Interactive Meshes collection for raycasting
  const interactiveMeshesRef = useRef<{
    mesh: THREE.Object3D;
    data: InteractiveObjectData;
  }[]>([]);

  // Hover state
  const [hoveredData, setHoveredData] = useState<InteractiveObjectData | null>(null);

  // Camera Orbit State
  const cameraAngle = useRef<number>(0); // azimuthal angle in radians
  const cameraElevation = useRef<number>(0.2); // elevation angle
  const cameraDistance = useRef<number>(6.5); // distance from center
  const isDragging = useRef<boolean>(false);
  const prevPointer = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Flickering light reference
  const flickerLightRef = useRef<THREE.PointLight | null>(null);
  const drippingParticlesRef = useRef<THREE.Points | null>(null);
  const oscilloscopeMeshRef = useRef<THREE.Mesh | null>(null);
  const flagMeshRef = useRef<THREE.Group | null>(null);

  // Raycaster
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  // Updates camera spherical coordinates
  const updateCameraTransform = useCallback(() => {
    if (!cameraRef.current) return;
    const r = cameraDistance.current;
    const theta = cameraAngle.current;
    const phi = Math.max(0.05, Math.min(Math.PI / 2.2, Math.PI / 2 - cameraElevation.current));

    const x = r * Math.sin(phi) * Math.sin(theta);
    const y = r * Math.cos(phi) + 1.2;
    const z = r * Math.sin(phi) * Math.cos(theta);

    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(0, 1.3, 0);
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // 1. Scene with eerie fog
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x03060c);
    scene.fog = new THREE.FogExp2(0x040812, 0.08);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 40);
    cameraRef.current = camera;
    updateCameraTransform();

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 4. Ambient & Base Lighting
    const ambientLight = new THREE.AmbientLight(0x0f1c29, 1.2);
    scene.add(ambientLight);

    // Flickering industrial ceiling light
    const overheadLamp = new THREE.PointLight(0x38bdf8, 2.4, 14, 1.8);
    overheadLamp.position.set(0, 3.8, 0);
    overheadLamp.castShadow = true;
    overheadLamp.shadow.mapSize.width = 1024;
    overheadLamp.shadow.mapSize.height = 1024;
    scene.add(overheadLamp);
    flickerLightRef.current = overheadLamp;

    // Atmospheric green/cyan rim light
    const rimLight = new THREE.PointLight(0x10b981, 1.5, 12, 2.0);
    rimLight.position.set(-3.5, 1.5, -3.5);
    scene.add(rimLight);

    // Subtle red alarm light in corner
    const redAlarmLight = new THREE.PointLight(0xef4444, 1.8, 9, 2.0);
    redAlarmLight.position.set(3.5, 2.8, -3.5);
    scene.add(redAlarmLight);

    // 5. Dripping water particles
    const dropCount = 40;
    const dropGeo = new THREE.BufferGeometry();
    const dropPositions = new Float32Array(dropCount * 3);
    for (let i = 0; i < dropCount; i++) {
      dropPositions[i * 3 + 0] = (Math.random() - 0.5) * 6;
      dropPositions[i * 3 + 1] = Math.random() * 3.5 + 0.5;
      dropPositions[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    dropGeo.setAttribute('position', new THREE.BufferAttribute(dropPositions, 3));
    const dropMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.05,
      transparent: true,
      opacity: 0.7,
    });
    const drippingPoints = new THREE.Points(dropGeo, dropMat);
    scene.add(drippingPoints);
    drippingParticlesRef.current = drippingPoints;

    // Build room contents
    buildRoomGeometry(currentRoomId, scene);

    // 6. Animation Loop
    let clock = new THREE.Clock();
    let oscPhase = 0;

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Flickering overhead lamp
      if (flickerLightRef.current) {
        if (Math.random() < 0.06) {
          flickerLightRef.current.intensity = 0.5 + Math.random() * 2.8;
        } else {
          flickerLightRef.current.intensity = 2.4 + Math.sin(elapsed * 4) * 0.3;
        }
      }

      // Animate dripping water droplets
      if (drippingParticlesRef.current) {
        const positions = drippingParticlesRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < dropCount; i++) {
          positions[i * 3 + 1] -= delta * 3.0; // fall down
          if (positions[i * 3 + 1] < 0.1) {
            positions[i * 3 + 1] = 3.6 + Math.random() * 0.3;
          }
        }
        drippingParticlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      // Animate oscilloscope texture waveform (Room 2)
      if (oscilloscopeMeshRef.current && currentRoomId === 2) {
        oscPhase += delta * 6;
        if (oscPhase > 100) oscPhase = 0;
        const mat = oscilloscopeMeshRef.current.material as THREE.MeshBasicMaterial;
        mat.map = createOscilloscopeTexture(oscPhase);
        mat.needsUpdate = true;
      }

      // Floating flag rotation (Room 4)
      if (flagMeshRef.current) {
        flagMeshRef.current.rotation.y = elapsed * 0.8;
        flagMeshRef.current.position.y = 1.6 + Math.sin(elapsed * 2) * 0.1;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize listener
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [currentRoomId, updateCameraTransform]);

  // Build 3D Room geometry based on currentRoomId
  const buildRoomGeometry = (roomId: number, scene: THREE.Scene) => {
    interactiveMeshesRef.current = [];
    oscilloscopeMeshRef.current = null;
    flagMeshRef.current = null;

    // Remove existing room meshes
    const objectsToRemove: THREE.Object3D[] = [];
    scene.children.forEach((child) => {
      if (child.name === 'ROOM_OBJECT') {
        objectsToRemove.push(child);
      }
    });
    objectsToRemove.forEach((obj) => scene.remove(obj));

    const rustTex = createRustMetalTexture();
    const stoneTex = createDistressedStoneTexture();
    const cobwebTex = createCobwebTexture();

    const roomGroup = new THREE.Group();
    roomGroup.name = 'ROOM_OBJECT';

    // Chamber Dimensions: 12x12 meters
    const floorGeo = new THREE.PlaneGeometry(12, 12);
    const floorMat = new THREE.MeshStandardMaterial({
      map: rustTex,
      roughness: 0.85,
      metalness: 0.35,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    roomGroup.add(floor);

    // Ceiling
    const ceilingGeo = new THREE.PlaneGeometry(12, 12);
    const ceilingMat = new THREE.MeshStandardMaterial({
      map: rustTex,
      roughness: 0.9,
    });
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.position.y = 4.2;
    ceiling.rotation.x = Math.PI / 2;
    roomGroup.add(ceiling);

    // Industrial Ceiling Pipes
    for (let p = -4; p <= 4; p += 2.5) {
      const pipeGeo = new THREE.CylinderGeometry(0.12, 0.12, 12, 12);
      const pipeMat = new THREE.MeshStandardMaterial({
        color: 0x1f2937,
        metalness: 0.8,
        roughness: 0.4,
      });
      const pipe = new THREE.Mesh(pipeGeo, pipeMat);
      pipe.position.set(p, 3.9, 0);
      pipe.rotation.x = Math.PI / 2;
      roomGroup.add(pipe);
    }

    // Four Walls
    const wallMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: 0.85,
      color: roomId === 4 ? 0x181822 : roomId === 3 ? 0x1f1922 : 0x192026,
    });

    // North Wall (Z = -6, Exit Blast Door)
    const northWall = new THREE.Mesh(new THREE.PlaneGeometry(12, 4.2), wallMat);
    northWall.position.set(0, 2.1, -6);
    northWall.receiveShadow = true;
    roomGroup.add(northWall);

    // South Wall (Z = +6)
    const southWall = new THREE.Mesh(new THREE.PlaneGeometry(12, 4.2), wallMat);
    southWall.position.set(0, 2.1, 6);
    southWall.rotation.y = Math.PI;
    roomGroup.add(southWall);

    // West Wall (X = -6)
    const westWall = new THREE.Mesh(new THREE.PlaneGeometry(12, 4.2), wallMat);
    westWall.position.set(-6, 2.1, 0);
    westWall.rotation.y = Math.PI / 2;
    roomGroup.add(westWall);

    // East Wall (X = +6)
    const eastWall = new THREE.Mesh(new THREE.PlaneGeometry(12, 4.2), wallMat);
    eastWall.position.set(6, 2.1, 0);
    eastWall.rotation.y = -Math.PI / 2;
    roomGroup.add(eastWall);

    // Cobwebs in upper corners
    const webGeo = new THREE.PlaneGeometry(2.5, 2.5);
    const webMat = new THREE.MeshBasicMaterial({
      map: cobwebTex,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
    });

    const webNW = new THREE.Mesh(webGeo, webMat);
    webNW.position.set(-4.8, 3.2, -4.8);
    webNW.rotation.set(0, Math.PI / 4, 0);
    roomGroup.add(webNW);

    const webNE = new THREE.Mesh(webGeo, webMat);
    webNE.position.set(4.8, 3.2, -4.8);
    webNE.rotation.set(0, -Math.PI / 4, 0);
    roomGroup.add(webNE);

    // Overhead Hanging Lamp Cable
    const lampCable = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.6, 8),
      new THREE.MeshBasicMaterial({ color: 0x111827 })
    );
    lampCable.position.set(0, 3.9, 0);
    roomGroup.add(lampCable);

    const lampShade = new THREE.Mesh(
      new THREE.ConeGeometry(0.45, 0.3, 16),
      new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.7 })
    );
    lampShade.position.set(0, 3.65, 0);
    roomGroup.add(lampShade);

    // EXIT BLAST DOOR on North Wall
    const doorFrame = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 3.2, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.3 })
    );
    doorFrame.position.set(0, 1.6, -5.8);
    roomGroup.add(doorFrame);

    const doorLeaf = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 2.9, 0.25),
      new THREE.MeshStandardMaterial({
        color: stage === 'DOOR_UNBOLTED' || stage === 'COMPLETED' ? 0x064e3b : 0x7f1d1d,
        metalness: 0.9,
        roughness: 0.3,
      })
    );
    doorLeaf.position.set(0, 1.55, -5.7);
    roomGroup.add(doorLeaf);

    // Hazard Stripes on Door
    const hazardStripe = new THREE.Mesh(
      new THREE.PlaneGeometry(1.8, 0.3),
      new THREE.MeshBasicMaterial({ color: stage === 'DOOR_UNBOLTED' || stage === 'COMPLETED' ? 0x10b981 : 0xf59e0b })
    );
    hazardStripe.position.set(0, 2.6, -5.55);
    roomGroup.add(hazardStripe);

    // Physical Key Lockbox terminal mounted near door
    const lockboxUnit = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.9, 0.3),
      new THREE.MeshStandardMaterial({
        color: step2Verified ? 0x065f46 : 0x1e293b,
        metalness: 0.6,
        roughness: 0.4,
      })
    );
    lockboxUnit.position.set(1.9, 1.6, -5.75);
    roomGroup.add(lockboxUnit);

    const lockboxLED = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 12, 12),
      new THREE.MeshBasicMaterial({ color: step2Verified ? 0x10b981 : 0xef4444 })
    );
    lockboxLED.position.set(1.9, 1.95, -5.58);
    roomGroup.add(lockboxLED);

    interactiveMeshesRef.current.push({
      mesh: lockboxUnit,
      data: {
        type: 'KEY_LOCKBOX',
        name: 'Physical Keycard Lockbox',
        description: 'Heavy electronic lockbox requiring the physical keycard found at the venue location.',
      },
    });

    // Level 2 Technical Challenge Terminal (Stationed on right wall / console)
    const techConsoleGroup = new THREE.Group();
    techConsoleGroup.position.set(3.8, 0, -2.5);

    const techDesk = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 1.1, 1.1),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 })
    );
    techDesk.position.y = 0.55;
    techConsoleGroup.add(techDesk);

    const techScreen = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.8, 0.15),
      new THREE.MeshStandardMaterial({
        color: step3Completed ? 0x065f46 : 0x0f172a,
        roughness: 0.2,
      })
    );
    techScreen.position.set(0, 1.55, 0);
    techConsoleGroup.add(techScreen);

    const techScreenGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(0.95, 0.65),
      new THREE.MeshBasicMaterial({ color: step3Completed ? 0x10b981 : 0x0284c7 })
    );
    techScreenGlass.position.set(0, 1.55, 0.08);
    techConsoleGroup.add(techScreenGlass);

    roomGroup.add(techConsoleGroup);

    interactiveMeshesRef.current.push({
      mesh: techScreen,
      data: {
        type: 'TECH_TERMINAL',
        name: 'Level 2 Technical Override Terminal',
        description: 'Master engineering terminal governing the hydraulic unbolting interlocks.',
      },
    });

    // -----------------------------------------------------------------
    // ROOM-SPECIFIC PROPS & CENTRAL 3D PUZZLE STATIONS
    // -----------------------------------------------------------------
    if (roomId === 1) {
      // ROOM 1: THE DISCOVERY (The Haunted Front Gate)
      // Flickering Wall Breaker Box behind cobwebs on West wall (X = -5.8)
      const breakerGroup = new THREE.Group();
      breakerGroup.position.set(-5.75, 1.8, -1.2);
      breakerGroup.rotation.y = Math.PI / 2;

      const breakerBox = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 1.6, 0.35),
        new THREE.MeshStandardMaterial({
          color: step1Solved ? 0x064e3b : 0x3f3f46,
          metalness: 0.7,
          roughness: 0.4,
        })
      );
      breakerGroup.add(breakerBox);

      // Scratched "L1" Stencil panel
      const stencilPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.9, 1.3),
        new THREE.MeshBasicMaterial({
          map: createBreakerStickerTexture(),
        })
      );
      stencilPlane.position.set(0, 0, 0.18);
      breakerGroup.add(stencilPlane);

      // Flickering yellow/cyan conduit spark light
      const sparkLED = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 12, 12),
        new THREE.MeshBasicMaterial({ color: step1Solved ? 0x22d3ee : 0xf59e0b })
      );
      sparkLED.position.set(0.4, 0.6, 0.2);
      breakerGroup.add(sparkLED);

      roomGroup.add(breakerGroup);

      interactiveMeshesRef.current.push({
        mesh: breakerBox,
        data: {
          type: 'INSPECT_BREAKER',
          name: 'Flickering Wall Breaker Box',
          description: 'Prying open the rusted loose breaker box door reveals scratched letters taped to the back panel.',
          letterCode: 'L1',
          venueClue: 'Go to LAB BENCH 1 in the venue to locate physical key DOOR-KEY-91.',
        },
      });

      // Decoy: Rusted maintenance toolbox
      const toolbox = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.6, 0.6),
        new THREE.MeshStandardMaterial({ color: 0x991b1b, metalness: 0.6 })
      );
      toolbox.position.set(-3.5, 0.3, 2.5);
      roomGroup.add(toolbox);

      interactiveMeshesRef.current.push({
        mesh: toolbox,
        data: {
          type: 'DECOY',
          name: 'Rusted Maintenance Toolbox',
          description: 'Empty corroded wrenches and blown fuses. Nothing of value here. Look closer at the breaker box.',
        },
      });
    } else if (roomId === 2) {
      // ROOM 2: THE DECODER (The Abandoned Comms Lab)
      // 1. Oscilloscope Workstation on West Wall (X = -4.5, Z = 0)
      const scopeGroup = new THREE.Group();
      scopeGroup.position.set(-4.5, 0, 0);

      const scopeBench = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 1.1, 2.6),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.4 })
      );
      scopeBench.position.y = 0.55;
      scopeGroup.add(scopeBench);

      const oscChassis = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.7, 0.8),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.4 })
      );
      oscChassis.position.set(0, 1.45, -0.4);
      scopeGroup.add(oscChassis);

      const oscScreen = new THREE.Mesh(
        new THREE.PlaneGeometry(0.65, 0.55),
        new THREE.MeshBasicMaterial({ map: createOscilloscopeTexture(0) })
      );
      oscScreen.position.set(0.41, 1.45, -0.4);
      oscScreen.rotation.y = Math.PI / 2;
      scopeGroup.add(oscScreen);
      oscilloscopeMeshRef.current = oscScreen;

      roomGroup.add(scopeGroup);

      interactiveMeshesRef.current.push({
        mesh: oscChassis,
        data: {
          type: 'INSPECT_OSCILLOSCOPE',
          name: 'Cathode Ray Oscilloscope (S2)',
          description: 'The green phosphor tube flickers with high-frequency CAN static. Etched on the scope station chassis is a code.',
          letterCode: 'S2',
          venueClue: 'Go to SCOPE STATION 2 in the venue to locate physical chip DECODER-CHIP-42.',
        },
      });

      // 2. Haunted CRT Monitor with Embedded Matchstick Puzzle
      const crtGroup = new THREE.Group();
      crtGroup.position.set(-4.5, 1.45, 0.7);

      const crtBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.85, 0.75, 0.75),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 })
      );
      crtGroup.add(crtBody);

      const crtScreen = new THREE.Mesh(
        new THREE.PlaneGeometry(0.7, 0.6),
        new THREE.MeshBasicMaterial({ map: createCRTMonitorTexture() })
      );
      crtScreen.position.set(0.43, 0, 0);
      crtScreen.rotation.y = Math.PI / 2;
      crtGroup.add(crtScreen);

      roomGroup.add(crtGroup);

      interactiveMeshesRef.current.push({
        mesh: crtBody,
        data: {
          type: 'MATCHSTICK_CRT',
          name: 'Cracked CRT Terminal [MATCHSTICK CYPHER]',
          description: 'A glowing CRT screen displaying the interactive matchstick puzzle: "Rearrange the 6 matchsticks and make NOTHING."',
        },
      });
    } else if (roomId === 3) {
      // ROOM 3: THE SYSTEM (The Ruined Relay Vault)
      // Buzzing industrial relay cabinet with red alarm lights on West wall
      const relayGroup = new THREE.Group();
      relayGroup.position.set(-4.5, 0, -1.0);

      const relayCabinet = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 2.8, 1.0),
        new THREE.MeshStandardMaterial({
          color: step1Solved ? 0x064e3b : 0x450a0a,
          metalness: 0.8,
          roughness: 0.3,
        })
      );
      relayCabinet.position.y = 1.4;
      relayGroup.add(relayCabinet);

      // Warning Strobe
      const strobe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 0.3, 16),
        new THREE.MeshBasicMaterial({ color: 0xef4444 })
      );
      strobe.position.set(0, 2.95, 0);
      relayGroup.add(strobe);

      // Glass inspection window showing "P3"
      const windowMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1.0, 1.4),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1 })
      );
      windowMesh.position.set(0, 1.5, 0.51);
      relayGroup.add(windowMesh);

      roomGroup.add(relayGroup);

      interactiveMeshesRef.current.push({
        mesh: relayCabinet,
        data: {
          type: 'INSPECT_RELAY',
          name: 'Buzzing Industrial Relay Cabinet',
          description: 'High-voltage relay ladder coils hum loudly. Prying open the access port reveals an engraved tag.',
          letterCode: 'P3',
          venueClue: 'Go to 3D PRINTER ENCLOSURE in the venue to locate physical key SYSTEM-RELAY-88.',
        },
      });

      // Decoy: Severed cable duct on floor
      const duct = new THREE.Mesh(
        new THREE.BoxGeometry(3.5, 0.2, 0.6),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 })
      );
      duct.position.set(0, 0.1, 1.5);
      roomGroup.add(duct);
      interactiveMeshesRef.current.push({
        mesh: duct,
        data: {
          type: 'DECOY',
          name: 'Loosened Floor Cable Duct',
          description: 'Sparks crackle from severed high-voltage conduits. Focus on the relay cabinet.',
        },
      });
    } else if (roomId === 4) {
      // ROOM 4: THE FINAL VAULT (The Master SCADA Core)
      // 1. Heavy Rusted Vault Door Handle on North Wall
      const handleGroup = new THREE.Group();
      handleGroup.position.set(-0.8, 1.5, -5.5);

      const handleWheel = new THREE.Mesh(
        new THREE.TorusGeometry(0.35, 0.08, 12, 24),
        new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.2 })
      );
      handleGroup.add(handleWheel);

      roomGroup.add(handleGroup);

      interactiveMeshesRef.current.push({
        mesh: handleWheel,
        data: {
          type: 'INSPECT_VAULT_HANDLE',
          name: 'Heavy Rusted Vault Handle',
          description: 'Behind the heavy vault door locking gear teeth, you find an engraved tag with master authorization letters.',
          letterCode: 'V4',
          venueClue: 'Go to VAULT CONTROL DESK in the venue to locate physical key VAULT-FLAG-777.',
        },
      });

      // 2. THE CHAMPIONSHIP FLAG ON A CYBER PEDESTAL IN THE CENTER
      const flagGroup = new THREE.Group();
      flagGroup.position.set(0, 0, 0);

      // Hexagonal pedestal
      const pedGeo = new THREE.CylinderGeometry(1.0, 1.2, 0.8, 6);
      const pedMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.8,
        roughness: 0.3,
      });
      const pedestal = new THREE.Mesh(pedGeo, pedMat);
      pedestal.position.y = 0.4;
      flagGroup.add(pedestal);

      // Glowing aura ring
      const ringGeo = new THREE.TorusGeometry(0.9, 0.05, 12, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
      const auraRing = new THREE.Mesh(ringGeo, ringMat);
      auraRing.rotation.x = Math.PI / 2;
      auraRing.position.y = 0.82;
      flagGroup.add(auraRing);

      // Flag pole
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 2.2, 12),
        new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9 })
      );
      pole.position.set(-0.4, 1.9, 0);
      flagGroup.add(pole);

      // Gold Championship Flag cloth
      const flagCloth = new THREE.Mesh(
        new THREE.PlaneGeometry(1.2, 0.75),
        new THREE.MeshStandardMaterial({
          color: 0xfbbf24,
          metalness: 0.5,
          roughness: 0.4,
          side: THREE.DoubleSide,
        })
      );
      flagCloth.position.set(0.2, 2.5, 0);
      flagGroup.add(flagCloth);

      roomGroup.add(flagGroup);
      flagMeshRef.current = flagGroup;

      interactiveMeshesRef.current.push({
        mesh: flagCloth,
        data: {
          type: 'FLAG',
          name: 'THE CHAMPIONSHIP FLAG',
          description: 'The ultimate trophy of Tech Quest 2026. Capture this flag to complete the escape room tournament!',
        },
      });
    }

    scene.add(roomGroup);
  };

  // Pointer Interaction (Raycasting & Hover)
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = mountRef.current;
    if (!container || !cameraRef.current) return;

    // Orbit Camera Dragging
    if (isDragging.current) {
      const dx = e.clientX - prevPointer.current.x;
      const dy = e.clientY - prevPointer.current.y;
      prevPointer.current = { x: e.clientX, y: e.clientY };

      cameraAngle.current -= dx * 0.007;
      cameraElevation.current = Math.max(-0.4, Math.min(0.6, cameraElevation.current + dy * 0.007));
      updateCameraTransform();
      return;
    }

    // Raycasting for interactive hover
    const rect = container.getBoundingClientRect();
    mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.current.setFromCamera(mouse.current, cameraRef.current);
    const meshes = interactiveMeshesRef.current.map((item) => item.mesh);
    const intersects = raycaster.current.intersectObjects(meshes, true);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      const found = interactiveMeshesRef.current.find(
        (item) => item.mesh === hitMesh || item.mesh.children.includes(hitMesh)
      );
      if (found) {
        setHoveredData(found.data);
        return;
      }
    }
    setHoveredData(null);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = true;
    prevPointer.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = false;

    // Check if click on object
    const container = mountRef.current;
    if (!container || !cameraRef.current) return;
    const rect = container.getBoundingClientRect();
    mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.current.setFromCamera(mouse.current, cameraRef.current);
    const meshes = interactiveMeshesRef.current.map((item) => item.mesh);
    const intersects = raycaster.current.intersectObjects(meshes, true);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      const found = interactiveMeshesRef.current.find(
        (item) => item.mesh === hitMesh || item.mesh.children.includes(hitMesh)
      );
      if (found) {
        handleClickObject(found.data);
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    cameraDistance.current = Math.max(3.5, Math.min(10.5, cameraDistance.current + e.deltaY * 0.005));
    updateCameraTransform();
  };

  const handleClickObject = (data: InteractiveObjectData) => {
    sound.playKeystroke();
    if (data.type === 'KEY_LOCKBOX') {
      onOpenKeyLockbox();
    } else if (data.type === 'TECH_TERMINAL') {
      onOpenTechTerminal();
    } else if (data.type === 'MATCHSTICK_CRT') {
      if (onOpenMatchstickCRT) onOpenMatchstickCRT();
    } else if (data.type === 'FLAG') {
      if (onCaptureFlag) onCaptureFlag();
    } else {
      onInspectTarget(data);
    }
  };

  // Camera Buttons
  const orbitLeft = () => {
    cameraAngle.current += 0.3;
    updateCameraTransform();
  };
  const orbitRight = () => {
    cameraAngle.current -= 0.3;
    updateCameraTransform();
  };
  const zoomIn = () => {
    cameraDistance.current = Math.max(3.5, cameraDistance.current - 1.0);
    updateCameraTransform();
  };
  const zoomOut = () => {
    cameraDistance.current = Math.min(10.5, cameraDistance.current + 1.0);
    updateCameraTransform();
  };
  const resetCamera = () => {
    cameraAngle.current = 0;
    cameraElevation.current = 0.2;
    cameraDistance.current = 6.5;
    updateCameraTransform();
  };

  return (
    <div className="relative w-full h-[480px] sm:h-[580px] bg-[#02050b] rounded-2xl border-2 border-cyan-900/60 overflow-hidden shadow-2xl select-none">
      {/* 3D Canvas Mount */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
      />

      {/* CRT Scanline Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.35)_50%)] bg-[length:100%_4px] opacity-70" />

      {/* Atmospheric Fog Vignette */}
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.9)]" />

      {/* Top Telemetry Overlay */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-900/60 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-cyan-300 font-bold">3D CHAMBER VIEW:</span>
          <span className="text-slate-300">ROOM 0{currentRoomId}</span>
        </div>

        {/* Audio Toggle & Camera Reset */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            type="button"
            onClick={onToggleSound}
            className={`p-2 rounded-lg border text-xs font-mono transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700'
                : 'bg-slate-900/80 text-slate-400 border-slate-700'
            }`}
            title={soundEnabled ? 'Mute Horror Ambience' : 'Enable Eerie Ambience'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={resetCamera}
            className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs cursor-pointer"
            title="Reset Camera View"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </div>

      {/* Hover Object Indicator */}
      {hoveredData && !isInspectingModalOpen && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 pointer-events-none z-20">
          <div className="px-4 py-2 rounded-xl bg-slate-950/90 border border-cyan-400 shadow-2xl flex items-center gap-2 text-xs font-mono animate-bounce">
            <Crosshair className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-300 font-bold uppercase">{hoveredData.name}</span>
            <span className="text-amber-400 font-semibold">[CLICK TO INSPECT]</span>
          </div>
        </div>
      )}

      {/* On-Screen Orbit & Camera Navigation Controls */}
      <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-slate-950/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 text-xs font-mono">
        <span className="text-[10px] text-slate-400 px-1 font-bold">CAM:</span>
        <button
          type="button"
          onClick={orbitLeft}
          className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 cursor-pointer"
          title="Orbit Camera Left"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={orbitRight}
          className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 cursor-pointer"
          title="Orbit Camera Right"
        >
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={zoomIn}
          className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={zoomOut}
          className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Drag Instruction Helper */}
      <div className="absolute bottom-3 right-3 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 font-mono pointer-events-none">
        <span>Click & drag to look around • Click glowing objects to inspect</span>
      </div>
    </div>
  );
};
