import React from 'react';
import { Trophy, Award, Medal, Zap } from 'lucide-react';
import { PublicLeaderboardEntry } from '../types';

interface PodiumProps {
  entries: PublicLeaderboardEntry[];
}

export const Podium: React.FC<PodiumProps> = ({ entries }) => {
  if (!entries || entries.length === 0) return null;

  const first = entries[0];
  const second = entries.length > 1 ? entries[1] : null;
  const third = entries.length > 2 ? entries[2] : null;

  return (
    <div className="relative py-6 sm:py-8 px-2 max-w-4xl mx-auto">
      {/* Background cyber glow */}
      <div className="absolute inset-0 bg-radial from-cyan-950/20 via-transparent to-transparent pointer-events-none" />

      <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end justify-center pt-8">
        {/* 2nd Place */}
        {second ? (
          <div className="flex flex-col items-center order-1">
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-slate-800 border-2 border-slate-300 flex items-center justify-center mb-2 shadow-lg glow-cyan text-slate-200">
              <Medal className="w-5 h-5 sm:w-7 sm:h-7 text-slate-300" />
            </div>
            <div className="text-center w-full px-1">
              <span className="text-[10px] sm:text-xs font-mono text-slate-400 block truncate">
                {second.department}
              </span>
              <h4 className="font-heading font-bold text-xs sm:text-sm text-slate-200 truncate">
                {second.teamName}
              </h4>
              <div className="text-xs sm:text-base font-mono font-bold text-cyan-400 mt-1">
                {second.score} <span className="text-[10px] text-slate-400">PTS</span>
              </div>
            </div>
            {/* Pedestal */}
            <div className="w-full h-24 sm:h-32 bg-gradient-to-t from-slate-900 via-slate-800/90 to-slate-700/60 border-t-2 border-slate-400/80 rounded-t-lg mt-3 flex items-center justify-center flex-col relative overflow-hidden">
              <div className="absolute inset-0 bg-grid-pattern opacity-20" />
              <span className="text-xl sm:text-3xl font-heading font-black text-slate-400/60">2ND</span>
              <span className="text-[10px] font-mono text-slate-400">{second.timeFormatted}</span>
            </div>
          </div>
        ) : (
          <div className="order-1" />
        )}

        {/* 1st Place */}
        {first && (
          <div className="flex flex-col items-center order-2 -mt-6">
            <div className="relative">
              <div className="absolute -inset-1 bg-amber-400 rounded-full blur-md opacity-70 animate-pulse" />
              <div className="relative w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-amber-950 border-2 border-amber-400 flex items-center justify-center mb-2 shadow-2xl text-amber-300">
                <Trophy className="w-7 h-7 sm:w-10 sm:h-10 text-amber-300" />
              </div>
            </div>
            <div className="text-center w-full px-1">
              <span className="text-[10px] sm:text-xs font-mono text-amber-400 font-semibold block truncate">
                {first.department}
              </span>
              <h4 className="font-heading font-black text-sm sm:text-lg text-white truncate text-glow-cyan">
                {first.teamName}
              </h4>
              <div className="text-sm sm:text-xl font-mono font-extrabold text-amber-300 mt-1 flex items-center justify-center gap-1">
                <Zap className="w-4 h-4 text-amber-400" />
                {first.score} <span className="text-[10px] text-amber-400">PTS</span>
              </div>
            </div>
            {/* Pedestal */}
            <div className="w-full h-32 sm:h-44 bg-gradient-to-t from-amber-950/40 via-cyan-950/40 to-cyan-800/60 border-t-2 border-amber-400 rounded-t-lg mt-3 flex items-center justify-center flex-col relative overflow-hidden shadow-2xl glow-cyan">
              <div className="absolute inset-0 bg-grid-pattern opacity-25" />
              <span className="text-2xl sm:text-5xl font-heading font-black text-amber-400/80">1ST</span>
              <span className="text-[10px] sm:text-xs font-mono text-cyan-300 mt-1 font-bold">
                {first.timeFormatted}
              </span>
            </div>
          </div>
        )}

        {/* 3rd Place */}
        {third ? (
          <div className="flex flex-col items-center order-3">
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-amber-950/40 border-2 border-amber-700 flex items-center justify-center mb-2 shadow-lg text-amber-600">
              <Award className="w-5 h-5 sm:w-7 sm:h-7 text-amber-600" />
            </div>
            <div className="text-center w-full px-1">
              <span className="text-[10px] sm:text-xs font-mono text-slate-400 block truncate">
                {third.department}
              </span>
              <h4 className="font-heading font-bold text-xs sm:text-sm text-slate-200 truncate">
                {third.teamName}
              </h4>
              <div className="text-xs sm:text-base font-mono font-bold text-cyan-400 mt-1">
                {third.score} <span className="text-[10px] text-slate-400">PTS</span>
              </div>
            </div>
            {/* Pedestal */}
            <div className="w-full h-20 sm:h-24 bg-gradient-to-t from-slate-900 via-slate-800/80 to-amber-950/40 border-t-2 border-amber-700/80 rounded-t-lg mt-3 flex items-center justify-center flex-col relative overflow-hidden">
              <div className="absolute inset-0 bg-grid-pattern opacity-20" />
              <span className="text-lg sm:text-2xl font-heading font-black text-amber-700/60">3RD</span>
              <span className="text-[10px] font-mono text-slate-400">{third.timeFormatted}</span>
            </div>
          </div>
        ) : (
          <div className="order-3" />
        )}
      </div>
    </div>
  );
};
