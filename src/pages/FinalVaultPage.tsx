import React, { useEffect, useState } from 'react';
import {
  Layers,
  ShieldAlert,
  Lock,
  Unlock,
  CheckCircle2,
  Trophy,
  AlertTriangle,
  Terminal,
  Zap,
  ArrowRight,
  Flame,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../utils/api';
import { sound } from '../utils/audio';
import { CyberTimer } from '../components/CyberTimer';
import { AntiCheatMonitor } from '../components/AntiCheatMonitor';
import { Team } from '../types';

interface FinalVaultPageProps {
  onNavigate: (path: string) => void;
  team: Team | null;
  onRefreshTeam: () => void;
}

export const FinalVaultPage: React.FC<FinalVaultPageProps> = ({
  onNavigate,
  team,
  onRefreshTeam,
}) => {
  const [challengeData, setChallengeData] = useState<{
    title: string;
    question: string;
    systemContext: string;
    points: number;
    diagramAscii?: string;
    codeSnippet?: string;
    hint?: string;
  } | null>(null);

  const [isQualified, setIsQualified] = useState<boolean>(true);
  const [isCracked, setIsCracked] = useState<boolean>(false);
  const [vaultTimeLeft, setVaultTimeLeft] = useState<number>(900);
  const [answer, setAnswer] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{
    status: 'IDLE' | 'CRACKED' | 'DENIED';
    message: string;
  }>({ status: 'IDLE', message: '' });

  const [lastSubmittedTime, setLastSubmittedTime] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVault = async () => {
    try {
      setLoading(true);
      const data = await api.getVaultChallenge();
      setIsQualified(data.isQualified);
      setChallengeData(data.challenge || null);
      setIsCracked(data.isCracked);
      setVaultTimeLeft(data.vaultTimeLeft);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Vault connection restricted.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!team) {
      onNavigate('/login');
      return;
    }
    fetchVault();
  }, [team]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;

    try {
      setSubmitting(true);
      setFeedback({ status: 'IDLE', message: '' });

      const res = await api.submitVaultAnswer(answer);

      if (res.isCorrect) {
        sound.playVaultUnlock();
        try {
          confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.5 },
          });
        } catch {
          // ignore
        }
        setIsCracked(true);
        setFeedback({
          status: 'CRACKED',
          message: res.message,
        });
        await fetchVault();
        onRefreshTeam();
      } else {
        sound.playAccessDenied();
        setFeedback({
          status: 'DENIED',
          message: res.message,
        });
      }
    } catch (err: any) {
      sound.playAccessDenied();
      setFeedback({
        status: 'DENIED',
        message: err.message || 'Security calculation rejected.',
      });
    } finally {
      setSubmitting(false);
      setLastSubmittedTime(Date.now());
    }
  };

  if (!team) return null;

  const isVaultSolved = isCracked || team.status === 'COMPLETED';

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 max-w-5xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-900">
        <div>
          <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-amber-950/70 border border-amber-500/50 text-amber-300 font-bold uppercase tracking-widest">
            CHAMPIONSHIP STAGE: FINAL VAULT
          </span>
          <h2 className="text-2xl sm:text-4xl font-heading font-black text-white mt-1">
            THE FINAL VAULT
          </h2>
          <p className="text-xs font-mono text-slate-300 mt-1">
            "One final challenge stands between your team and victory."
          </p>
        </div>

        <div className="flex items-center gap-3">
          <AntiCheatMonitor
            teamId={team.id}
            enabled={isQualified && !isVaultSolved}
            isCompleted={isVaultSolved}
            isSubmitting={submitting}
            lastSubmittedTime={lastSubmittedTime}
          />
          <button
            onClick={() => onNavigate('/dashboard')}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300"
          >
            ← DASHBOARD
          </button>
        </div>
      </div>

      {/* Disqualification or Non-Qualification Gate */}
      {!isQualified && (
        <div className="p-8 rounded-2xl bg-slate-950 border-2 border-red-500/70 text-center space-y-4 glow-red">
          <Lock className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="text-xl sm:text-2xl font-heading font-black text-red-400">
            ACCESS RESTRICTED: QUALIFICATION REQUIRED
          </h3>
          <p className="text-xs font-mono text-slate-300 max-w-md mx-auto">
            The Final Vault is strictly reserved for squads advancing through the Round 1 & Round 2 qualification matrices.
          </p>
          <button
            onClick={() => onNavigate('/leaderboard')}
            className="px-6 py-2.5 bg-slate-900 border border-slate-700 rounded-xl font-mono text-xs font-bold text-cyan-300"
          >
            CHECK LEADERBOARD STANDINGS
          </button>
        </div>
      )}

      {isQualified && (
        <div className="space-y-6">
          {/* Timer HUD */}
          <CyberTimer
            seconds={vaultTimeLeft}
            label="FINAL VAULT SECURITY LOCKDOWN TIMER"
            className="glow-amber border-amber-500/50"
          />

          {/* Victory state if Cracked */}
          {isCracked ? (
            <div className="p-8 sm:p-12 rounded-3xl bg-amber-950/40 border-2 border-amber-400 text-center space-y-6 shadow-2xl glow-amber animate-in zoom-in-95">
              <div className="relative inline-block">
                <div className="absolute -inset-4 bg-amber-400 rounded-full blur-xl opacity-60 animate-pulse" />
                <Trophy className="w-20 h-20 text-amber-300 relative mx-auto" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-mono tracking-widest text-amber-300 uppercase font-bold">
                  TOURNAMENT CLEARANCE ACHIEVED
                </span>
                <h3 className="text-3xl sm:text-6xl font-heading font-black text-white text-glow-cyan">
                  VAULT CRACKED!
                </h3>
                <p className="text-sm font-mono text-slate-200 max-w-lg mx-auto">
                  Team <span className="text-cyan-300 font-bold">{team.name}</span> has bypassed all core cryptographic locks and achieved highest competitive engineering honors!
                </p>
              </div>

              <div className="pt-4 flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => onNavigate('/results')}
                  className="px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-heading font-black text-xs uppercase tracking-wider shadow-lg glow-amber"
                >
                  VIEW SQUAD CERTIFICATE & RANK
                </button>
                <button
                  onClick={() => onNavigate('/leaderboard')}
                  className="px-8 py-3.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-mono text-xs font-bold"
                >
                  SEE TOURNAMENT PODIUM
                </button>
              </div>
            </div>
          ) : (
            challengeData && (
              <div className="bg-slate-950/95 border-2 border-amber-500/60 rounded-3xl p-6 sm:p-10 shadow-2xl glow-amber space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="space-y-1">
                    <span className="text-xs font-mono text-amber-400 font-bold">
                      NODE FINAL • MULTIDISCIPLINARY CORE
                    </span>
                    <h3 className="text-xl sm:text-2xl font-heading font-black text-white">
                      {challengeData.title}
                    </h3>
                  </div>
                  <span className="px-3 py-1.5 rounded-xl bg-amber-950 border border-amber-600 text-amber-300 font-mono text-xs font-bold">
                    +{challengeData.points} PTS BOUNTY
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-sm font-sans text-slate-200 leading-relaxed">
                  {challengeData.question}
                </div>

                {challengeData.diagramAscii && (
                  <div className="p-4 rounded-xl bg-[#03060c] border border-amber-950 font-mono text-xs text-amber-300 overflow-x-auto">
                    <pre className="whitespace-pre">{challengeData.diagramAscii}</pre>
                  </div>
                )}

                {/* Submission Input */}
                <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-slate-900">
                  <div className="space-y-1">
                    <label className="block text-xs font-mono text-slate-300">
                      MASTER DECRYPTION KEY *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Type final key value (e.g. 378)..."
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        className="flex-1 bg-slate-900 border-2 border-slate-700 focus:border-amber-400 rounded-xl px-4 py-3.5 text-sm text-white font-mono font-bold tracking-wider focus:outline-none transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-heading font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg glow-amber transition-all cursor-pointer"
                      >
                        {submitting ? (
                          <span>CRACKING...</span>
                        ) : (
                          <>
                            <Zap className="w-4 h-4" />
                            <span>BREACH VAULT</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {feedback.status === 'DENIED' && (
                    <div className="p-4 rounded-xl bg-red-950/70 border-2 border-red-500 text-red-200 font-mono text-xs text-center space-y-1 animate-in fade-in">
                      <div className="font-heading font-black text-sm text-red-400">
                        ACCESS DENIED
                      </div>
                      <p>{feedback.message}</p>
                    </div>
                  )}
                </form>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};
