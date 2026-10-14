import React, { useEffect, useState } from 'react';
import { ShieldAlert, AlertTriangle, Maximize2, X, ShieldCheck } from 'lucide-react';
import { api } from '../utils/api';
import { sound } from '../utils/audio';

interface AntiCheatMonitorProps {
  teamId?: string;
  enabled?: boolean;
  isCompleted?: boolean;
  isSubmitting?: boolean;
  lastSubmittedTime?: number;
}

export const AntiCheatMonitor: React.FC<AntiCheatMonitorProps> = ({
  teamId,
  enabled = true,
  isCompleted = false,
  isSubmitting = false,
  lastSubmittedTime = 0,
}) => {
  const [warningsCount, setWarningsCount] = useState<number>(0);
  const [showWarningModal, setShowWarningModal] = useState<boolean>(false);
  const [warningMessage, setWarningMessage] = useState<string>('');

  useEffect(() => {
    // Only arm tab switch detection if actively enabled, team is known, and NOT completed/submitting
    if (!enabled || !teamId || isCompleted || isSubmitting) return;

    let lastSwitchTime = 0;

    const handleVisibilityChange = () => {
      // If user has completed the challenge or submitted an answer, do NOT record tab switch
      if (isCompleted || isSubmitting) return;

      // Grace period: if an answer was submitted within the last 30 seconds, do not record
      if (lastSubmittedTime > 0 && Date.now() - lastSubmittedTime < 30000) {
        return;
      }

      // ONLY trigger when the tab is actually hidden (user switched tabs or minimized)
      if (document.hidden) {
        const now = Date.now();
        // Throttle tab switch alerts to once every 4 seconds to prevent repeated stacking
        if (now - lastSwitchTime > 4000) {
          lastSwitchTime = now;
          setWarningsCount((prev) => prev + 1);
          setWarningMessage(
            'Tab switch detected. You switched away from the competition tab while an unsolved challenge was active.'
          );
          setShowWarningModal(true);
          sound.playAccessDenied();
          api
            .logAntiCheatAlert(
              'TAB_SWITCH',
              'Participant switched away from active competition tab during an unsolved challenge'
            )
            .catch(() => {});
        }
      }
    };

    // STRICT TAB SWITCH ONLY: no window blur, no click-off, no clipboard copy triggers
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, teamId, isCompleted, isSubmitting, lastSubmittedTime]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const isStandby = !enabled || isCompleted;

  return (
    <>
      {/* Floating anti-cheat indicator */}
      <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-slate-900/90 border border-slate-700/60 text-[11px] font-mono text-slate-400 select-none">
        {isCompleted ? (
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <ShieldAlert className={`w-3.5 h-3.5 ${isStandby ? 'text-slate-500' : 'text-cyan-400'}`} />
        )}
        <span className="hidden sm:inline">INTEGRITY:</span>
        {isCompleted ? (
          <span className="text-emerald-400 font-semibold">SUBMITTED (STANDBY)</span>
        ) : !enabled ? (
          <span className="text-slate-400 font-semibold">STANDBY</span>
        ) : (
          <span className="text-cyan-400 font-semibold">ACTIVE (TAB LOCK)</span>
        )}
        {warningsCount > 0 && (
          <span className="text-amber-400 ml-1 font-bold">
            [{warningsCount} TAB SWITCH{warningsCount > 1 ? 'ES' : ''}]
          </span>
        )}
        <button
          onClick={toggleFullScreen}
          title="Toggle Fullscreen Arena"
          className="ml-1 p-0.5 hover:text-cyan-300 text-slate-500 transition-colors"
        >
          <Maximize2 className="w-3 h-3" />
        </button>
      </div>

      {/* Security alert modal - shown strictly when switching tabs during an active unsolved test */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-md w-full bg-slate-950 border border-red-500/80 rounded-xl p-5 shadow-2xl glow-red">
            <div className="flex items-center justify-between pb-3 border-b border-red-500/30">
              <div className="flex items-center gap-2 text-red-400 font-heading tracking-wide">
                <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
                <span className="font-bold">TAB SWITCH DETECTED</span>
              </div>
              <button
                onClick={() => setShowWarningModal(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 font-mono text-sm">
              <p className="text-slate-200">{warningMessage}</p>
              <div className="bg-red-950/40 border border-red-800/40 p-3 rounded text-xs text-red-300 space-y-1.5">
                <p>
                  • Tab switches recorded: <span className="font-bold text-red-400">{warningsCount}</span>
                </p>
                <p>• Only tab switching during unsolved challenges is monitored.</p>
                <p>• Once you submit your answer, monitoring automatically enters standby.</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowWarningModal(false)}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold tracking-wider rounded transition-colors cursor-pointer"
              >
                RETURN TO CHALLENGE
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
