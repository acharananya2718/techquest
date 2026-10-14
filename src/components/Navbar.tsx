import React, { useState } from 'react';
import {
  Cpu,
  Volume2,
  VolumeX,
  Shield,
  Layers,
  Terminal,
  Trophy,
  KeyRound,
  LogOut,
  Menu,
  X,
  Compass,
} from 'lucide-react';
import { sound } from '../utils/audio';
import { Team } from '../types';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  team: Team | null;
  isAdmin: boolean;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPath,
  onNavigate,
  team,
  isAdmin,
  onLogout,
}) => {
  const [audioActive, setAudioActive] = useState<boolean>(sound.enabled);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const toggleSound = () => {
    const next = sound.toggle();
    setAudioActive(next);
  };

  const navItems = [
    { label: 'HOME', path: '/', icon: Cpu },
    { label: 'TECH HUNT', path: '/tech-hunt', icon: Compass, badge: 'R1' },
    { label: 'ESCAPE ROOM', path: '/escape-room', icon: KeyRound, badge: 'R2' },
    { label: 'LEADERBOARD', path: '/leaderboard', icon: Trophy },
    { label: 'RESULTS', path: '/results', icon: Terminal },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-cyan-950/80 bg-[#050811]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => onNavigate('/')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-lg bg-cyan-950/60 border border-cyan-500/50 flex items-center justify-center group-hover:border-cyan-400 group-hover:glow-cyan transition-all">
            <Cpu className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-black tracking-wider text-base sm:text-lg text-white">
                TECH<span className="text-cyan-400">QUEST</span>
              </span>
              <span className="hidden sm:inline-block text-[9px] px-1.5 py-0.5 rounded bg-cyan-900/40 border border-cyan-700/50 text-cyan-300 font-mono font-bold tracking-widest">
                ESC-ROOM
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-tight hidden sm:block">
              ENGINEERING COMPETITION PLATFORM
            </p>
          </div>
        </div>

        {/* Desktop Nav Items */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentPath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  sound.playKeystroke();
                  onNavigate(item.path);
                }}
                className={`relative px-3 py-1.5 rounded-md text-xs font-mono font-bold tracking-wider transition-all flex items-center gap-1.5 ${
                  active
                    ? 'text-cyan-300 bg-cyan-950/70 border border-cyan-500/40 glow-cyan'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-cyan-400' : 'text-slate-400'}`} />
                {item.label}
                {item.badge && (
                  <span
                    className={`text-[9px] px-1 rounded ${
                      active ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Audio toggle button */}
          <button
            onClick={toggleSound}
            title={audioActive ? 'Mute SFX' : 'Enable SFX'}
            className={`p-2 rounded-lg border transition-all ${
              audioActive
                ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300 hover:glow-cyan'
                : 'bg-slate-900 border-slate-700 text-slate-500'
            }`}
          >
            {audioActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* User state badge */}
          {team ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('/dashboard')}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-cyan-500/40 hover:border-cyan-400 transition-all text-left"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <div className="text-xs font-heading font-bold text-white truncate max-w-[120px]">
                    {team.name}
                  </div>
                  <div className="text-[10px] font-mono text-cyan-400">
                    {team.score} PTS | {team.id}
                  </div>
                </div>
              </button>
              <button
                onClick={onLogout}
                title="Disconnect Squad"
                className="p-2 rounded-lg bg-red-950/30 border border-red-500/40 hover:border-red-400 text-red-400 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : isAdmin ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('/admin')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-950/50 border border-purple-500/50 text-purple-300 font-mono text-xs font-bold glow-purple"
              >
                <Shield className="w-3.5 h-3.5" />
                COMMAND CENTER
              </button>
              <button
                onClick={onLogout}
                title="Exit Admin"
                className="p-2 rounded-lg bg-red-950/30 border border-red-500/40 text-red-400"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('/login')}
                className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold border border-cyan-500/50 text-cyan-300 hover:bg-cyan-950/50 hover:glow-cyan transition-all"
              >
                TEAM LOGIN
              </button>
              <button
                onClick={() => onNavigate('/register')}
                className="hidden sm:inline-flex px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-md shadow-cyan-500/20"
              >
                REGISTER
              </button>
              <button
                onClick={() => onNavigate('/admin')}
                title="Organizer Portal"
                className="p-2 rounded-lg border border-purple-500/40 hover:border-purple-400 text-purple-400 hover:bg-purple-950/40"
              >
                <Shield className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg border border-slate-700 text-slate-300"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-950/95 border-b border-cyan-900/50 px-4 py-4 space-y-2 backdrop-blur-xl animate-in fade-in">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentPath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  sound.playKeystroke();
                  onNavigate(item.path);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm font-mono ${
                  active
                    ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/50'
                    : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-cyan-400" />
                  {item.label}
                </span>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-900 text-cyan-300">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
          {team && (
            <button
              onClick={() => {
                onNavigate('/dashboard');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded text-sm font-mono bg-cyan-900/20 text-cyan-300 border border-cyan-800"
            >
              <span>DASHBOARD: {team.name}</span>
              <span className="font-bold">{team.score} PTS</span>
            </button>
          )}
          <button
            onClick={() => {
              onNavigate('/admin');
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm font-mono text-purple-300 hover:bg-purple-950/40"
          >
            <Shield className="w-4 h-4" />
            ADMIN / ORGANIZER CONSOLE
          </button>
        </div>
      )}
    </header>
  );
};
