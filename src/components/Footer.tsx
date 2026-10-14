import React from 'react';
import { Terminal, Shield, Zap, HelpCircle } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full border-t border-slate-900 bg-[#03060c] text-slate-400 text-xs py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Col 1 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white font-heading font-black">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            TECH QUEST
          </div>
          <p className="text-slate-400 font-mono text-[11px] leading-relaxed">
            Inter-Department Engineering Escape Room & Technical Hunt Tournament. Built for interdisciplinary problem solving.
          </p>
          <div className="flex items-center gap-2 pt-1 font-mono text-[10px] text-cyan-400">
            <Shield className="w-3 h-3 text-emerald-400" />
            <span>SECURE VAULT SYSTEM v4.2.0</span>
          </div>
        </div>

        {/* Col 2 */}
        <div className="space-y-2 font-mono">
          <h5 className="text-white font-bold text-xs uppercase tracking-wider">Tournament Stages</h5>
          <ul className="space-y-1.5 text-[11px]">
            <li className="flex items-center gap-1.5 hover:text-cyan-300 cursor-pointer" onClick={() => onNavigate('/tech-hunt')}>
              <span className="text-cyan-500">›</span> Round 1: Tech Hunt (60-90m)
            </li>
            <li className="flex items-center gap-1.5 hover:text-cyan-300 cursor-pointer" onClick={() => onNavigate('/dashboard')}>
              <span className="text-cyan-500">›</span> Qualification: Top Teams
            </li>
            <li className="flex items-center gap-1.5 hover:text-cyan-300 cursor-pointer" onClick={() => onNavigate('/escape-room')}>
              <span className="text-cyan-500">›</span> Round 2: Escape Room (45-60m)
            </li>
            <li className="flex items-center gap-1.5 hover:text-cyan-300 cursor-pointer" onClick={() => onNavigate('/final-vault')}>
              <span className="text-cyan-500">›</span> Final Vault: Championship (10-20m)
            </li>
          </ul>
        </div>

        {/* Col 3 */}
        <div className="space-y-2 font-mono">
          <h5 className="text-white font-bold text-xs uppercase tracking-wider">Navigation</h5>
          <ul className="space-y-1.5 text-[11px]">
            <li className="hover:text-cyan-300 cursor-pointer" onClick={() => onNavigate('/register')}>
              • Team Registration (2-4 Members)
            </li>
            <li className="hover:text-cyan-300 cursor-pointer" onClick={() => onNavigate('/login')}>
              • Team Access Portal
            </li>
            <li className="hover:text-cyan-300 cursor-pointer" onClick={() => onNavigate('/leaderboard')}>
              • Live Public Leaderboard
            </li>
            <li className="hover:text-purple-300 cursor-pointer text-purple-400" onClick={() => onNavigate('/admin')}>
              • Organizer Command Center
            </li>
          </ul>
        </div>

        {/* Col 4 */}
        <div className="space-y-2 bg-slate-950/60 border border-slate-800/80 p-3 rounded-lg font-mono text-[11px]">
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1 text-cyan-400 font-bold">
              <Zap className="w-3.5 h-3.5" /> TELEMETRY
            </span>
            <span className="text-emerald-400">ONLINE</span>
          </div>
          <p className="text-slate-400 text-[10px]">
            Server authoritative timers active. Anti-cheat integrity monitor initialized across all nodes.
          </p>
          <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
            <span>PORT 3000 DEV/PROD</span>
            <span className="text-cyan-400">ENCRYPTED</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-4 border-t border-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
        <div>
          © 2026 TECH QUEST ENGINEERING ESCAPE ROOM. All rights reserved.
        </div>
        <div className="flex items-center gap-4">
          <span>DEPARTMENTS: CSE • ECE • ME • EEE • MECHATRONICS</span>
        </div>
      </div>
    </footer>
  );
};
