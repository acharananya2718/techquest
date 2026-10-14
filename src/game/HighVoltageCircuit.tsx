import React, { useState } from 'react';
import { Zap, CheckCircle2, AlertTriangle, X, RefreshCw } from 'lucide-react';
import { escapeAudio } from './audioEngine.ts';

interface HighVoltageCircuitProps {
  isRestored: boolean;
  onRestoreSuccess: () => void;
  onClose: () => void;
}

export const HighVoltageCircuit: React.FC<HighVoltageCircuitProps> = ({
  isRestored,
  onRestoreSuccess,
  onClose,
}) => {
  // 4 Breaker switches: S1, S2, S3, S4
  // Target route logic: To bridge from 480V Main Feed to Auxiliary Relay 3:
  // S1 must be ON, S2 must be OFF (avoiding shunt ground), S3 must be ON, S4 must be ON.
  const [switches, setSwitches] = useState<boolean[]>([false, true, false, false]);
  const [solved, setSolved] = useState<boolean>(isRestored);

  const toggleSwitch = (index: number) => {
    if (solved) return;
    escapeAudio.playKeypadBeep(520 + index * 110);
    const updated = [...switches];
    updated[index] = !updated[index];
    setSwitches(updated);

    // Check circuit condition: S1: ON, S2: OFF, S3: ON, S4: ON
    if (updated[0] && !updated[1] && updated[2] && updated[3]) {
      setSolved(true);
      escapeAudio.playElectricSpark();
      escapeAudio.playUnboltClunk();
      onRestoreSuccess();
    }
  };

  const resetSwitches = () => {
    escapeAudio.playKeypadBeep(400);
    setSwitches([false, true, false, false]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-xl p-6 rounded-2xl bg-[#0b0f17] border-2 border-amber-500 shadow-2xl space-y-4 font-mono text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-900/60 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
            <h3 className="font-heading font-black text-amber-300 text-base uppercase tracking-wider">
              HIGH-VOLTAGE PLC CIRCUIT PANEL [480V]
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300">
          The tunnel ceiling floodlights are unpowered. Route high-voltage power through the busbar switches to energize the master safety coil.
          <br />
          <span className="text-amber-400 font-bold">
            Caution: Bypassing through Ground Shunt (Switch 2) triggers safety trip!
          </span>
        </p>

        {/* Schematic Board Visual */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-900 pb-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              MAIN FEED: 480V 3-PHASE
            </span>
            <span className={`font-bold ${solved ? 'text-emerald-400' : 'text-amber-500'}`}>
              BUSBAR STATUS: {solved ? 'ENERGIZED [100%]' : 'INTERLOCKED [0%]'}
            </span>
          </div>

          {/* Circuit Switch Toggles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'S1: Primary Feeder', desc: 'Main Supply Inflow' },
              { label: 'S2: Ground Shunt', desc: 'Safety Earthing' },
              { label: 'S3: Auxiliary Coil', desc: 'Tunnel Lights Bus' },
              { label: 'S4: Hatch Interlock', desc: 'Ceiling Hoist Motor' },
            ].map((sw, idx) => {
              const isOn = switches[idx];
              return (
                <button
                  key={sw.label}
                  type="button"
                  onClick={() => toggleSwitch(idx)}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-between gap-2 text-center transition-all cursor-pointer ${
                    isOn
                      ? 'bg-amber-950/60 border-amber-400 text-amber-200 shadow-md glow-amber'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-[11px] font-bold">{sw.label}</span>
                  <div
                    className={`w-8 h-12 rounded border flex flex-col items-center justify-between p-1 transition-colors ${
                      isOn ? 'bg-amber-500 border-amber-300' : 'bg-slate-800 border-slate-700'
                    }`}
                  >
                    <div
                      className={`w-6 h-5 rounded transition-transform ${
                        isOn ? 'bg-slate-950 translate-y-5' : 'bg-slate-400 translate-y-0'
                      }`}
                    />
                  </div>
                  <span className="text-[10px] font-mono font-black uppercase">
                    {isOn ? 'ENGAGED' : 'OPEN'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Circuit Trace Diagram */}
          <div className="p-3 rounded-lg bg-black/80 border border-slate-900 text-[11px] font-mono text-slate-400 leading-relaxed">
            <div>
              [480V IN] ─── [{switches[0] ? '✓ S1: CLOSED' : '✗ S1: OPEN'}] ──┬── [{switches[1] ? '⚠ S2: SHUNTED (TRIP)' : '✓ S2: ISOLATED'}]
            </div>
            <div className="pl-28">
              └── [{switches[2] ? '✓ S3: CLOSED' : '✗ S3: OPEN'}] ─── [{switches[3] ? '✓ S4: CLOSED' : '✗ S4: OPEN'}] ─── [CEILING HATCH POWER]
            </div>
          </div>
        </div>

        {/* Status Message */}
        {solved ? (
          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 flex items-center gap-2 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>CIRCUIT ENERGIZED: Power successfully restored to the ceiling hoist & utility lights!</span>
          </div>
        ) : switches[1] ? (
          <div className="p-3 rounded-xl bg-red-950/80 border border-red-500 text-red-300 flex items-center gap-2 text-xs">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>GROUND TRIP ACTIVE: Disengage Switch 2 (Ground Shunt) to allow current flow!</span>
          </div>
        ) : (
          <div className="text-xs text-slate-400 text-center">
            Toggle switches to complete circuit without tripping ground shunt.
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={resetSwitches}
            className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>RESET SWITCHES</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-heading font-black text-xs uppercase cursor-pointer"
          >
            {solved ? 'RETURN TO TUNNEL' : 'CLOSE PANEL'}
          </button>
        </div>
      </div>
    </div>
  );
};
