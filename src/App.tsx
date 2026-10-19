import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { RegisterPage } from './pages/RegisterPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { TechHuntPage } from './pages/TechHuntPage';
import { EscapeRoomPage } from './pages/EscapeRoomPage';
import { FinalVaultPage } from './pages/FinalVaultPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { ResultsPage } from './pages/ResultsPage';
import { AdminPage } from './pages/AdminPage';
import { api, setToken } from './utils/api';
import { sound } from './utils/audio';
import { Team } from './types';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });
  const [team, setTeam] = useState<Team | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);

  // Sync route on popstate
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Check current session
  const checkSession = async () => {
    try {
      setLoadingInitial(true);
      const me = await api.getMe();
      if (me.role === 'ADMIN') {
        setIsAdmin(true);
        setTeam(null);
      } else if (me.role === 'TEAM' && me.team) {
        setTeam(me.team);
        setIsAdmin(false);
      } else {
        setTeam(null);
        setIsAdmin(false);
      }
    } catch {
      setTeam(null);
      setIsAdmin(false);
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const handleLogout = () => {
    sound.playKeystroke();
    setToken(null);
    setTeam(null);
    setIsAdmin(false);
    navigate('/');
  };

  const handleLoginSuccess = (role: 'TEAM' | 'ADMIN', teamData?: Team) => {
    sound.playAccessGranted();
    if (role === 'ADMIN') {
      setIsAdmin(true);
      setTeam(null);
      navigate('/admin');
    } else if (teamData) {
      setTeam(teamData);
      setIsAdmin(false);
      navigate('/dashboard');
    }
  };

  const handleRegistered = (newTeam: Team) => {
    sound.playAccessGranted();
    setTeam(newTeam);
    setIsAdmin(false);
    navigate('/dashboard');
  };

  // Render Page Content
  const renderContent = () => {
    if (loadingInitial) {
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
          <p className="font-mono text-xs text-cyan-400 tracking-widest animate-pulse">
            INITIALIZING SECURE QUANTUM TELEMETRY...
          </p>
        </div>
      );
    }

    switch (currentPath) {
      case '/':
        return (
          <LandingPage
            onNavigate={navigate}
            onQuickDemoLogin={() => handleLoginSuccess('TEAM', team || undefined)}
          />
        );
      case '/register':
        return <RegisterPage onRegistered={handleRegistered} onNavigate={navigate} />;
      case '/login':
        return <LoginPage onLoginSuccess={handleLoginSuccess} onNavigate={navigate} />;
      case '/dashboard':
        return <DashboardPage onNavigate={navigate} team={team} onRefreshTeam={checkSession} />;
      case '/tech-hunt':
        return <TechHuntPage onNavigate={navigate} team={team} onRefreshTeam={checkSession} />;
      case '/escape-room':
        return <EscapeRoomPage onNavigate={navigate} team={team} onRefreshTeam={checkSession} />;
      case '/final-vault':
        return <FinalVaultPage onNavigate={navigate} team={team} onRefreshTeam={checkSession} />;
      case '/leaderboard':
        return <LeaderboardPage onNavigate={navigate} userTeamId={team?.id} />;
      case '/results':
        return <ResultsPage onNavigate={navigate} team={team} />;
      case '/admin':
        return <AdminPage onNavigate={navigate} onRefreshMe={checkSession} />;
      default:
        return (
          <LandingPage
            onNavigate={navigate}
            onQuickDemoLogin={() => handleLoginSuccess('TEAM', team || undefined)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050811] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {currentPath !== '/escape-room' && (
        <Navbar
          currentPath={currentPath}
          onNavigate={navigate}
          team={team}
          isAdmin={isAdmin}
          onLogout={handleLogout}
        />
      )}

      <main className={currentPath === '/escape-room' ? 'flex-1 w-full h-full' : 'flex-1'}>
        {renderContent()}
      </main>

      {currentPath !== '/escape-room' && <Footer onNavigate={navigate} />}
    </div>
  );
}
