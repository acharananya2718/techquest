import React, { useEffect, useState } from 'react';
import {
  Compass,
  KeyRound,
  Layers,
  Shield,
  Zap,
  Users,
  Award,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Lock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { api } from '../utils/api';
import { sound } from '../utils/audio';
import { CyberTimer } from '../components/CyberTimer';
import { AntiCheatMonitor } from '../components/AntiCheatMonitor';
import { EventSettings, Team } from '../types';

interface DashboardPageProps {
  onNavigate: (path: string) => void;
  team: Team | null;
  onRefreshTeam: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  team: initialTeam,
  onRefreshTeam,
}) => {
  const [team, setTeam] = useState<Team | null>(initialTeam);
  const [settings, setSettings] = useState<EventSettings | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(3600);
  const [rank, setRank] = useState<number>(1);
  const [totalTeams, setTotalTeams] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await api.getTeamDashboard();
      setTeam(data.team);
      setSettings(data.settings);
      setTimeRemaining(data.timeRemaining);
      setRank(data.rank);
      setTotalTeams(data.totalTeams);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to sync squad dashboard telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !team) {
    return (
      <div className="min-h-screen flex items-center justify-center font-mono text-cyan-400">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>SYNCHRONIZING SQUAD TELEMETRY...</span>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-950 border border-red-500/60 rounded-xl p-6 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
          <h3 className="font-heading font-bold text-lg text-white">ACCESS INTERRUPTED</h3>
          <p className="text-xs font-mono text-slate-400">{error || 'Team record not found.'}</p>
          <button
            onClick={() => onNavigate('/login')}
            className="px-4 py-2 bg-cyan-500 text-slate-950 text-xs font-mono font-bold rounded"
          >
            RETURN TO LOGIN
          </button>
        </div>
      </div>
    );
  }

  const isRound1Active = team.currentRound === 'ROUND_1';
  const isRound2Active = team.currentRound === 'ROUND_2';
  const isVaultActive = team.currentRound === 'FINAL_VAULT';

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 max-w-7xl mx-auto space-y-6">
      {/* Top Telemetry & AntiCheat Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-900">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase">
            OPERATIONAL COMMAND CENTER
          </span>
          <h2 className="text-2xl sm:text-3xl font-heading font-black text-white flex items-center gap-2">
            <span>{team.name}</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
              {team.id}
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <AntiCheatMonitor teamId={team.id} enabled={false} isCompleted={true} />
          <button
            onClick={() => {
              sound.playKeystroke();
              fetchDashboard();
              onRefreshTeam();
            }}
            title="Refresh Telemetry"
            className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: Status, Timer, and Qualification Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Mission Stats & Squad Roster */}
        <div className="space-y-6 lg:col-span-2">
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/30 glow-cyan">
              <span className="text-[10px] font-mono text-slate-400 block">TOTAL SCORE</span>
              <div className="text-2xl sm:text-3xl font-heading font-black text-cyan-300 mt-1">
                {team.score}
              </div>
              <span className="text-[10px] font-mono text-emerald-400">
                +{team.timeBonus} BONUS / -{team.penalties} PEN
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-purple-500/30 glow-purple">
              <span className="text-[10px] font-mono text-slate-400 block">CURRENT RANK</span>
              <div className="text-2xl sm:text-3xl font-heading font-black text-purple-300 mt-1">
                #{rank}{' '}
                <span className="text-xs text-slate-400 font-mono">/ {totalTeams}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {team.department}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/30 glow-amber">
              <span className="text-[10px] font-mono text-slate-400 block">NODES SOLVED</span>
              <div className="text-2xl sm:text-3xl font-heading font-black text-amber-300 mt-1">
                {team.completedChallenges.length}
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {team.hintsUsed} Hints Used
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30">
              <span className="text-[10px] font-mono text-slate-400 block">ACTIVE STAGE</span>
              <div className="text-lg sm:text-xl font-heading font-black text-white mt-2 truncate">
                {team.currentRound === 'ROUND_1'
                  ? 'TECH HUNT'
                  : team.currentRound === 'ROUND_2'
                  ? 'ESCAPE ROOM'
                  : 'FINAL VAULT'}
              </div>
              <span className="text-[10px] font-mono text-emerald-400 uppercase">
                STATUS: {team.status}
              </span>
            </div>
          </div>

          {/* Qualification Status Module */}
          <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-900">
              <span className="font-heading font-black text-sm text-slate-300 tracking-wider">
                QUALIFICATION STATUS
              </span>
              <span className="text-xs font-mono text-slate-400">
                ROUND 2 ADMITTANCE GATEWAY
              </span>
            </div>

            <div className="py-4 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <p className="text-xs font-mono text-slate-400 leading-relaxed">
                  Adjudication threshold required to access the Escape Room.
                  {team.isQualified
                    ? ' Squad credentials approved by master event controller.'
                    : ' Standing evaluated after Tech Hunt concludes or upon organizer advancement.'}
                </p>
                <div className="mt-3 flex items-center gap-4 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px]">CURRENT SCORE</span>
                    <span className="font-bold text-cyan-300">{team.score} PTS</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">TIME SPENT</span>
                    <span className="font-bold text-white">{Math.floor(team.totalTimeSpentSeconds / 60)}m</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">SQUAD RANK</span>
                    <span className="font-bold text-purple-300">RANK #{rank}</span>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                {team.isQualified ? (
                  <>
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-1 animate-pulse" />
                    <div className="text-xl font-heading font-black text-emerald-400 tracking-widest text-glow-cyan">
                      ACCESS GRANTED
                    </div>
                    <span className="text-[11px] font-mono text-emerald-300 mt-1">
                      QUALIFIED FOR ENGINEERING ESCAPE ROOM
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-10 h-10 text-amber-500 mb-1" />
                    <div className="text-lg font-heading font-black text-amber-400 tracking-wider">
                      IN PROGRESS / PENDING
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 mt-1">
                      Complete Tech Hunt nodes to qualify
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Escape Room Progress (Only renders for qualified teams) */}
          <EscapeRoomProgress team={team} onNavigate={onNavigate} />

          {/* Squad Roster */}
          <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 font-heading font-bold text-sm tracking-wide">
              <Users className="w-4 h-4" />
              <span>SQUAD ROSTER & BRANCH REGISTRY</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {team.members.map((member, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between text-xs font-mono"
                >
                  <div>
                    <div className="font-bold text-white">
                      {member.name}{' '}
                      {idx === 0 && (
                        <span className="text-[9px] px-1 py-0.5 rounded bg-cyan-900 text-cyan-300 ml-1">
                          LEADER
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      USN: {member.usn}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-950 text-[10px] text-purple-300 border border-purple-900">
                    {member.department}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Active Round Launch Card & Server Timer */}
        <div className="space-y-6">
          <CyberTimer
            seconds={timeRemaining}
            label={`${team.currentRound} TIME POWER`}
            onExpire={() => {
              sound.playAccessDenied();
            }}
          />

          {/* Dynamic Mission Launcher Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border border-cyan-500/50 shadow-2xl glow-cyan space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700 text-cyan-300">
                ACTIVE ARENA
              </span>
              <Zap className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>

            {isRound1Active && (
              <>
                <h3 className="font-heading font-black text-xl text-white">
                  ROUND 1: TECH HUNT
                </h3>
                <p className="text-xs font-mono text-slate-300 leading-relaxed">
                  Engage in the multi-branch technical nodes. Solve digital logic, circuit diagrams, and debugging challenges to reveal cryptographic sector clues.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      sound.playKeystroke();
                      onNavigate('/tech-hunt');
                    }}
                    className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg glow-cyan transition-all cursor-pointer"
                  >
                    <span>ENTER TECH HUNT ARENA</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}

            {(isRound2Active || isVaultActive) && (
              <>
                <h3 className="font-heading font-black text-xl text-white">
                  ROUND 2: ESCAPE ROOM
                </h3>
                <p className="text-xs font-mono text-slate-300 leading-relaxed">
                  SYSTEM FAILURE detected at smart manufacturing facility. Solve 4 sequential rooms (The Discovery, The Decoder, The System, and Room 4: The Final Vault) to restore central plant control.
                </p>
                <div className="pt-2">
                  {team.isQualified ? (
                    <button
                      onClick={() => {
                        sound.playKeystroke();
                        onNavigate('/escape-room');
                      }}
                      className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                    >
                      <span>ENTER ESCAPE ROOM ARENA</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-600 text-amber-300 text-xs font-mono text-center">
                      QUALIFICATION REQUIRED: Complete Round 1 to satisfy qualification threshold.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Quick Shortcuts */}
          <div className="space-y-2">
            <button
              onClick={() => onNavigate('/leaderboard')}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all"
            >
              <Award className="w-4 h-4 text-amber-400" />
              VIEW LIVE TOURNAMENT LEADERBOARD
            </button>

            <button
              onClick={() => onNavigate('/results')}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all"
            >
              <Layers className="w-4 h-4 text-cyan-400" />
              MISSION BRIEFING & RESULTS SUMMARY
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export interface EscapeRoomProgressProps {
  team: Team;
  onNavigate: (path: string) => void;
}

export const EscapeRoomProgress: React.FC<EscapeRoomProgressProps> = ({ team, onNavigate }) => {
  // Only render if the team's 'qualified' flag is true (checks both qualified and isQualified)
  const isTeamQualified = Boolean(team.qualified ?? team.isQualified);
  if (!isTeamQualified) {
    return null;
  }

  const currentRoom = team.round2CurrentRoom || 1;
  const completedRooms = team.round2CompletedRooms || [];
  const isAllCompleted =
    completedRooms.length >= 4 || team.round2Status === 'COMPLETED' || currentRoom > 4;
  const progressPercent = Math.min(100, Math.round((completedRooms.length / 4) * 100));

  const roomDefinitions = [
    {
      id: 1,
      code: 'ROOM-01',
      name: 'The Discovery',
      subtitle: 'Perimeter Sensor Junction',
      desc: 'Tripped sensor bus diagnosis and logic gate fault isolation.',
    },
    {
      id: 2,
      code: 'ROOM-02',
      name: 'The Decoder',
      subtitle: 'Telemetry Decryption Matrix',
      desc: 'Corrupted CAN bus telemetry packet parsing and cryptographic decode.',
    },
    {
      id: 3,
      code: 'ROOM-03',
      name: 'The System',
      subtitle: 'SCADA PLC Interlock Relay',
      desc: 'Safety lockout relay ladder logic and emergency feedback bypass.',
    },
    {
      id: 4,
      code: 'ROOM-04',
      name: 'The Final Vault',
      subtitle: 'Master SCADA Core Unlock',
      desc: 'Central control room physical vault and 3-phase rotor synchronization.',
    },
  ];

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-black border-2 border-amber-500/40 shadow-xl space-y-5 relative overflow-hidden">
      {/* Background technical accent glow */}
      <div className="absolute -right-20 -top-20 w-52 h-52 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-500/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase font-bold px-2 py-0.5 rounded bg-amber-950/80 border border-amber-600/40">
              ROUND 2 ESCAPE ROOM
            </span>
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> QUALIFIED SQUAD
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-heading font-black text-white mt-1 flex items-center gap-2">
            <span>ESCAPE ROOM PROGRESSION</span>
            {isAllCompleted && (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500 text-emerald-300">
                100% RESTORED
              </span>
            )}
          </h3>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300">
            <span className="text-[10px] text-slate-400 block">R2 SCORE</span>
            <span className="font-bold text-sm text-amber-400">{team.round2Score || 0} PTS</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            <span className="text-[10px] text-slate-400 block">HINTS USED</span>
            <span className="font-bold text-sm text-purple-300">{team.round2HintsUsed || 0}</span>
          </div>
          <button
            onClick={() => {
              sound.playKeystroke();
              onNavigate('/escape-room');
            }}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold uppercase tracking-wider text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <span>{isAllCompleted ? 'VIEW VAULT' : 'ENTER ROOM'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress Bar & Summary */}
      <div className="space-y-1.5 font-mono">
        <div className="flex justify-between text-xs text-slate-300">
          <span className="text-slate-400">FACILITY RESTORATION PROGRESS:</span>
          <span className="font-bold text-amber-400">
            {completedRooms.length} OF 4 ROOMS SECURED ({progressPercent}%)
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
          <div
            className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 4 Room Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
        {roomDefinitions.map((room) => {
          const isSolved = completedRooms.includes(room.id);
          const isCurrent =
            !isSolved && (currentRoom === room.id || (currentRoom > 4 && room.id === 4));

          return (
            <div
              key={room.id}
              className={`p-3.5 rounded-xl border transition-all text-xs flex flex-col justify-between ${
                isSolved
                  ? 'bg-emerald-950/20 border-emerald-500/50 text-white'
                  : isCurrent
                  ? 'bg-amber-950/30 border-amber-400 text-white shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
                  : 'bg-slate-950/60 border-slate-800/80 text-slate-500'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      isSolved
                        ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                        : isCurrent
                        ? 'bg-amber-900/60 text-amber-300 border border-amber-600'
                        : 'bg-slate-900 text-slate-500 border border-slate-800'
                    }`}
                  >
                    {room.code}
                  </span>
                  {isSolved ? (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> SECURED
                    </span>
                  ) : isCurrent ? (
                    <span className="flex items-center gap-1 text-[10px] text-amber-400 font-bold animate-pulse">
                      <Zap className="w-3.5 h-3.5" /> ACTIVE
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                      <Lock className="w-3.5 h-3.5" /> LOCKED
                    </span>
                  )}
                </div>

                <div className="font-heading font-black text-sm text-white">{room.name}</div>
                <div className="text-[11px] text-amber-300/80 font-medium mt-0.5">
                  {room.subtitle}
                </div>
                <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {room.desc}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">ROOM {room.id}</span>
                {isSolved ? (
                  <span className="text-emerald-400 font-bold">KEY VERIFIED</span>
                ) : isCurrent ? (
                  <span className="text-amber-400 font-bold">IN PROGRESS</span>
                ) : (
                  <span className="text-slate-600">STANDBY</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
