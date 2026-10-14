import React, { useEffect, useState } from 'react';
import {
  Trophy,
  Award,
  Layers,
  Clock,
  Zap,
  CheckCircle2,
  FileCheck,
  Printer,
  ArrowRight,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { api } from '../utils/api';
import { sound } from '../utils/audio';
import { Team } from '../types';

interface ResultsPageProps {
  onNavigate: (path: string) => void;
  team: Team | null;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({ onNavigate, team }) => {
  const [rank, setRank] = useState<number>(1);
  const [totalTeams, setTotalTeams] = useState<number>(5);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const res = await api.getLeaderboard();
        setTotalTeams(res.totalTeams);
        if (team) {
          const idx = res.leaderboard.findIndex((e) => e.teamId === team.id);
          if (idx !== -1) setRank(idx + 1);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, [team]);

  const handlePrint = () => {
    sound.playKeystroke();
    window.print();
  };

  const isVaultCracked = team?.finishTimeVault !== undefined;
  const isEscapeRoomRestored = team?.finishTimeRound2 !== undefined;
  const isTimeExpired = team?.status === 'TIME_EXPIRED';

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 max-w-4xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 font-mono text-xs">
          <FileCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>DEBRIEF & TOURNAMENT RECORD</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-heading font-black text-white">
          {isVaultCracked
            ? 'VAULT CRACKED'
            : isTimeExpired
            ? 'TIME EXPIRED'
            : 'MISSION COMPLETE'}
        </h2>
        <p className="text-xs sm:text-sm font-mono text-slate-400">
          Official competition debrief certified by the Engineering Adjudication Board.
        </p>
      </div>

      {team ? (
        <div className="bg-slate-950/95 border-2 border-cyan-500/50 rounded-3xl p-6 sm:p-10 shadow-2xl glow-cyan space-y-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />

          {/* Certificate Header Stamp */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-950 border border-cyan-400 flex items-center justify-center text-cyan-300">
                <Trophy className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="font-heading font-black text-xl text-white uppercase">
                  {team.name}
                </h3>
                <span className="text-xs font-mono text-cyan-400">
                  SQUAD ID: {team.id} • {team.college}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">FINAL RANKING</span>
              <span className="text-3xl font-heading font-black text-amber-300">
                RANK #{rank} <span className="text-xs text-slate-400 font-mono">/ {totalTeams}</span>
              </span>
            </div>
          </div>

          {/* Core Metric Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 block">TOTAL SCORE</span>
              <div className="text-2xl sm:text-3xl font-heading font-black text-cyan-300 mt-1">
                {team.score}
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                +{team.timeBonus} Bonus / -{team.penalties} Pen
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 block">MISSION DURATION</span>
              <div className="text-2xl sm:text-3xl font-heading font-black text-white mt-1">
                {Math.floor(team.totalTimeSpentSeconds / 60)}m
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Active Problem Solving
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 block">NODES SOLVED</span>
              <div className="text-2xl sm:text-3xl font-heading font-black text-purple-300 mt-1">
                {team.completedChallenges.length}
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Tech Hunt Nodes
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 block">HINTS ACCESSED</span>
              <div className="text-2xl sm:text-3xl font-heading font-black text-amber-400 mt-1">
                {team.hintsUsed}
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                -{team.penalties} Points Penalty
              </span>
            </div>
          </div>

          {/* Subsystem status highlights */}
          <div className="space-y-3 p-5 rounded-2xl bg-slate-900/40 border border-slate-800 font-mono text-xs">
            <div className="text-slate-300 font-bold uppercase tracking-wider text-xs">
              STAGE CLEARANCE BREAKDOWN:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px]">STAGE 01: TECH HUNT</span>
                <div className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>COMPLETED</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px]">STAGE 02: ESCAPE ROOM</span>
                <div className={`font-bold flex items-center gap-1 ${isEscapeRoomRestored ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {isEscapeRoomRestored ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>SYSTEM RESTORED</span>
                    </>
                  ) : (
                    <span>IN PROGRESS / RECORDED</span>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px]">STAGE 03: FINAL VAULT</span>
                <div className={`font-bold flex items-center gap-1 ${isVaultCracked ? 'text-amber-300' : 'text-slate-400'}`}>
                  {isVaultCracked ? (
                    <>
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span>VAULT CRACKED</span>
                    </>
                  ) : (
                    <span>NOT ENGAGED</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Squad Roster Listing */}
          <div className="pt-2 border-t border-slate-900">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-2">
              CERTIFIED SQUAD MEMBERS
            </span>
            <div className="flex flex-wrap gap-2">
              {team.members.map((m, idx) => (
                <div
                  key={idx}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300"
                >
                  <span className="font-bold text-white">{m.name}</span>{' '}
                  <span className="text-slate-500">({m.usn} • {m.department})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Print / Navigation Actions */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              PRINT / DOWNLOAD MISSION CERTIFICATE
            </button>

            <button
              onClick={() => onNavigate('/leaderboard')}
              className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-heading font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>VIEW PUBLIC LEADERBOARD</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3">
          <p className="text-xs font-mono text-slate-400">Please sign in as a team to review squad debrief telemetry.</p>
          <button
            onClick={() => onNavigate('/login')}
            className="px-6 py-2 bg-cyan-500 text-slate-950 font-mono text-xs font-bold rounded"
          >
            SQUAD LOGIN
          </button>
        </div>
      )}
    </div>
  );
};
