import React, { useEffect, useState } from 'react';
import {
  Compass,
  CheckCircle2,
  Lock,
  Unlock,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  Code2,
  Terminal,
  RefreshCw,
  Key,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Eye,
  BookOpen,
} from 'lucide-react';
import { api } from '../utils/api';
import { sound } from '../utils/audio';
import { AntiCheatMonitor } from '../components/AntiCheatMonitor';
import { Challenge, Team } from '../types';

interface TechHuntPageProps {
  onNavigate: (path: string) => void;
  team: Team | null;
  onRefreshTeam: () => void;
}

export const TechHuntPage: React.FC<TechHuntPageProps> = ({
  onNavigate,
  team,
  onRefreshTeam,
}) => {
  const [challenges, setChallenges] = useState<
    (Challenge & {
      isCompleted: boolean;
      isUnlocked: boolean;
      hintsAvailable?: number;
      hintsUnlocked?: number;
      revealedHints?: string[];
    })[]
  >([]);
  const [activeChallengeId, setActiveChallengeId] = useState<string>('CH-01');
  const [isPasswordStageActive, setIsPasswordStageActive] = useState<boolean>(false);

  // Question submission state
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<{
    status: 'IDLE' | 'GRANTED' | 'DENIED';
    message: string;
    pointsAwarded?: number;
  }>({ status: 'IDLE', message: '' });

  // Password submission state
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [passwordSubmitting, setPasswordSubmitting] = useState<boolean>(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{
    status: 'IDLE' | 'GRANTED' | 'DENIED';
    message: string;
    pointsAwarded?: number;
  }>({ status: 'IDLE', message: '' });

  // Password Challenge data
  const [passwordChallengeData, setPasswordChallengeData] = useState<{
    isUnlocked: boolean;
    passwordStatus: 'LOCKED' | 'IN_PROGRESS' | 'COMPLETED';
    clues: { index: number; title: string; clue: string; questionId?: string }[];
    cluesStatus?: { index: number; title: string; clue: string | null; questionId: string; isUnlocked: boolean }[];
    passwordHintsAvailable: number;
    passwordHintsUnlocked: number;
    revealedPasswordHints: string[];
    isCompleted: boolean;
  }>({
    isUnlocked: false,
    passwordStatus: 'LOCKED',
    clues: [],
    cluesStatus: [],
    passwordHintsAvailable: 3,
    passwordHintsUnlocked: 0,
    revealedPasswordHints: [],
    isCompleted: false,
  });

  // Revisit Clue Modal (free, no penalty)
  const [selectedClueModal, setSelectedClueModal] = useState<{
    index: number;
    title: string;
    clue: string;
  } | null>(null);

  // Newly Unlocked Clue Celebration Modal
  const [newlyUnlockedClueModal, setNewlyUnlockedClueModal] = useState<{
    index: number;
    title: string;
    clue: string;
  } | null>(null);

  // Question Hint Modal
  const [hintModal, setHintModal] = useState<{
    open: boolean;
    challengeId: string;
    challengeTitle: string;
    hintText?: string;
    revealedHints?: string[];
    hintNumber?: number;
    totalHints?: number;
    penaltyPoints?: number;
  }>({ open: false, challengeId: '', challengeTitle: '' });

  // Explicit Hint Request Confirmation Modal
  const [hintConfirmModal, setHintConfirmModal] = useState<{
    open: boolean;
    type: 'QUESTION' | 'PASSWORD';
    challengeId?: string;
    challengeTitle?: string;
    hintNumber?: number;
    totalHints?: number;
    penaltyPoints?: number;
  }>({ open: false, type: 'QUESTION' });
  const [hintRequesting, setHintRequesting] = useState<boolean>(false);

  const [lastSubmittedTime, setLastSubmittedTime] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [challengesRes, passRes] = await Promise.all([
        api.getRound1Challenges(),
        api.getPasswordChallenge(),
      ]);

      setChallenges(challengesRes.challenges);
      setPasswordChallengeData(passRes);

      // Auto-select initial question if not already set
      if (!isPasswordStageActive) {
        const nextUnsolved = challengesRes.challenges.find((c) => c.isUnlocked && !c.isCompleted);
        if (nextUnsolved) {
          setActiveChallengeId(nextUnsolved.id);
        } else if (challengesRes.challenges.length > 0 && challengesRes.teamProgress.allCompleted) {
          setIsPasswordStageActive(true);
        }
      }

      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to initialize Round 1 questions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!team) {
      onNavigate('/login');
      return;
    }
    fetchData();
  }, [team]);

  const activeChallenge = challenges.find((c) => c.id === activeChallengeId);
  const allQuestionsCompleted =
    challenges.length > 0 && challenges.every((c) => c.isCompleted);

  // Submit Answer for Q1 - Q5
  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChallenge || !userAnswer.trim()) return;

    try {
      setSubmitting(true);
      setSubmissionFeedback({ status: 'IDLE', message: '' });

      const res = await api.submitRound1Answer(activeChallenge.id, userAnswer);

      if (res.isCorrect) {
        sound.playAccessGranted();
        setSubmissionFeedback({
          status: 'GRANTED',
          message: res.message,
          pointsAwarded: res.pointsAwarded,
        });
        setUserAnswer('');
        await fetchData();
        onRefreshTeam();

        // Reveal the corresponding password clue immediately after correct answer
        if (res.unlockedClue) {
          setNewlyUnlockedClueModal({
            index: res.unlockedClue.index,
            title: res.unlockedClue.title,
            clue: res.unlockedClue.clue,
          });
        }
      } else {
        sound.playAccessDenied();
        setSubmissionFeedback({
          status: 'DENIED',
          message: res.message || 'Incorrect answer. Please re-check your calculations.',
        });
      }
    } catch (err: any) {
      sound.playAccessDenied();
      setSubmissionFeedback({
        status: 'DENIED',
        message: err.message || 'Submission verification failed.',
      });
    } finally {
      setSubmitting(false);
      setLastSubmittedTime(Date.now());
    }
  };

  // Submit Final Password
  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) return;

    try {
      setPasswordSubmitting(true);
      setPasswordFeedback({ status: 'IDLE', message: '' });

      const res = await api.submitRound1Password(passwordInput);

      if (res.isCorrect) {
        sound.playAccessGranted();
        setPasswordFeedback({
          status: 'GRANTED',
          message: res.message,
          pointsAwarded: res.pointsAwarded,
        });
        setPasswordInput('');
        await fetchData();
        onRefreshTeam();
      } else {
        sound.playAccessDenied();
        setPasswordFeedback({
          status: 'DENIED',
          message: res.message || 'Invalid password. Review the clues carefully.',
        });
      }
    } catch (err: any) {
      sound.playAccessDenied();
      setPasswordFeedback({
        status: 'DENIED',
        message: err.message || 'Password verification failed.',
      });
    } finally {
      setPasswordSubmitting(false);
      setLastSubmittedTime(Date.now());
    }
  };

  // Step 1: Open Confirmation Modal when user asks for a hint
  const handlePromptQuestionHint = () => {
    if (!activeChallenge) return;
    const currentHints = activeChallenge.hintsUnlocked || 0;
    const totalAvail = activeChallenge.hintsAvailable || 3;
    if (currentHints >= totalAvail) {
      setError('All available hints for this question have already been revealed.');
      return;
    }
    sound.playKeystroke();
    setHintConfirmModal({
      open: true,
      type: 'QUESTION',
      challengeId: activeChallenge.id,
      challengeTitle: activeChallenge.title,
      hintNumber: currentHints + 1,
      totalHints: totalAvail,
      penaltyPoints: activeChallenge.hintPenaltyPoints || 10,
    });
  };

  const handlePromptPasswordHint = () => {
    const currentHints = passwordChallengeData.passwordHintsUnlocked || 0;
    const totalAvail = passwordChallengeData.passwordHintsAvailable || 3;
    if (currentHints >= totalAvail) {
      setError('All available password hints have already been revealed.');
      return;
    }
    sound.playKeystroke();
    setHintConfirmModal({
      open: true,
      type: 'PASSWORD',
      challengeTitle: 'Final Password Decryption Clues',
      hintNumber: currentHints + 1,
      totalHints: totalAvail,
      penaltyPoints: 10,
    });
  };

  // Step 2: User explicitly confirms hint request
  const handleConfirmRequestHint = async () => {
    setHintRequesting(true);
    try {
      sound.playKeystroke();
      if (hintConfirmModal.type === 'QUESTION' && hintConfirmModal.challengeId) {
        const res = await api.requestRound1Hint(hintConfirmModal.challengeId, hintConfirmModal.hintNumber);
        setHintConfirmModal({ open: false, type: 'QUESTION' });
        setHintModal({
          open: true,
          challengeId: hintConfirmModal.challengeId,
          challengeTitle: hintConfirmModal.challengeTitle || '',
          hintText: res.hint,
          revealedHints: res.revealedHints,
          hintNumber: res.hintNumber,
          totalHints: res.totalHints,
          penaltyPoints: res.penaltyPoints,
        });
        await fetchData();
        onRefreshTeam();
      } else if (hintConfirmModal.type === 'PASSWORD') {
        const res = await api.requestPasswordHint(hintConfirmModal.hintNumber);
        setHintConfirmModal({ open: false, type: 'PASSWORD' });
        setHintModal({
          open: true,
          challengeId: 'PASSWORD_CHALLENGE',
          challengeTitle: 'Final Password Decryption Clues',
          hintText: res.hint,
          revealedHints: res.revealedHints,
          hintNumber: res.revealedHints.length,
          totalHints: passwordChallengeData.passwordHintsAvailable,
          penaltyPoints: res.penaltyPoints,
        });
        await fetchData();
        onRefreshTeam();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to request hint.');
      setHintConfirmModal({ open: false, type: 'QUESTION' });
    } finally {
      setHintRequesting(false);
    }
  };

  if (!team) return null;

  return (
    <div className="min-h-screen py-6 px-4 sm:px-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-900">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold uppercase tracking-wider">
              ROUND 1: TECH HUNT
            </span>
            <span className="text-xs font-mono text-slate-400">
              SQUAD: {team.name} ({team.id})
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-heading font-black text-white mt-1">
            TECHNICAL RECONNAISSANCE & DECRYPTION
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <AntiCheatMonitor
            teamId={team.id}
            enabled={
              !(
                (allQuestionsCompleted && passwordChallengeData.isCompleted) ||
                (isPasswordStageActive
                  ? passwordChallengeData.isCompleted
                  : Boolean(activeChallenge?.isCompleted))
              )
            }
            isCompleted={
              (allQuestionsCompleted && passwordChallengeData.isCompleted) ||
              (isPasswordStageActive
                ? passwordChallengeData.isCompleted
                : Boolean(activeChallenge?.isCompleted))
            }
            isSubmitting={submitting || passwordSubmitting}
            lastSubmittedTime={lastSubmittedTime}
          />
          <button
            onClick={() => onNavigate('/dashboard')}
            className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-xs font-mono text-slate-300 transition-colors"
          >
            ← DASHBOARD
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/60 flex items-center gap-2 text-red-300 text-xs font-mono">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Layout: Question List (Left) + Active Workspace (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Round 1 Questions Navigator (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-900">
              <span className="text-xs font-heading font-bold text-slate-300 tracking-wider">
                ROUND 1 QUESTIONS
              </span>
              <span className="text-[10px] font-mono text-cyan-400 font-bold">
                {challenges.filter((c) => c.isCompleted).length} / {challenges.length} SOLVED
              </span>
            </div>

            <div className="space-y-2">
              {/* Five Questions */}
              {challenges.map((c, idx) => {
                const isActive = !isPasswordStageActive && c.id === activeChallengeId;
                return (
                  <button
                    key={c.id}
                    disabled={!c.isUnlocked}
                    onClick={() => {
                      sound.playKeystroke();
                      setIsPasswordStageActive(false);
                      setActiveChallengeId(c.id);
                      setSubmissionFeedback({ status: 'IDLE', message: '' });
                      setUserAnswer('');
                    }}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                      c.isCompleted
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/50'
                        : isActive
                        ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 glow-cyan'
                        : c.isUnlocked
                        ? 'bg-slate-900/60 border-slate-700/80 text-slate-300 hover:border-slate-500'
                        : 'bg-slate-950/50 border-slate-900 text-slate-600 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 text-[10px] font-mono">
                        <span className="font-bold">{c.nodeCode || `Q${idx + 1}`}</span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-950/80 text-slate-400 text-[9px]">
                          {c.category}
                        </span>
                      </div>
                      <div className="text-xs font-heading font-bold truncate max-w-[190px]">
                        {c.title}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-amber-300">
                        {c.points}p
                      </span>
                      {c.isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      ) : c.isUnlocked ? (
                        <Unlock className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}

              {/* Part 2: Final Password Challenge Navigator Node */}
              <div className="pt-2 border-t border-slate-900">
                <button
                  disabled={!allQuestionsCompleted && !passwordChallengeData.isCompleted}
                  onClick={() => {
                    sound.playKeystroke();
                    setIsPasswordStageActive(true);
                    setPasswordFeedback({ status: 'IDLE', message: '' });
                  }}
                  className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                    passwordChallengeData.isCompleted
                      ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
                      : isPasswordStageActive
                      ? 'bg-purple-950/80 border-purple-400 text-purple-200 glow-purple'
                      : allQuestionsCompleted
                      ? 'bg-amber-950/30 border-amber-500/40 text-amber-300 hover:border-amber-400'
                      : 'bg-slate-950/40 border-slate-900 text-slate-600 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold">
                      <Key className="w-3 h-3 text-amber-400" />
                      <span className="text-amber-400">FINAL STAGE</span>
                    </div>
                    <div className="text-xs font-heading font-black">
                      FINAL PASSWORD CHALLENGE
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-amber-300">
                      +150p
                    </span>
                    {passwordChallengeData.isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : allQuestionsCompleted ? (
                      <Unlock className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-slate-600" />
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Section: Unlocked Password Clues */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-amber-500/40 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-900">
              <div className="flex items-center gap-1.5 text-xs font-heading font-bold text-amber-300 tracking-wider">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>UNLOCKED PASSWORD CLUES</span>
              </div>
              <span className="text-[10px] font-mono text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-950/40 border border-amber-700/50">
                {passwordChallengeData.clues.length} / 5 UNLOCKED
              </span>
            </div>

            <p className="text-[11px] font-mono text-slate-400 leading-relaxed">
              Correct answers reveal password clues sequentially. Revisit any unlocked clue anytime to deduce your character:
            </p>

            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((idx) => {
                const clueItem = passwordChallengeData.clues.find((c) => c.index === idx);
                const isUnlocked = Boolean(clueItem);

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isUnlocked
                        ? 'bg-amber-950/20 border-amber-500/40 text-amber-100 hover:border-amber-400'
                        : 'bg-slate-950/40 border-slate-900 text-slate-600 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono">
                        <span className="font-bold text-amber-300">CLUE {idx}</span>
                        <span className="text-slate-400">• CHAR #{idx}</span>
                      </div>
                      {isUnlocked ? (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300">
                          UNLOCKED
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[9px] font-mono text-slate-500">
                          <Lock className="w-2.5 h-2.5" />
                          SOLVE Q{idx}
                        </span>
                      )}
                    </div>

                    {isUnlocked && clueItem ? (
                      <div className="space-y-2">
                        <p className="text-xs font-sans text-slate-200 leading-relaxed italic line-clamp-2">
                          "{clueItem.clue}"
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            sound.playKeystroke();
                            setSelectedClueModal(clueItem);
                          }}
                          className="w-full py-1 px-2 rounded bg-amber-950/50 hover:bg-amber-900/50 border border-amber-600/40 text-amber-300 text-[10px] font-mono font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-amber-400" />
                          <span>REVISIT FULL CLUE</span>
                        </button>
                      </div>
                    ) : (
                      <p className="text-[10px] font-mono text-slate-500 italic">
                        Solve Question {idx} to reveal Clue {idx}.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Active Question Workspace OR Password Challenge (8 Cols) */}
        <div className="lg:col-span-8">
          {isPasswordStageActive ? (
            /* FINAL PASSWORD CHALLENGE INTERFACE */
            !allQuestionsCompleted && !passwordChallengeData.isCompleted ? (
              <div className="bg-slate-950/95 border border-purple-500/40 rounded-2xl p-8 shadow-2xl text-center space-y-4">
                <Lock className="w-12 h-12 text-amber-400 mx-auto" />
                <h3 className="text-xl font-heading font-black text-white">FINAL PASSWORD TERMINAL LOCKED</h3>
                <p className="text-xs font-mono text-slate-300 max-w-md mx-auto leading-relaxed">
                  You must answer all 5 technical reconnaissance questions to unlock all 5 clues before accessing the final master password field.
                </p>
                <div className="text-xs font-mono text-amber-400 font-bold">
                  PROGRESS: {challenges.filter((c) => c.isCompleted).length} / 5 QUESTIONS CLEARED
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      const nextUnsolved = challenges.find((c) => c.isUnlocked && !c.isCompleted);
                      if (nextUnsolved) {
                        setIsPasswordStageActive(false);
                        setActiveChallengeId(nextUnsolved.id);
                      }
                    }}
                    className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-heading font-bold text-xs uppercase cursor-pointer"
                  >
                    RETURN TO QUESTIONS
                  </button>
                </div>
              </div>
            ) : (
            <div className="bg-slate-950/95 border border-purple-500/50 rounded-2xl p-5 sm:p-7 shadow-2xl glow-purple space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-950 border border-purple-700 text-purple-300 font-bold uppercase">
                      PART 2: FINAL CHALLENGE
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-950/60 border border-amber-700/60 text-amber-300 font-bold">
                      150 PTS BONUS
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-heading font-black text-white mt-1 flex items-center gap-2">
                    <Key className="w-5 h-5 text-amber-400" />
                    <span>FINAL PASSWORD CHALLENGE</span>
                  </h3>
                </div>

                {!passwordChallengeData.isCompleted && (
                  <button
                    onClick={handlePromptPasswordHint}
                    className="px-3 py-1.5 rounded-lg border border-amber-500/50 hover:bg-amber-950/40 text-amber-300 font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>PASSWORD HINT (-10 PTS)</span>
                  </button>
                )}
              </div>

              {/* Password Clues Presentation */}
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed">
                  Congratulations! All five reconnaissance questions have been conquered. Deducing the five password clues below in their exact sequence unlocks the master decryption password.
                </div>

                {/* The Five Password Clues in exact order and original wording */}
                <div className="space-y-3">
                  {passwordChallengeData.clues.map((clue) => (
                    <div
                      key={clue.index}
                      className="p-4 rounded-xl bg-[#03060c] border border-slate-800 hover:border-slate-700 space-y-2 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-bold text-cyan-400">{clue.title}</span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest">
                          CHARACTER #{clue.index}
                        </span>
                      </div>
                      <p className="text-sm text-slate-200 font-sans leading-relaxed">
                        {clue.clue}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Password Hints Revealed */}
                {passwordChallengeData.revealedPasswordHints.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-700/50 space-y-2">
                    <span className="text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider block">
                      REVEALED PASSWORD HINTS:
                    </span>
                    <ul className="space-y-1 text-xs font-mono text-amber-200">
                      {passwordChallengeData.revealedPasswordHints.map((hint, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-amber-400">•</span>
                          <span>{hint}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Password Submission Area */}
              {passwordChallengeData.isCompleted ? (
                <div className="p-5 rounded-xl bg-emerald-950/50 border border-emerald-500/70 space-y-3 text-center">
                  <div className="flex items-center justify-center gap-2 text-emerald-400 font-heading font-bold text-base">
                    <CheckCircle2 className="w-6 h-6" />
                    <span>ROUND 1 DECRYPTION COMPLETE!</span>
                  </div>
                  <p className="text-xs font-mono text-emerald-200">
                    Master password verified successfully. Round 1 Tech Hunt completed with all bonus points awarded.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => onNavigate('/dashboard')}
                      className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-heading font-black text-xs uppercase tracking-wider shadow-lg transition-all"
                    >
                      RETURN TO DASHBOARD
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitPassword} className="space-y-4 pt-2">
                  <div className="space-y-1">
                    <label className="block text-xs font-mono text-slate-300">
                      SUBMIT 5-CHARACTER DECRYPTION PASSWORD *
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        required
                        autoComplete="off"
                        placeholder="Enter the 5-character password..."
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 focus:border-purple-400 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={passwordSubmitting}
                        className="px-6 py-3 rounded-xl bg-purple-500 hover:bg-purple-400 disabled:opacity-50 text-white font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg glow-purple transition-all cursor-pointer"
                      >
                        {passwordSubmitting ? (
                          <span>DECRYPTING...</span>
                        ) : (
                          <>
                            <Terminal className="w-4 h-4" />
                            <span>TRANSMIT PASSWORD</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {passwordFeedback.status === 'GRANTED' && (
                    <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/80 text-emerald-200 text-xs font-mono space-y-1 animate-in fade-in">
                      <div className="font-bold flex items-center gap-1.5 text-sm text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>DECRYPTION SUCCESSFUL (+{passwordFeedback.pointsAwarded} PTS)</span>
                      </div>
                      <p>{passwordFeedback.message}</p>
                    </div>
                  )}

                  {passwordFeedback.status === 'DENIED' && (
                    <div className="p-4 rounded-xl bg-red-950/70 border border-red-500/80 text-red-200 text-xs font-mono space-y-1 animate-in fade-in">
                      <div className="font-bold flex items-center gap-1.5 text-sm text-red-400">
                        <AlertTriangle className="w-4 h-4" />
                        <span>ACCESS DENIED</span>
                      </div>
                      <p>{passwordFeedback.message}</p>
                    </div>
                  )}
                </form>
              )}
            </div>
          )) : activeChallenge ? (
            /* QUESTIONS 1 TO 5 WORKSPACE */
            <div className="bg-slate-950/90 border border-cyan-500/40 rounded-2xl p-5 sm:p-7 shadow-2xl glow-cyan space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      {activeChallenge.nodeCode}
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-purple-300">
                      {activeChallenge.category}
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-950/60 border border-amber-700/60 text-amber-300 font-bold">
                      {activeChallenge.difficulty} • {activeChallenge.points} PTS
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-heading font-black text-white mt-1">
                    {activeChallenge.title}
                  </h3>
                </div>

                {!activeChallenge.isCompleted && (
                  <button
                    onClick={handlePromptQuestionHint}
                    className="px-3 py-1.5 rounded-lg border border-amber-500/50 hover:bg-amber-950/40 text-amber-300 font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>GET HINT (-{activeChallenge.hintPenaltyPoints || 10} PTS)</span>
                  </button>
                )}
              </div>

              {/* Question Body */}
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/90 text-sm text-slate-200 font-sans leading-relaxed whitespace-pre-line">
                  {activeChallenge.question}
                </div>

                {/* Code Snippet (e.g. Question 2 C Program) */}
                {activeChallenge.codeSnippet && (
                  <div className="p-3.5 rounded-xl bg-[#03060c] border border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-widest mb-2 pb-1 border-b border-slate-900">
                      <span className="flex items-center gap-1">
                        <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                        C PROGRAM CODE BUFFER
                      </span>
                      <span>STANDARD C COMPILER</span>
                    </div>
                    <pre className="whitespace-pre text-slate-200 leading-relaxed">
                      {activeChallenge.codeSnippet}
                    </pre>
                  </div>
                )}

                {/* Diagram ASCII if present */}
                {activeChallenge.diagramAscii && (
                  <div className="p-3 rounded-xl bg-[#03060c] border border-cyan-950 font-mono text-xs text-cyan-300 overflow-x-auto">
                    <pre className="whitespace-pre">{activeChallenge.diagramAscii}</pre>
                  </div>
                )}

                {/* Revealed Hints */}
                {activeChallenge.revealedHints && activeChallenge.revealedHints.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-700/50 space-y-2">
                    <span className="text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider block">
                      UNLOCKED HINTS:
                    </span>
                    <ul className="space-y-1 text-xs font-mono text-amber-200">
                      {activeChallenge.revealedHints.map((hint, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-amber-400 font-bold">Hint {idx + 1}:</span>
                          <span>{hint}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Question Solved Status */}
              {activeChallenge.isCompleted && (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/60 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-300 font-heading font-bold text-xs uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>QUESTION VERIFIED & SOLVED (+{activeChallenge.points} PTS)</span>
                  </div>
                </div>
              )}

              {/* Submission Area (Text or Numerical Input only, NO multiple choice) */}
              {!activeChallenge.isCompleted ? (
                <form onSubmit={handleSubmitAnswer} className="space-y-4 pt-2">
                  <div className="space-y-1">
                    <label className="block text-xs font-mono text-slate-300">
                      SUBMIT YOUR ANSWER *
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        required
                        autoComplete="off"
                        placeholder="Type your answer here..."
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg glow-cyan transition-all cursor-pointer"
                      >
                        {submitting ? (
                          <span>VERIFYING...</span>
                        ) : (
                          <>
                            <Terminal className="w-4 h-4" />
                            <span>TRANSMIT ANSWER</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {submissionFeedback.status === 'GRANTED' && (
                    <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/80 text-emerald-200 text-xs font-mono space-y-1 animate-in fade-in">
                      <div className="font-bold flex items-center gap-1.5 text-sm text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>ACCESS GRANTED (+{submissionFeedback.pointsAwarded} PTS)</span>
                      </div>
                      <p>{submissionFeedback.message}</p>
                    </div>
                  )}

                  {submissionFeedback.status === 'DENIED' && (
                    <div className="p-4 rounded-xl bg-red-950/70 border border-red-500/80 text-red-200 text-xs font-mono space-y-1 animate-in fade-in">
                      <div className="font-bold flex items-center gap-1.5 text-sm text-red-400">
                        <AlertTriangle className="w-4 h-4" />
                        <span>ACCESS DENIED</span>
                      </div>
                      <p>{submissionFeedback.message}</p>
                    </div>
                  )}
                </form>
              ) : (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      const nextUnsolved = challenges.find((c) => c.isUnlocked && !c.isCompleted);
                      if (nextUnsolved) {
                        setActiveChallengeId(nextUnsolved.id);
                        setSubmissionFeedback({ status: 'IDLE', message: '' });
                      } else {
                        setIsPasswordStageActive(true);
                      }
                    }}
                    className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-heading font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <span>
                      {allQuestionsCompleted
                        ? 'PROCEED TO FINAL PASSWORD CHALLENGE'
                        : 'NEXT QUESTION'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-10 rounded-2xl bg-slate-950 border border-slate-800 text-center text-slate-400 font-mono text-xs">
              SELECT A QUESTION TO BEGIN ANALYSIS
            </div>
          )}
        </div>
      </div>

      {/* Hint Confirmation Modal */}
      {hintConfirmModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="max-w-md w-full bg-slate-950 border border-amber-500/80 rounded-2xl p-6 glow-amber space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/30">
              <div className="flex items-center gap-2 text-amber-300 font-heading font-bold text-sm">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span>CONFIRM HINT REQUEST</span>
              </div>
              <span className="text-[10px] font-mono text-red-400 font-bold">
                -{hintConfirmModal.penaltyPoints || 10} PTS PENALTY
              </span>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                {hintConfirmModal.challengeTitle}
              </span>
              <p className="text-xs font-mono text-slate-300 leading-relaxed">
                Are you sure you want to request <span className="text-amber-300 font-bold">Hint {hintConfirmModal.hintNumber}</span>? 
                A penalty of <span className="text-red-400 font-bold">{hintConfirmModal.penaltyPoints || 10} points</span> will be deducted from your squad's total score.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={hintRequesting}
                onClick={() => setHintConfirmModal({ open: false, type: 'QUESTION' })}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs rounded transition-colors cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                disabled={hintRequesting}
                onClick={handleConfirmRequestHint}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-mono text-xs font-bold rounded flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {hintRequesting ? (
                  <span>REQUESTING...</span>
                ) : (
                  <>
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>CONFIRM & UNLOCK HINT</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hint Modal */}
      {hintModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="max-w-md w-full bg-slate-950 border border-amber-500/80 rounded-2xl p-6 glow-amber space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/30">
              <div className="flex items-center gap-2 text-amber-300 font-heading font-bold text-sm">
                <HelpCircle className="w-4 h-4" />
                <span>
                  HINT {hintModal.hintNumber || 1} OF {hintModal.totalHints || 3}
                </span>
              </div>
              <span className="text-[10px] font-mono text-red-400 font-bold">
                -{hintModal.penaltyPoints || 10} PTS PENALTY
              </span>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                {hintModal.challengeTitle}
              </span>
              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-900 text-xs font-mono text-amber-200 leading-relaxed">
                {hintModal.hintText || 'Consider alternative mathematical perspectives.'}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setHintModal({ open: false, challengeId: '', challengeTitle: '' })}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold rounded cursor-pointer"
              >
                PROCEED WITH HINT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Newly Unlocked Password Clue Celebration Modal */}
      {newlyUnlockedClueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="max-w-lg w-full bg-slate-950 border border-amber-500 rounded-2xl p-6 glow-amber space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/30">
              <div className="flex items-center gap-2 text-amber-300 font-heading font-black text-sm">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>NEW PASSWORD CLUE UNLOCKED!</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold">
                CHARACTER #{newlyUnlockedClueModal.index}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-amber-300">
                  {newlyUnlockedClueModal.title} (FROM QUESTION {newlyUnlockedClueModal.index})
                </span>
              </div>
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-600/40 text-slate-100 text-sm font-sans leading-relaxed italic">
                "{newlyUnlockedClueModal.clue}"
              </div>
              <p className="text-[11px] font-mono text-slate-400 leading-relaxed">
                Analyze this clue to deduce character #{newlyUnlockedClueModal.index}. You can revisit this and any other unlocked clue anytime in the <strong className="text-amber-300">Unlocked Password Clues</strong> section.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  sound.playKeystroke();
                  setNewlyUnlockedClueModal(null);
                  const nextUnsolved = challenges.find((c) => c.isUnlocked && !c.isCompleted);
                  if (nextUnsolved) {
                    setActiveChallengeId(nextUnsolved.id);
                  } else if (allQuestionsCompleted) {
                    setIsPasswordStageActive(true);
                  }
                }}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg transition-colors cursor-pointer"
              >
                <span>NOTED — CONTINUE MISSION</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revisit Password Clue Modal (Free, No Deductions) */}
      {selectedClueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="max-w-lg w-full bg-slate-950 border border-amber-500/80 rounded-2xl p-6 glow-amber space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/30">
              <div className="flex items-center gap-2 text-amber-300 font-heading font-black text-sm">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>UNLOCKED PASSWORD CLUE</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 font-bold">
                CHARACTER #{selectedClueModal.index}
              </span>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-mono font-bold text-amber-300">
                {selectedClueModal.title} (FROM QUESTION {selectedClueModal.index})
              </div>
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-600/40 text-slate-100 text-sm font-sans leading-relaxed italic">
                "{selectedClueModal.clue}"
              </div>
              <p className="text-[11px] font-mono text-slate-400 leading-relaxed">
                Interpret this riddle to deduce character #{selectedClueModal.index} of the master password.
                <span className="block text-emerald-400 text-[10px] mt-1 font-bold">
                  ✓ Revisiting unlocked clues incurs zero penalty.
                </span>
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  sound.playKeystroke();
                  setSelectedClueModal(null);
                }}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
