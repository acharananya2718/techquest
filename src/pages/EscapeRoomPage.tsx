import React, { useEffect, useState } from 'react';
import { EscapeMemoirsGame } from '../game/EscapeMemoirsGame.tsx';
import { AntiCheatMonitor } from '../components/AntiCheatMonitor.tsx';
import { Team } from '../types';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

interface EscapeRoomPageProps {
  onNavigate: (path: string) => void;
  team: Team | null;
  onRefreshTeam: () => void;
}

export const EscapeRoomPage: React.FC<EscapeRoomPageProps> = ({
  onNavigate,
  team,
  onRefreshTeam,
}) => {
  const isRound2Completed = Boolean(team?.finishTimeRound2) || team?.status === 'COMPLETED';

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col z-30 select-none">
      <AntiCheatMonitor
        teamId={team?.id}
        enabled={!isRound2Completed}
        isCompleted={isRound2Completed}
      />

      {/* Primary First-Person 3D Game Canvas - 100% Viewport */}
      <div className="relative w-full h-full flex-1 overflow-hidden">
        <EscapeMemoirsGame
          onNavigate={onNavigate}
          teamName={team?.name || 'Engineering Squad'}
          onRefreshTeam={onRefreshTeam}
        />
      </div>
    </div>
  );
};
