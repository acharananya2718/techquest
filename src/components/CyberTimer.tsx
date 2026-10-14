import React, { useEffect, useState } from 'react';
import { sound } from '../utils/audio';

interface CyberTimerProps {
  seconds: number;
  totalSeconds?: number;
  maxSeconds?: number;
  label?: string;
  isCriticalAlert?: boolean;
  onExpire?: () => void;
  className?: string;
}

export const CyberTimer: React.FC<CyberTimerProps> = ({
  seconds,
  totalSeconds,
  maxSeconds,
  label = 'SYSTEM POWER REMAINING',
  isCriticalAlert = true,
  onExpire,
  className = '',
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(seconds);
  const maxSpan = Math.max(totalSeconds || maxSeconds || seconds || 1, 1);

  useEffect(() => {
    setTimeLeft(seconds);
  }, [seconds]);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (onExpire) onExpire();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onExpire) onExpire();
          return 0;
        }
        if (prev <= 10 && isCriticalAlert) {
          sound.playCountdownTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, onExpire, isCriticalAlert]);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const secs = timeLeft % 60;

  const isLow = timeLeft < 300 && timeLeft > 0; // < 5 mins
  const isCritical = timeLeft < 60 && timeLeft > 0; // < 1 min

  return (
    <div
      className={`relative border rounded-lg p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md transition-all duration-300 ${
        isCritical
          ? 'border-red-500/80 glow-red animate-pulse'
          : isLow
          ? 'border-amber-500/70 glow-amber'
          : 'border-cyan-500/40 glow-cyan'
      } ${className}`}
    >
      <div className="flex items-center justify-between text-xs tracking-wider uppercase mb-1 font-mono">
        <span
          className={`flex items-center gap-1.5 ${
            isCritical ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-cyan-400'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isCritical ? 'bg-red-500 animate-ping' : isLow ? 'bg-amber-400' : 'bg-cyan-400 animate-pulse'
            }`}
          />
          {label}
        </span>
        <span className="text-slate-400 text-[10px]">
          {isCritical ? 'CRITICAL STATE' : isLow ? 'LOW RESERVES' : 'NOMINAL TELEMETRY'}
        </span>
      </div>

      <div className="font-mono text-2xl sm:text-4xl font-bold tracking-widest text-center py-1">
        <span className={isCritical ? 'text-red-400' : isLow ? 'text-amber-300' : 'text-cyan-300'}>
          {hours > 0 && `${String(hours).padStart(2, '0')}:`}
          {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </span>
      </div>

      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
        <div
          className={`h-full transition-all duration-1000 ${
            isCritical ? 'bg-red-500' : isLow ? 'bg-amber-400' : 'bg-gradient-to-r from-cyan-500 to-indigo-500'
          }`}
          style={{ width: `${Math.min(100, Math.max(0, (timeLeft / maxSpan) * 100))}%` }}
        />
      </div>
    </div>
  );
};
