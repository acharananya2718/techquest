import React, { useState } from 'react';
import {
  Users,
  Shield,
  Key,
  Copy,
  CheckCircle,
  ArrowRight,
  Plus,
  Trash2,
  AlertCircle,
  Cpu,
} from 'lucide-react';
import { api, setToken } from '../utils/api';
import { sound } from '../utils/audio';
import { Team } from '../types';

interface RegisterPageProps {
  onRegistered: (team: Team) => void;
  onNavigate: (path: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onRegistered, onNavigate }) => {
  const [teamName, setTeamName] = useState('');
  const [leaderName, setLeaderName] = useState('');
  const [leaderEmail, setLeaderEmail] = useState('');
  const [leaderPhone, setLeaderPhone] = useState('');
  const [department, setDepartment] = useState('Computer Science & Eng');
  const [college, setCollege] = useState('');

  // Members 2 to 4 (minimum 1 additional member for team size 2)
  const [members, setMembers] = useState([
    { name: '', usn: '', department: 'Computer Science & Eng' },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdTeam, setCreatedTeam] = useState<Team | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const departmentsList = [
    'Computer Science & Eng',
    'Electronics & Comm Eng',
    'Mechanical Engineering',
    'Electrical & Electronics',
    'Mechatronics & Robotics',
    'Information Science & Eng',
    'Artificial Intelligence & DS',
    'Civil Engineering',
    'Aeronautical Engineering',
  ];

  const addMember = () => {
    if (members.length < 3) {
      sound.playKeystroke();
      setMembers([...members, { name: '', usn: '', department }]);
    }
  };

  const removeMember = (index: number) => {
    if (members.length > 1) {
      sound.playKeystroke();
      setMembers(members.filter((_, i) => i !== index));
    }
  };

  const updateMember = (index: number, field: 'name' | 'usn' | 'department', value: string) => {
    const updated = [...members];
    updated[index][field] = value;
    setMembers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!teamName.trim() || !leaderName.trim() || !leaderEmail.trim() || !college.trim()) {
      setError('Please fill all team lead and institution details.');
      sound.playAccessDenied();
      return;
    }

    const invalidMember = members.find((m) => !m.name.trim() || !m.usn.trim());
    if (invalidMember) {
      setError('Please provide Name and USN/Roll Number for all team members.');
      sound.playAccessDenied();
      return;
    }

    try {
      setLoading(true);
      const res = await api.register({
        teamName,
        leaderName,
        leaderEmail,
        leaderPhone,
        department,
        college,
        members,
      });

      setToken(res.token);
      setCreatedTeam(res.team);
      sound.playAccessGranted();
    } catch (err: any) {
      setError(err.message || 'Registration failed. Check network parameters.');
      sound.playAccessDenied();
    } finally {
      setLoading(false);
    }
  };

  const copyCredentials = () => {
    if (!createdTeam) return;
    const text = `TECH QUEST CREDENTIALS\nTeam: ${createdTeam.name}\nTeam ID: ${createdTeam.id}\nAccess Code: ${createdTeam.loginCode}\nCollege: ${createdTeam.college}`;
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    sound.playKeystroke();
    setTimeout(() => setCopiedKey(false), 2500);
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 max-w-4xl mx-auto">
      {/* Registration Confirmation Modal */}
      {createdTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="max-w-md w-full bg-slate-950 border-2 border-cyan-400 rounded-2xl p-6 sm:p-8 glow-cyan shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-cyan-950/80 border border-cyan-400 mx-auto flex items-center justify-center text-cyan-300">
                <CheckCircle className="w-8 h-8 text-cyan-400 animate-pulse" />
              </div>
              <h3 className="font-heading font-black text-xl sm:text-2xl text-white">
                REGISTRATION CONFIRMED
              </h3>
              <p className="font-mono text-xs text-cyan-300">
                Squad encrypted into tournament registry. Save access keys securely.
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4 font-mono space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">TEAM NAME:</span>
                <span className="font-bold text-white uppercase">{createdTeam.name}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">UNIQUE TEAM ID:</span>
                <span className="font-bold text-cyan-400 tracking-wider">{createdTeam.id}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">ACCESS PASSWORD:</span>
                <span className="font-bold text-purple-400 tracking-widest">{createdTeam.loginCode}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>TEAM SIZE:</span>
                <span className="text-white">{createdTeam.members.length} Engineers</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={copyCredentials}
                className="w-full py-2.5 rounded-lg border border-cyan-500/50 hover:bg-cyan-950/50 text-cyan-300 font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all"
              >
                <Copy className="w-4 h-4" />
                {copiedKey ? 'CREDENTIALS COPIED TO CLIPBOARD!' : 'COPY TEAM CREDENTIALS'}
              </button>

              <button
                onClick={() => {
                  sound.playKeystroke();
                  onRegistered(createdTeam);
                  onNavigate('/dashboard');
                }}
                className="w-full py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg glow-cyan transition-all"
              >
                <span>ENTER TACTICAL DASHBOARD</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Registration Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-mono mb-2">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span>SQUAD RECRUITMENT PROTOCOL</span>
        </div>
        <h2 className="font-heading font-black text-2xl sm:text-4xl text-white">
          TEAM REGISTRATION
        </h2>
        <p className="font-mono text-xs sm:text-sm text-slate-400 mt-1">
          Register 2 to 4 engineering students for Tech Quest. All branches eligible.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-500/60 flex items-center gap-3 text-red-300 text-xs font-mono">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Team Leader & Institute */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 sm:p-7 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-900 text-cyan-400 font-heading font-bold text-sm tracking-wide">
            <Users className="w-4 h-4" />
            <span>PRIMARY SQUAD PARAMETERS</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                TEAM NAME *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CYBER PROTOCOL"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                COLLEGE / INSTITUTION *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Apex Institute of Engineering"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                TEAM LEADER NAME *
              </label>
              <input
                type="text"
                required
                placeholder="Full Name"
                value={leaderName}
                onChange={(e) => setLeaderName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                LEADER EMAIL *
              </label>
              <input
                type="email"
                required
                placeholder="leader@college.edu"
                value={leaderEmail}
                onChange={(e) => setLeaderEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                LEADER PHONE *
              </label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={leaderPhone}
                onChange={(e) => setLeaderPhone(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">
              PRIMARY DEPARTMENT *
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none transition-colors"
            >
              {departmentsList.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Section 2: Squad Members (2 to 4) */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 sm:p-7 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-900">
            <div className="flex items-center gap-2 text-purple-400 font-heading font-bold text-sm tracking-wide">
              <Shield className="w-4 h-4" />
              <span>SQUAD MEMBERS ({members.length + 1} OF 4 TOTAL)</span>
            </div>
            {members.length < 3 && (
              <button
                type="button"
                onClick={addMember}
                className="px-3 py-1.5 rounded-lg border border-purple-500/50 hover:bg-purple-950/50 text-purple-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                ADD MEMBER {members.length + 2}
              </button>
            )}
          </div>

          <div className="space-y-4">
            {members.map((member, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 relative space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-400">
                    MEMBER {idx + 2}
                  </span>
                  {members.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMember(idx)}
                      className="text-red-400 hover:text-red-300 p-1 text-xs"
                      title="Remove Member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      FULL NAME *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Student Name"
                      value={member.name}
                      onChange={(e) => updateMember(idx, 'name', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-purple-400 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      USN / ROLL NUMBER *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 4AP21EC042"
                      value={member.usn}
                      onChange={(e) => updateMember(idx, 'usn', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-purple-400 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      DEPARTMENT
                    </label>
                    <select
                      value={member.department}
                      onChange={(e) => updateMember(idx, 'department', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-purple-400 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none"
                    >
                      {departmentsList.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={() => onNavigate('/login')}
            className="text-xs font-mono text-slate-400 hover:text-cyan-300"
          >
            Already registered? Sign in with Access Code →
          </button>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg glow-cyan transition-all"
          >
            {loading ? (
              <span>ENCRYPTING SQUAD DATA...</span>
            ) : (
              <>
                <Key className="w-4 h-4" />
                <span>GENERATE TEAM CREDENTIALS</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
