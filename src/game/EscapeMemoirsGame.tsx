import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import {
  Volume2,
  VolumeX,
  Eye,
  Crosshair,
  HelpCircle,
  Trophy,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Key,
  Layers,
  ArrowRight,
  ArrowLeft,
  Lightbulb,
  RefreshCw,
  Terminal,
  FileText,
  X,
  Maximize2,
  Minimize2,
  Sparkles,
  Shield,
  Clock,
  Compass,
  Settings,
  Hand,
  RotateCcw,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ROOMS_CONFIG, RoomConfig, RoomInteractableDef } from './roomsData.ts';
import {
  verify,
  computeNetScore,
  BASE_SCORE,
  RoomStep,
  AUTHORITATIVE_ROOMS,
} from './verify.ts';
import {
  createRustedMetalTexture,
  createBrickMasonryTexture,
  createDampConcreteTexture,
  createWeatheredWoodTexture,
  createHazardStripesTexture,
  createOscilloscopeTexture,
  createCRTTerminalTexture,
} from './proceduralTextures.ts';
import { escapeAudio } from './audioEngine.ts';
import { EscapePhysicsWorld, PhysicsObjectBinding } from './physicsWorld.ts';
import { MatchstickPuzzle, MatchstickState } from '../components/MatchstickPuzzle.tsx';
import { HighVoltageCircuit } from './HighVoltageCircuit.tsx';
import { api } from '../utils/api.ts';

interface InventoryItem {
  id: string;
  name: string;
  type: 'NOTE' | 'KEY' | 'TOOL';
  icon: string;
  description: string;
}

interface GameProgress {
  currentRoomId: number;
  netScore: number;
  cumulativeErrors: number;
  hintsUsedCount: number;
  unlockedHints: Record<string, boolean>; // key: `${roomId}_${step}`
  physicalVenueMode: boolean;

  // Per-room state:
  roomStates: Record<
    number,
    {
      letter1Found: boolean;
      letter1Solved: boolean;
      letter2Found: boolean;
      letter2Solved: boolean;
      circuitSolved?: boolean;
      matchstickSolved?: boolean;
      physicalKeyVerified?: boolean;
      techSolved: boolean;
      doorUnbolted: boolean;
      timeSpentSeconds: number;
      mattressFlipped?: boolean;
      breakerDoorOpen?: boolean;
      tvMoved?: boolean;
      deskDrawerOpen?: boolean;
      scopeMatMoved?: boolean;
      wallClockTaken?: boolean;
      cableCoverLifted?: boolean;
      fanGuardRemoved?: boolean;
      ladderPlaced?: boolean;
      ropeCut?: boolean;
      batteryDrawerPulled?: boolean;
    }
  >;

  inventory: InventoryItem[];
  objectiveLog: string[];
}

const STORAGE_KEY = 'TECH_QUEST_ESCAPE_SIMULATOR_PROGRESS_V2';

const DEFAULT_PROGRESS: GameProgress = {
  currentRoomId: 1,
  netScore: BASE_SCORE,
  cumulativeErrors: 0,
  hintsUsedCount: 0,
  unlockedHints: {},
  physicalVenueMode: false,
  roomStates: {
    1: {
      letter1Found: false,
      letter1Solved: false,
      letter2Found: false,
      letter2Solved: false,
      techSolved: false,
      doorUnbolted: false,
      timeSpentSeconds: 0,
      mattressFlipped: false,
      breakerDoorOpen: false,
      tvMoved: false,
    },
    2: {
      letter1Found: false,
      letter1Solved: false,
      letter2Found: false,
      letter2Solved: false,
      matchstickSolved: false,
      techSolved: false,
      doorUnbolted: false,
      timeSpentSeconds: 0,
      deskDrawerOpen: false,
      scopeMatMoved: false,
      wallClockTaken: false,
    },
    3: {
      letter1Found: false,
      letter1Solved: false,
      letter2Found: false,
      letter2Solved: false,
      circuitSolved: false,
      techSolved: false,
      doorUnbolted: false,
      timeSpentSeconds: 0,
      cableCoverLifted: false,
      fanGuardRemoved: false,
      ladderPlaced: false,
      ropeCut: false,
    },
    4: {
      letter1Found: false,
      letter1Solved: false,
      letter2Found: false,
      letter2Solved: false,
      techSolved: false,
      doorUnbolted: false,
      timeSpentSeconds: 0,
      batteryDrawerPulled: false,
    },
  },
  inventory: [],
  objectiveLog: ['Entered detention cell. Search the room for clues and tools.'],
};

interface EscapeMemoirsGameProps {
  onNavigate: (path: string) => void;
  teamName: string;
  onRefreshTeam?: () => void;
}

export const EscapeMemoirsGame: React.FC<EscapeMemoirsGameProps> = ({
  onNavigate,
  teamName,
  onRefreshTeam,
}) => {
  // Canvas & Three.js refs
  const gameViewportRef = useRef<HTMLDivElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameId = useRef<number | null>(null);
  const physicsWorldRef = useRef<EscapePhysicsWorld | null>(null);

  // First-Person Player Kinematics (Smoothed Velocity & Damped Look)
  const playerPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.65, 0));
  const playerVelocity = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const horizontalVelocity = useRef<THREE.Vector2>(new THREE.Vector2(0, 0));
  const isGrounded = useRef<boolean>(true);
  const isCrouching = useRef<boolean>(false);
  const currentEyeHeight = useRef<number>(1.65);
  const targetEyeHeight = useRef<number>(1.65);
  const footstepAccumulator = useRef<number>(0);

  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const cameraPitch = useRef<number>(0);
  const cameraYaw = useRef<number>(0);
  const targetPitch = useRef<number>(0);
  const targetYaw = useRef<number>(0);
  const isPointerLocked = useRef<boolean>(false);

  // Escape Simulator: Held Object & Throw System
  const heldBindingRef = useRef<PhysicsObjectBinding | null>(null);
  const carryDistanceRef = useRef<number>(1.2);
  const heldRotationRef = useRef<THREE.Euler>(new THREE.Euler(0, 0, 0, 'YXZ'));
  const isRotatingHeldRef = useRef<boolean>(false);
  const isChargingThrowRef = useRef<boolean>(false);
  const throwChargeStartRef = useRef<number>(0);
  const [throwMeterPercent, setThrowMeterPercent] = useState<number>(0);

  // Settings
  const [mouseSensitivity, setMouseSensitivity] = useState<number>(1.0);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>('');
  const [adminAuthenticated, setAdminAuthenticated] = useState<boolean>(false);

  // Persistent Progress
  const [progress, setProgress] = useState<GameProgress>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_PROGRESS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {}
  }, [progress]);

  // Current Room Configuration
  const roomConfig = ROOMS_CONFIG[progress.currentRoomId] || ROOMS_CONFIG[1];

  // Hovered target
  const [hoveredPrompt, setHoveredPrompt] = useState<{
    text: string;
    subText?: string;
    isPickable?: boolean;
    isContainer?: boolean;
    isInteractable?: boolean;
  } | null>(null);
  const hoveredTargetRef = useRef<RoomInteractableDef | null>(null);
  const hoveredPhysicsBindingRef = useRef<PhysicsObjectBinding | null>(null);

  // Modals & Active Screens
  const [activeNoteModal, setActiveNoteModal] = useState<{
    step: 'LETTER_1' | 'LETTER_2';
    title: string;
    storyLocation: string;
    code: string;
    paperText: string;
    puzzleQuestion: string;
    revealClue: string;
    hint: string;
  } | null>(null);

  const [activeKeyBoxTerminal, setActiveKeyBoxTerminal] = useState<boolean>(false);
  const [activeCircuitPanel, setActiveCircuitPanel] = useState<boolean>(false);
  const [activeMatchstickPanel, setActiveMatchstickPanel] = useState<boolean>(false);
  const [activeNotesMenu, setActiveNotesMenu] = useState<boolean>(false);
  const [showHintsOverviewModal, setShowHintsOverviewModal] = useState<boolean>(false);
  const [activeHintConfirmModal, setActiveHintConfirmModal] = useState<{
    step: RoomStep;
    puzzleTitle: string;
    hintText: string;
  } | null>(null);
  const [revealedHintModal, setRevealedHintModal] = useState<{
    puzzleTitle: string;
    hintText: string;
    isNewUnlock?: boolean;
  } | null>(null);
  const [showVictoryModal, setShowVictoryModal] = useState<boolean>(false);

  // Close-Up 3D Combination Lock Modal
  const [activeComboLock, setActiveComboLock] = useState<{
    targetCode: string;
    currentDials: number[];
    title: string;
    onSuccess: () => void;
  } | null>(null);

  // Submission inputs & feedbacks
  const [puzzleInput, setPuzzleInput] = useState<string>('');
  const [puzzleFeedback, setPuzzleFeedback] = useState<{ success?: boolean; message: string } | null>(null);
  const [keyBoxInput, setKeyBoxInput] = useState<string>('');
  const [venueKeyInput, setVenueKeyInput] = useState<string>('');
  const [keyBoxFeedback, setKeyBoxFeedback] = useState<{ success?: boolean; message: string } | null>(null);
  const [selectedInventorySlot, setSelectedInventorySlot] = useState<number | null>(null);

  // Audio mute state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Meshes Registry
  const dynamicMeshes = useRef<{
    mattress?: THREE.Mesh;
    breakerDoor?: THREE.Mesh;
    tv?: THREE.Mesh;
    deskDrawer?: THREE.Mesh;
    scopeMat?: THREE.Mesh;
    wallClock?: THREE.Mesh;
    cableCover?: THREE.Mesh;
    fanBlades?: THREE.Mesh;
    fanGuard?: THREE.Mesh;
    ceilingHatch?: THREE.Mesh;
    ladder?: THREE.Mesh;
    vaultDoorGears?: THREE.Mesh;
    vaultDoor?: THREE.Group;
    dustParticles?: THREE.Points;
    ceilingLamp?: THREE.PointLight;
  }>({});

  const targetMeshMap = useRef<Map<THREE.Object3D, RoomInteractableDef>>(new Map());

  // Background Audio Drone
  useEffect(() => {
    if (soundEnabled) {
      escapeAudio.startAmbientDrone();
    } else {
      escapeAudio.stopAmbientDrone();
    }
    return () => {
      escapeAudio.stopAmbientDrone();
    };
  }, [soundEnabled]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    escapeAudio.setMuted(!next);
  };

  // Add an entry to the Objective Log
  const logObjective = useCallback((text: string) => {
    setProgress((prev) => {
      if (prev.objectiveLog.includes(text)) return prev;
      return {
        ...prev,
        objectiveLog: [text, ...prev.objectiveLog].slice(0, 10),
      };
    });
  }, []);

  // Update room timer
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        const cur = prev.currentRoomId;
        const roomState = prev.roomStates[cur] || { timeSpentSeconds: 0 };
        return {
          ...prev,
          roomStates: {
            ...prev.roomStates,
            [cur]: {
              ...roomState,
              timeSpentSeconds: (roomState.timeSpentSeconds || 0) + 1,
            },
          },
        };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ==========================================================================
  // INITIALIZE THREE.JS & CANNON-ES SCENE
  // ==========================================================================
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 560;

    // 1. Scene & Atmospheric Daylight Setting
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x384a5e);
    scene.fog = new THREE.Fog(0x384a5e, 22, 65);

    // 2. Camera & Kinematics Initial State
    const camera = new THREE.PerspectiveCamera(72, width / height, 0.08, 60);
    cameraRef.current = camera;
    playerPos.current.set(...roomConfig.playerSpawn);
    camera.position.copy(playerPos.current);
    cameraYaw.current = 0;
    cameraPitch.current = 0;
    targetYaw.current = 0;
    targetPitch.current = 0;
    horizontalVelocity.current.set(0, 0);
    playerVelocity.current.set(0, 0, 0);

    // 3. Renderer with PCF Soft Shadows
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 4. Initialize Cannon-ES Physics
    const physicsWorld = new EscapePhysicsWorld();
    physicsWorldRef.current = physicsWorld;
    physicsWorld.buildRoomBoundaries(roomConfig.roomBounds, 4.2);

    // 5. Procedural Textures
    const rustTex = createRustedMetalTexture();
    const brickTex = createBrickMasonryTexture();
    const concreteTex = createDampConcreteTexture();
    const woodTex = createWeatheredWoodTexture();
    const hazardTex = createHazardStripesTexture(false);

    // 6. Build Room Architecture & Static Colliders
    buildRoomArchitecture(scene, physicsWorld, roomConfig, concreteTex, brickTex, rustTex);

    // 7. Daylight & Natural Illumination
    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x64748b, 2.2);
    scene.add(hemiLight);

    const ambient = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambient);

    // Natural Sunlight streaming in from high windows / skylight
    const sunLight = new THREE.DirectionalLight(0xfffaed, 2.6);
    sunLight.position.set(4, 7, 3);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // Soft sky bounce fill light from opposite angle
    const bounceLight = new THREE.DirectionalLight(0xbae6fd, 1.2);
    bounceLight.position.set(-4, 6, -3);
    scene.add(bounceLight);

    // Bright daylight overhead fixture
    const ceilingLamp = new THREE.PointLight(0xfffbeb, 3.2, 24, 1.2);
    ceilingLamp.position.set(0, 3.8, 0);
    ceilingLamp.castShadow = true;
    ceilingLamp.shadow.mapSize.width = 1024;
    ceilingLamp.shadow.mapSize.height = 1024;
    scene.add(ceilingLamp);
    dynamicMeshes.current.ceilingLamp = ceilingLamp;

    // Warm daylight corner fill
    const cornerFill = new THREE.PointLight(0xfef08a, 1.5, 14, 1.2);
    cornerFill.position.set(roomConfig.roomBounds.minX + 0.8, 2.0, roomConfig.roomBounds.minZ + 0.8);
    scene.add(cornerFill);

    // 8. Dust Motes Particle Field
    const dustCount = 180;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 8;
      dustPositions[i * 3 + 1] = Math.random() * 3.6;
      dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0x94a3b8,
      size: 0.035,
      transparent: true,
      opacity: 0.45,
    });
    const dustPoints = new THREE.Points(dustGeo, dustMat);
    scene.add(dustPoints);
    dynamicMeshes.current.dustParticles = dustPoints;

    // 9. Build Props & Dynamic Physics Objects for this room
    buildRoomProps(scene, physicsWorld, roomConfig, rustTex, woodTex, hazardTex);

    // 10. Main Game Animation Loop
    let lastTime = performance.now();

    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.08);
      lastTime = now;

      // Update Player Kinematics & Crouch
      updateMovement(delta);

      // Step Rigid Body Physics
      physicsWorld.step(delta);

      // Update Held Object Transform & Throw Charge
      updateHeldObject(delta);

      // Flickering Lamp
      if (dynamicMeshes.current.ceilingLamp) {
        if (Math.random() < 0.035) {
          dynamicMeshes.current.ceilingLamp.intensity = 0.5 + Math.random() * 2.8;
        } else {
          dynamicMeshes.current.ceilingLamp.intensity = 2.6 + Math.sin(now * 0.006) * 0.25;
        }
      }

      // Fan Blades (Room 3)
      if (dynamicMeshes.current.fanBlades) {
        dynamicMeshes.current.fanBlades.rotation.z += delta * 6;
      }

      // Vault Door Cogs (Room 4)
      if (dynamicMeshes.current.vaultDoorGears) {
        dynamicMeshes.current.vaultDoorGears.rotation.z += delta * 0.4;
      }

      // Dust Motes
      if (dynamicMeshes.current.dustParticles) {
        const pos = dynamicMeshes.current.dustParticles.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < dustCount; i++) {
          pos[i * 3 + 1] -= delta * 0.07;
          if (pos[i * 3 + 1] < 0.15) pos[i * 3 + 1] = 3.6;
        }
        dynamicMeshes.current.dustParticles.geometry.attributes.position.needsUpdate = true;
      }

      // Crosshair Hover Raycast
      checkCrosshairRaycast();

      renderer.render(scene, camera);
    };

    animate();

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
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      physicsWorld.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [progress.currentRoomId]);

  // ==========================================================================
  // ROOM ARCHITECTURE BUILDER
  // ==========================================================================
  const buildRoomArchitecture = (
    scene: THREE.Scene,
    physicsWorld: EscapePhysicsWorld,
    cfg: RoomConfig,
    concreteTex: THREE.CanvasTexture,
    brickTex: THREE.CanvasTexture,
    rustTex: THREE.CanvasTexture
  ) => {
    const { minX, maxX, minZ, maxZ } = cfg.roomBounds;
    const roomWidth = maxX - minX;
    const roomDepth = maxZ - minZ;

    // Floor
    const floorGeo = new THREE.PlaneGeometry(roomWidth + 2, roomDepth + 2);
    const floorMat = new THREE.MeshStandardMaterial({
      map: concreteTex,
      roughness: 0.65,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Ceiling with Conduit Pipes
    const ceilGeo = new THREE.PlaneGeometry(roomWidth + 2, roomDepth + 2);
    const ceilMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.7,
    });
    const ceiling = new THREE.Mesh(ceilGeo, ceilMat);
    ceiling.position.y = 4.2;
    ceiling.rotation.x = Math.PI / 2;
    scene.add(ceiling);

    // Overhead Industrial Pipes
    for (let p = minX + 0.8; p <= maxX - 0.8; p += 1.8) {
      const pipeGeo = new THREE.CylinderGeometry(0.08, 0.08, roomDepth, 16);
      const pipeMat = new THREE.MeshStandardMaterial({
        map: rustTex,
        metalness: 0.8,
        roughness: 0.35,
      });
      const pipe = new THREE.Mesh(pipeGeo, pipeMat);
      pipe.position.set(p, 3.9, (minZ + maxZ) / 2);
      pipe.rotation.x = Math.PI / 2;
      scene.add(pipe);
    }

    // Walls
    const wallMat = new THREE.MeshStandardMaterial({
      map: brickTex,
      roughness: 0.8,
    });

    const northWall = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth + 2, 4.2), wallMat);
    northWall.position.set((minX + maxX) / 2, 2.1, minZ);
    northWall.receiveShadow = true;
    scene.add(northWall);

    const southWall = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth + 2, 4.2), wallMat);
    southWall.position.set((minX + maxX) / 2, 2.1, maxZ);
    southWall.rotation.y = Math.PI;
    southWall.receiveShadow = true;
    scene.add(southWall);

    const westWall = new THREE.Mesh(new THREE.PlaneGeometry(roomDepth + 2, 4.2), wallMat);
    westWall.position.set(minX, 2.1, (minZ + maxZ) / 2);
    westWall.rotation.y = Math.PI / 2;
    westWall.receiveShadow = true;
    scene.add(westWall);

    const eastWall = new THREE.Mesh(new THREE.PlaneGeometry(roomDepth + 2, 4.2), wallMat);
    eastWall.position.set(maxX, 2.1, (minZ + maxZ) / 2);
    eastWall.rotation.y = -Math.PI / 2;
    eastWall.receiveShadow = true;
    scene.add(eastWall);
  };

  // ==========================================================================
  // PROPS & PHYSICAL OBJECTS BUILDER
  // ==========================================================================
  const buildRoomProps = (
    scene: THREE.Scene,
    physicsWorld: EscapePhysicsWorld,
    cfg: RoomConfig,
    rustTex: THREE.CanvasTexture,
    woodTex: THREE.CanvasTexture,
    hazardTex: THREE.CanvasTexture
  ) => {
    targetMeshMap.current.clear();
    const curState = progress.roomStates[cfg.roomId] || {};

    // ------------------------------------------------------------------------
    // ROOM 1: THE DISCOVERY (Detention Cell)
    // ------------------------------------------------------------------------
    if (cfg.roomId === 1) {
      // 1. Iron Bunk Bed Frame (Static Obstacle)
      const bedGroup = new THREE.Group();
      const frameMat = new THREE.MeshStandardMaterial({ map: rustTex, metalness: 0.8 });

      // Bed Posts
      const postGeo = new THREE.BoxGeometry(0.1, 2.2, 0.1);
      const posts = [
        [-0.8, 1.1, -1.6],
        [0.8, 1.1, -1.6],
        [-0.8, 1.1, 1.6],
        [0.8, 1.1, 1.6],
      ];
      posts.forEach(([x, y, z]) => {
        const post = new THREE.Mesh(postGeo, frameMat);
        post.position.set(x, y, z);
        bedGroup.add(post);
      });

      // Bed Slats
      const slatGeo = new THREE.BoxGeometry(1.6, 0.06, 0.12);
      for (let z = -1.5; z <= 1.5; z += 0.3) {
        const slat = new THREE.Mesh(slatGeo, frameMat);
        slat.position.set(0, 0.55, z);
        bedGroup.add(slat);
      }
      bedGroup.position.set(-2.5, 0, -2.5);
      scene.add(bedGroup);
      physicsWorld.addStaticBox([-2.5, 0.7, -2.5], [0.9, 0.7, 1.7]);

      // 2. Physical Flippable Mattress (Dynamic Rigid Body)
      const mattressGeo = new THREE.BoxGeometry(1.5, 0.3, 3.0);
      const mattressMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.95,
      });
      const mattress = new THREE.Mesh(mattressGeo, mattressMat);
      mattress.castShadow = true;
      mattress.receiveShadow = true;

      // Position on bed frame or flipped
      if (curState.mattressFlipped) {
        mattress.position.set(-2.5, 1.4, -2.5);
        mattress.rotation.z = Math.PI * 0.4;
      } else {
        mattress.position.set(-2.5, 0.75, -2.5);
      }
      scene.add(mattress);
      dynamicMeshes.current.mattress = mattress;

      const mattressBinding = physicsWorld.registerDynamicObject(mattress, 4.5, [0.75, 0.15, 1.5], 'wood');
      (mattress as any).__physicsBinding = mattressBinding;

      const mattressInteractable: RoomInteractableDef = {
        id: 'r1_bunk_mattress',
        name: 'Bunk Bed Mattress',
        prompt: curState.mattressFlipped ? '[E] Pick up mattress' : '[LMB] Flip mattress / [E] Lift',
        category: 'PHYSICAL_PROP',
        position: [-2.5, 0.75, -2.5],
      };
      targetMeshMap.current.set(mattress, mattressInteractable);

      // 3. Hidden Letter 1 (taped under mattress on bed slats)
      const letter1Geo = new THREE.PlaneGeometry(0.35, 0.45);
      const letter1Mat = new THREE.MeshStandardMaterial({
        color: 0xfef3c7,
        roughness: 0.85,
        side: THREE.DoubleSide,
      });
      const letter1Mesh = new THREE.Mesh(letter1Geo, letter1Mat);
      letter1Mesh.rotation.x = -Math.PI / 2;
      letter1Mesh.position.set(-2.5, 0.58, -2.5);
      scene.add(letter1Mesh);

      const letter1Def: RoomInteractableDef = {
        id: 'r1_letter1',
        name: 'Taped Parchment Note (Code L1)',
        prompt: '[E] Inspect Note',
        category: 'LETTER_1',
        position: [-2.5, 0.58, -2.5],
      };
      targetMeshMap.current.set(letter1Mesh, letter1Def);

      // 4. Rusted Metal Breaker Box on North Wall
      const breakerGroup = new THREE.Group();
      const boxShellGeo = new THREE.BoxGeometry(0.9, 1.3, 0.25);
      const boxShellMat = new THREE.MeshStandardMaterial({ map: rustTex, metalness: 0.8 });
      const boxShell = new THREE.Mesh(boxShellGeo, boxShellMat);
      breakerGroup.add(boxShell);

      // Hinged Door
      const doorGeo = new THREE.BoxGeometry(0.85, 1.25, 0.05);
      const doorMat = new THREE.MeshStandardMaterial({ map: rustTex, metalness: 0.85 });
      const door = new THREE.Mesh(doorGeo, doorMat);
      door.position.set(0, 0, 0.14);
      if (curState.breakerDoorOpen) {
        door.position.set(0.45, 0, 0.45);
        door.rotation.y = -Math.PI * 0.6;
      }
      breakerGroup.add(door);
      dynamicMeshes.current.breakerDoor = door;

      breakerGroup.position.set(2.4, 2.1, cfg.roomBounds.minZ + 0.15);
      scene.add(breakerGroup);
      physicsWorld.addStaticBox([2.4, 2.1, cfg.roomBounds.minZ + 0.15], [0.5, 0.7, 0.2]);

      const breakerDef: RoomInteractableDef = {
        id: 'r1_breaker_panel',
        name: 'Rusted Industrial Breaker Box',
        prompt: curState.breakerDoorOpen ? '[E] Inspect Breaker Interior' : '[LMB] Pull Open Breaker Door',
        category: 'PHYSICAL_PROP',
        position: [2.4, 2.1, cfg.roomBounds.minZ + 0.15],
      };
      targetMeshMap.current.set(breakerGroup, breakerDef);
      targetMeshMap.current.set(door, breakerDef);

      // Hidden Letter 2 inside Breaker Box
      const letter2Geo = new THREE.PlaneGeometry(0.3, 0.4);
      const letter2Mat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, side: THREE.DoubleSide });
      const letter2Mesh = new THREE.Mesh(letter2Geo, letter2Mat);
      letter2Mesh.position.set(2.4, 2.05, cfg.roomBounds.minZ + 0.2);
      scene.add(letter2Mesh);

      const letter2Def: RoomInteractableDef = {
        id: 'r1_letter2',
        name: 'Parchment Note in Breaker Conduit',
        prompt: '[E] Inspect Note',
        category: 'LETTER_2',
        position: [2.4, 2.05, cfg.roomBounds.minZ + 0.2],
      };
      targetMeshMap.current.set(letter2Mesh, letter2Def);

      // 5. Corner CRT TV & Table (Hides Key Box)
      const tableGeo = new THREE.BoxGeometry(1.2, 0.9, 1.2);
      const tableMat = new THREE.MeshStandardMaterial({ map: woodTex });
      const table = new THREE.Mesh(tableGeo, tableMat);
      table.position.set(-2.8, 0.45, 3.2);
      scene.add(table);
      physicsWorld.addStaticBox([-2.8, 0.45, 3.2], [0.65, 0.45, 0.65]);

      // CRT TV (Dynamic Pickable / Pushable Rigid Body)
      const tvGeo = new THREE.BoxGeometry(0.85, 0.75, 0.75);
      const tvMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
      const tvMesh = new THREE.Mesh(tvGeo, tvMat);
      tvMesh.castShadow = true;

      if (curState.tvMoved) {
        tvMesh.position.set(-2.1, 0.4, 2.4);
        tvMesh.rotation.y = 0.5;
      } else {
        tvMesh.position.set(-2.8, 1.3, 3.2);
      }
      scene.add(tvMesh);
      dynamicMeshes.current.tv = tvMesh;

      const tvBinding = physicsWorld.registerDynamicObject(tvMesh, 10.0, [0.42, 0.37, 0.37], 'metal');
      (tvMesh as any).__physicsBinding = tvBinding;

      const tvDef: RoomInteractableDef = {
        id: 'r1_crt_tv',
        name: 'Humming CRT Television',
        prompt: '[LMB] Push TV Aside / [E] Pick Up',
        category: 'PHYSICAL_PROP',
        position: [-2.8, 1.3, 3.2],
      };
      targetMeshMap.current.set(tvMesh, tvDef);

      // Hidden Key Box behind TV (Wall Niche)
      const keyBoxGeo = new THREE.BoxGeometry(0.55, 0.55, 0.2);
      const keyBoxMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.8,
        emissive: 0x06b6d4,
        emissiveIntensity: 0.2,
      });
      const keyBox = new THREE.Mesh(keyBoxGeo, keyBoxMat);
      keyBox.position.set(-2.8, 1.3, 3.7);
      scene.add(keyBox);

      const keyBoxDef: RoomInteractableDef = {
        id: 'r1_keybox',
        name: 'Security SCADA Key Box Terminal',
        prompt: '[E] Access Key Box Terminal',
        category: 'KEY_BOX',
        position: [-2.8, 1.3, 3.7],
      };
      targetMeshMap.current.set(keyBox, keyBoxDef);

      // 6. Interactive Loose Throwables: Rusted Mug, Bricks, Plate
      const brickGeo = new THREE.BoxGeometry(0.35, 0.18, 0.2);
      const brickMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.9 });
      const brick1 = new THREE.Mesh(brickGeo, brickMat);
      brick1.position.set(1.5, 0.1, -1.8);
      scene.add(brick1);
      const brickBinding = physicsWorld.registerDynamicObject(brick1, 2.2, [0.18, 0.09, 0.1], 'wood');
      (brick1 as any).__physicsBinding = brickBinding;
      targetMeshMap.current.set(brick1, {
        id: 'r1_brick_1',
        name: 'Heavy Loose Brick',
        prompt: '[E] Pick up brick  [LMB] Throw',
        category: 'PHYSICAL_PROP',
        position: [1.5, 0.1, -1.8],
      });

      const mugGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.22, 12);
      const mugMat = new THREE.MeshStandardMaterial({ map: rustTex, metalness: 0.7 });
      const mug = new THREE.Mesh(mugGeo, mugMat);
      mug.position.set(2.0, 0.12, 1.2);
      scene.add(mug);
      const mugBinding = physicsWorld.registerDynamicObject(mug, 0.6, [0.1, 0.11, 0.1], 'metal');
      (mug as any).__physicsBinding = mugBinding;
      targetMeshMap.current.set(mug, {
        id: 'r1_tin_mug',
        name: 'Rusted Prison Tin Mug',
        prompt: '[E] Pick up mug  [R+Mouse] Rotate to inspect',
        category: 'PHYSICAL_PROP',
        position: [2.0, 0.12, 1.2],
      });

      // 7. Exit Door (Heavy Iron Cell Gate)
      const gateGroup = new THREE.Group();
      const barMat = new THREE.MeshStandardMaterial({ map: rustTex, metalness: 0.9 });
      for (let x = -0.9; x <= 0.9; x += 0.2) {
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 3.2, 12), barMat);
        bar.position.set(x, 1.6, 0);
        gateGroup.add(bar);
      }
      gateGroup.position.set(cfg.roomBounds.maxX - 0.1, 0, 0);
      gateGroup.rotation.y = -Math.PI / 2;
      scene.add(gateGroup);

      const exitDef: RoomInteractableDef = {
        id: 'r1_exit_gate',
        name: 'Reinforced Detention Cell Gate',
        prompt: curState.doorUnbolted ? '[E] Escape to Corridor (Next Room)' : '[E] Heavy Gate Locked with Keyhole',
        category: 'EXIT_DOOR',
        position: [cfg.roomBounds.maxX - 0.1, 1.6, 0],
      };
      targetMeshMap.current.set(gateGroup, exitDef);
    }

    // ------------------------------------------------------------------------
    // ROOM 2: THE DECODER (Guard Comms Lab)
    // ------------------------------------------------------------------------
    if (cfg.roomId === 2) {
      // 1. Guard Comms Workbench Desk with False-Bottom Drawer
      const deskGroup = new THREE.Group();
      const deskMat = new THREE.MeshStandardMaterial({ map: woodTex });
      const top = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 1.4), deskMat);
      top.position.y = 0.9;
      deskGroup.add(top);

      deskGroup.position.set(-2.0, 0, -2.0);
      scene.add(deskGroup);
      physicsWorld.addStaticBox([-2.0, 0.45, -2.0], [1.3, 0.45, 0.7]);

      // Sliding Drawer with false bottom
      const drawerGeo = new THREE.BoxGeometry(1.0, 0.35, 0.9);
      const drawer = new THREE.Mesh(drawerGeo, deskMat);
      drawer.position.set(-2.0, 0.65, curState.deskDrawerOpen ? -1.4 : -2.0);
      scene.add(drawer);
      dynamicMeshes.current.deskDrawer = drawer;

      const drawerDef: RoomInteractableDef = {
        id: 'r2_desk_drawer',
        name: 'Officer Desk Drawer (False Bottom)',
        prompt: curState.deskDrawerOpen ? '[E] Search False Bottom' : '[LMB] Slide Drawer Open',
        category: 'PHYSICAL_PROP',
        position: [-2.0, 0.65, -2.0],
      };
      targetMeshMap.current.set(drawer, drawerDef);

      // Hidden Letter 1 in Drawer
      const letter1Geo = new THREE.PlaneGeometry(0.3, 0.4);
      const letter1Mesh = new THREE.Mesh(letter1Geo, new THREE.MeshStandardMaterial({ color: 0xfef3c7 }));
      letter1Mesh.rotation.x = -Math.PI / 2;
      letter1Mesh.position.set(-2.0, 0.68, curState.deskDrawerOpen ? -1.4 : -2.0);
      scene.add(letter1Mesh);

      const letter1Def: RoomInteractableDef = {
        id: 'r2_letter1',
        name: 'Hidden Note under False Bottom (Code S2)',
        prompt: '[E] Inspect Note',
        category: 'LETTER_1',
        position: [-2.0, 0.68, -2.0],
      };
      targetMeshMap.current.set(letter1Mesh, letter1Def);

      // 2. Oscilloscope Station & Rubber Mat
      const scopeGroup = new THREE.Group();
      const scopeBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.6, 0.7),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7 })
      );
      scopeBody.position.y = 1.25;
      scopeGroup.add(scopeBody);

      // Screen
      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(0.5, 0.4),
        new THREE.MeshBasicMaterial({ map: createOscilloscopeTexture() })
      );
      screen.position.set(0, 1.25, 0.36);
      scopeGroup.add(screen);

      scopeGroup.position.set(2.2, 0, -2.2);
      scene.add(scopeGroup);
      physicsWorld.addStaticBox([2.2, 0.6, -2.2], [0.6, 0.6, 0.5]);

      // Removable Rubber Mat (Dynamic)
      const matGeo = new THREE.BoxGeometry(1.2, 0.04, 0.9);
      const matMesh = new THREE.Mesh(matGeo, new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 }));
      if (curState.scopeMatMoved) {
        matMesh.position.set(2.2, 0.95, -1.5);
      } else {
        matMesh.position.set(2.2, 0.92, -2.2);
      }
      scene.add(matMesh);
      dynamicMeshes.current.scopeMat = matMesh;

      const matBinding = physicsWorld.registerDynamicObject(matMesh, 1.8, [0.6, 0.02, 0.45], 'wood');
      (matMesh as any).__physicsBinding = matBinding;

      const matDef: RoomInteractableDef = {
        id: 'r2_scope_mat',
        name: 'Rubber Insulating Station Mat',
        prompt: '[LMB] Lift Rubber Mat / [E] Pick Up',
        category: 'PHYSICAL_PROP',
        position: [2.2, 0.92, -2.2],
      };
      targetMeshMap.current.set(matMesh, matDef);

      // Hidden Letter 2 under Rubber Mat
      const letter2Mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.3, 0.4),
        new THREE.MeshStandardMaterial({ color: 0xfef3c7, side: THREE.DoubleSide })
      );
      letter2Mesh.rotation.x = -Math.PI / 2;
      letter2Mesh.position.set(2.2, 0.91, -2.2);
      scene.add(letter2Mesh);

      const letter2Def: RoomInteractableDef = {
        id: 'r2_letter2',
        name: 'Note Under Rubber Mat',
        prompt: '[E] Inspect Note',
        category: 'LETTER_2',
        position: [2.2, 0.91, -2.2],
      };
      targetMeshMap.current.set(letter2Mesh, letter2Def);

      // 3. Wall Matchstick Puzzle Panel (Unlocks false drawer)
      const panelGeo = new THREE.BoxGeometry(0.8, 0.8, 0.1);
      const panelMat = new THREE.MeshStandardMaterial({
        color: 0x1e1e24,
        metalness: 0.85,
        emissive: 0xd946ef,
        emissiveIntensity: 0.2,
      });
      const panel = new THREE.Mesh(panelGeo, panelMat);
      panel.position.set(0, 2.2, cfg.roomBounds.minZ + 0.1);
      scene.add(panel);

      const panelDef: RoomInteractableDef = {
        id: 'r2_matchstick_panel',
        name: 'Vintage Matchstick Logic Solenoid',
        prompt: curState.matchstickSolved ? '[E] Matchstick Logic Solved (Unlocked)' : '[E] Solve Matchstick Puzzle',
        category: 'MATCHSTICK_PANEL',
        position: [0, 2.2, cfg.roomBounds.minZ + 0.1],
      };
      targetMeshMap.current.set(panel, panelDef);

      // 4. Wall Clock (Can be taken off wall to reveal Key Box)
      const clockGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.08, 24);
      const clockMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6 });
      const clockMesh = new THREE.Mesh(clockGeo, clockMat);
      clockMesh.rotation.x = Math.PI / 2;

      if (curState.wallClockTaken) {
        clockMesh.position.set(-2.0, 0.1, 1.5);
      } else {
        clockMesh.position.set(cfg.roomBounds.minX + 0.08, 2.4, 0);
      }
      scene.add(clockMesh);
      dynamicMeshes.current.wallClock = clockMesh;

      const clockBinding = physicsWorld.registerDynamicObject(clockMesh, 1.5, [0.4, 0.4, 0.05], 'wood');
      (clockMesh as any).__physicsBinding = clockBinding;

      const clockDef: RoomInteractableDef = {
        id: 'r2_wall_clock',
        name: 'Heavy Industrial Wall Clock',
        prompt: '[LMB] Take Clock Off Wall / [E] Pick Up',
        category: 'PHYSICAL_PROP',
        position: [cfg.roomBounds.minX + 0.08, 2.4, 0],
      };
      targetMeshMap.current.set(clockMesh, clockDef);

      // Key Box in Wall Recess behind Clock
      const keyBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.5, 0.18),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, emissive: 0xd946ef, emissiveIntensity: 0.25 })
      );
      keyBox.position.set(cfg.roomBounds.minX + 0.05, 2.4, 0);
      keyBox.rotation.y = Math.PI / 2;
      scene.add(keyBox);

      const keyBoxDef: RoomInteractableDef = {
        id: 'r2_keybox',
        name: 'Comms Encryption Key Box',
        prompt: '[E] Access Comms Terminal',
        category: 'KEY_BOX',
        position: [cfg.roomBounds.minX + 0.05, 2.4, 0],
      };
      targetMeshMap.current.set(keyBox, keyBoxDef);

      // 5. Exit Blast Door
      const doorGroup = new THREE.Group();
      const exitLeaf = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 3.2, 1.8),
        new THREE.MeshStandardMaterial({ map: rustTex, metalness: 0.85 })
      );
      doorGroup.add(exitLeaf);
      doorGroup.position.set(cfg.roomBounds.maxX - 0.1, 1.6, 0);
      scene.add(doorGroup);

      const exitDef: RoomInteractableDef = {
        id: 'r2_exit_door',
        name: 'Heavy Steel Comms Portal',
        prompt: curState.doorUnbolted ? '[E] Proceed to Utility Tunnels' : '[E] Locked Portal Requires Passkey',
        category: 'EXIT_DOOR',
        position: [cfg.roomBounds.maxX - 0.1, 1.6, 0],
      };
      targetMeshMap.current.set(doorGroup, exitDef);
    }

    // ------------------------------------------------------------------------
    // ROOM 3: THE SYSTEM (Utility Tunnels / PLC Relay)
    // ------------------------------------------------------------------------
    if (cfg.roomId === 3) {
      // 1. High-Voltage Circuit Panel on North Wall
      const circuitPanel = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 1.6, 0.2),
        new THREE.MeshStandardMaterial({
          map: rustTex,
          emissive: curState.circuitSolved ? 0x22c55e : 0xf59e0b,
          emissiveIntensity: 0.2,
        })
      );
      circuitPanel.position.set(-2.0, 2.1, cfg.roomBounds.minZ + 0.15);
      scene.add(circuitPanel);

      const circuitDef: RoomInteractableDef = {
        id: 'r3_circuit_panel',
        name: 'High-Voltage 480V Breaker Panel',
        prompt: curState.circuitSolved ? '[E] Circuit Restored (480V Active)' : '[E] Route Circuit Switches',
        category: 'CIRCUIT_PANEL',
        position: [-2.0, 2.1, cfg.roomBounds.minZ + 0.15],
      };
      targetMeshMap.current.set(circuitPanel, circuitDef);

      // 2. Loose Floor Cable Duct Cover (Dynamic Physics)
      const ductCoverGeo = new THREE.BoxGeometry(2.4, 0.08, 0.8);
      const ductCover = new THREE.Mesh(
        ductCoverGeo,
        new THREE.MeshStandardMaterial({ map: rustTex, metalness: 0.9 })
      );
      if (curState.cableCoverLifted) {
        ductCover.position.set(0, 0.1, 1.6);
        ductCover.rotation.z = 0.2;
      } else {
        ductCover.position.set(0, 0.04, 0);
      }
      scene.add(ductCover);
      dynamicMeshes.current.cableCover = ductCover;

      const ductBinding = physicsWorld.registerDynamicObject(ductCover, 5.0, [1.2, 0.04, 0.4], 'metal');
      (ductCover as any).__physicsBinding = ductBinding;

      const ductDef: RoomInteractableDef = {
        id: 'r3_cable_cover',
        name: 'Loose Floor Cable Duct Cover',
        prompt: '[LMB] Lift Duct Cover / [E] Pick Up',
        category: 'PHYSICAL_PROP',
        position: [0, 0.04, 0],
      };
      targetMeshMap.current.set(ductCover, ductDef);

      // Hidden Letter 1 in Floor Duct
      const letter1Mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.35, 0.45),
        new THREE.MeshStandardMaterial({ color: 0xfef3c7, side: THREE.DoubleSide })
      );
      letter1Mesh.rotation.x = -Math.PI / 2;
      letter1Mesh.position.set(0, 0.02, 0);
      scene.add(letter1Mesh);

      const letter1Def: RoomInteractableDef = {
        id: 'r3_letter1',
        name: 'Parchment Note in Floor Conduits (Code P3)',
        prompt: '[E] Inspect Note',
        category: 'LETTER_1',
        position: [0, 0.02, 0],
      };
      targetMeshMap.current.set(letter1Mesh, letter1Def);

      // 3. Ventilation Fan & Protective Wire Guard
      const fanGroup = new THREE.Group();
      const cowlGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.3, 20);
      const cowl = new THREE.Mesh(cowlGeo, new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.8 }));
      cowl.rotation.z = Math.PI / 2;
      fanGroup.add(cowl);

      const bladeGeo = new THREE.BoxGeometry(0.12, 1.2, 0.02);
      const blades = new THREE.Mesh(bladeGeo, new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9 }));
      fanGroup.add(blades);
      dynamicMeshes.current.fanBlades = blades;

      fanGroup.position.set(cfg.roomBounds.maxX - 0.15, 2.4, -2.0);
      scene.add(fanGroup);

      // Removable Wire Guard
      const guardGeo = new THREE.CylinderGeometry(0.72, 0.72, 0.05, 16);
      const guardMesh = new THREE.Mesh(
        guardGeo,
        new THREE.MeshStandardMaterial({ color: 0x64748b, wireframe: true })
      );
      guardMesh.rotation.z = Math.PI / 2;
      if (curState.fanGuardRemoved) {
        guardMesh.position.set(cfg.roomBounds.maxX - 0.5, 0.1, -2.0);
      } else {
        guardMesh.position.set(cfg.roomBounds.maxX - 0.25, 2.4, -2.0);
      }
      scene.add(guardMesh);
      dynamicMeshes.current.fanGuard = guardMesh;

      const fanGuardDef: RoomInteractableDef = {
        id: 'r3_fan_guard',
        name: 'Ventilation Fan Protective Grill',
        prompt: curState.fanGuardRemoved ? '[E] Inspect Fan Housing' : '[LMB] Unscrew & Remove Fan Grill',
        category: 'PHYSICAL_PROP',
        position: [cfg.roomBounds.maxX - 0.25, 2.4, -2.0],
      };
      targetMeshMap.current.set(guardMesh, fanGuardDef);

      // Hidden Letter 2 behind Fan Blades
      const letter2Mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.3, 0.4),
        new THREE.MeshStandardMaterial({ color: 0xfef3c7, side: THREE.DoubleSide })
      );
      letter2Mesh.position.set(cfg.roomBounds.maxX - 0.1, 2.4, -2.0);
      letter2Mesh.rotation.y = -Math.PI / 2;
      scene.add(letter2Mesh);

      const letter2Def: RoomInteractableDef = {
        id: 'r3_letter2',
        name: 'Note Behind Fan Housing',
        prompt: '[E] Inspect Note',
        category: 'LETTER_2',
        position: [cfg.roomBounds.maxX - 0.1, 2.4, -2.0],
      };
      targetMeshMap.current.set(letter2Mesh, letter2Def);

      // 4. Wooden Ladder (Dynamic Pickable)
      const ladderGeo = new THREE.BoxGeometry(0.6, 2.8, 0.15);
      const ladderMesh = new THREE.Mesh(ladderGeo, new THREE.MeshStandardMaterial({ map: woodTex }));
      if (curState.ladderPlaced) {
        ladderMesh.position.set(2.0, 1.4, 2.0);
      } else {
        ladderMesh.position.set(-2.5, 1.4, 2.5);
        ladderMesh.rotation.z = 0.1;
      }
      scene.add(ladderMesh);
      dynamicMeshes.current.ladder = ladderMesh;

      const ladderBinding = physicsWorld.registerDynamicObject(ladderMesh, 6.0, [0.3, 1.4, 0.08], 'wood');
      (ladderMesh as any).__physicsBinding = ladderBinding;

      const ladderDef: RoomInteractableDef = {
        id: 'r3_wooden_ladder',
        name: 'Heavy Wooden Utility Ladder',
        prompt: '[E] Pick up ladder  [LMB] Throw / Place',
        category: 'PHYSICAL_PROP',
        position: [-2.5, 1.4, 2.5],
      };
      targetMeshMap.current.set(ladderMesh, ladderDef);

      // 5. Ceiling Hatch tied with Rope (Contains Key Box)
      const hatchMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.1, 1.2),
        new THREE.MeshStandardMaterial({ map: rustTex })
      );
      hatchMesh.position.set(2.0, 4.15, 2.0);
      scene.add(hatchMesh);
      dynamicMeshes.current.ceilingHatch = hatchMesh;

      const hatchDef: RoomInteractableDef = {
        id: 'r3_ceiling_hatch',
        name: 'Overhead Maintenance Hatch (Tied with Rope)',
        prompt: curState.ropeCut ? '[E] Access Overhead Key Box' : '[LMB] Cut Rope & Drop Hatch',
        category: 'KEY_BOX',
        position: [2.0, 4.15, 2.0],
      };
      targetMeshMap.current.set(hatchMesh, hatchDef);

      // 6. Exit Portal Door
      const exitDoor = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 3.2, 1.8),
        new THREE.MeshStandardMaterial({ map: rustTex, metalness: 0.9 })
      );
      exitDoor.position.set(cfg.roomBounds.maxX - 0.1, 1.6, 2.0);
      scene.add(exitDoor);

      const exitDef: RoomInteractableDef = {
        id: 'r3_exit_door',
        name: 'Master SCADA Blast Portal',
        prompt: curState.doorUnbolted ? '[E] Proceed to Master SCADA Vault' : '[E] Portal Locked by PLC Relay',
        category: 'EXIT_DOOR',
        position: [cfg.roomBounds.maxX - 0.1, 1.6, 2.0],
      };
      targetMeshMap.current.set(exitDoor, exitDef);
    }

    // ------------------------------------------------------------------------
    // ROOM 4: THE FINAL VAULT (Master SCADA Core)
    // ------------------------------------------------------------------------
    if (cfg.roomId === 4) {
      // 1. Massive Circular Vault Door with Animated Gears
      const vaultGroup = new THREE.Group();
      const doorLeafGeo = new THREE.CylinderGeometry(1.8, 1.8, 0.45, 32);
      const doorLeaf = new THREE.Mesh(
        doorLeafGeo,
        new THREE.MeshStandardMaterial({ map: rustTex, metalness: 0.9, roughness: 0.25 })
      );
      doorLeaf.rotation.x = Math.PI / 2;
      vaultGroup.add(doorLeaf);

      // Rotating Gears
      const gearGeo = new THREE.TorusGeometry(1.3, 0.12, 16, 32);
      const gearMesh = new THREE.Mesh(
        gearGeo,
        new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.9 })
      );
      vaultGroup.add(gearMesh);
      dynamicMeshes.current.vaultDoorGears = gearMesh;

      vaultGroup.position.set(0, 2.2, cfg.roomBounds.maxZ - 0.25);
      scene.add(vaultGroup);
      dynamicMeshes.current.vaultDoor = vaultGroup;

      const vaultDef: RoomInteractableDef = {
        id: 'r4_vault_door',
        name: 'Master Pneumatic Vault Blast Door',
        prompt: curState.techSolved ? '[E] Escape Through Extraction Portal!' : '[E] Inspect Vault Lever Mechanism',
        category: 'PHYSICAL_PROP',
        position: [0, 2.2, cfg.roomBounds.maxZ - 0.25],
      };
      targetMeshMap.current.set(vaultGroup, vaultDef);

      // Hidden Letter 1 behind Vault Lever Mechanism
      const letter1Mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.35, 0.45),
        new THREE.MeshStandardMaterial({ color: 0xfef3c7, side: THREE.DoubleSide })
      );
      letter1Mesh.position.set(1.4, 1.8, cfg.roomBounds.maxZ - 0.45);
      scene.add(letter1Mesh);

      const letter1Def: RoomInteractableDef = {
        id: 'r4_letter1',
        name: 'Parchment Note Behind Vault Lever (Code V4)',
        prompt: '[E] Inspect Note',
        category: 'LETTER_1',
        position: [1.4, 1.8, cfg.roomBounds.maxZ - 0.45],
      };
      targetMeshMap.current.set(letter1Mesh, letter1Def);

      // 2. High-Density Server Rack with Battery Drawer
      const rackGroup = new THREE.Group();
      const rack = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 3.2, 0.9),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85 })
      );
      rack.position.y = 1.6;
      rackGroup.add(rack);

      // Modular Battery Drawer (Slideable)
      const batteryTrayGeo = new THREE.BoxGeometry(1.0, 0.35, 0.85);
      const batteryTray = new THREE.Mesh(
        batteryTrayGeo,
        new THREE.MeshStandardMaterial({ map: rustTex, metalness: 0.8 })
      );
      batteryTray.position.set(0, 0.7, curState.batteryDrawerPulled ? 0.7 : 0);
      rackGroup.add(batteryTray);

      rackGroup.position.set(-2.5, 0, 0);
      scene.add(rackGroup);
      physicsWorld.addStaticBox([-2.5, 1.6, 0], [0.6, 1.6, 0.5]);

      const trayDef: RoomInteractableDef = {
        id: 'r4_battery_drawer',
        name: 'Server Rack Backup Battery Drawer',
        prompt: curState.batteryDrawerPulled ? '[E] Inspect Dead Battery Compartment' : '[LMB] Pull Battery Drawer Open',
        category: 'PHYSICAL_PROP',
        position: [-2.5, 0.7, 0],
      };
      targetMeshMap.current.set(batteryTray, trayDef);

      // Hidden Letter 2 inside Battery Drawer
      const letter2Mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.3, 0.4),
        new THREE.MeshStandardMaterial({ color: 0xfef3c7, side: THREE.DoubleSide })
      );
      letter2Mesh.rotation.x = -Math.PI / 2;
      letter2Mesh.position.set(-2.5, 0.75, curState.batteryDrawerPulled ? 0.7 : 0);
      scene.add(letter2Mesh);

      const letter2Def: RoomInteractableDef = {
        id: 'r4_letter2',
        name: 'Parchment Note Inside Battery Compartment',
        prompt: '[E] Inspect Note',
        category: 'LETTER_2',
        position: [-2.5, 0.75, 0],
      };
      targetMeshMap.current.set(letter2Mesh, letter2Def);

      // 3. Central SCADA Control Desk & Key Box Terminal
      const deskMesh = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 0.9, 1.2),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7 })
      );
      deskMesh.position.set(0, 0.45, -1.8);
      scene.add(deskMesh);
      physicsWorld.addStaticBox([0, 0.45, -1.8], [1.1, 0.45, 0.6]);

      // Terminal Screen on Desk
      const terminalScreen = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.6, 0.15),
        new THREE.MeshStandardMaterial({
          color: 0x020617,
          emissive: 0x3b82f6,
          emissiveIntensity: 0.3,
        })
      );
      terminalScreen.position.set(0, 1.25, -1.8);
      scene.add(terminalScreen);

      const terminalDef: RoomInteractableDef = {
        id: 'r4_keybox',
        name: 'Master SCADA Terminal & Vault Console',
        prompt: '[E] Access Master SCADA Terminal',
        category: 'KEY_BOX',
        position: [0, 1.25, -1.8],
      };
      targetMeshMap.current.set(terminalScreen, terminalDef);

      // 4. CHAMPIONSHIP EXTRACTION FLAG (Spawns beyond vault door when cracked)
      if (curState.techSolved) {
        const flagGroup = new THREE.Group();
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 2.5, 12),
          new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9 })
        );
        pole.position.y = 1.25;
        flagGroup.add(pole);

        const banner = new THREE.Mesh(
          new THREE.PlaneGeometry(1.2, 0.7),
          new THREE.MeshStandardMaterial({
            color: 0x06b6d4,
            emissive: 0x06b6d4,
            emissiveIntensity: 0.4,
            side: THREE.DoubleSide,
          })
        );
        banner.position.set(0.6, 2.0, 0);
        flagGroup.add(banner);

        flagGroup.position.set(0, 0, cfg.roomBounds.maxZ + 2.0);
        scene.add(flagGroup);

        const flagDef: RoomInteractableDef = {
          id: 'r4_flag',
          name: 'CHAMPIONSHIP VICTORY FLAG',
          prompt: '[E] CAPTURE CHAMPIONSHIP FLAG & ESCAPE!',
          category: 'FLAG',
          position: [0, 1.5, cfg.roomBounds.maxZ + 2.0],
        };
        targetMeshMap.current.set(flagGroup, flagDef);
      }
    }
  };

  // ==========================================================================
  // FIRST-PERSON KINEMATICS, COLLISION & CROUCH
  // ==========================================================================
  const updateMovement = (delta: number) => {
    const camera = cameraRef.current;
    if (!camera) return;

    // 1. Smooth Camera Look Yaw & Pitch (Buttery subpixel interpolation)
    const lookDamping = 34;
    cameraYaw.current += (targetYaw.current - cameraYaw.current) * Math.min(delta * lookDamping, 1.0);
    cameraPitch.current += (targetPitch.current - cameraPitch.current) * Math.min(delta * lookDamping, 1.0);

    // 2. Smooth Crouch Transition
    targetEyeHeight.current = isCrouching.current ? 0.82 : 1.65;
    currentEyeHeight.current += (targetEyeHeight.current - currentEyeHeight.current) * Math.min(delta * 14, 1.0);

    // 3. Smooth Acceleration & Deceleration (Horizontal Kinematics)
    const baseSpeed = isCrouching.current
      ? 2.0
      : keysPressed.current['ShiftLeft'] || keysPressed.current['ShiftRight']
      ? 5.8
      : 3.5;

    const moveVector = new THREE.Vector3(0, 0, 0);
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraYaw.current);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraYaw.current);

    if (keysPressed.current['KeyW'] || keysPressed.current['ArrowUp']) moveVector.add(forward);
    if (keysPressed.current['KeyS'] || keysPressed.current['ArrowDown']) moveVector.sub(forward);
    if (keysPressed.current['KeyD'] || keysPressed.current['ArrowRight']) moveVector.add(right);
    if (keysPressed.current['KeyA'] || keysPressed.current['ArrowLeft']) moveVector.sub(right);

    const isMoving = moveVector.lengthSq() > 0.001;
    if (isMoving) {
      moveVector.normalize();
    }

    const targetVelX = isMoving ? moveVector.x * baseSpeed : 0;
    const targetVelZ = isMoving ? moveVector.z * baseSpeed : 0;

    // Responsive acceleration, smooth gentle damping upon release
    const accelRate = isMoving ? 18 : 14;
    horizontalVelocity.current.x += (targetVelX - horizontalVelocity.current.x) * Math.min(delta * accelRate, 1.0);
    horizontalVelocity.current.y += (targetVelZ - horizontalVelocity.current.y) * Math.min(delta * accelRate, 1.0);

    playerPos.current.x += horizontalVelocity.current.x * delta;
    playerPos.current.z += horizontalVelocity.current.y * delta;

    // 4. Natural Footstep Pacing (Not spamming every frame!)
    const currentSpeedSq = horizontalVelocity.current.x ** 2 + horizontalVelocity.current.y ** 2;
    if (isGrounded.current && currentSpeedSq > 0.15) {
      footstepAccumulator.current += delta;
      const stepInterval = keysPressed.current['ShiftLeft'] || keysPressed.current['ShiftRight'] ? 0.32 : 0.46;
      if (footstepAccumulator.current >= stepInterval) {
        escapeAudio.playFootstep();
        footstepAccumulator.current = 0;
      }
    } else {
      footstepAccumulator.current = Math.min(footstepAccumulator.current, 0.1);
    }

    // 5. Jump & Gravity
    if (keysPressed.current['Space'] && isGrounded.current && !isCrouching.current) {
      playerVelocity.current.y = 4.8;
      isGrounded.current = false;
      escapeAudio.playFootstep();
    }

    if (!isGrounded.current) {
      playerVelocity.current.y -= 14.0 * delta; // Gravity
      playerPos.current.y += playerVelocity.current.y * delta;
      if (playerPos.current.y <= currentEyeHeight.current) {
        playerPos.current.y = currentEyeHeight.current;
        playerVelocity.current.y = 0;
        isGrounded.current = true;
      }
    } else {
      playerPos.current.y = currentEyeHeight.current;
    }

    // 6. Smooth Room Bounds Collision Padding
    const bounds = roomConfig.roomBounds;
    const padding = 0.45;
    playerPos.current.x = Math.max(bounds.minX + padding, Math.min(bounds.maxX - padding, playerPos.current.x));
    playerPos.current.z = Math.max(bounds.minZ + padding, Math.min(bounds.maxZ - padding, playerPos.current.z));

    camera.position.copy(playerPos.current);

    // Apply rotation
    camera.rotation.set(0, 0, 0);
    camera.rotation.y = cameraYaw.current;
    camera.rotation.x = cameraPitch.current;
  };

  // ==========================================================================
  // HELD OBJECT UPDATES (CARRY DISTANCE, 3D ROTATE WITH R, CHARGE THROW)
  // ==========================================================================
  const updateHeldObject = (delta: number) => {
    const camera = cameraRef.current;
    const binding = heldBindingRef.current;
    if (!camera || !binding) return;

    // Update Throw Power Meter
    if (isChargingThrowRef.current) {
      const elapsed = (performance.now() - throwChargeStartRef.current) / 1000;
      const power = Math.min(elapsed / 1.1, 1.0);
      setThrowMeterPercent(Math.round(power * 100));
    }

    // Calculate carry target position in front of camera
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);

    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(forward, up).normalize();
    const actualUp = new THREE.Vector3().crossVectors(right, forward).normalize();

    const targetPos = camera.position
      .clone()
      .add(forward.clone().multiplyScalar(carryDistanceRef.current))
      .sub(actualUp.clone().multiplyScalar(0.2));

    binding.mesh.position.lerp(targetPos, Math.min(delta * 22, 1.0));

    // Combine camera orientation with local held rotation (from [R] mouse drag)
    const combinedQuat = camera.quaternion.clone();
    const rotQuat = new THREE.Quaternion().setFromEuler(heldRotationRef.current);
    combinedQuat.multiply(rotQuat);
    binding.mesh.quaternion.slerp(combinedQuat, Math.min(delta * 20, 1.0));

    // Sync kinematic cannon body
    binding.body.position.set(binding.mesh.position.x, binding.mesh.position.y, binding.mesh.position.z);
    binding.body.quaternion.set(
      binding.mesh.quaternion.x,
      binding.mesh.quaternion.y,
      binding.mesh.quaternion.z,
      binding.mesh.quaternion.w
    );
  };

  // ==========================================================================
  // RAYCASTING FOR CROSSHAIR & PROMPT (ESCAPE SIMULATOR STYLE)
  // ==========================================================================
  const checkCrosshairRaycast = () => {
    const camera = cameraRef.current;
    const scene = sceneRef.current;
    if (!camera || !scene) return;

    // If holding an object, context is different
    if (heldBindingRef.current) {
      setHoveredPrompt({
        text: `Holding ${heldBindingRef.current.mesh.name || 'Object'}`,
        subText: `[LMB Hold] Throw  |  [R+Mouse] 3D Rotate  |  [Wheel] Distance (${carryDistanceRef.current.toFixed(1)}m)  |  [Q] Drop  |  [F] Inspect`,
        isPickable: false,
        isInteractable: true,
      });
      return;
    }

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

    const intersects = raycaster.intersectObjects(scene.children, true);
    let foundInteractable: RoomInteractableDef | null = null;
    let foundBinding: PhysicsObjectBinding | null = null;

    for (const hit of intersects) {
      if (hit.distance > 3.4) break;

      // Check physics dynamic binding
      let obj: THREE.Object3D | null = hit.object;
      while (obj) {
        if ((obj as any).__physicsBinding) {
          foundBinding = (obj as any).__physicsBinding;
        }
        if (targetMeshMap.current.has(obj)) {
          foundInteractable = targetMeshMap.current.get(obj)!;
          break;
        }
        obj = obj.parent;
      }
      if (foundInteractable || foundBinding) break;
    }

    hoveredTargetRef.current = foundInteractable;
    hoveredPhysicsBindingRef.current = foundBinding;

    if (foundInteractable) {
      setHoveredPrompt({
        text: foundInteractable.name,
        subText: foundInteractable.prompt,
        isPickable: foundInteractable.category === 'PHYSICAL_PROP',
        isContainer: foundInteractable.category === 'PHYSICAL_PROP' && foundInteractable.prompt.includes('Open'),
        isInteractable: true,
      });
    } else if (foundBinding) {
      setHoveredPrompt({
        text: foundBinding.mesh.name || 'Physical Object',
        subText: '[E] Pick up  [LMB] Throw  [C] Crouch to search',
        isPickable: true,
        isInteractable: true,
      });
    } else {
      setHoveredPrompt(null);
    }
  };

  // ==========================================================================
  // PICK UP / DROP / THROW / INSPECT ACTIONS
  // ==========================================================================
  const pickUpObject = (binding: PhysicsObjectBinding) => {
    if (!physicsWorldRef.current) return;
    heldBindingRef.current = binding;
    physicsWorldRef.current.setHeld(binding, true);
    carryDistanceRef.current = 1.2;
    heldRotationRef.current.set(0, 0, 0);
    escapeAudio.playGrab();
  };

  const dropHeldObject = () => {
    if (!heldBindingRef.current || !physicsWorldRef.current || !cameraRef.current) return;
    const forward = new THREE.Vector3();
    cameraRef.current.getWorldDirection(forward);
    physicsWorldRef.current.dropBody(heldBindingRef.current, forward);
    heldBindingRef.current = null;
    setThrowMeterPercent(0);
    isChargingThrowRef.current = false;
  };

  const throwHeldObject = (power: number) => {
    if (!heldBindingRef.current || !physicsWorldRef.current || !cameraRef.current) return;
    const forward = new THREE.Vector3();
    cameraRef.current.getWorldDirection(forward);
    physicsWorldRef.current.throwBody(heldBindingRef.current, forward, power);
    heldBindingRef.current = null;
    setThrowMeterPercent(0);
    isChargingThrowRef.current = false;
  };

  // ==========================================================================
  // INTERACT WITH SCENE TARGET
  // ==========================================================================
  const triggerInteraction = (target: RoomInteractableDef) => {
    const roomId = progress.currentRoomId;
    const roomState = progress.roomStates[roomId] || {};

    // 1. HIDDEN LETTER 1
    if (target.category === 'LETTER_1') {
      escapeAudio.playPaperRustle();
      setActiveNoteModal({
        step: 'LETTER_1',
        title: roomConfig.letter1.title,
        storyLocation: roomConfig.letter1.storyLocation,
        code: roomConfig.letter1.engravedCode,
        paperText: roomConfig.letter1.paperText,
        puzzleQuestion: roomConfig.letter1.puzzleQuestion,
        revealClue: roomConfig.letter1.revealClue,
        hint: roomConfig.letter1.hint,
      });
      setPuzzleInput('');
      setPuzzleFeedback(null);
      return;
    }

    // 2. HIDDEN LETTER 2
    if (target.category === 'LETTER_2') {
      escapeAudio.playPaperRustle();
      setActiveNoteModal({
        step: 'LETTER_2',
        title: roomConfig.letter2.title,
        storyLocation: roomConfig.letter2.storyLocation,
        code: 'CLUE-2',
        paperText: roomConfig.letter2.paperText,
        puzzleQuestion: roomConfig.letter2.puzzleQuestion,
        revealClue: roomConfig.letter2.revealClue,
        hint: roomConfig.letter2.hint,
      });
      setPuzzleInput('');
      setPuzzleFeedback(null);
      return;
    }

    // 3. KEY BOX / TERMINAL
    if (target.category === 'KEY_BOX') {
      escapeAudio.playKeypadBeep(650);
      setActiveKeyBoxTerminal(true);
      setKeyBoxInput('');
      setVenueKeyInput('');
      setKeyBoxFeedback(null);
      return;
    }

    // 4. HIGH-VOLTAGE CIRCUIT (Room 3)
    if (target.category === 'CIRCUIT_PANEL') {
      escapeAudio.playElectricSpark();
      setActiveCircuitPanel(true);
      return;
    }

    // 5. MATCHSTICK PUZZLE (Room 2)
    if (target.category === 'MATCHSTICK_PANEL') {
      escapeAudio.playKeypadBeep(520);
      setActiveMatchstickPanel(true);
      return;
    }

    // 6. SPECIFIC PHYSICAL PROPS
    if (target.id === 'r1_bunk_mattress') {
      // Flip Mattress
      const flipped = !roomState.mattressFlipped;
      setProgress((prev) => ({
        ...prev,
        roomStates: {
          ...prev.roomStates,
          [roomId]: { ...prev.roomStates[roomId], mattressFlipped: flipped },
        },
      }));
      escapeAudio.playImpact('wood', 0.6);
      if (dynamicMeshes.current.mattress) {
        dynamicMeshes.current.mattress.position.set(-2.5, flipped ? 1.4 : 0.75, -2.5);
        dynamicMeshes.current.mattress.rotation.z = flipped ? Math.PI * 0.4 : 0;
      }
      logObjective('Flipped the bunk bed mattress! A note is taped to the bed slats.');
      return;
    }

    if (target.id === 'r1_breaker_panel') {
      // Open Breaker Door
      const open = !roomState.breakerDoorOpen;
      setProgress((prev) => ({
        ...prev,
        roomStates: {
          ...prev.roomStates,
          [roomId]: { ...prev.roomStates[roomId], breakerDoorOpen: open },
        },
      }));
      escapeAudio.playUnboltClunk();
      if (dynamicMeshes.current.breakerDoor) {
        dynamicMeshes.current.breakerDoor.position.set(open ? 0.45 : 0, 0, open ? 0.45 : 0.14);
        dynamicMeshes.current.breakerDoor.rotation.y = open ? -Math.PI * 0.6 : 0;
      }
      logObjective('Swung open the rusty breaker box. Conduits and a note exposed.');
      return;
    }

    if (target.id === 'r1_crt_tv') {
      // Tilt / Slide TV Aside
      const moved = !roomState.tvMoved;
      setProgress((prev) => ({
        ...prev,
        roomStates: {
          ...prev.roomStates,
          [roomId]: { ...prev.roomStates[roomId], tvMoved: moved },
        },
      }));
      escapeAudio.playImpact('metal', 0.8);
      if (dynamicMeshes.current.tv) {
        dynamicMeshes.current.tv.position.set(moved ? -2.1 : -2.8, moved ? 0.4 : 1.3, moved ? 2.4 : 3.2);
        dynamicMeshes.current.tv.rotation.y = moved ? 0.5 : 0;
      }
      logObjective('Pushed the heavy CRT TV aside. Security Key Box uncovered in wall niche!');
      return;
    }

    if (target.id === 'r2_desk_drawer') {
      const open = !roomState.deskDrawerOpen;
      setProgress((prev) => ({
        ...prev,
        roomStates: {
          ...prev.roomStates,
          [roomId]: { ...prev.roomStates[roomId], deskDrawerOpen: open },
        },
      }));
      escapeAudio.playImpact('wood', 0.5);
      if (dynamicMeshes.current.deskDrawer) {
        dynamicMeshes.current.deskDrawer.position.z = open ? -1.4 : -2.0;
      }
      logObjective('Slid the officer desk drawer open. Inspecting false bottom.');
      return;
    }

    if (target.id === 'r2_scope_mat') {
      const moved = !roomState.scopeMatMoved;
      setProgress((prev) => ({
        ...prev,
        roomStates: {
          ...prev.roomStates,
          [roomId]: { ...prev.roomStates[roomId], scopeMatMoved: moved },
        },
      }));
      escapeAudio.playImpact('wood', 0.4);
      if (dynamicMeshes.current.scopeMat) {
        dynamicMeshes.current.scopeMat.position.set(2.2, moved ? 0.95 : 0.92, moved ? -1.5 : -2.2);
      }
      logObjective('Lifted the oscilloscope rubber mat. Discovered hidden note!');
      return;
    }

    if (target.id === 'r2_wall_clock') {
      const taken = !roomState.wallClockTaken;
      setProgress((prev) => ({
        ...prev,
        roomStates: {
          ...prev.roomStates,
          [roomId]: { ...prev.roomStates[roomId], wallClockTaken: taken },
        },
      }));
      escapeAudio.playImpact('glass', 0.7);
      if (dynamicMeshes.current.wallClock) {
        dynamicMeshes.current.wallClock.position.set(
          taken ? -2.0 : roomConfig.roomBounds.minX + 0.08,
          taken ? 0.1 : 2.4,
          taken ? 1.5 : 0
        );
      }
      logObjective('Removed the industrial wall clock. Uncovered Comms Key Box!');
      return;
    }

    if (target.id === 'r3_cable_cover') {
      const lifted = !roomState.cableCoverLifted;
      setProgress((prev) => ({
        ...prev,
        roomStates: {
          ...prev.roomStates,
          [roomId]: { ...prev.roomStates[roomId], cableCoverLifted: lifted },
        },
      }));
      escapeAudio.playImpact('metal', 0.9);
      if (dynamicMeshes.current.cableCover) {
        dynamicMeshes.current.cableCover.position.set(0, lifted ? 0.1 : 0.04, lifted ? 1.6 : 0);
        dynamicMeshes.current.cableCover.rotation.z = lifted ? 0.2 : 0;
      }
      logObjective('Lifted the heavy diamond-plate cable cover. Found note in conduits!');
      return;
    }

    if (target.id === 'r3_fan_guard') {
      const removed = !roomState.fanGuardRemoved;
      setProgress((prev) => ({
        ...prev,
        roomStates: {
          ...prev.roomStates,
          [roomId]: { ...prev.roomStates[roomId], fanGuardRemoved: removed },
        },
      }));
      escapeAudio.playUnboltClunk();
      if (dynamicMeshes.current.fanGuard) {
        dynamicMeshes.current.fanGuard.position.set(
          roomConfig.roomBounds.maxX - (removed ? 0.5 : 0.25),
          removed ? 0.1 : 2.4,
          -2.0
        );
      }
      logObjective('Unscrewed the fan protective grill. Note accessible behind blades!');
      return;
    }

    if (target.id === 'r3_ceiling_hatch') {
      if (!roomState.ropeCut) {
        // Cut rope with utility knife
        setProgress((prev) => ({
          ...prev,
          roomStates: {
            ...prev.roomStates,
            [roomId]: { ...prev.roomStates[roomId], ropeCut: true },
          },
        }));
        escapeAudio.playUnboltClunk();
        logObjective('Cut the rope binding the ceiling hatch! Reached the overhead Key Box.');
      }
      setActiveKeyBoxTerminal(true);
      return;
    }

    if (target.id === 'r4_battery_drawer') {
      const pulled = !roomState.batteryDrawerPulled;
      setProgress((prev) => ({
        ...prev,
        roomStates: {
          ...prev.roomStates,
          [roomId]: { ...prev.roomStates[roomId], batteryDrawerPulled: pulled },
        },
      }));
      escapeAudio.playImpact('metal', 0.6);
      logObjective('Pulled the server rack battery drawer. Note hidden inside!');
      return;
    }

    // 7. EXIT DOOR INTERACTION
    if (target.category === 'EXIT_DOOR') {
      if (!roomState.doorUnbolted) {
        escapeAudio.playErrorBuzz();
        logObjective('Portal locked! Must solve technical question at the Key Box first.');
        return;
      }
      advanceToNextRoom();
      return;
    }

    // 8. CHAMPIONSHIP FLAG (Room 4)
    if (target.category === 'FLAG') {
      escapeAudio.playVictoryFanfare();
      confetti({
        particleCount: 180,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#eab308', '#ec4899', '#3b82f6'],
      });
      setShowVictoryModal(true);
      return;
    }
  };

  // ==========================================================================
  // VERIFY PUZZLE 1 & 2 ANSWERS
  // ==========================================================================
  const handleSolveNotePuzzle = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeNoteModal || !puzzleInput.trim()) return;

    const roomId = progress.currentRoomId;
    const step = activeNoteModal.step;

    const res = verify(
      roomId,
      step,
      puzzleInput.trim(),
      progress.cumulativeErrors,
      progress.hintsUsedCount
    );

    if (res.success) {
      escapeAudio.playUnboltClunk();
      setPuzzleFeedback({ success: true, message: res.message });

      setProgress((prev) => {
        const curRoomState = prev.roomStates[roomId] || {};
        const updatedRoom = {
          ...curRoomState,
          [step === 'LETTER_1' ? 'letter1Solved' : 'letter2Solved']: true,
        };

        const newLogEntry =
          step === 'LETTER_1'
            ? `Letter 1 Solved! Revealed Clue: "${res.revealedClue}"`
            : `Letter 2 Solved! Revealed Clue: "${res.revealedClue}"`;

        return {
          ...prev,
          roomStates: { ...prev.roomStates, [roomId]: updatedRoom },
          netScore: computeNetScore(prev.cumulativeErrors, prev.hintsUsedCount),
          objectiveLog: [newLogEntry, ...prev.objectiveLog].slice(0, 10),
        };
      });

      if (onRefreshTeam) onRefreshTeam();
    } else {
      escapeAudio.playErrorBuzz();
      const newErrors = progress.cumulativeErrors + 1;
      const isWarn = newErrors % 3 === 2;
      const penaltyMsg =
        newErrors % 3 === 0
          ? '(-15 PTS DEDUCTED)'
          : isWarn
          ? '(WARNING: 1 attempt left before penalty)'
          : '';

      setPuzzleFeedback({
        success: false,
        message: `${res.message} ${penaltyMsg}`,
      });

      setProgress((prev) => ({
        ...prev,
        cumulativeErrors: newErrors,
        netScore: computeNetScore(newErrors, prev.hintsUsedCount),
      }));

      if (onRefreshTeam) onRefreshTeam();
    }
  };

  // ==========================================================================
  // VERIFY TECHNICAL QUESTION / KEY BOX
  // ==========================================================================
  const handleSolveKeyBox = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!keyBoxInput.trim()) return;

    const roomId = progress.currentRoomId;
    const roomState = progress.roomStates[roomId] || {};

    if (!roomState.letter1Solved || !roomState.letter2Solved) {
      escapeAudio.playErrorBuzz();
      setKeyBoxFeedback({
        success: false,
        message: 'LOCKED: Both Puzzle 1 and Puzzle 2 fragments must be decoded first.',
      });
      return;
    }

    // Physical Venue Keycard Check (if venue mode active)
    if (progress.physicalVenueMode && !roomState.physicalKeyVerified) {
      const venueRes = verify(
        roomId,
        'PHYSICAL_KEY',
        venueKeyInput.trim(),
        progress.cumulativeErrors,
        progress.hintsUsedCount
      );

      if (!venueRes.success) {
        escapeAudio.playErrorBuzz();
        setKeyBoxFeedback({
          success: false,
          message: 'INVALID PHYSICAL KEYCARD: Check the card code at the physical venue station.',
        });
        return;
      }

      setProgress((prev) => ({
        ...prev,
        roomStates: {
          ...prev.roomStates,
          [roomId]: { ...prev.roomStates[roomId], physicalKeyVerified: true },
        },
      }));
    }

    // Technical Question Verification
    const res = verify(
      roomId,
      'TECH',
      keyBoxInput.trim(),
      progress.cumulativeErrors,
      progress.hintsUsedCount
    );

    if (res.success) {
      escapeAudio.playUnboltClunk();
      setKeyBoxFeedback({ success: true, message: res.message });

      const unlockedItem: InventoryItem = {
        id: `ROOM_KEY_${roomId}`,
        name: roomConfig.keyBox.unlockedKeyName,
        type: 'KEY',
        icon: '🔑',
        description: `Unlocked key for the exit portal of ${roomConfig.roomName}.`,
      };

      setProgress((prev) => {
        const updatedRoom = {
          ...prev.roomStates[roomId],
          techSolved: true,
          doorUnbolted: true,
        };
        return {
          ...prev,
          roomStates: { ...prev.roomStates, [roomId]: updatedRoom },
          inventory: [...prev.inventory, unlockedItem],
          netScore: computeNetScore(prev.cumulativeErrors, prev.hintsUsedCount),
          objectiveLog: [
            `Key Box Cracked! Retrieved ${roomConfig.keyBox.unlockedKeyName}. Exit portal unbolted!`,
            ...prev.objectiveLog,
          ].slice(0, 10),
        };
      });

      // Special Room 4: Trigger Vault Door Opening Cinematic
      if (roomId === 4) {
        if (dynamicMeshes.current.vaultDoor) {
          dynamicMeshes.current.vaultDoor.position.x = 2.5;
        }
      }

      if (onRefreshTeam) onRefreshTeam();
    } else {
      escapeAudio.playErrorBuzz();
      const newErrors = progress.cumulativeErrors + 1;
      const isWarn = newErrors % 3 === 2;
      const penaltyMsg =
        newErrors % 3 === 0
          ? '(-15 PTS DEDUCTED)'
          : isWarn
          ? '(WARNING: 1 attempt left before penalty)'
          : '';

      setKeyBoxFeedback({
        success: false,
        message: `${res.message} ${penaltyMsg}`,
      });

      setProgress((prev) => ({
        ...prev,
        cumulativeErrors: newErrors,
        netScore: computeNetScore(newErrors, prev.hintsUsedCount),
      }));

      if (onRefreshTeam) onRefreshTeam();
    }
  };

  // ==========================================================================
  // ADVANCE TO NEXT ROOM
  // ==========================================================================
  const advanceToNextRoom = () => {
    const nextRoomId = progress.currentRoomId + 1;
    if (nextRoomId > 4) {
      setShowVictoryModal(true);
      return;
    }
    escapeAudio.playUnboltClunk();
    setProgress((prev) => ({
      ...prev,
      currentRoomId: nextRoomId,
      objectiveLog: [
        `Entered Room ${nextRoomId}: ${ROOMS_CONFIG[nextRoomId]?.roomName}. Free roam to search.`,
        ...prev.objectiveLog,
      ].slice(0, 10),
    }));
    setActiveKeyBoxTerminal(false);
  };

  // ==========================================================================
  // CONFIRM AND DEDUCT HINT (-10 PTS) - ZERO PREVIEW UNTIL UNLOCKED
  // ==========================================================================
  const handleConfirmHint = () => {
    if (!activeHintConfirmModal) return;
    const { step, puzzleTitle, hintText } = activeHintConfirmModal;
    const roomId = progress.currentRoomId;
    const hintKey = `${roomId}_${step}`;

    if (!progress.unlockedHints[hintKey]) {
      const newHintsCount = progress.hintsUsedCount + 1;
      setProgress((prev) => ({
        ...prev,
        hintsUsedCount: newHintsCount,
        unlockedHints: { ...prev.unlockedHints, [hintKey]: true },
        netScore: computeNetScore(prev.cumulativeErrors, newHintsCount),
        objectiveLog: [`Hint unlocked for Room ${roomId} (${puzzleTitle}): -10 points`, ...prev.objectiveLog].slice(0, 10),
      }));
    }
    setActiveHintConfirmModal(null);
    setRevealedHintModal({
      puzzleTitle,
      hintText,
      isNewUnlock: true,
    });
  };

  const handleRequestHint = (step: RoomStep, puzzleTitle: string, hintText: string) => {
    const roomId = progress.currentRoomId;
    const hintKey = `${roomId}_${step}`;
    if (progress.unlockedHints[hintKey]) {
      setRevealedHintModal({ puzzleTitle, hintText, isNewUnlock: false });
    } else {
      setActiveHintConfirmModal({ step, puzzleTitle, hintText });
    }
  };

  // ==========================================================================
  // KEYBOARD & MOUSE EVENT LISTENERS (POINTER LOCK, CROUCH, ROTATE, THROW)
  // ==========================================================================
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = true;

      // [C] Crouch Toggle
      if (e.code === 'KeyC') {
        isCrouching.current = !isCrouching.current;
        escapeAudio.playFootstep();
      }

      // [R] Hold for 3D rotate held object
      if (e.code === 'KeyR' && heldBindingRef.current) {
        isRotatingHeldRef.current = true;
      }

      // [Q] Drop held object
      if (e.code === 'KeyQ' && heldBindingRef.current) {
        dropHeldObject();
      }

      // [F] Inspect Mode
      if (e.code === 'KeyF') {
        if (hoveredTargetRef.current) {
          triggerInteraction(hoveredTargetRef.current);
        } else if (heldBindingRef.current) {
          // Open 3D inspection view
          setActiveNotesMenu(true);
        }
      }

      // [E] Pick up or Interact
      if (e.code === 'KeyE') {
        if (hoveredPhysicsBindingRef.current && !heldBindingRef.current) {
          pickUpObject(hoveredPhysicsBindingRef.current);
        } else if (hoveredTargetRef.current) {
          triggerInteraction(hoveredTargetRef.current);
        }
      }

      // [H] Hint Key - opens room tactical hints dossier
      if (e.code === 'KeyH') {
        setShowHintsOverviewModal(true);
      }

      // [N] Notes Log
      if (e.code === 'KeyN') {
        setActiveNotesMenu(true);
      }

      // [M] Mute Toggle
      if (e.code === 'KeyM') {
        toggleSound();
      }

      // [O] Settings
      if (e.code === 'KeyO') {
        setShowSettingsModal(true);
      }

      // Admin shortcut: Ctrl+Shift+A
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyA') {
        setShowAdminModal(true);
      }

      // [Escape] Close Modals
      if (e.code === 'Escape') {
        setActiveNoteModal(null);
        setActiveKeyBoxTerminal(false);
        setActiveCircuitPanel(false);
        setActiveMatchstickPanel(false);
        setActiveNotesMenu(false);
        setActiveHintConfirmModal(null);
        setShowHintsOverviewModal(false);
        setRevealedHintModal(null);
        setShowSettingsModal(false);
        setShowAdminModal(false);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false;
      if (e.code === 'KeyR') {
        isRotatingHeldRef.current = false;
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0 && heldBindingRef.current) {
        // Holding LMB charges throw!
        isChargingThrowRef.current = true;
        throwChargeStartRef.current = performance.now();
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0 && heldBindingRef.current && isChargingThrowRef.current) {
        const elapsed = (performance.now() - throwChargeStartRef.current) / 1000;
        const power = Math.min(elapsed / 1.1, 1.0);
        throwHeldObject(power);
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isPointerLocked.current) return;

      // If holding [R] and an object is held, rotate the held object in 3D!
      if (heldBindingRef.current && isRotatingHeldRef.current) {
        heldRotationRef.current.y += e.movementX * 0.007 * mouseSensitivity;
        heldRotationRef.current.x += e.movementY * 0.007 * mouseSensitivity;
        return;
      }

      // Normal first-person look with smoothed mouse orientation tracking
      const sens = 0.0022 * mouseSensitivity;
      targetYaw.current -= e.movementX * sens;
      targetPitch.current -= e.movementY * sens;
      targetPitch.current = Math.max(-Math.PI * 0.44, Math.min(Math.PI * 0.44, targetPitch.current));
    };

    const onWheel = (e: WheelEvent) => {
      // Mouse Wheel adjusts carry distance in Escape Simulator!
      if (heldBindingRef.current) {
        carryDistanceRef.current = Math.max(
          0.6,
          Math.min(2.4, carryDistanceRef.current - e.deltaY * 0.0015)
        );
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('wheel', onWheel, { passive: true });

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('wheel', onWheel);
    };
  }, [progress, mouseSensitivity]);

  // Pointer Lock Handler on Canvas / Viewport
  const requestPointerLock = () => {
    const target = gameViewportRef.current || canvasContainerRef.current;
    if (target && document.pointerLockElement !== target) {
      target.requestPointerLock();
    }
  };

  useEffect(() => {
    const handleLockChange = () => {
      isPointerLocked.current =
        Boolean(document.pointerLockElement) &&
        (document.pointerLockElement === gameViewportRef.current ||
          document.pointerLockElement === canvasContainerRef.current);
    };
    document.addEventListener('pointerlockchange', handleLockChange);
    return () => document.removeEventListener('pointerlockchange', handleLockChange);
  }, []);

  return (
    <div className="relative w-full h-full bg-[#1e293b] text-slate-100 flex flex-col select-none overflow-hidden font-mono">
      {/* =====================================================================
          TOP MINIMAL HUD: Room Title, Score, Errors, Timer, Mute & Settings
      ===================================================================== */}
      <div className="z-20 bg-slate-950/85 border-b border-slate-900/90 px-4 py-2.5 flex items-center justify-between text-xs backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('/dashboard')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 text-xs font-mono transition-colors cursor-pointer mr-1"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-bold">DASHBOARD</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full animate-ping"
              style={{ backgroundColor: roomConfig.accentColor }}
            />
            <span className="font-heading font-black tracking-wider text-white text-sm">
              ROOM {roomConfig.roomId}: {roomConfig.roomName}
            </span>
          </div>
          <span className="text-slate-500 hidden sm:inline">|</span>
          <span className="text-slate-400 hidden sm:inline">{roomConfig.subtitle}</span>
        </div>

        {/* Real-Time Metrics */}
        <div className="flex items-center gap-4 sm:gap-6 font-mono text-xs">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400">SCORE:</span>
            <strong className="text-amber-300 font-bold">{progress.netScore}</strong>
          </div>

          <div className="flex items-center gap-1.5">
            <AlertTriangle
              className={`w-4 h-4 ${
                progress.cumulativeErrors % 3 === 2 ? 'text-red-400 animate-pulse' : 'text-slate-400'
              }`}
            />
            <span className="text-slate-400">ERRORS:</span>
            <strong
              className={`font-bold ${
                progress.cumulativeErrors % 3 === 2 ? 'text-red-400 font-black' : 'text-slate-300'
              }`}
            >
              {progress.cumulativeErrors}
            </strong>
          </div>

          <div className="flex items-center gap-1.5 hidden md:flex">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400">TIME:</span>
            <span className="text-cyan-300">
              {Math.floor((progress.roomStates[progress.currentRoomId]?.timeSpentSeconds || 0) / 60)}m{' '}
              {(progress.roomStates[progress.currentRoomId]?.timeSpentSeconds || 0) % 60}s
            </span>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
            <button
              onClick={() => setShowHintsOverviewModal(true)}
              title="Tactical Surveillance Hints [H]"
              className="p-1.5 rounded-lg hover:bg-amber-950/50 text-amber-400 border border-amber-900/60 hover:border-amber-400 transition-colors cursor-pointer flex items-center gap-1.5 font-bold"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="hidden lg:inline text-[11px]">HINTS [H]</span>
            </button>

            <button
              onClick={() => setActiveNotesMenu(true)}
              title="Notes Log [N]"
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden lg:inline text-[10px]">NOTES [N]</span>
            </button>

            <button
              onClick={toggleSound}
              title={soundEnabled ? 'Mute Audio [M]' : 'Unmute Audio [M]'}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            <button
              onClick={() => setShowSettingsModal(true)}
              title="Controls & Settings [O]"
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          PRIMARY 3D INTERACTIVE CANVAS & RETICLE
      ===================================================================== */}
      <div
        ref={gameViewportRef}
        onClick={requestPointerLock}
        className="relative flex-1 w-full h-full cursor-crosshair overflow-hidden"
      >
        {/* Dedicated 3D Canvas Mount (Contains NO React children - purely managed by Three.js) */}
        <div ref={canvasContainerRef} className="absolute inset-0 w-full h-full pointer-events-none" />

        {/* CENTER CROSSHAIR / HAND GRAB ICON */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {hoveredPrompt?.isPickable ? (
            <div className="flex flex-col items-center animate-pulse">
              <Hand className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            </div>
          ) : hoveredPrompt?.isInteractable ? (
            <div className="w-3 h-3 rounded-full border-2 border-cyan-400 bg-cyan-400/30 animate-ping" />
          ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-white/70" />
          )}
        </div>

        {/* THROW POWER CHARGE METER */}
        {throwMeterPercent > 0 && (
          <div className="absolute inset-x-0 bottom-24 flex flex-col items-center pointer-events-none">
            <div className="w-48 bg-slate-950/80 border border-amber-500 rounded-full h-3 p-0.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-full transition-all duration-75"
                style={{ width: `${throwMeterPercent}%` }}
              />
            </div>
            <span className="text-[11px] font-bold text-amber-300 mt-1 uppercase tracking-wider drop-shadow">
              THROW POWER: {throwMeterPercent}% (Release LMB)
            </span>
          </div>
        )}

        {/* INTERACTION CONTEXT PROMPT (Escape Simulator Style) */}
        {hoveredPrompt && (
          <div className="absolute inset-x-0 bottom-16 flex flex-col items-center pointer-events-none animate-in fade-in">
            <div className="bg-slate-950/90 border border-cyan-500/80 px-4 py-2 rounded-xl shadow-2xl text-center backdrop-blur-md">
              <div className="text-cyan-300 font-heading font-black text-sm tracking-wide">
                {hoveredPrompt.text}
              </div>
              {hoveredPrompt.subText && (
                <div className="text-slate-300 text-xs font-mono mt-0.5">
                  {hoveredPrompt.subText}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CROUCH STATUS BADGE */}
        {isCrouching.current && (
          <div className="absolute bottom-16 left-4 bg-slate-950/80 border border-slate-700 px-2.5 py-1 rounded text-[11px] text-cyan-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>[C] CROUCHING (Looking under furniture)</span>
          </div>
        )}

        {/* =====================================================================
            FLOATING BOTTOM HUD: ONLY MOVEMENT INSTRUCTION & MINIMAL INVENTORY PILL
        ===================================================================== */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center gap-2 max-w-[95%] px-2">
          {/* Minimal Stowed Inventory (Only if items collected) */}
          {progress.inventory.length > 0 && (
            <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md border border-slate-800 px-3 py-1 rounded-full shadow-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                ITEMS:
              </span>
              {progress.inventory.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedInventorySlot(idx)}
                  className={`px-2.5 py-0.5 rounded-full border text-[11px] flex items-center gap-1 transition-all cursor-pointer ${
                    selectedInventorySlot === idx
                      ? 'bg-cyan-950/90 border-cyan-400 text-cyan-300 font-bold shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                      : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Movement Instruction Bar Only */}
          <div className="pointer-events-auto bg-slate-950/85 backdrop-blur-md border border-slate-800/80 px-4 py-1.5 rounded-full text-slate-300 text-[11px] sm:text-xs shadow-2xl flex items-center gap-2 sm:gap-2.5 whitespace-nowrap">
            <span className="text-cyan-400 font-bold tracking-wider hidden xs:inline">CONTROLS:</span>
            <span>
              WASD Move <span className="text-slate-600">•</span> Shift Sprint <span className="text-slate-600">•</span> Space Jump <span className="text-slate-600">•</span> C Crouch <span className="text-slate-600">•</span> E Pick/Open <span className="text-slate-600">•</span> LMB Throw <span className="text-slate-600">•</span> R Rotate 3D <span className="text-slate-600">•</span> H Hint <span className="text-slate-600">•</span> Esc Close
            </span>
          </div>
        </div>
      </div>

      {/* =====================================================================
          MODAL: FULL PARCHMENT NOTE READER (LETTER 1 & 2)
      ===================================================================== */}
      {activeNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-[#fef3c7] text-slate-900 border-4 border-amber-900/60 shadow-2xl space-y-4 font-mono relative overflow-hidden">
            {/* Parchment texture background overlay */}
            <div className="flex items-center justify-between border-b-2 border-amber-900/20 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-amber-800" />
                <div>
                  <h3 className="font-heading font-black text-amber-950 text-base sm:text-lg">
                    {activeNoteModal.title}
                  </h3>
                  <span className="text-xs text-amber-800 font-bold block">
                    LOCATION: {activeNoteModal.storyLocation}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeNoteModal.code && (
                  <span className="px-2.5 py-1 rounded bg-amber-900 text-amber-100 font-black text-xs uppercase tracking-widest border border-amber-950">
                    CODE: {activeNoteModal.code}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setActiveNoteModal(null)}
                  className="p-1 rounded text-amber-900 hover:text-black cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Note Paper Text */}
            <div className="bg-amber-100/60 p-4 rounded-xl border border-amber-900/20 text-xs sm:text-sm text-amber-950 leading-relaxed italic space-y-2">
              <p>"{activeNoteModal.paperText}"</p>
            </div>

            {/* Puzzle Question */}
            <div className="p-4 rounded-xl bg-amber-900/10 border-2 border-amber-900/30 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 block">
                DECRYPTION CHALLENGE:
              </span>
              <p className="font-bold text-xs sm:text-sm text-slate-900">
                {activeNoteModal.puzzleQuestion}
              </p>
            </div>

            {/* Tactical Hint (Zero preview if locked) */}
            {progress.unlockedHints[`${progress.currentRoomId}_${activeNoteModal.step}`] ? (
              <div className="p-3.5 rounded-xl bg-amber-200/90 border border-amber-600/60 text-xs text-amber-950 font-mono space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-amber-900">
                  <Lightbulb className="w-4 h-4 text-amber-700" /> UNLOCKED TACTICAL HINT:
                </span>
                <p className="italic text-slate-900 font-medium">{activeNoteModal.hint}</p>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs px-1">
                <button
                  type="button"
                  onClick={() => handleRequestHint(activeNoteModal.step, activeNoteModal.title, activeNoteModal.hint)}
                  className="text-amber-900 hover:text-black font-bold flex items-center gap-1.5 underline decoration-amber-600 hover:decoration-amber-900 cursor-pointer"
                >
                  <Lightbulb className="w-3.5 h-3.5 text-amber-800" />
                  <span>Request Tactical Hint (-10 PTS)</span>
                </button>
                <span className="text-[10px] text-amber-800/80 italic">No preview • Points deducted on confirmation</span>
              </div>
            )}

            {/* Verification & Input Form */}
            <form onSubmit={handleSolveNotePuzzle} className="space-y-3 pt-1">
              <div className="flex gap-2">
                <input
                  type="text"
                  autoFocus
                  placeholder="Enter decoded answer..."
                  value={puzzleInput}
                  onChange={(e) => setPuzzleInput(e.target.value)}
                  className="flex-1 bg-white/90 border-2 border-amber-900/40 focus:border-amber-900 rounded-xl px-4 py-2 text-sm text-slate-900 font-mono font-bold outline-none"
                />
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-900 hover:bg-amber-950 text-amber-100 font-heading font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  VERIFY
                </button>
              </div>

              {puzzleFeedback && (
                <div
                  className={`p-3 rounded-xl border text-xs font-mono flex items-center gap-2 ${
                    puzzleFeedback.success
                      ? 'bg-emerald-100 border-emerald-600 text-emerald-950'
                      : 'bg-red-100 border-red-600 text-red-950'
                  }`}
                >
                  {puzzleFeedback.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-700 flex-shrink-0" />
                  )}
                  <span>{puzzleFeedback.message}</span>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: KEY BOX TERMINAL & TECHNICAL QUESTION
      ===================================================================== */}
      {activeKeyBoxTerminal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-xl p-6 sm:p-8 rounded-3xl bg-[#030712] border-2 border-cyan-500 shadow-2xl space-y-4 font-mono text-slate-100">
            {/* Terminal Header */}
            <div className="flex items-center justify-between border-b border-cyan-900/60 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-6 h-6 text-cyan-400 animate-pulse" />
                <div>
                  <h3 className="font-heading font-black text-cyan-300 text-base sm:text-lg uppercase">
                    {roomConfig.keyBox.name}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    STATUS:{' '}
                    {progress.roomStates[roomConfig.roomId]?.techSolved
                      ? 'UNLOCKED / VERIFIED'
                      : 'LOCKED (Requires Fragment Authorization)'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveKeyBoxTerminal(false)}
                className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Fragment Indicators */}
            <div className="grid grid-cols-2 gap-3">
              <div
                className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${
                  progress.roomStates[roomConfig.roomId]?.letter1Solved
                    ? 'bg-emerald-950/40 border-emerald-600 text-emerald-300'
                    : 'bg-red-950/30 border-red-800 text-red-400'
                }`}
              >
                {progress.roomStates[roomConfig.roomId]?.letter1Solved ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <Lock className="w-4 h-4 text-red-400 flex-shrink-0" />
                )}
                <span>FRAGMENT 1: {progress.roomStates[roomConfig.roomId]?.letter1Solved ? 'HOLDING' : 'MISSING'}</span>
              </div>

              <div
                className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${
                  progress.roomStates[roomConfig.roomId]?.letter2Solved
                    ? 'bg-emerald-950/40 border-emerald-600 text-emerald-300'
                    : 'bg-red-950/30 border-red-800 text-red-400'
                }`}
              >
                {progress.roomStates[roomConfig.roomId]?.letter2Solved ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <Lock className="w-4 h-4 text-red-400 flex-shrink-0" />
                )}
                <span>FRAGMENT 2: {progress.roomStates[roomConfig.roomId]?.letter2Solved ? 'HOLDING' : 'MISSING'}</span>
              </div>
            </div>

            {/* Venue Mode Keycard Input (If active) */}
            {progress.physicalVenueMode && !progress.roomStates[roomConfig.roomId]?.physicalKeyVerified && (
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-600/60 space-y-2">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Key className="w-4 h-4" /> PHYSICAL VENUE KEYCARD REQUIRED
                </span>
                <p className="text-xs text-slate-300">
                  Retrieve keycard from <strong>{roomConfig.venue.locationName}</strong> and enter code:
                </p>
                <input
                  type="text"
                  placeholder="e.g. DOOR-KEY-91"
                  value={venueKeyInput}
                  onChange={(e) => setVenueKeyInput(e.target.value)}
                  className="w-full bg-slate-900 border border-amber-600 rounded-lg px-3 py-1.5 text-xs text-amber-200 outline-none"
                />
              </div>
            )}

            {/* Technical Question Display */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-cyan-400 font-bold">
                <span>{roomConfig.keyBox.techTitle}</span>
                <span className="text-[10px] bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  {roomConfig.keyBox.techTopic}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {roomConfig.keyBox.techQuestion}
              </p>

              {roomConfig.keyBox.techCodeSnippet && (
                <pre className="p-3 rounded-lg bg-black/80 border border-slate-800 text-[11px] text-cyan-300 overflow-x-auto">
                  <code>{roomConfig.keyBox.techCodeSnippet}</code>
                </pre>
              )}
            </div>

            {/* Tactical Tech Hint (Zero preview if locked) */}
            {progress.unlockedHints[`${roomConfig.roomId}_TECH`] ? (
              <div className="p-3.5 rounded-xl bg-cyan-950/60 border border-cyan-500/60 text-xs text-cyan-200 font-mono space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-cyan-300">
                  <Lightbulb className="w-4 h-4 text-cyan-400" /> UNLOCKED TECHNICAL HINT:
                </span>
                <p className="italic text-cyan-100">{roomConfig.keyBox.techHint}</p>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs px-1">
                <button
                  type="button"
                  onClick={() => handleRequestHint('TECH', roomConfig.keyBox.techTitle, roomConfig.keyBox.techHint)}
                  className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1.5 cursor-pointer underline decoration-amber-500/50 hover:decoration-amber-300"
                >
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  <span>Request Technical Hint (-10 PTS)</span>
                </button>
                <span className="text-[10px] text-slate-500">No preview • Points deducted on confirmation</span>
              </div>
            )}

            {/* Technical Answer Form */}
            <form onSubmit={handleSolveKeyBox} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  autoFocus
                  placeholder="Transmit technical answer..."
                  value={keyBoxInput}
                  onChange={(e) => setKeyBoxInput(e.target.value)}
                  className="flex-1 bg-slate-900 border-2 border-cyan-900/60 focus:border-cyan-400 rounded-xl px-4 py-2 text-sm text-cyan-100 font-mono outline-none"
                />
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-heading font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  TRANSMIT
                </button>
              </div>

              {keyBoxFeedback && (
                <div
                  className={`p-3 rounded-xl border text-xs font-mono flex items-center gap-2 ${
                    keyBoxFeedback.success
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                      : 'bg-red-950/60 border-red-500 text-red-300'
                  }`}
                >
                  {keyBoxFeedback.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  )}
                  <span>{keyBoxFeedback.message}</span>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: HIGH-VOLTAGE CIRCUIT (ROOM 3)
      ===================================================================== */}
      {activeCircuitPanel && (
        <HighVoltageCircuit
          isRestored={Boolean(progress.roomStates[3]?.circuitSolved)}
          onRestoreSuccess={() => {
            setProgress((prev) => ({
              ...prev,
              roomStates: {
                ...prev.roomStates,
                3: { ...prev.roomStates[3], circuitSolved: true },
              },
              objectiveLog: [
                'Circuit restored! Ceiling floodlights and auxiliary relays energized.',
                ...prev.objectiveLog,
              ].slice(0, 10),
            }));
            setActiveCircuitPanel(false);
          }}
          onClose={() => setActiveCircuitPanel(false)}
        />
      )}

      {/* =====================================================================
          MODAL: MATCHSTICK PUZZLE (ROOM 2)
      ===================================================================== */}
      {activeMatchstickPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl p-6 rounded-2xl bg-slate-950 border-2 border-magenta-500 shadow-2xl space-y-4 font-mono text-slate-100">
            <div className="flex items-center justify-between border-b border-magenta-900/60 pb-3">
              <h3 className="font-heading font-black text-magenta-300 text-base">
                MATCHSTICK SOLENOID LOGIC (OFFICER DESK)
              </h3>
              <button
                type="button"
                onClick={() => setActiveMatchstickPanel(false)}
                className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-2 rounded-xl bg-black border border-magenta-950">
              <MatchstickPuzzle
                isCompleted={Boolean(progress.roomStates[2]?.matchstickSolved)}
                clueAwarded="MATCHSTICK SOLVED: OFFICER DESK FALSE DRAWER RELEASED!"
                points={50}
                onSubmit={async (sticks: MatchstickState[]) => {
                  setProgress((prev) => ({
                    ...prev,
                    roomStates: {
                      ...prev.roomStates,
                      2: { ...prev.roomStates[2], matchstickSolved: true, deskDrawerOpen: true },
                    },
                    objectiveLog: [
                      'Matchstick puzzle solved! False drawer latch released on desk.',
                      ...prev.objectiveLog,
                    ].slice(0, 10),
                  }));
                  setActiveMatchstickPanel(false);
                  return {
                    isCorrect: true,
                    message: 'MATCHSTICK SOLVED: OFFICER DESK FALSE DRAWER RELEASED!',
                    clueUnlocked: 'Officer desk secret false bottom compartment unlocked.',
                  };
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: NOTES & OBJECTIVES LOG [N]
      ===================================================================== */}
      {activeNotesMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-slate-950 border border-slate-700 shadow-2xl space-y-4 font-mono text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h3 className="font-heading font-black text-white text-base">
                  DISCOVERED NOTES & CLUE LOG
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveNotesMenu(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-2 text-xs">
              {progress.objectiveLog.map((log, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span className="text-slate-300 leading-relaxed">{log}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: HINT CONFIRMATION (-10 PTS) - ZERO PREVIEW BEFORE UNLOCK
      ===================================================================== */}
      {activeHintConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-950 border-2 border-amber-500 shadow-2xl space-y-4 font-mono text-slate-200">
            <div className="flex items-center gap-2 text-amber-400 font-heading font-black text-base">
              <HelpCircle className="w-6 h-6 animate-pulse" />
              <span>REQUEST SURVEILLANCE HINT (-10 PTS)</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Unlocking this hint will deduct <strong>10 points</strong> from your squad's total score. The tactical hint will be revealed immediately after unlocking.
            </p>

            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-600/50 text-xs text-amber-300 space-y-1">
              <span className="font-bold text-amber-400 block text-[11px] uppercase tracking-wider">
                TARGET PUZZLE:
              </span>
              <p className="font-semibold text-white">{activeHintConfirmModal.puzzleTitle}</p>
              <p className="text-[11px] text-amber-400/80 italic mt-1">
                🔒 Hint content is encrypted. Confirm to decrypt and reveal.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveHintConfirmModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleConfirmHint}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-heading font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                ACCEPT & UNLOCK (-10 PTS)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: REVEALED HINT VIEWER
      ===================================================================== */}
      {revealedHintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-slate-950 border-2 border-emerald-500 shadow-2xl space-y-4 font-mono text-slate-200">
            <div className="flex items-center justify-between border-b border-emerald-900/60 pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-heading font-black text-base">
                <Lightbulb className="w-6 h-6 animate-pulse text-emerald-400" />
                <span>
                  {revealedHintModal.isNewUnlock ? '🎉 HINT UNLOCKED (-10 PTS)' : '💡 TACTICAL INTEL'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setRevealedHintModal(null)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300">
              PUZZLE: <strong className="text-white">{revealedHintModal.puzzleTitle}</strong>
            </div>

            <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/70 text-xs sm:text-sm text-emerald-200 leading-relaxed font-mono shadow-inner">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1.5 tracking-wider">
                DECRYPTED SURVEILLANCE ADVICE:
              </span>
              "{revealedHintModal.hintText}"
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setRevealedHintModal(null)}
                className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-heading font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                GOT IT, BACK TO ROOM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: TACTICAL SURVEILLANCE HINTS OVERVIEW [H]
      ===================================================================== */}
      {showHintsOverviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl p-6 rounded-3xl bg-slate-950 border-2 border-amber-500/80 shadow-2xl space-y-5 font-mono text-slate-200">
            <div className="flex items-center justify-between border-b border-amber-900/50 pb-3">
              <div className="flex items-center gap-2.5 text-amber-400 font-heading font-black text-base sm:text-lg">
                <HelpCircle className="w-6 h-6 animate-pulse" />
                <span>ROOM {roomConfig.roomId} SURVEILLANCE HINTS</span>
              </div>
              <button
                type="button"
                onClick={() => setShowHintsOverviewModal(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Each hint unlock deducts <strong>10 points</strong> from your score. Once unlocked, a hint can be referenced repeatedly at zero cost. Hints have zero preview prior to unlocking.
            </p>

            <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
              {/* Hint 1: Letter 1 */}
              {(() => {
                const hintKey = `${roomConfig.roomId}_LETTER_1`;
                const isUnlocked = Boolean(progress.unlockedHints[hintKey]);
                return (
                  <div
                    className={`p-4 rounded-2xl border transition-all ${
                      isUnlocked
                        ? 'bg-emerald-950/30 border-emerald-600/70'
                        : 'bg-slate-900/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-amber-300">
                          1. HIDDEN LETTER 1 ({roomConfig.letter1.engravedCode})
                        </span>
                        <span className="text-[10px] text-slate-400 hidden sm:inline">
                          • {roomConfig.letter1.storyLocation}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                          isUnlocked
                            ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-700'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {isUnlocked ? '✓ REVEALED' : '🔒 LOCKED (-10 PTS)'}
                      </span>
                    </div>

                    {isUnlocked ? (
                      <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-xs text-emerald-200 italic">
                        "{roomConfig.letter1.hint}"
                      </div>
                    ) : (
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-slate-400 italic">
                          Tactical logic guide encrypted. No preview available.
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setShowHintsOverviewModal(false);
                            handleRequestHint(
                              'LETTER_1',
                              `Hidden Letter 1 (${roomConfig.letter1.engravedCode})`,
                              roomConfig.letter1.hint
                            );
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold font-heading transition-colors cursor-pointer"
                        >
                          UNLOCK HINT (-10 PTS)
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Hint 2: Letter 2 */}
              {(() => {
                const hintKey = `${roomConfig.roomId}_LETTER_2`;
                const isUnlocked = Boolean(progress.unlockedHints[hintKey]);
                return (
                  <div
                    className={`p-4 rounded-2xl border transition-all ${
                      isUnlocked
                        ? 'bg-emerald-950/30 border-emerald-600/70'
                        : 'bg-slate-900/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-amber-300">
                          2. HIDDEN LETTER 2 ({roomConfig.letter2.id})
                        </span>
                        <span className="text-[10px] text-slate-400 hidden sm:inline">
                          • {roomConfig.letter2.storyLocation}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                          isUnlocked
                            ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-700'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {isUnlocked ? '✓ REVEALED' : '🔒 LOCKED (-10 PTS)'}
                      </span>
                    </div>

                    {isUnlocked ? (
                      <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-xs text-emerald-200 italic">
                        "{roomConfig.letter2.hint}"
                      </div>
                    ) : (
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-slate-400 italic">
                          Mathematical deduction hint encrypted. No preview available.
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setShowHintsOverviewModal(false);
                            handleRequestHint(
                              'LETTER_2',
                              `Hidden Letter 2 (${roomConfig.letter2.id})`,
                              roomConfig.letter2.hint
                            );
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold font-heading transition-colors cursor-pointer"
                        >
                          UNLOCK HINT (-10 PTS)
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Hint 3: Key Box Terminal */}
              {(() => {
                const hintKey = `${roomConfig.roomId}_TECH`;
                const isUnlocked = Boolean(progress.unlockedHints[hintKey]);
                return (
                  <div
                    className={`p-4 rounded-2xl border transition-all ${
                      isUnlocked
                        ? 'bg-emerald-950/30 border-emerald-600/70'
                        : 'bg-slate-900/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-cyan-300">
                          3. KEY BOX TERMINAL ({roomConfig.keyBox.techTitle})
                        </span>
                        <span className="text-[10px] text-slate-400 hidden sm:inline">
                          • {roomConfig.keyBox.techTopic}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                          isUnlocked
                            ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-700'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {isUnlocked ? '✓ REVEALED' : '🔒 LOCKED (-10 PTS)'}
                      </span>
                    </div>

                    {isUnlocked ? (
                      <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-xs text-emerald-200 italic">
                        "{roomConfig.keyBox.techHint}"
                      </div>
                    ) : (
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-slate-400 italic">
                          Computer science algorithm hint encrypted. No preview available.
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setShowHintsOverviewModal(false);
                            handleRequestHint(
                              'TECH',
                              `Key Box: ${roomConfig.keyBox.techTitle}`,
                              roomConfig.keyBox.techHint
                            );
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold font-heading transition-colors cursor-pointer"
                        >
                          UNLOCK HINT (-10 PTS)
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowHintsOverviewModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 cursor-pointer"
              >
                CLOSE HINTS DOSSIER
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: SETTINGS & CONTROLS GUIDE [O]
      ===================================================================== */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-slate-950 border border-slate-700 shadow-2xl space-y-4 font-mono text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-cyan-400" />
                <h3 className="font-heading font-black text-white text-base">
                  ESCAPE SIMULATOR SETTINGS & CONTROLS
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-slate-300">
                  Mouse Look Sensitivity: {mouseSensitivity.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.4"
                  max="2.5"
                  step="0.1"
                  value={mouseSensitivity}
                  onChange={(e) => setMouseSensitivity(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <span className="text-cyan-400 font-bold block">Pine Studios Escape Simulator Controls:</span>
                <ul className="space-y-1 text-slate-300">
                  <li>• <strong>WASD / Arrows:</strong> Free roam move</li>
                  <li>• <strong>Shift:</strong> Sprint run</li>
                  <li>• <strong>Space:</strong> Jump over debris</li>
                  <li>• <strong>C:</strong> Crouch (look under beds, desks, ducts)</li>
                  <li>• <strong>E:</strong> Pick up object / Search container / Read note</li>
                  <li>• <strong>LMB (Hold & Release):</strong> Charge throw power & throw</li>
                  <li>• <strong>R (Hold + Move Mouse):</strong> Rotate held object in 3D</li>
                  <li>• <strong>Mouse Wheel:</strong> Carry distance closer / further</li>
                  <li>• <strong>Q:</strong> Drop object at feet</li>
                  <li>• <strong>F:</strong> Inspect mode in 3D</li>
                  <li>• <strong>H / N / M:</strong> Hint / Notes / Mute</li>
                </ul>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: ADMIN PANEL (Password Protected)
      ===================================================================== */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-950 border-2 border-red-500 shadow-2xl space-y-4 font-mono text-slate-200">
            <div className="flex items-center justify-between border-b border-red-900 pb-2">
              <div className="flex items-center gap-2 text-red-400 font-heading font-black">
                <Shield className="w-5 h-5 text-red-500" />
                <span>ADJUDICATOR ADMIN CONTROLS</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAdminModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!adminAuthenticated ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (adminPasswordInput === 'admin123' || adminPasswordInput === 'techquest2026') {
                    setAdminAuthenticated(true);
                  } else {
                    escapeAudio.playErrorBuzz();
                  }
                }}
                className="space-y-3"
              >
                <label className="text-xs text-slate-400">Admin Security Passcode:</label>
                <input
                  type="password"
                  placeholder="Enter passcode..."
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg text-xs text-white"
                />
                <button
                  type="submit"
                  className="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs"
                >
                  AUTHENTICATE
                </button>
              </form>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="text-slate-300">Jump to Room:</div>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setProgress((prev) => ({ ...prev, currentRoomId: r }));
                        setShowAdminModal(false);
                      }}
                      className="p-2 bg-slate-900 hover:bg-cyan-950 border border-slate-700 rounded text-center text-cyan-300 font-bold"
                    >
                      Room {r}
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Physical Venue Mode:</span>
                    <button
                      onClick={() =>
                        setProgress((prev) => ({
                          ...prev,
                          physicalVenueMode: !prev.physicalVenueMode,
                        }))
                      }
                      className={`px-3 py-1 rounded text-[11px] font-bold ${
                        progress.physicalVenueMode
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {progress.physicalVenueMode ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      localStorage.removeItem(STORAGE_KEY);
                      setProgress(DEFAULT_PROGRESS);
                      setShowAdminModal(false);
                    }}
                    className="w-full py-2 bg-red-950 border border-red-700 text-red-300 font-bold rounded-lg text-xs"
                  >
                    RESET ALL PROGRESS
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: CHAMPIONSHIP EXTRACTION VICTORY SCREEN
      ===================================================================== */}
      {showVictoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-slate-950 border-2 border-amber-400 shadow-2xl text-center space-y-5 font-mono">
            <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mx-auto text-amber-300 animate-bounce">
              <Trophy className="w-10 h-10" />
            </div>

            <div>
              <div className="text-xs font-bold tracking-widest text-amber-400 uppercase">
                CHAMPIONSHIP EXTRACTION COMPLETE
              </div>
              <h2 className="text-2xl sm:text-3xl font-heading font-black text-white mt-1">
                FACILITY ESCAPED!
              </h2>
              <p className="text-xs text-slate-300 mt-2 max-w-sm mx-auto">
                Squad <strong>{teamName}</strong> has cracked all four escape chambers and captured the championship extraction flag!
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block">FINAL SCORE</span>
                <strong className="text-xl font-heading font-black text-amber-300">
                  {progress.netScore}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">TOTAL ERRORS</span>
                <strong className="text-xl font-heading font-black text-slate-200">
                  {progress.cumulativeErrors}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">HINTS USED</span>
                <strong className="text-xl font-heading font-black text-slate-200">
                  {progress.hintsUsedCount}
                </strong>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => onNavigate('/dashboard')}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-heading font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg"
              >
                GO TO DASHBOARD
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
