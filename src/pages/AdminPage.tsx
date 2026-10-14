import React, { useEffect, useState } from 'react';
import {
  Shield,
  Play,
  Pause,
  RotateCcw,
  Users,
  Compass,
  KeyRound,
  Layers,
  Settings,
  AlertTriangle,
  Download,
  Trash2,
  Edit2,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Terminal,
  Activity,
  Award,
  Save,
  MapPin,
  HelpCircle,
  Lock,
  Unlock,
  Sparkles,
  Search,
} from 'lucide-react';
import { api } from '../utils/api';
import { sound } from '../utils/audio';
import { Challenge, Difficulty, EventSettings, Team, ActivityLog, RoundId } from '../types';

interface AdminPageProps {
  onNavigate: (path: string) => void;
  onRefreshMe: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigate, onRefreshMe }) => {
  const [activeTab, setActiveTab] = useState<
    'OVERVIEW' | 'ROUND_2' | 'TEAMS' | 'CHALLENGES' | 'TIMERS' | 'LOGS'
  >('OVERVIEW');

  // Overview data
  const [overview, setOverview] = useState<{
    totalTeams: number;
    activeTeams: number;
    completedTeams: number;
    qualifiedTeams: number;
    settings: EventSettings;
    serverTime: number;
    round1TimeLeft: number;
    round2TimeLeft: number;
    vaultTimeLeft: number;
  } | null>(null);

  // Teams data
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // Challenges data
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [editingChallenge, setEditingChallenge] = useState<Partial<Challenge> | null>(null);

  // Logs
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  // Round 2 Admin State
  const [r2Data, setR2Data] = useState<{
    teams: any[];
    rooms: any[];
    settings: EventSettings;
    totalTeams: number;
    qualifiedCount: number;
    round2CompletedCount: number;
    round2ActiveCount: number;
  } | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<number>(1);
  const [editingRoom, setEditingRoom] = useState<any | null>(null);
  const [r2Search, setR2Search] = useState<string>('');
  const [criteriaType, setCriteriaType] = useState<'TOP_N' | 'MIN_SCORE' | 'ALL_R1_COMPLETE'>('TOP_N');
  const [topCountInput, setTopCountInput] = useState<number>(10);
  const [minScoreInput, setMinScoreInput] = useState<number>(200);

  // Penalty Modal
  const [penaltyModal, setPenaltyModal] = useState<{ open: boolean; teamId: string; points: number; reason: string }>({
    open: false,
    teamId: '',
    points: 10,
    reason: '',
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchRound2Data = async () => {
    try {
      const data = await api.getAdminRound2Overview();
      setR2Data(data);
      if (data.rooms && data.rooms.length > 0) {
        setEditingRoom((prev: any) => {
          const match = data.rooms.find((r: any) => r.roomId === (prev?.roomId || 1));
          return match ? { ...match } : { ...data.rooms[0] };
        });
      }
    } catch (err: any) {
      console.error('Failed to load Round 2 data:', err);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ov, tm, ch, lg] = await Promise.all([
        api.getAdminOverview(),
        api.getAdminTeams(),
        api.getAdminChallenges(),
        api.getAdminLogs(),
        fetchRound2Data(),
      ]);
      setOverview(ov);
      setTeams(tm.teams);
      setChallenges(ch.challenges);
      setLogs(lg.logs);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleEventControl = async (action: string, round?: RoundId) => {
    try {
      sound.playKeystroke();
      await api.controlEvent(action, round);
      setActionMessage(`Event Action [${action}] executed successfully.`);
      await fetchData();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`);
    }
  };

  const handleQualifyTop = async (topCount: number) => {
    try {
      sound.playAccessGranted();
      await api.updateQualifyTeams({ qualifyTopCount: topCount });
      setActionMessage(`Qualified Top ${topCount} squads for Round 2.`);
      await fetchData();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setActionMessage(err.message);
    }
  };

  const handleToggleTeamQualify = async (teamId: string, current: boolean) => {
    try {
      sound.playKeystroke();
      await api.updateQualifyTeams({ teamId, isQualified: !current });
      await fetchData();
    } catch (err: any) {
      setActionMessage(err.message);
    }
  };

  const handleDisqualify = async (teamId: string) => {
    const reason = prompt('Specify Disqualification Reason:', 'Unauthorized external communication');
    if (!reason) return;
    try {
      sound.playAccessDenied();
      await api.disqualifyTeam(teamId, reason);
      await fetchData();
    } catch (err: any) {
      setActionMessage(err.message);
    }
  };

  const handleResetTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to reset this team\'s answers and progress?')) return;
    try {
      sound.playKeystroke();
      await api.resetTeam(teamId);
      await fetchData();
    } catch (err: any) {
      setActionMessage(err.message);
    }
  };

  const handleApplyPenalty = async () => {
    try {
      sound.playKeystroke();
      await api.applyTeamPenalty(penaltyModal.teamId, penaltyModal.points, penaltyModal.reason);
      setPenaltyModal({ open: false, teamId: '', points: 10, reason: '' });
      await fetchData();
    } catch (err: any) {
      setActionMessage(err.message);
    }
  };

  const handleSaveChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChallenge) return;
    try {
      sound.playKeystroke();
      await api.saveAdminChallenge(editingChallenge);
      setEditingChallenge(null);
      await fetchData();
      setActionMessage('Challenge updated in database.');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setActionMessage(err.message);
    }
  };

  const handleDeleteChallenge = async (id: string) => {
    if (!confirm('Delete this challenge permanently?')) return;
    try {
      sound.playKeystroke();
      await api.deleteAdminChallenge(id);
      await fetchData();
    } catch (err: any) {
      setActionMessage(err.message);
    }
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;
    try {
      sound.playKeystroke();
      await api.updateAdminRound2Room(editingRoom);
      setActionMessage(`Room ${editingRoom.roomId} [${editingRoom.roomName}] parameters successfully saved.`);
      await fetchRound2Data();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setActionMessage(`Error updating room: ${err.message}`);
    }
  };

  const handleApplyCriteria = async () => {
    try {
      sound.playAccessGranted();
      const res = await api.updateAdminRound2QualificationCriteria({
        criteriaType,
        topCount: Number(topCountInput),
        minScore: Number(minScoreInput),
      });
      setActionMessage(`Qualification criteria applied: ${res.qualifiedCount} squads authorized for Round 2.`);
      await Promise.all([fetchData(), fetchRound2Data()]);
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err: any) {
      setActionMessage(`Failed to apply criteria: ${err.message}`);
    }
  };

  const handleToggleQualify = async (teamId: string, currentStatus: boolean) => {
    try {
      sound.playKeystroke();
      await api.toggleAdminRound2Qualify(teamId, !currentStatus);
      await Promise.all([fetchData(), fetchRound2Data()]);
    } catch (err: any) {
      setActionMessage(`Error toggling qualification: ${err.message}`);
    }
  };

  const handleResetTeamRound2 = async (teamId: string, teamName: string) => {
    if (
      !confirm(
        `Reset Round 2 progress for squad "${teamName}" (${teamId})?\n\nThis resets their Escape Room state back to Room 1 while keeping their Round 1 scores, password clues, and leaderboard records completely intact.`
      )
    ) {
      return;
    }
    try {
      sound.playKeystroke();
      await api.resetAdminTeamRound2(teamId);
      setActionMessage(`Round 2 progress reset for squad "${teamName}".`);
      await Promise.all([fetchData(), fetchRound2Data()]);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setActionMessage(`Error resetting Round 2: ${err.message}`);
    }
  };

  const handleR2TimerAction = async (action: 'START' | 'RESET', durationMinutes?: number) => {
    try {
      sound.playKeystroke();
      await api.updateAdminRound2Timer({ action, durationMinutes });
      setActionMessage(`Round 2 timer ${action === 'START' ? 'started' : 'reset'}.`);
      await Promise.all([fetchData(), fetchRound2Data()]);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setActionMessage(`Error with Round 2 timer: ${err.message}`);
    }
  };

  const handleDemoReset = async () => {
    if (!confirm('Reset entire competition telemetry to initial demo baseline?')) return;
    try {
      sound.playKeystroke();
      await api.resetToDemo();
      setActionMessage('All live records reset to default demo parameters.');
      await fetchData();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setActionMessage(err.message);
    }
  };

  const handleExportCSV = () => {
    sound.playKeystroke();
    const rows = [
      ['Team ID', 'Team Name', 'Department', 'College', 'Score', 'Status', 'Time Seconds', 'Qualified', 'Completed Nodes'],
      ...teams.map((t) => [
        t.id,
        t.name,
        t.department,
        t.college,
        t.score,
        t.status,
        t.totalTimeSpentSeconds,
        t.isQualified ? 'YES' : 'NO',
        t.completedChallenges.length,
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `techquest_tournament_results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen py-6 px-4 sm:px-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-900">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping" />
            <span className="text-xs font-mono text-purple-300 font-bold uppercase tracking-widest">
              ORGANIZER COMMAND CENTER
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-black text-white mt-1">
            TECH QUEST MASTER CONSOLE
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDemoReset}
            className="px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-500/40 hover:bg-amber-900/60 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET DEMO COMPETITION</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 text-xs font-mono font-bold flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>EXPORT CSV</span>
          </button>

          <button
            onClick={() => onNavigate('/')}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-slate-400 hover:text-white"
          >
            ← PUBLIC VIEW
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-500/60 text-purple-200 text-xs font-mono flex items-center gap-2 animate-in fade-in">
          <Zap className="w-4 h-4 text-purple-400" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2 text-xs font-mono font-bold">
        {[
          { id: 'OVERVIEW', label: 'LIVE MONITOR & CONTROLS', icon: Activity },
          {
            id: 'ROUND_2',
            label: `ROUND 2: ESCAPE ROOM (${r2Data?.rooms?.length || 4} ROOMS)`,
            icon: KeyRound,
            highlight: true,
          },
          { id: 'TEAMS', label: `TEAM REGISTRY (${teams.length})`, icon: Users },
          { id: 'CHALLENGES', label: `CHALLENGE DATABASE (${challenges.length})`, icon: Terminal },
          { id: 'TIMERS', label: 'TIMERS & SETTINGS', icon: Clock },
          { id: 'LOGS', label: `TELEMETRY LOGS (${logs.length})`, icon: AlertTriangle },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                sound.playKeystroke();
                setActiveTab(tab.id as any);
              }}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${
                active
                  ? tab.id === 'ROUND_2'
                    ? 'bg-amber-950/80 border border-amber-500/80 text-amber-300 glow-amber'
                    : 'bg-purple-950/80 border border-purple-500/60 text-purple-300 glow-purple'
                  : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & LIVE MONITOR */}
      {activeTab === 'OVERVIEW' && overview && (
        <div className="space-y-6">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400">TOTAL SQUADS</span>
              <div className="text-xl sm:text-2xl font-heading font-black text-white mt-1">
                {overview.totalTeams}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-mono text-cyan-400">ACTIVE SQUADS</span>
              <div className="text-xl sm:text-2xl font-heading font-black text-cyan-300 mt-1">
                {overview.activeTeams}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-mono text-emerald-400">QUALIFIED</span>
              <div className="text-xl sm:text-2xl font-heading font-black text-emerald-300 mt-1">
                {overview.qualifiedTeams}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-mono text-purple-400">COMPLETED</span>
              <div className="text-xl sm:text-2xl font-heading font-black text-purple-300 mt-1">
                {overview.completedTeams}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-mono text-amber-400">CURRENT ROUND</span>
              <div className="text-xs font-heading font-black text-amber-300 mt-2 truncate">
                {overview.settings.currentActiveRound}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400">EVENT STATE</span>
              <div className="text-xs font-heading font-black text-emerald-400 mt-2">
                {overview.settings.competitionState}
              </div>
            </div>
          </div>

          {/* Master Event Action Bar */}
          <div className="p-5 rounded-2xl bg-slate-950/90 border border-purple-500/40 glow-purple flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-heading font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-400" />
                <span>COMPETITION STAGE CONTROL</span>
              </div>
              <p className="text-[11px] font-mono text-slate-400">
                Change stages or pause active timers for all connected student workstations.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleEventControl('START')}
                className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" /> START / RESUME
              </button>

              <button
                onClick={() => handleEventControl('PAUSE')}
                className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-mono text-xs font-bold flex items-center gap-1.5"
              >
                <Pause className="w-3.5 h-3.5" /> PAUSE
              </button>

              <div className="h-6 w-px bg-slate-800 hidden sm:block" />

              <button
                onClick={() => handleEventControl('SET_ROUND', 'ROUND_1')}
                className="px-3 py-2 rounded-lg bg-slate-900 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold"
              >
                OPEN R1: TECH HUNT
              </button>

              <button
                onClick={() => handleEventControl('SET_ROUND', 'ROUND_2')}
                className="px-3 py-2 rounded-lg bg-slate-900 border border-purple-500/40 text-purple-300 font-mono text-xs font-bold"
              >
                OPEN R2: ESCAPE ROOM
              </button>

              <button
                onClick={() => handleEventControl('SET_ROUND', 'FINAL_VAULT')}
                className="px-3 py-2 rounded-lg bg-slate-900 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold"
              >
                OPEN FINAL VAULT
              </button>
            </div>
          </div>

          {/* Qualification Controller Card */}
          <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-heading font-black text-sm text-white">
                  ROUND 2 QUALIFICATION GATEWAY
                </span>
                <p className="text-[11px] font-mono text-slate-400">
                  Select top ranking teams to automatically unlock the Engineering Escape Room.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleQualifyTop(3)}
                  className="px-3 py-1.5 rounded-lg bg-purple-950 border border-purple-600 text-purple-200 font-mono text-xs font-bold hover:bg-purple-900"
                >
                  QUALIFY TOP 3
                </button>
                <button
                  onClick={() => handleQualifyTop(5)}
                  className="px-3 py-1.5 rounded-lg bg-purple-950 border border-purple-600 text-purple-200 font-mono text-xs font-bold hover:bg-purple-900"
                >
                  QUALIFY TOP 5
                </button>
                <button
                  onClick={() => handleQualifyTop(10)}
                  className="px-3 py-1.5 rounded-lg bg-purple-950 border border-purple-600 text-purple-200 font-mono text-xs font-bold hover:bg-purple-900"
                >
                  QUALIFY TOP 10
                </button>
              </div>
            </div>
          </div>

          {/* Live Telemetry Table */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <span className="font-heading font-bold text-xs text-white">
                LIVE COMPETITION TELEMETRY STREAM
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                AUTO-SYNCS EVERY 8 SECONDS
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/60 text-slate-400 text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">TEAM</th>
                    <th className="py-3 px-4">STAGE</th>
                    <th className="py-3 px-4">SCORE</th>
                    <th className="py-3 px-4">SOLVED</th>
                    <th className="py-3 px-4">TIME SPENT</th>
                    <th className="py-3 px-4">STATUS</th>
                    <th className="py-3 px-4 text-right">MANAGE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {teams.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-900/40">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{t.name}</div>
                        <div className="text-[10px] text-slate-500">
                          {t.id} • {t.department}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300">
                          {t.currentRound}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-cyan-300 text-sm">{t.score}</span>
                        <span className="text-[10px] text-slate-500 ml-1">
                          (-{t.penalties} pen)
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-300">
                        {t.completedChallenges.length} Nodes
                      </td>

                      <td className="py-3 px-4 text-slate-400">
                        {Math.floor(t.totalTimeSpentSeconds / 60)}m {t.totalTimeSpentSeconds % 60}s
                      </td>

                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleTeamQualify(t.id, t.isQualified)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                            t.isQualified
                              ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                              : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                          }`}
                        >
                          {t.isQualified ? 'QUALIFIED' : 'ACTIVE'}
                        </button>
                      </td>

                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => setPenaltyModal({ open: true, teamId: t.id, points: 10, reason: '' })}
                          className="px-2 py-1 rounded bg-amber-950/60 border border-amber-700/60 text-amber-300 text-[10px]"
                        >
                          PENALTY
                        </button>
                        <button
                          onClick={() => handleDisqualify(t.id)}
                          className="px-2 py-1 rounded bg-red-950/60 border border-red-700/60 text-red-300 text-[10px]"
                        >
                          DISQUALIFY
                        </button>
                        <button
                          onClick={() => handleResetTeam(t.id)}
                          className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[10px]"
                        >
                          RESET
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: ROUND 2 ESCAPE ROOM MANAGEMENT */}
      {activeTab === 'ROUND_2' && (
        <div className="space-y-6">
          {/* Top Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400">TOTAL SQUADS</span>
              <div className="text-xl sm:text-2xl font-heading font-black text-white mt-1">
                {r2Data?.totalTeams || teams.length}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/40">
              <span className="text-[10px] font-mono text-amber-400">QUALIFIED FOR R2</span>
              <div className="text-xl sm:text-2xl font-heading font-black text-amber-300 mt-1">
                {r2Data?.qualifiedCount || 0}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-500/40">
              <span className="text-[10px] font-mono text-cyan-400">IN ESCAPE ROOM</span>
              <div className="text-xl sm:text-2xl font-heading font-black text-cyan-300 mt-1">
                {r2Data?.round2ActiveCount || 0}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/40">
              <span className="text-[10px] font-mono text-emerald-400">PLANT RESTORED</span>
              <div className="text-xl sm:text-2xl font-heading font-black text-emerald-300 mt-1">
                {r2Data?.round2CompletedCount || 0}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-mono text-purple-400">R2 TIMER DURATION</span>
              <div className="text-xl sm:text-2xl font-heading font-black text-purple-300 mt-1">
                {r2Data?.settings?.round2DurationMinutes || 60}m
              </div>
            </div>
          </div>

          {/* Section 1: Qualification Criteria & Adjudication Gateway */}
          <div className="p-5 rounded-2xl bg-slate-950/90 border border-amber-500/40 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-900">
              <div>
                <span className="text-[10px] font-mono text-amber-400 font-bold tracking-widest uppercase">
                  COMPETITION ADVANCEMENT GATEWAY
                </span>
                <h3 className="font-heading font-black text-lg text-white">
                  ROUND 1 → ROUND 2 QUALIFICATION CRITERIA
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Evaluation of Round 1 Tech Hunt results
              </span>
            </div>

            <p className="text-xs font-mono text-slate-300 leading-relaxed">
              Teams are evaluated using their Round 1 scores and completion times. Select and execute the qualification rule below to automatically authorize squads, or manually override individual squad status in the live table.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              {/* Option A: Top N */}
              <div
                onClick={() => setCriteriaType('TOP_N')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  criteriaType === 'TOP_N'
                    ? 'bg-amber-950/40 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-amber-300">RULE A: TOP N SQUADS</span>
                  <input
                    type="radio"
                    name="qualRule"
                    checked={criteriaType === 'TOP_N'}
                    onChange={() => setCriteriaType('TOP_N')}
                    className="text-amber-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                  Qualify top ranking squads ordered by highest Round 1 score and fastest completion time.
                </p>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] text-slate-400">COUNT:</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={topCountInput}
                    onChange={(e) => setTopCountInput(Math.max(1, Number(e.target.value)))}
                    className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs font-bold"
                  />
                  <span className="text-[10px] text-slate-500">TEAMS</span>
                </div>
              </div>

              {/* Option B: Minimum Score */}
              <div
                onClick={() => setCriteriaType('MIN_SCORE')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  criteriaType === 'MIN_SCORE'
                    ? 'bg-amber-950/40 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-amber-300">RULE B: SCORE THRESHOLD</span>
                  <input
                    type="radio"
                    name="qualRule"
                    checked={criteriaType === 'MIN_SCORE'}
                    onChange={() => setCriteriaType('MIN_SCORE')}
                    className="text-amber-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                  Qualify all squads achieving at least a minimum net score in Round 1: Tech Hunt.
                </p>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] text-slate-400">MIN SCORE:</label>
                  <input
                    type="number"
                    step={10}
                    value={minScoreInput}
                    onChange={(e) => setMinScoreInput(Number(e.target.value))}
                    className="w-24 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs font-bold"
                  />
                  <span className="text-[10px] text-slate-500">PTS</span>
                </div>
              </div>

              {/* Option C: All 5 nodes + Password completed */}
              <div
                onClick={() => setCriteriaType('ALL_R1_COMPLETE')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  criteriaType === 'ALL_R1_COMPLETE'
                    ? 'bg-amber-950/40 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-amber-300">RULE C: COMPLETE R1</span>
                  <input
                    type="radio"
                    name="qualRule"
                    checked={criteriaType === 'ALL_R1_COMPLETE'}
                    onChange={() => setCriteriaType('ALL_R1_COMPLETE')}
                    className="text-amber-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                  Qualify all squads that solved all 5 technical nodes and verified the Master Sector password.
                </p>
                <div className="text-[10px] text-emerald-400 font-bold pt-1">
                  REQUIRES: 5 NODES + PASSWORD SOLVED
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-900">
              <span className="text-xs font-mono text-slate-400">
                Current Qualified Count:{' '}
                <strong className="text-amber-400">{r2Data?.qualifiedCount || 0}</strong> of{' '}
                {teams.length} Squads
              </span>
              <button
                onClick={handleApplyCriteria}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>APPLY & ADVANCE SQUADS</span>
              </button>
            </div>
          </div>

          {/* Section 2: Participating Squads & Live Progress Monitor */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-3 p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-900">
              <div>
                <span className="text-[10px] font-mono text-amber-400 font-bold tracking-widest uppercase">
                  PARTICIPATING TEAMS TELEMETRY
                </span>
                <h3 className="font-heading font-black text-lg text-white">
                  ROUND 2 SQUAD ADVANCEMENT & PROGRESS
                </h3>
              </div>

              <div className="relative w-full sm:w-64 font-mono text-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter squad name or ID..."
                  value={r2Search}
                  onChange={(e) => setR2Search(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/60 text-slate-400 text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3">SQUAD / TEAM</th>
                    <th className="py-3 px-3">R1 SCORE</th>
                    <th className="py-3 px-3 text-center">QUALIFICATION</th>
                    <th className="py-3 px-3">CURRENT ROOM</th>
                    <th className="py-3 px-3 text-center">CLEARED</th>
                    <th className="py-3 px-3 text-right">R2 SCORE</th>
                    <th className="py-3 px-3 text-center">HINTS</th>
                    <th className="py-3 px-3 text-center">TIMESTAMPS</th>
                    <th className="py-3 px-3 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {r2Data?.teams
                    ?.filter((t) => {
                      const q = r2Search.toLowerCase();
                      return (
                        t.name.toLowerCase().includes(q) ||
                        t.id.toLowerCase().includes(q) ||
                        t.department.toLowerCase().includes(q)
                      );
                    })
                    .map((t) => {
                      const roomName =
                        t.r2CurrentRoom === 1
                          ? 'Room 1: The Discovery'
                          : t.r2CurrentRoom === 2
                          ? 'Room 2: The Decoder'
                          : t.r2CurrentRoom === 3
                          ? 'Room 3: The System'
                          : t.r2CurrentRoom === 4
                          ? 'Room 4: The Final Vault'
                          : 'Restored (Vault Cleared)';

                      const startTimeFormatted = t.r2StartTime
                        ? new Date(t.r2StartTime).toLocaleTimeString()
                        : 'Not Started';
                      const finishTimeFormatted = t.r2FinishTime
                        ? new Date(t.r2FinishTime).toLocaleTimeString()
                        : t.r2Status === 'IN_PROGRESS'
                        ? 'In Progress'
                        : '—';

                      return (
                        <tr key={t.id} className="hover:bg-slate-900/40">
                          <td className="py-3 px-3">
                            <div className="font-bold text-white">{t.name}</div>
                            <div className="text-[10px] text-slate-500">
                              {t.id} • {t.department}
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <span className="font-bold text-cyan-300">{t.r1Score}</span>
                            <span className="text-[10px] text-slate-500 ml-1">PTS</span>
                          </td>

                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => handleToggleQualify(t.id, t.isQualified)}
                              title="Click to toggle qualification for Round 2"
                              className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                                t.isQualified
                                  ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300'
                                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                              }`}
                            >
                              {t.isQualified ? 'QUALIFIED' : 'PENDING'}
                            </button>
                          </td>

                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                t.r2Status === 'COMPLETED'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                                  : t.r2Status === 'IN_PROGRESS'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-700'
                                  : 'bg-slate-900 text-slate-400'
                              }`}
                            >
                              {roomName}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span className="font-bold text-white">
                              {t.r2CompletedRooms?.length || 0} / 4
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right">
                            <span className="font-bold text-amber-400 text-sm">{t.r2Score}</span>
                            <span className="text-[10px] text-slate-500 ml-1">PTS</span>
                          </td>

                          <td className="py-3 px-3 text-center text-slate-300">
                            {t.r2HintsUsed}
                          </td>

                          <td className="py-3 px-3 text-center text-[10px] text-slate-400">
                            <div>START: {startTimeFormatted}</div>
                            <div>FINISH: {finishTimeFormatted}</div>
                          </td>

                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => handleResetTeamRound2(t.id, t.name)}
                              title="Reset Round 2 Escape Room progress without deleting Round 1 results"
                              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-amber-950/80 border border-slate-700 hover:border-amber-600 text-amber-300 text-[10px] font-bold transition-all cursor-pointer"
                            >
                              RESET R2
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: 4-Room Interactive Puzzle & Verification Clue Editor */}
          <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-900">
              <div>
                <span className="text-[10px] font-mono text-amber-400 font-bold tracking-widest uppercase">
                  PUZZLE & VERIFICATION KEY MANAGER
                </span>
                <h3 className="font-heading font-black text-lg text-white">
                  EDIT ROUND 2 ESCAPE ROOM CHALLENGES
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Securely updated on server • Not exposed client-side
              </span>
            </div>

            {/* Room Selector Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
              {[
                { id: 1, name: 'Room 1: The Discovery', code: 'ROOM-01' },
                { id: 2, name: 'Room 2: The Decoder', code: 'ROOM-02' },
                { id: 3, name: 'Room 3: The System', code: 'ROOM-03' },
                { id: 4, name: 'Room 4: The Final Vault', code: 'ROOM-04' },
              ].map((rm) => (
                <button
                  key={rm.id}
                  onClick={() => {
                    sound.playKeystroke();
                    setSelectedRoomId(rm.id);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedRoomId === rm.id
                      ? 'bg-amber-950/40 border-amber-400 text-white shadow-lg shadow-amber-500/10'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-[10px] font-bold block text-amber-400">{rm.code}</span>
                  <span className="font-heading font-bold text-xs">{rm.name}</span>
                </button>
              ))}
            </div>

            {/* Room Editor Form */}
            {editingRoom && (
              <form onSubmit={handleSaveRoom} className="space-y-4 font-mono text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">ROOM NAME</label>
                    <input
                      type="text"
                      value={editingRoom.roomName || ''}
                      onChange={(e) => setEditingRoom({ ...editingRoom, roomName: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">ROOM CODE</label>
                    <input
                      type="text"
                      value={editingRoom.roomCode || ''}
                      onChange={(e) => setEditingRoom({ ...editingRoom, roomCode: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">POINTS AWARDED</label>
                    <input
                      type="number"
                      value={editingRoom.points || 0}
                      onChange={(e) =>
                        setEditingRoom({ ...editingRoom, points: Number(e.target.value) })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">SYSTEM CONTEXT / STORYLINE</label>
                  <textarea
                    rows={2}
                    value={editingRoom.systemContext || ''}
                    onChange={(e) =>
                      setEditingRoom({ ...editingRoom, systemContext: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">DIAGNOSTIC PUZZLE TITLE</label>
                  <input
                    type="text"
                    value={editingRoom.puzzleTitle || ''}
                    onChange={(e) => setEditingRoom({ ...editingRoom, puzzleTitle: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">PUZZLE QUESTION & TECHNICAL SPEC</label>
                  <textarea
                    rows={4}
                    value={editingRoom.puzzleQuestion || ''}
                    onChange={(e) =>
                      setEditingRoom({ ...editingRoom, puzzleQuestion: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-amber-300 font-bold mb-1">
                      ACCEPTED ANSWER (SERVER VALIDATED)
                    </label>
                    <input
                      type="text"
                      value={editingRoom.correctAnswer || ''}
                      onChange={(e) =>
                        setEditingRoom({ ...editingRoom, correctAnswer: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-amber-500/80 rounded-lg p-2 text-amber-300 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-purple-300 mb-1">HINT TEXT</label>
                    <input
                      type="text"
                      value={editingRoom.hint || ''}
                      onChange={(e) => setEditingRoom({ ...editingRoom, hint: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-purple-300 mb-1">HINT PENALTY POINTS</label>
                    <input
                      type="number"
                      value={editingRoom.hintPenaltyPoints || 10}
                      onChange={(e) =>
                        setEditingRoom({
                          ...editingRoom,
                          hintPenaltyPoints: Number(e.target.value),
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-900">
                  <div>
                    <label className="block text-emerald-300 mb-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>PHYSICAL LOCATION CLUE</span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Directions to find the physical key or code..."
                      value={editingRoom.physicalLocationClue || ''}
                      onChange={(e) =>
                        setEditingRoom({ ...editingRoom, physicalLocationClue: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-emerald-500/40 rounded-lg p-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-emerald-300 font-bold mb-1 flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>PHYSICAL VERIFICATION CODE / KEY</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. DISCOVERY-KEY-492"
                      value={editingRoom.physicalVerificationCode || ''}
                      onChange={(e) =>
                        setEditingRoom({
                          ...editingRoom,
                          physicalVerificationCode: e.target.value,
                        })
                      }
                      className="w-full bg-slate-900 border border-emerald-500 rounded-lg p-2 text-emerald-300 font-bold"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Teams must physically locate and submit this exact code to clear the room.
                    </span>
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-heading font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>SAVE ROOM CONFIGURATION</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Section 4: Round 2 Timers & Controls */}
          <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-900">
              <span className="font-heading font-black text-sm text-white">
                ROUND 2 TIMER & MASTER CLOCK CONTROLS
              </span>
              <span className="text-xs font-mono text-slate-400">Duration: 45–60 Minutes</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs items-end">
              <div>
                <label className="block text-slate-400 mb-1">
                  ESCAPE ROOM DURATION (MINUTES)
                </label>
                <input
                  type="number"
                  min={15}
                  max={120}
                  defaultValue={r2Data?.settings?.round2DurationMinutes || 60}
                  onBlur={(e) =>
                    handleR2TimerAction('RESET', Number(e.target.value))
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <button
                  onClick={() => handleR2TimerAction('START')}
                  className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>START ROUND 2 CLOCK</span>
                </button>
              </div>

              <div>
                <button
                  onClick={() => handleR2TimerAction('RESET')}
                  className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>RESET ROUND 2 CLOCK</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TEAMS MANAGEMENT */}
      {activeTab === 'TEAMS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((t) => (
              <div
                key={t.id}
                className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3 shadow-xl relative"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-900">
                  <span className="text-xs font-mono text-cyan-400 font-bold">{t.id}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300">
                    CODE: {t.loginCode}
                  </span>
                </div>

                <div>
                  <h4 className="font-heading font-black text-base text-white">{t.name}</h4>
                  <p className="text-xs font-mono text-slate-400">{t.college}</p>
                  <p className="text-[11px] font-mono text-purple-300">{t.department}</p>
                </div>

                <div className="space-y-1 bg-slate-900/50 p-3 rounded-xl text-xs font-mono">
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Squad Roster:</div>
                  {t.members.map((m, idx) => (
                    <div key={idx} className="flex justify-between text-slate-300">
                      <span>{m.name}</span>
                      <span className="text-slate-500 font-bold">{m.usn}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-slate-400 text-[10px] block">TOTAL SCORE</span>
                    <span className="font-bold text-cyan-300">{t.score} PTS</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">HINTS USED</span>
                    <span className="font-bold text-amber-400">{t.hintsUsed}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">QUALIFICATION</span>
                    <span className={t.isQualified ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                      {t.isQualified ? 'QUALIFIED' : 'ACTIVE'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CHALLENGES DATABASE */}
      {activeTab === 'CHALLENGES' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <span className="font-heading font-bold text-sm text-white">
              ROUND 1 & VAULT QUESTION REPOSITORY
            </span>
            <button
              onClick={() => {
                setEditingChallenge({
                  id: `CH-${Date.now()}`,
                  round: 'ROUND_1',
                  nodeCode: `NODE-${challenges.length + 1}`,
                  title: 'NEW TECHNICAL NODE',
                  category: 'DIGITAL',
                  difficulty: 'MEDIUM',
                  points: 75,
                  question: 'Describe problem statement here...',
                  questionType: 'TEXT',
                  correctAnswer: 'SAMPLE_ANSWER',
                  hint: 'Sample hint description',
                  hintPenaltyPoints: 5,
                  order: challenges.length + 1,
                  active: true,
                });
              }}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> ADD CHALLENGE NODE
            </button>
          </div>

          {/* Edit Form if open */}
          {editingChallenge && (
            <form
              onSubmit={handleSaveChallenge}
              className="p-6 rounded-2xl bg-slate-950 border border-cyan-500/60 space-y-4 glow-cyan"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-heading font-bold text-sm text-cyan-300">
                  EDIT TECHNICAL NODE: {editingChallenge.nodeCode}
                </span>
                <button
                  type="button"
                  onClick={() => setEditingChallenge(null)}
                  className="text-xs font-mono text-slate-400 hover:text-white"
                >
                  CANCEL
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 font-mono text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">NODE CODE</label>
                  <input
                    type="text"
                    value={editingChallenge.nodeCode || ''}
                    onChange={(e) => setEditingChallenge({ ...editingChallenge, nodeCode: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">TITLE</label>
                  <input
                    type="text"
                    value={editingChallenge.title || ''}
                    onChange={(e) => setEditingChallenge({ ...editingChallenge, title: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">CATEGORY</label>
                  <select
                    value={editingChallenge.category || 'DIGITAL'}
                    onChange={(e) => setEditingChallenge({ ...editingChallenge, category: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="DIGITAL">DIGITAL</option>
                    <option value="ELECTRONICS">ELECTRONICS</option>
                    <option value="CODING">CODING</option>
                    <option value="ENGINEERING_LOGIC">ENGINEERING_LOGIC</option>
                    <option value="HIDDEN">HIDDEN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">POINTS</label>
                  <input
                    type="number"
                    value={editingChallenge.points || 50}
                    onChange={(e) => setEditingChallenge({ ...editingChallenge, points: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-xs mb-1">QUESTION</label>
                <textarea
                  rows={3}
                  value={editingChallenge.question || ''}
                  onChange={(e) => setEditingChallenge({ ...editingChallenge, question: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">SERVER CORRECT ANSWER (EXACT KEY)</label>
                  <input
                    type="text"
                    value={editingChallenge.correctAnswer || ''}
                    onChange={(e) => setEditingChallenge({ ...editingChallenge, correctAnswer: e.target.value })}
                    className="w-full bg-slate-900 border border-cyan-500 rounded-lg p-2 text-cyan-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">TACTICAL HINT</label>
                  <input
                    type="text"
                    value={editingChallenge.hint || ''}
                    onChange={(e) => setEditingChallenge({ ...editingChallenge, hint: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-cyan-500 text-slate-950 font-mono text-xs font-bold"
                >
                  SAVE NODE IN DATABASE
                </button>
              </div>
            </form>
          )}

          {/* List */}
          <div className="space-y-3">
            {challenges.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-cyan-400">{c.nodeCode}</span>
                    <span className="text-white font-heading font-bold">{c.title}</span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-900 text-purple-300 text-[10px]">
                      {c.category}
                    </span>
                    <span className="text-amber-300 font-bold">{c.points} PTS</span>
                  </div>
                  <p className="text-slate-400 max-w-2xl line-clamp-1">{c.question}</p>
                  <div className="text-[11px] text-emerald-400">
                    ANSWER KEY: <code className="bg-slate-900 px-1 py-0.5 rounded">{c.correctAnswer}</code>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingChallenge(c)}
                    className="p-2 rounded bg-slate-900 hover:bg-slate-800 text-slate-300"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteChallenge(c.id)}
                    className="p-2 rounded bg-red-950/40 hover:bg-red-900/60 text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: TIMERS & SETTINGS */}
      {activeTab === 'TIMERS' && overview && (
        <div className="max-w-xl mx-auto p-6 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-6 shadow-xl">
          <div className="pb-3 border-b border-slate-900">
            <h4 className="font-heading font-bold text-base text-white">
              TOURNAMENT TIMER CONFIGURATION
            </h4>
            <p className="text-xs font-mono text-slate-400">
              Timers are enforced on the server and will not reset on client browser refresh.
            </p>
          </div>

          <div className="space-y-4 font-mono text-xs">
            <div>
              <label className="block text-slate-300 mb-1">
                ROUND 1 DURATION (MINUTES)
              </label>
              <input
                type="number"
                defaultValue={overview.settings.round1DurationMinutes}
                onBlur={(e) => api.updateEventSettings({ round1DurationMinutes: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">
                ROUND 2 DURATION (MINUTES)
              </label>
              <input
                type="number"
                defaultValue={overview.settings.round2DurationMinutes}
                onBlur={(e) => api.updateEventSettings({ round2DurationMinutes: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">
                FINAL VAULT DURATION (MINUTES)
              </label>
              <input
                type="number"
                defaultValue={overview.settings.vaultDurationMinutes}
                onBlur={(e) => api.updateEventSettings({ vaultDurationMinutes: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
              />
            </div>

            <div className="pt-2 border-t border-slate-900">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  defaultChecked={overview.settings.isLeaderboardPublic}
                  onChange={(e) => api.updateEventSettings({ isLeaderboardPublic: e.target.checked })}
                  className="w-4 h-4 rounded text-cyan-500"
                />
                <span>PUBLIC LEADERBOARD VISIBLE TO ALL SQUADS</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TELEMETRY & ANTI-CHEAT LOGS */}
      {activeTab === 'LOGS' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">
              AUDIT LOG RECORDING ALL SCREEN FOCUS LOSS, HINTS, & SUBMISSION EVENTS
            </span>
            <span className="text-emerald-400 font-bold">MONITOR ARMED</span>
          </div>

          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`p-3 rounded-xl border font-mono text-xs flex items-center justify-between ${
                  log.type === 'CHEAT_ALERT'
                    ? 'bg-red-950/40 border-red-500/50 text-red-200'
                    : log.type === 'HINT_USED'
                    ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                    : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      log.type === 'CHEAT_ALERT'
                        ? 'bg-red-600 text-white'
                        : log.type === 'HINT_USED'
                        ? 'bg-amber-600 text-slate-950'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {log.type}
                  </span>
                  <span>{log.message}</span>
                </div>
                <span className="text-[10px] text-slate-500 whitespace-nowrap ml-2">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Penalty Modal */}
      {penaltyModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-md w-full bg-slate-950 border border-amber-500/80 rounded-2xl p-6 glow-amber space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-heading font-bold text-sm text-amber-300">
                APPLY SQUAD SCORE PENALTY
              </span>
              <button
                onClick={() => setPenaltyModal({ open: false, teamId: '', points: 10, reason: '' })}
                className="text-xs font-mono text-slate-400"
              >
                CANCEL
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-slate-300 mb-1">DEDUCT POINTS</label>
                <input
                  type="number"
                  value={penaltyModal.points}
                  onChange={(e) => setPenaltyModal({ ...penaltyModal, points: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">REASON / CODE VIOLATION</label>
                <input
                  type="text"
                  placeholder="e.g. Unwarranted screen desynchronization"
                  value={penaltyModal.reason}
                  onChange={(e) => setPenaltyModal({ ...penaltyModal, reason: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={handleApplyPenalty}
                className="px-5 py-2 rounded-lg bg-amber-500 text-slate-950 font-mono text-xs font-bold"
              >
                DEDUCT PENALTY
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
