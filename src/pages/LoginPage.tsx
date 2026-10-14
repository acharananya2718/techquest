import React, { useState } from 'react';
import {
  Lock,
  Shield,
  KeyRound,
  ArrowRight,
  AlertCircle,
  Zap,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import { api, setToken } from '../utils/api';
import { sound } from '../utils/audio';
import { Team } from '../types';

interface LoginPageProps {
  onLoginSuccess: (role: 'TEAM' | 'ADMIN', team?: Team) => void;
  onNavigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'TEAM' | 'ADMIN' | 'DEMO'>('TEAM');

  // Team Form
  const [teamId, setTeamId] = useState('');
  const [loginCode, setLoginCode] = useState('');

  // Admin Form
  const [adminPassword, setAdminPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const demoAccounts = [
    {
      id: 'TQ-CYBER-101',
      name: 'CYBERDYNE SYSTEMS',
      dept: 'Computer Science & Eng',
      code: 'CYBER2026',
      round: 'Round 2 Qualified',
      color: 'border-cyan-500/40 text-cyan-300',
    },
    {
      id: 'TQ-QUANTUM-202',
      name: 'QUANTUM PULSE',
      dept: 'Electronics & Comm Eng',
      code: 'PULSE2026',
      round: 'Round 2 Qualified',
      color: 'border-purple-500/40 text-purple-300',
    },
    {
      id: 'TQ-MECH-303',
      name: 'MECH HORIZON',
      dept: 'Mechanical Engineering',
      code: 'MECH2026',
      round: 'Round 1 Active',
      color: 'border-amber-500/40 text-amber-300',
    },
    {
      id: 'TQ-VOLT-404',
      name: 'VOLT DYNAMICS',
      dept: 'Electrical & Electronics',
      code: 'VOLT2026',
      round: 'Round 1 Active',
      color: 'border-emerald-500/40 text-emerald-300',
    },
    {
      id: 'TQ-ROBOTIC-505',
      name: 'ROBOTIC SYNAPSE',
      dept: 'Mechatronics & Robotics',
      code: 'SYNAPSE2026',
      round: 'Round 2 Qualified',
      color: 'border-sky-500/40 text-sky-300',
    },
  ];

  const handleTeamLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!teamId.trim() || !loginCode.trim()) {
      setError('Please provide Team ID and Access Code.');
      sound.playAccessDenied();
      return;
    }

    try {
      setLoading(true);
      const res = await api.teamLogin(teamId, loginCode);
      setToken(res.token);
      sound.playAccessGranted();
      onLoginSuccess('TEAM', res.team);
      onNavigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication rejected.');
      sound.playAccessDenied();
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!adminPassword.trim()) {
      setError('Administrator password required.');
      sound.playAccessDenied();
      return;
    }

    try {
      setLoading(true);
      const res = await api.adminLogin(adminPassword);
      setToken(res.token);
      sound.playAccessGranted();
      onLoginSuccess('ADMIN');
      onNavigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Admin authentication failed.');
      sound.playAccessDenied();
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (id: string, code: string) => {
    setError(null);
    try {
      setLoading(true);
      sound.playKeystroke();
      const res = await api.teamLogin(id, code);
      setToken(res.token);
      sound.playAccessGranted();
      onLoginSuccess('TEAM', res.team);
      onNavigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
      sound.playAccessDenied();
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdmin = async () => {
    setError(null);
    try {
      setLoading(true);
      sound.playKeystroke();
      const res = await api.adminLogin('admin2026');
      setToken(res.token);
      sound.playAccessGranted();
      onLoginSuccess('ADMIN');
      onNavigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Admin login failed');
      sound.playAccessDenied();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 flex items-center justify-center">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-500/50 mx-auto flex items-center justify-center text-cyan-400 glow-cyan">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="font-heading font-black text-2xl sm:text-3xl text-white">
            SECURITY CLEARANCE
          </h2>
          <p className="font-mono text-xs text-slate-400">
            AUTHENTICATE INTO COMPETITION ENVIRONMENT
          </p>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-3 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold">
          <button
            onClick={() => {
              sound.playKeystroke();
              setActiveTab('TEAM');
              setError(null);
            }}
            className={`py-2 rounded-lg transition-all ${
              activeTab === 'TEAM'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 glow-cyan'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            SQUAD LOGIN
          </button>
          <button
            onClick={() => {
              sound.playKeystroke();
              setActiveTab('ADMIN');
              setError(null);
            }}
            className={`py-2 rounded-lg transition-all ${
              activeTab === 'ADMIN'
                ? 'bg-purple-950 text-purple-300 border border-purple-500/40 glow-purple'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ORGANIZER
          </button>
          <button
            onClick={() => {
              sound.playKeystroke();
              setActiveTab('DEMO');
              setError(null);
            }}
            className={`py-2 rounded-lg transition-all ${
              activeTab === 'DEMO'
                ? 'bg-amber-950 text-amber-300 border border-amber-500/40 glow-amber'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            1-CLICK DEMO
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/60 flex items-center gap-2.5 text-red-300 text-xs font-mono animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab 1: Team Login */}
        {activeTab === 'TEAM' && (
          <form
            onSubmit={handleTeamLogin}
            className="bg-slate-950/90 border border-cyan-950/80 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl glow-cyan"
          >
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                TEAM ID
              </label>
              <input
                type="text"
                required
                placeholder="e.g. TQ-CYBER-101"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-lg px-3.5 py-2.5 text-sm text-white font-mono uppercase focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                ACCESS CODE / PASSWORD
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={loginCode}
                onChange={(e) => setLoginCode(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-lg px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg glow-cyan transition-all mt-2 cursor-pointer"
            >
              {loading ? (
                <span>DECRYPTING KEYS...</span>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>INITIALIZE MISSION ACCESS</span>
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => onNavigate('/register')}
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300"
              >
                Need to register your team first? Click here →
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Admin Login */}
        {activeTab === 'ADMIN' && (
          <form
            onSubmit={handleAdminLogin}
            className="bg-slate-950/90 border border-purple-950/80 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl glow-purple"
          >
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                ORGANIZER MASTER KEY
              </label>
              <input
                type="password"
                required
                placeholder="Admin password (default: admin2026)"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-purple-400 rounded-lg px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none transition-colors"
              />
              <p className="text-[11px] font-mono text-slate-500 mt-1">
                Demo default pass: <code className="text-purple-300 font-bold">admin2026</code>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg glow-purple transition-all mt-2 cursor-pointer"
            >
              {loading ? (
                <span>AUTHENTICATING COMMAND...</span>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>ENTER COMMAND CENTER</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Tab 3: 1-Click Demo Testing */}
        {activeTab === 'DEMO' && (
          <div className="bg-slate-950/90 border border-amber-950/80 rounded-2xl p-5 space-y-4 shadow-xl glow-amber">
            <div className="flex items-center justify-between pb-2 border-b border-slate-900">
              <span className="font-heading font-bold text-xs text-amber-300">
                1-CLICK DEMO SQUADS (INSTANT TEST)
              </span>
              <button
                onClick={handleQuickAdmin}
                className="text-[11px] font-mono font-bold text-purple-300 hover:underline flex items-center gap-1"
              >
                <Shield className="w-3 h-3 text-purple-400" /> ADMIN LOGIN
              </button>
            </div>

            <div className="space-y-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.id}
                  disabled={loading}
                  onClick={() => handleQuickLogin(acc.id, acc.code)}
                  className={`w-full p-2.5 rounded-xl bg-slate-900/60 border ${acc.color} hover:bg-slate-800 flex items-center justify-between text-left transition-all group`}
                >
                  <div>
                    <div className="font-heading font-bold text-xs text-white group-hover:text-cyan-300">
                      {acc.name}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      {acc.dept} • {acc.id}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-cyan-300">
                      {acc.round}
                    </span>
                    <span className="block text-[9px] text-slate-500 font-mono mt-0.5">
                      PASS: {acc.code}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
