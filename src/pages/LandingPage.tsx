import React, { useState } from 'react';
import {
  Shield,
  Zap,
  Clock,
  Users,
  Compass,
  KeyRound,
  Layers,
  ChevronRight,
  Terminal,
  Cpu,
  Lock,
  ArrowRight,
  Play,
  FileText,
  CheckCircle,
} from 'lucide-react';
import { sound } from '../utils/audio';

interface LandingPageProps {
  onNavigate: (path: string) => void;
  onQuickDemoLogin?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onQuickDemoLogin }) => {
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);

  return (
    <div className="relative overflow-hidden min-h-screen">
      {/* Background ambient grid and glow */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-cyan-600/10 via-purple-600/10 to-transparent blur-3xl pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 px-4 sm:px-6 max-w-7xl mx-auto text-center">
        {/* Futuristic badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 font-mono text-xs mb-6 shadow-sm glow-cyan">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>INTER-DEPARTMENT COMPETITION ENGINE ACTIVE</span>
        </div>

        {/* Hero Headings */}
        <h1 className="font-heading font-black tracking-tight text-3xl sm:text-5xl md:text-7xl uppercase text-white leading-none">
          TECH <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400 text-glow-cyan">HUNT</span>
        </h1>
        <h2 className="font-heading font-black tracking-widest text-2xl sm:text-4xl md:text-5xl uppercase text-slate-300 mt-2">
          ENGINEERING <span className="text-purple-400 text-glow-purple">ESCAPE ROOM</span>
        </h2>

        {/* Tagline */}
        <div className="mt-5 inline-block">
          <p className="font-mono text-base sm:text-2xl font-bold tracking-widest text-cyan-300 uppercase">
            Decode. Solve. Hunt. Conquer.
          </p>
        </div>

        {/* Short description */}
        <p className="max-w-3xl mx-auto mt-4 text-sm sm:text-lg text-slate-300 font-sans leading-relaxed">
          A technical competition where engineering knowledge, speed, teamwork and problem-solving decide who reaches the final vault.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <button
            onClick={() => {
              sound.playKeystroke();
              onNavigate('/register');
            }}
            className="px-6 py-3.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-heading font-black text-xs sm:text-sm tracking-wider uppercase transition-all shadow-lg glow-cyan flex items-center gap-2 group cursor-pointer"
          >
            <span>REGISTER TEAM</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => {
              sound.playKeystroke();
              onNavigate('/login');
            }}
            className="px-6 py-3.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 font-heading font-bold text-xs sm:text-sm tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer"
          >
            <Lock className="w-4 h-4 text-cyan-400" />
            <span>TEAM LOGIN</span>
          </button>

          <button
            onClick={() => {
              sound.playKeystroke();
              setShowRulesModal(true);
            }}
            className="px-5 py-3.5 rounded-lg bg-slate-950/80 hover:bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 font-mono font-semibold text-xs sm:text-sm tracking-wider transition-all flex items-center gap-2 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-slate-400" />
            <span>VIEW RULES</span>
          </button>
        </div>

        {/* Quick Demo Test Squad Launcher */}
        <div className="mt-6">
          <button
            onClick={() => {
              sound.playKeystroke();
              onNavigate('/login');
            }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded bg-purple-950/60 border border-purple-500/40 text-[11px] font-mono text-purple-300 hover:border-purple-400 transition-all hover:glow-purple"
          >
            <Play className="w-3 h-3 text-purple-400" />
            <span>TEST MODE: 1-Click login as Demo Team (CYBERDYNE / QUANTUM / MECH) or Admin</span>
          </button>
        </div>
      </section>

      {/* Visual Journey Pipeline */}
      <section className="relative max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="text-center mb-8">
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">
            COMPETITION ARCHITECTURE
          </span>
          <h3 className="text-xl sm:text-3xl font-heading font-black text-white mt-1">
            THE TACTICAL JOURNEY
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative">
          {/* Round 1 */}
          <div className="relative p-6 rounded-2xl bg-slate-950/90 border border-cyan-500/40 hover:border-cyan-400 transition-all glow-cyan group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-cyan-400 px-2.5 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                ROUND 01
              </span>
              <Compass className="w-5 h-5 text-cyan-400 group-hover:rotate-45 transition-transform" />
            </div>
            <h4 className="font-heading font-black text-xl text-white">TECH HUNT</h4>
            <p className="text-xs font-mono text-slate-400 mt-2 leading-relaxed">
              Solve five canonical engineering challenges across number series, C output trace, alphanumeric ciphers, kinematics, and two's complement. Crack the master password.
            </p>
            <div className="mt-5 pt-3 border-t border-slate-900 flex items-center justify-between text-[11px] font-mono text-cyan-300">
              <span>DURATION:</span>
              <span className="font-bold text-white">60–90 MIN</span>
            </div>
          </div>

          {/* Qualification Bridge */}
          <div className="relative p-6 rounded-2xl bg-slate-950/90 border border-purple-500/40 hover:border-purple-400 transition-all glow-purple group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-purple-400 px-2.5 py-0.5 rounded bg-purple-950 border border-purple-800">
                GATEWAY
              </span>
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
            <h4 className="font-heading font-black text-xl text-white">QUALIFICATION</h4>
            <p className="text-xs font-mono text-slate-400 mt-2 leading-relaxed">
              Teams are evaluated using Round 1 scores and completion times. Only squads meeting organizer-defined qualification criteria unlock access to Round 2.
            </p>
            <div className="mt-5 pt-3 border-t border-slate-900 flex items-center justify-between text-[11px] font-mono text-purple-300">
              <span>THRESHOLD:</span>
              <span className="font-bold text-white">TOP ADVANCING SQUADS</span>
            </div>
          </div>

          {/* Round 2 */}
          <div className="relative p-6 rounded-2xl bg-slate-950/90 border border-amber-500/50 hover:border-amber-400 transition-all glow-amber group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-amber-400 px-2.5 py-0.5 rounded bg-amber-950 border border-amber-800">
                ROUND 02
              </span>
              <KeyRound className="w-5 h-5 text-amber-400" />
            </div>
            <h4 className="font-heading font-black text-xl text-white">ESCAPE ROOM</h4>
            <p className="text-xs font-mono text-slate-400 mt-2 leading-relaxed">
              System failure at smart manufacturing plant! Clear 4 sequential rooms: The Discovery, The Decoder, The System, and Room 4: The Final Vault to restore central control.
            </p>
            <div className="mt-5 pt-3 border-t border-slate-900 flex items-center justify-between text-[11px] font-mono text-amber-300">
              <span>DURATION:</span>
              <span className="font-bold text-white">45–60 MIN</span>
            </div>
          </div>
        </div>
      </section>

      {/* Event Information Cards */}
      <section className="relative max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 sm:p-10 shadow-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-900">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">
                OFFICIAL SPECIFICATIONS
              </span>
              <h3 className="text-2xl sm:text-3xl font-heading font-black text-white mt-1">
                COMPETITION PARAMETERS
              </h3>
            </div>
            <button
              onClick={() => onNavigate('/register')}
              className="px-6 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-heading font-bold text-xs uppercase tracking-wider transition-all"
            >
              FORM YOUR SQUAD NOW
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            {/* Spec 1 */}
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
              <div className="w-10 h-10 rounded-lg bg-cyan-950/60 border border-cyan-800 flex items-center justify-center mb-3">
                <Users className="w-5 h-5 text-cyan-400" />
              </div>
              <h5 className="font-heading font-bold text-sm text-white">TEAM COMPOSITION</h5>
              <p className="text-xs font-mono text-cyan-300 mt-1">2 to 4 Students per Squad</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Designate a Team Leader. Cross-branch collaboration encouraged for multidisciplinary edge.
              </p>
            </div>

            {/* Spec 2 */}
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
              <div className="w-10 h-10 rounded-lg bg-purple-950/60 border border-purple-800 flex items-center justify-center mb-3">
                <Cpu className="w-5 h-5 text-purple-400" />
              </div>
              <h5 className="font-heading font-bold text-sm text-white">ELIGIBILITY</h5>
              <p className="text-xs font-mono text-purple-300 mt-1">All Departments</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Computer Science, Electronics, Mechanical, Electrical, Civil, Mechatronics, & AI.
              </p>
            </div>

            {/* Spec 3 */}
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
              <div className="w-10 h-10 rounded-lg bg-amber-950/60 border border-amber-800 flex items-center justify-center mb-3">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <h5 className="font-heading font-bold text-sm text-white">ROUND TIMINGS</h5>
              <p className="text-xs font-mono text-amber-300 mt-1">Server Authoritative Sync</p>
              <p className="text-[11px] text-slate-400 mt-1">
                R1: 60–90 mins • R2: 45–60 mins • Final Vault: 10–20 mins. Persistent across page refreshes.
              </p>
            </div>

            {/* Spec 4 */}
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
              <div className="w-10 h-10 rounded-lg bg-emerald-950/60 border border-emerald-800 flex items-center justify-center mb-3">
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
              <h5 className="font-heading font-bold text-sm text-white">SCORING & HINTS</h5>
              <p className="text-xs font-mono text-emerald-300 mt-1">Accuracy + Speed Matrix</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Difficulty selection rewards higher points. Tactical hints deduct configured penalty.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="max-w-2xl w-full bg-slate-950 border border-cyan-500/70 rounded-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto glow-cyan">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-6 h-6 text-cyan-400" />
                <h3 className="font-heading font-black text-lg text-white">
                  MISSION PROTOCOLS & COMPETITION RULES
                </h3>
              </div>
              <button
                onClick={() => setShowRulesModal(false)}
                className="text-slate-400 hover:text-white p-1 font-mono text-sm"
              >
                [ESC]
              </button>
            </div>

            <div className="py-5 space-y-4 font-mono text-xs text-slate-300 leading-relaxed">
              <div className="space-y-1 bg-slate-900/70 p-3 rounded-lg border border-slate-800">
                <div className="text-cyan-400 font-bold uppercase">1. Squad Formation</div>
                <p>Teams must consist of 2 to 4 registered engineering students. Each squad must have a designated leader who receives credentials.</p>
              </div>

              <div className="space-y-1 bg-slate-900/70 p-3 rounded-lg border border-slate-800">
                <div className="text-cyan-400 font-bold uppercase">2. Round 1: Tech Hunt</div>
                <p>Teams navigate progressive technical nodes (Digital, Electronics, Coding, Logic, Hidden). Choice-based nodes allow squads to lock in EASY (50 pts), MEDIUM (75 pts), or HARD (100 pts). Once locked, difficulty cannot be altered.</p>
              </div>

              <div className="space-y-1 bg-slate-900/70 p-3 rounded-lg border border-slate-800">
                <div className="text-cyan-400 font-bold uppercase">3. Qualification Gateway</div>
                <p>Only top squads according to total score and fastest completion timestamp qualify for the Engineering Escape Room. Non-qualifying squads terminate here.</p>
              </div>

              <div className="space-y-1 bg-slate-900/70 p-3 rounded-lg border border-slate-800">
                <div className="text-cyan-400 font-bold uppercase">4. Round 2: System Failure Escape Room</div>
                <p>A smart manufacturing plant is offline. 5 connected subsystems must be solved in strict sequence to recover 5 authorization keys. All 5 keys must then be configured on the Final Control Panel.</p>
              </div>

              <div className="space-y-1 bg-slate-900/70 p-3 rounded-lg border border-slate-800">
                <div className="text-cyan-400 font-bold uppercase">5. Anti-Cheat & Screen Integrity</div>
                <p>The platform monitors active focus. Multiple tab switches, unauthorized clipboard extraction, or synchronized rapid submissions will trigger security telemetry alerts to the organizer.</p>
              </div>

              <div className="space-y-1 bg-slate-900/70 p-3 rounded-lg border border-slate-800">
                <div className="text-cyan-400 font-bold uppercase">6. Timers & Server Validation</div>
                <p>All timers are server authoritative. Refreshing the browser or changing client time will not reset or alter remaining competition power.</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
              <span className="text-[11px] font-mono text-slate-500">Adjudicated by College Technical Committee</span>
              <button
                onClick={() => setShowRulesModal(false)}
                className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-heading text-xs rounded transition-colors"
              >
                ACKNOWLEDGE RULES
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
