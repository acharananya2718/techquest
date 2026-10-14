import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  RotateCcw,
  RotateCw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Compass,
  Undo2,
  Move,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Crosshair,
  Wand2,
} from 'lucide-react';
import { sound } from '../utils/audio';

export interface MatchstickState {
  id: number;
  x: number;
  y: number;
  rotation: number;
}

interface MatchstickPuzzleProps {
  isCompleted: boolean;
  clueAwarded?: string;
  points: number;
  onSubmit: (matchsticks: MatchstickState[]) => Promise<{ isCorrect: boolean; message: string; clueUnlocked?: string }>;
  onCompletedNext?: () => void;
}

const BOARD_WIDTH = 560;
const BOARD_HEIGHT = 320;

// Target blueprint for "N I L" (represents NOTHING)
const TARGET_SLOTS = [
  { id: 0, x: 145, y: 130, angle: 90, letter: 'N', desc: 'N Left Stem' },
  { id: 1, x: 170, y: 130, angle: 58, letter: 'N', desc: 'N Diagonal' },
  { id: 2, x: 195, y: 130, angle: 90, letter: 'N', desc: 'N Right Stem' },
  { id: 3, x: 285, y: 130, angle: 90, letter: 'I', desc: 'I Vertical' },
  { id: 4, x: 375, y: 130, angle: 90, letter: 'L', desc: 'L Vertical Stem' },
  { id: 5, x: 420, y: 175, angle: 0, letter: 'L', desc: 'L Base' },
];

const INITIAL_STICKS: MatchstickState[] = [
  { id: 0, x: 75, y: 260, rotation: 0 },
  { id: 1, x: 160, y: 260, rotation: 0 },
  { id: 2, x: 245, y: 260, rotation: 0 },
  { id: 3, x: 330, y: 260, rotation: 0 },
  { id: 4, x: 415, y: 260, rotation: 0 },
  { id: 5, x: 500, y: 260, rotation: 0 },
];

export const MatchstickPuzzle: React.FC<MatchstickPuzzleProps> = ({
  isCompleted,
  points,
  onSubmit,
  onCompletedNext,
}) => {
  const [sticks, setSticks] = useState<MatchstickState[]>(INITIAL_STICKS);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [showBlueprint, setShowBlueprint] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{
    status: 'IDLE' | 'GRANTED' | 'DENIED';
    title: string;
    message: string;
    clue?: string;
  }>({ status: 'IDLE', title: '', message: '' });

  const boardRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<{
    isDragging: boolean;
    stickId: number;
    startX: number;
    startY: number;
    stickStartX: number;
    stickStartY: number;
    pointerId?: number;
    hasMoved: boolean;
  } | null>(null);

  // Convert screen coordinates to SVG internal coordinates
  const getInternalCoords = useCallback((clientX: number, clientY: number) => {
    if (!boardRef.current) return { x: 0, y: 0 };
    const svg = boardRef.current;

    try {
      const ctm = svg.getScreenCTM();
      if (ctm) {
        const pt = svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const transformed = pt.matrixTransform(ctm.inverse());
        return {
          x: Math.max(25, Math.min(BOARD_WIDTH - 25, transformed.x)),
          y: Math.max(25, Math.min(BOARD_HEIGHT - 25, transformed.y)),
        };
      }
    } catch {
      // Fallback below
    }

    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return { x: 0, y: 0 };
    const scaleX = BOARD_WIDTH / rect.width;
    const scaleY = BOARD_HEIGHT / rect.height;
    return {
      x: Math.max(25, Math.min(BOARD_WIDTH - 25, (clientX - rect.left) * scaleX)),
      y: Math.max(25, Math.min(BOARD_HEIGHT - 25, (clientY - rect.top) * scaleY)),
    };
  }, []);

  const updateStickPosition = useCallback((stickId: number, targetX: number, targetY: number) => {
    const clampedX = Math.round(Math.max(25, Math.min(BOARD_WIDTH - 25, targetX)));
    const clampedY = Math.round(Math.max(25, Math.min(BOARD_HEIGHT - 25, targetY)));
    setSticks((prev) =>
      prev.map((s) => (s.id === stickId ? { ...s, x: clampedX, y: clampedY } : s))
    );
  }, []);

  const rotateStick = useCallback((stickId: number, deltaDeg: number) => {
    sound.playKeystroke();
    setSticks((prev) =>
      prev.map((s) => {
        if (s.id !== stickId) return s;
        let nextRot = (s.rotation + deltaDeg) % 360;
        if (nextRot < 0) nextRot += 360;
        return { ...s, rotation: Math.round(nextRot) };
      })
    );
  }, []);

  const setExactAngle = (stickId: number, angle: number) => {
    sound.playKeystroke();
    setSticks((prev) =>
      prev.map((s) => (s.id === stickId ? { ...s, rotation: (angle % 360 + 360) % 360 } : s))
    );
  };

  const nudgeStick = (stickId: number, dx: number, dy: number) => {
    sound.playKeystroke();
    setSticks((prev) =>
      prev.map((s) => {
        if (s.id !== stickId) return s;
        return {
          ...s,
          x: Math.round(Math.max(25, Math.min(BOARD_WIDTH - 25, s.x + dx))),
          y: Math.round(Math.max(25, Math.min(BOARD_HEIGHT - 25, s.y + dy))),
        };
      })
    );
  };

  const handleReset = () => {
    sound.playKeystroke();
    setSticks(INITIAL_STICKS.map((s) => ({ ...s })));
    setSelectedId(null);
    setDraggingId(null);
    dragRef.current = null;
    setFeedback({ status: 'IDLE', title: '', message: '' });
  };

  const handleApplyFormation = () => {
    sound.playKeystroke();
    setSticks(TARGET_SLOTS.map((t, idx) => ({
      id: idx,
      x: t.x,
      y: t.y,
      rotation: t.angle,
    })));
    setSelectedId(null);
    setDraggingId(null);
  };

  const handleSnapSelectedToSlot = (stickId: number) => {
    const stick = sticks.find((s) => s.id === stickId);
    if (!stick) return;
    // Find closest target slot
    let closest = TARGET_SLOTS[0];
    let minDist = Infinity;
    TARGET_SLOTS.forEach((slot) => {
      const d = Math.hypot(stick.x - slot.x, stick.y - slot.y);
      if (d < minDist) {
        minDist = d;
        closest = slot;
      }
    });
    sound.playKeystroke();
    setSticks((prev) =>
      prev.map((s) =>
        s.id === stickId ? { ...s, x: closest.x, y: closest.y, rotation: closest.angle } : s
      )
    );
  };

  // GLOBAL LISTENERS FOR DRAGGING
  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (!dragRef.current || !dragRef.current.isDragging) return;

      const { stickId, startX, startY, stickStartX, stickStartY } = dragRef.current;
      const coords = getInternalCoords(clientX, clientY);

      const dx = coords.x - startX;
      const dy = coords.y - startY;

      if (Math.hypot(dx, dy) > 2) {
        dragRef.current.hasMoved = true;
      }

      updateStickPosition(stickId, stickStartX + dx, stickStartY + dy);
    };

    const handlePointerMove = (e: PointerEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (dragRef.current && dragRef.current.isDragging && e.touches[0]) {
        e.preventDefault();
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleEnd = () => {
      if (dragRef.current) {
        dragRef.current = null;
        setDraggingId(null);
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handleEnd);
    window.addEventListener('pointercancel', handleEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleEnd);
    window.addEventListener('touchcancel', handleEnd);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handleEnd);
      window.removeEventListener('pointercancel', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
      window.removeEventListener('touchcancel', handleEnd);
    };
  }, [getInternalCoords, updateStickPosition]);

  // Keyboard navigation & rotation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedId === null || isCompleted) return;
      const step = e.shiftKey ? 25 : 10;

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        rotateStick(selectedId, e.shiftKey ? -45 : 45);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        nudgeStick(selectedId, 0, -step);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        nudgeStick(selectedId, 0, step);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        nudgeStick(selectedId, -step, 0);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nudgeStick(selectedId, step, 0);
      } else if (e.key === 'Escape') {
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, isCompleted, rotateStick]);

  const handleStickPointerDown = (e: React.PointerEvent<SVGElement>, stickId: number) => {
    if (isCompleted) return;
    e.preventDefault();
    e.stopPropagation();

    try {
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }

    sound.playKeystroke();
    setSelectedId(stickId);
    setDraggingId(stickId);

    const stick = sticks.find((s) => s.id === stickId);
    if (!stick) return;

    const coords = getInternalCoords(e.clientX, e.clientY);
    dragRef.current = {
      isDragging: true,
      stickId,
      startX: coords.x,
      startY: coords.y,
      stickStartX: stick.x,
      stickStartY: stick.y,
      pointerId: e.pointerId,
      hasMoved: false,
    };
  };

  const handleTouchStartStick = (e: React.TouchEvent<SVGElement>, stickId: number) => {
    if (isCompleted || !e.touches[0]) return;
    e.stopPropagation();
    const touch = e.touches[0];
    sound.playKeystroke();
    setSelectedId(stickId);
    setDraggingId(stickId);

    const stick = sticks.find((s) => s.id === stickId);
    if (!stick) return;

    const coords = getInternalCoords(touch.clientX, touch.clientY);
    dragRef.current = {
      isDragging: true,
      stickId,
      startX: coords.x,
      startY: coords.y,
      stickStartX: stick.x,
      stickStartY: stick.y,
      hasMoved: false,
    };
  };

  // Board click: allows "Click to select stick, then click board to place"
  const handleBoardClick = (e: React.MouseEvent<SVGSVGElement>) => {
    // If the user was just dragging, don't trigger click-to-place
    if (dragRef.current && dragRef.current.hasMoved) return;

    if (selectedId !== null) {
      const coords = getInternalCoords(e.clientX, e.clientY);
      updateStickPosition(selectedId, coords.x, coords.y);
      sound.playKeystroke();
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (selectedId === null || isCompleted) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 15 : -15;
    rotateStick(selectedId, delta);
  };

  const handleSubmit = async () => {
    if (isCompleted || isSubmitting) return;
    try {
      setIsSubmitting(true);
      setFeedback({ status: 'IDLE', title: '', message: '' });
      const res = await onSubmit(sticks);
      if (res.isCorrect) {
        sound.playAccessGranted();
        setFeedback({
          status: 'GRANTED',
          title: 'SYSTEM UNLOCKED',
          message: 'NOTHING FOUND. NIL = NOTHING (N: 3 sticks, I: 1 stick, L: 2 sticks)',
          clue: res.clueUnlocked,
        });
      } else {
        sound.playAccessDenied();
        setFeedback({
          status: 'DENIED',
          title: 'ACCESS DENIED',
          message: 'The arrangement does not form NOTHING (N-I-L). Align the 6 sticks into the letters N, I, and L.',
        });
      }
    } catch (err: any) {
      sound.playAccessDenied();
      setFeedback({
        status: 'DENIED',
        title: 'ACCESS DENIED',
        message: err.message || 'Verification failed.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedStick = sticks.find((s) => s.id === selectedId);

  return (
    <div className="w-full max-w-3xl space-y-4 font-mono select-none">
      {/* Header Info */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            INTERACTIVE MATCHSTICK CYPHER
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowBlueprint((prev) => !prev)}
              className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                showBlueprint
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700/80 shadow-sm'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
              title="Toggle blueprint guidance outlines"
            >
              {showBlueprint ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{showBlueprint ? 'GUIDE ON' : 'GUIDE OFF'}</span>
            </button>
            <span className="px-2 py-1 rounded bg-slate-950 border border-slate-700 text-cyan-300 text-[11px] font-bold">
              6 MATCHSTICKS
            </span>
          </div>
        </div>

        <div className="text-base sm:text-lg font-heading font-black text-white tracking-wide">
          "Rearrange the 6 matchsticks and make NOTHING."
        </div>

        <div className="text-xs text-slate-300/90 flex flex-wrap items-center gap-x-4 gap-y-1 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
          <span className="flex items-center gap-1 text-cyan-300 font-semibold">
            <Move className="w-3.5 h-3.5 text-cyan-400" />
            Drag stick directly
          </span>
          <span className="text-slate-500">•</span>
          <span className="flex items-center gap-1 text-amber-300 font-semibold">
            <Crosshair className="w-3.5 h-3.5 text-amber-400" />
            Click stick, then click board to place
          </span>
          <span className="text-slate-500">•</span>
          <span className="flex items-center gap-1 text-purple-300 font-semibold">
            <RotateCw className="w-3.5 h-3.5 text-purple-400" />
            Press 'R' or D-Pad below to rotate / nudge
          </span>
        </div>
      </div>

      {/* SVG Board */}
      <div className="relative bg-[#02050b] rounded-2xl border-2 border-cyan-900/60 p-2 sm:p-4 shadow-2xl overflow-hidden">
        <svg
          ref={boardRef}
          viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`}
          className={`w-full h-auto select-none ${
            selectedId !== null ? 'cursor-crosshair' : 'cursor-default'
          }`}
          style={{ touchAction: 'none' }}
          onWheel={handleWheel}
          onClick={handleBoardClick}
        >
          <defs>
            <linearGradient id="woodGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e8bb7a" />
              <stop offset="40%" stopColor="#d99f57" />
              <stop offset="70%" stopColor="#c58a43" />
              <stop offset="100%" stopColor="#ab722f" />
            </linearGradient>

            <radialGradient id="matchHeadGradient" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#ff4d6d" />
              <stop offset="45%" stopColor="#d90429" />
              <stop offset="85%" stopColor="#9b001d" />
              <stop offset="100%" stopColor="#590010" />
            </radialGradient>

            <filter id="cyanGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="stickShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* Grid Background */}
          <g opacity="0.15">
            {Array.from({ length: Math.floor(BOARD_WIDTH / 40) }).map((_, i) => (
              <line key={`gx-${i}`} x1={i * 40} y1="0" x2={i * 40} y2={BOARD_HEIGHT} stroke="#06b6d4" strokeWidth="0.5" />
            ))}
            {Array.from({ length: Math.floor(BOARD_HEIGHT / 40) }).map((_, j) => (
              <line key={`gy-${j}`} x1="0" y1={j * 40} x2={BOARD_WIDTH} y2={j * 40} stroke="#06b6d4" strokeWidth="0.5" />
            ))}
          </g>

          {/* Construction Zone Divider */}
          <line x1="20" y1="215" x2={BOARD_WIDTH - 20} y2="215" stroke="#1e293b" strokeWidth="1.5" strokeDasharray="4 4" />
          <text x="28" y="208" fill="#06b6d4" fontSize="9" letterSpacing="1.5" fontWeight="bold">
            [CONSTRUCTION ZONE: ARRANGE "N - I - L" (NOTHING) HERE]
          </text>
          <text x="28" y="235" fill="#475569" fontSize="9" letterSpacing="1.5">
            [SUPPLY TRAY]
          </text>

          {/* Optional Formation Blueprint Guide */}
          {showBlueprint && (
            <g opacity="0.38">
              {TARGET_SLOTS.map((slot) => (
                <g
                  key={`guide-${slot.id}`}
                  transform={`translate(${slot.x}, ${slot.y}) rotate(${slot.angle})`}
                  className="pointer-events-none"
                >
                  <rect
                    x="-45"
                    y="-7"
                    width="90"
                    height="14"
                    rx="3"
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                  />
                  <circle cx="43" cy="0" r="5" fill="#f43f5e" fillOpacity="0.6" />
                </g>
              ))}
              <text x="170" y="80" textAnchor="middle" fill="#22d3ee" fontSize="12" fontWeight="bold" letterSpacing="2">N</text>
              <text x="285" y="80" textAnchor="middle" fill="#22d3ee" fontSize="12" fontWeight="bold" letterSpacing="2">I</text>
              <text x="395" y="80" textAnchor="middle" fill="#22d3ee" fontSize="12" fontWeight="bold" letterSpacing="2">L</text>
            </g>
          )}

          {/* Click to place hint reticle */}
          {selectedId !== null && (
            <text x={BOARD_WIDTH / 2} y="25" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="bold" letterSpacing="1">
              [MATCHSTICK #{selectedId + 1} SELECTED: CLICK BOARD TO PLACE OR DRAG]
            </text>
          )}

          {/* Matchsticks */}
          {sticks.map((stick) => {
            const isSelected = selectedId === stick.id;
            const isDragging = draggingId === stick.id;

            return (
              <g
                key={stick.id}
                transform={`translate(${stick.x}, ${stick.y}) rotate(${stick.rotation})`}
                className="select-none"
                style={{ touchAction: 'none' }}
              >
                {/* WIDE GENEROUS HITBOX (120x60px) for effortless mouse & touch grabbing */}
                <rect
                  x="-60"
                  y="-30"
                  width="120"
                  height="60"
                  rx="10"
                  fill="#ffffff"
                  fillOpacity="0.001"
                  className="cursor-grab active:cursor-grabbing pointer-events-auto"
                  style={{ touchAction: 'none' }}
                  onPointerDown={(e) => handleStickPointerDown(e, stick.id)}
                  onTouchStart={(e) => handleTouchStartStick(e, stick.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    sound.playKeystroke();
                    setSelectedId(stick.id);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    rotateStick(stick.id, 45);
                  }}
                />

                {/* Selection Halo & Dashed Box */}
                {isSelected && (
                  <g pointerEvents="none">
                    <rect
                      x="-55"
                      y="-16"
                      width="110"
                      height="32"
                      rx="10"
                      fill="rgba(6, 182, 212, 0.12)"
                      stroke="#22d3ee"
                      strokeWidth="2"
                      strokeDasharray="5 3"
                      className="animate-pulse"
                    />
                    <circle cx="0" cy="0" r="3" fill="#22d3ee" />
                  </g>
                )}

                {/* Visible Matchstick Graphic */}
                <g
                  filter={isSelected || isDragging ? 'url(#cyanGlow)' : 'url(#stickShadow)'}
                  pointerEvents="none"
                >
                  {/* Wooden Stem */}
                  <rect
                    x="-45"
                    y="-6"
                    width="90"
                    height="12"
                    rx="2.5"
                    fill="url(#woodGradient)"
                    stroke="#78481b"
                    strokeWidth="0.8"
                  />
                  <line x1="-35" y1="-2" x2="35" y2="-2" stroke="#ab722f" strokeWidth="0.6" opacity="0.65" />
                  <line x1="-40" y1="2" x2="30" y2="2" stroke="#78481b" strokeWidth="0.6" opacity="0.5" />

                  {/* Red Phosphor Match Head */}
                  <path
                    d="M 39,-7.5 C 46,-7.5 49,-5 49,0 C 49,5 46,7.5 39,7.5 Z"
                    fill="url(#matchHeadGradient)"
                    stroke="#590010"
                    strokeWidth="0.8"
                  />
                  <ellipse cx="43" cy="-2.5" rx="2.5" ry="1.5" fill="#ffccd5" opacity="0.75" />

                  {/* Stick ID Badge */}
                  <text
                    x="-32"
                    y="3"
                    fill="#1e293b"
                    fontSize="7"
                    fontWeight="bold"
                    opacity="0.8"
                  >
                    #{stick.id + 1}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Dynamic Selected Stick Controls Toolbar */}
        {selectedStick && !isCompleted && (
          <div className="mt-3 p-3 rounded-xl bg-slate-900/95 border border-cyan-500/50 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xl">
            {/* Stick Status & Coordinates */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-cyan-300 font-bold">STICK #{selectedStick.id + 1}</span>
              <span className="text-amber-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-700 font-mono text-[11px]">
                X:{selectedStick.x} Y:{selectedStick.y}
              </span>
              <span className="text-cyan-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-700 font-mono text-[11px]">
                {selectedStick.rotation}°
              </span>
            </div>

            {/* Position D-Pad Nudge Buttons */}
            <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 px-1 font-bold">MOVE:</span>
              <button
                type="button"
                onClick={() => nudgeStick(selectedStick.id, -20, 0)}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
                title="Nudge Left"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => nudgeStick(selectedStick.id, 0, -20)}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
                title="Nudge Up"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => nudgeStick(selectedStick.id, 0, 20)}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
                title="Nudge Down"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => nudgeStick(selectedStick.id, 20, 0)}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
                title="Nudge Right"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Rotation Controls */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => rotateStick(selectedStick.id, -45)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 flex items-center gap-1 cursor-pointer"
                title="Rotate -45°"
              >
                <RotateCcw className="w-3 h-3 text-cyan-400" />
                <span>-45°</span>
              </button>

              <button
                type="button"
                onClick={() => rotateStick(selectedStick.id, 45)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 flex items-center gap-1 cursor-pointer"
                title="Rotate +45° or press 'R'"
              >
                <RotateCw className="w-3 h-3 text-cyan-400" />
                <span>+45°</span>
              </button>

              <div className="h-4 w-px bg-slate-700 mx-1" />

              {/* Angle Presets */}
              <button
                type="button"
                onClick={() => setExactAngle(selectedStick.id, 0)}
                className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                  selectedStick.rotation % 180 === 0
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                    : 'bg-slate-950 text-slate-300 border-slate-700'
                }`}
                title="Horizontal (0°)"
              >
                0°
              </button>
              <button
                type="button"
                onClick={() => setExactAngle(selectedStick.id, 58)}
                className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                  selectedStick.rotation % 180 === 58
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                    : 'bg-slate-950 text-slate-300 border-slate-700'
                }`}
                title="N Diagonal (58°)"
              >
                58°
              </button>
              <button
                type="button"
                onClick={() => setExactAngle(selectedStick.id, 90)}
                className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                  selectedStick.rotation % 180 === 90
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                    : 'bg-slate-950 text-slate-300 border-slate-700'
                }`}
                title="Vertical (90°)"
              >
                90°
              </button>

              <button
                type="button"
                onClick={() => handleSnapSelectedToSlot(selectedStick.id)}
                className="px-2 py-1 rounded bg-indigo-950 hover:bg-indigo-900 text-indigo-200 border border-indigo-700 text-[10px] font-bold cursor-pointer"
                title="Snap selected matchstick to nearest guide slot"
              >
                SNAP TO GUIDE
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action / Helper Bar */}
      {!isCompleted ? (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs flex items-center justify-center gap-2 cursor-pointer flex-1 sm:flex-initial"
              title="Reset all sticks to bottom supply tray"
            >
              <Undo2 className="w-4 h-4 text-amber-400" />
              <span>RESET</span>
            </button>

            <button
              type="button"
              onClick={handleApplyFormation}
              className="px-3 py-2.5 rounded-xl bg-cyan-950/70 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-xs flex items-center justify-center gap-2 cursor-pointer flex-1 sm:flex-initial"
              title="Form N-I-L arrangement automatically"
            >
              <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>AUTO-FORM NIL</span>
            </button>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg glow-cyan cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Compass className="w-4 h-4 animate-spin" />
                <span>VERIFYING GEOMETRY...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>SUBMIT ARRANGEMENT</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="p-5 rounded-2xl bg-emerald-950/60 border border-emerald-500/80 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-heading font-black text-sm uppercase">
            <CheckCircle2 className="w-5 h-5" />
            <span>PUZZLE SOLVED (+{points} PTS)</span>
          </div>
          <div className="text-xs text-emerald-200">
            <p className="font-bold text-white text-sm">NOTHING FOUND.</p>
            <p className="mt-1">NIL = NOTHING (N: 3 sticks, I: 1 stick, L: 2 sticks)</p>
          </div>
          {onCompletedNext && (
            <div className="pt-2 flex justify-end">
              <button
                onClick={onCompletedNext}
                className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-heading font-black text-xs uppercase cursor-pointer"
              >
                PROCEED TO NEXT ROOM
              </button>
            </div>
          )}
        </div>
      )}

      {/* Feedback Alert */}
      {feedback.status === 'DENIED' && (
        <div className="p-4 rounded-xl bg-red-950/80 border border-red-500 text-red-200 text-xs space-y-1">
          <div className="flex items-center gap-2 font-heading font-bold text-red-400">
            <AlertTriangle className="w-4 h-4" />
            <span>{feedback.title}</span>
          </div>
          <p>{feedback.message}</p>
        </div>
      )}
    </div>
  );
};
